import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { describeError } from '@/lib/errors';
import { getProgressPatch } from '@/lib/games/wordProgress';
import { CATEGORY_SORT_KEY, orderCategories, type CategorySortMode } from '@/lib/categorySort';
import { useStoredState } from '@/hooks/useStoredState';
import { findTwemojiCandidates, TWEMOJI_CREDIT } from '@/lib/twemoji';
import type { WordImageAssignment } from '@/lib/autoImages';
import type { QuizGameId } from '@/lib/games/types';
import {
  DEFAULT_CATEGORY_NAMES,
  normalizeFinnish,
  type Category,
  type Word,
  type WordFormValues,
  type LearningStatus,
} from '@/lib/vocabulary';

function describeAiGenerationError(code: string | undefined, status: number): string {
  if (code === 'cloudflare_not_configured') return 'Yapay zeka bağlantısı yapılandırılmamış.';
  if (code === 'image_generation_failed') return `Yapay zeka sağlayıcısı görseli oluşturamadı (HTTP ${status}).`;
  if (code === 'storage_failed') return 'Oluşturulan görsel depolama alanına kaydedilemedi.';
  if (code === 'invalid_image_response' || code === 'empty_image') return 'Yapay zeka geçerli bir görsel döndürmedi.';
  return `Görsel servisi beklenmeyen bir yanıt verdi (HTTP ${status}).`;
}

function autoImageForValues(values: WordFormValues): {
  image_url: string | null;
  image_source: typeof values.image_source;
  image_credit: string;
} | null {
  if (values.image_url) return null;
  const [match] = findTwemojiCandidates(values.finnish, values.turkish);
  return match
    ? { image_url: match.url, image_source: 'twemoji' as const, image_credit: TWEMOJI_CREDIT }
    : null;
}

const PAGE_SIZE = 1000;
const IMAGE_BATCH_SIZE = 20;
const IMPORT_BATCH_SIZE = 50;

async function fetchAll<T>(table: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data as T[]));
    if (data.length < PAGE_SIZE) break;
  }
  return rows;
}

interface LibraryContextValue {
  categories: Category[];
  categorySortMode: CategorySortMode;
  setCategorySortMode: (mode: CategorySortMode) => void;
  words: Word[];
  isLoading: boolean;
  loadError: string | null;
  reload: () => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  renameCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  seedDefaultCategories: () => Promise<number>;
  reorderCategories: (orderedIds: string[]) => Promise<void>;
  saveWord: (values: WordFormValues, wordId: string | null) => Promise<void>;
  deleteWord: (id: string) => Promise<void>;
  updateWordStatus: (id: string, status: LearningStatus) => Promise<void>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  recordAnswers: (gameId: QuizGameId, answers: { wordId: string; correct: boolean }[]) => Promise<void>;
  applyWordImages: (
    assignments: WordImageAssignment[],
    onProgress: (done: number) => void,
  ) => Promise<{ saved: number; errorMessage: string | null }>;
  insertWords: (
    rows: WordFormValues[],
    onProgress: (done: number) => void,
  ) => Promise<{ inserted: number; createdWords: Word[]; errorMessage: string | null }>;
  generateAiImages: (
    words: Word[],
    onProgress: (done: number) => void,
  ) => Promise<{ saved: number; errorMessage: string | null }>;
}

function nextCategoryPosition(categories: Category[]): number {
  return categories.reduce((max, category) => Math.max(max, category.position), -1) + 1;
}

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [categorySortSettings, setCategorySortSettings] = useStoredState<{ mode: CategorySortMode }>(
    CATEGORY_SORT_KEY,
    { mode: 'manual' },
  );
  const categorySortMode = categorySortSettings.mode;
  const orderedCategories = useMemo(() => orderCategories(categories, categorySortMode), [categories, categorySortMode]);
  const setCategorySortMode = useCallback(
    (mode: CategorySortMode) => setCategorySortSettings({ mode }),
    [setCategorySortSettings],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const wordsRef = useRef<Word[]>([]);

  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const [loadedCategories, loadedWords] = await Promise.all([
        fetchAll<Category>('categories'),
        fetchAll<Word>('words'),
      ]);
      setCategories(loadedCategories);
      setWords(loadedWords);
    } catch (error) {
      setLoadError(describeError(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const runAndReload = useCallback(
    async (operation: () => PromiseLike<{ error: unknown }>) => {
      const { error } = await operation();
      if (error) throw error;
      await reload();
    },
    [reload],
  );

  const addCategory = useCallback(
    (name: string) =>
      runAndReload(() =>
        supabase.from('categories').insert({ name: name.trim(), position: nextCategoryPosition(categories) }),
      ),
    [categories, runAndReload],
  );

  const renameCategory = useCallback(
    (id: string, name: string) =>
      runAndReload(() => supabase.from('categories').update({ name: name.trim() }).eq('id', id)),
    [runAndReload],
  );

  const deleteCategory = useCallback(
    (id: string) => runAndReload(() => supabase.from('categories').delete().eq('id', id)),
    [runAndReload],
  );

  const reorderCategories = useCallback(
    async (orderedIds: string[]) => {
      const responses = await Promise.all(
        orderedIds.map((id, position) => supabase.from('categories').update({ position }).eq('id', id)),
      );
      const failed = responses.find((response) => response.error);
      await reload();
      if (failed?.error) throw failed.error;
    },
    [reload],
  );

  const seedDefaultCategories = useCallback(async () => {
    const existing = new Set(categories.map((category) => category.name.toLocaleLowerCase('tr-TR')));
    const missing = DEFAULT_CATEGORY_NAMES.filter(
      (name) => !existing.has(name.toLocaleLowerCase('tr-TR')),
    );
    if (missing.length === 0) return 0;
    const base = nextCategoryPosition(categories);
    await runAndReload(() =>
      supabase.from('categories').insert(missing.map((name, offset) => ({ name, position: base + offset }))),
    );
    return missing.length;
  }, [categories, runAndReload]);

  const saveWord = useCallback(
    async (values: WordFormValues, wordId: string | null) => {
      const autoImage = autoImageForValues(values);
      const payload = {
        ...values,
        finnish: values.finnish.trim(),
        turkish: values.turkish.trim(),
        example_fi: values.example_fi?.trim() || null,
        example_tr: values.example_tr?.trim() || null,
        grammar_note: values.grammar_note?.trim() || null,
        image_url: autoImage ? autoImage.image_url : values.image_url,
        image_source: autoImage ? autoImage.image_source : values.image_source,
        image_credit: autoImage ? autoImage.image_credit : (values.image_credit?.trim() || null),
        updated_at: new Date().toISOString(),
      };

      if (wordId) {
        const { data, error } = await supabase
          .from('words')
          .update(payload)
          .eq('id', wordId)
          .select()
          .single();
        if (error) throw error;
        setWords((previous) => previous.map((word) => (word.id === wordId ? (data as Word) : word)));
        return;
      }

      const { data, error } = await supabase.from('words').insert(payload).select().single();
      if (error) throw error;
      setWords((previous) => [...previous, data as Word]);
    },
    [],
  );

  const deleteWord = useCallback(async (id: string) => {
    const { error } = await supabase.from('words').delete().eq('id', id);
    if (error) throw error;
    setWords((previous) => previous.filter((word) => word.id !== id));
  }, []);

  const patchWord = useCallback(
    async (id: string, patch: Partial<Pick<Word, 'is_favorite' | 'learning_status' | 'learning_status_manual' | 'completed_game_types'>>) => {
    const { data, error } = await supabase
      .from('words')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    setWords((previous) => previous.map((word) => (word.id === id ? (data as Word) : word)));
  }, []);

  const updateWordStatus = useCallback(
    (id: string, status: LearningStatus) => {
      const word = wordsRef.current.find((item) => item.id === id);
      const unlearning = word?.learning_status === 'learned' && status !== 'learned';
      return patchWord(
        id,
        unlearning
          ? { learning_status: status, learning_status_manual: true, completed_game_types: [] }
          : { learning_status: status, learning_status_manual: true },
      );
    },
    [patchWord],
  );

  const toggleFavorite = useCallback(
    (id: string, isFavorite: boolean) => patchWord(id, { is_favorite: isFavorite }),
    [patchWord],
  );

  const recordAnswers = useCallback(
    async (gameId: QuizGameId, answers: { wordId: string; correct: boolean }[]) => {
      const nowIso = new Date().toISOString();
      const updates = answers.flatMap(({ wordId, correct }) => {
        const word = wordsRef.current.find((item) => item.id === wordId);
        return word ? [{ id: wordId, patch: getProgressPatch(word, gameId, correct, nowIso) }] : [];
      });
      if (updates.length === 0) return;

      const responses = await Promise.all(
        updates.map(({ id, patch }) =>
          supabase.from('words').update({ ...patch, updated_at: nowIso }).eq('id', id).select().single(),
        ),
      );
      const failed = responses.find((response) => response.error);
      if (failed?.error) {
        await reload();
        throw failed.error;
      }

      const saved = new Map<string, Word>();
      for (const response of responses) {
        if (response.data) saved.set((response.data as Word).id, response.data as Word);
      }
      const next = wordsRef.current.map((word) => saved.get(word.id) ?? word);
      wordsRef.current = next;
      setWords(next);
    },
    [reload],
  );

  const applyWordImages = useCallback(
    async (assignments: WordImageAssignment[], onProgress: (done: number) => void) => {
      const nowIso = new Date().toISOString();
      let saved = 0;
      for (let start = 0; start < assignments.length; start += IMAGE_BATCH_SIZE) {
        const batch = assignments.slice(start, start + IMAGE_BATCH_SIZE);
        const responses = await Promise.all(
          batch.map((assignment) => {
            const base = supabase
              .from('words')
              .update({
                image_url: assignment.imageUrl,
                image_source: assignment.imageSource,
                image_credit: assignment.imageCredit,
                updated_at: nowIso,
              })
              .eq('id', assignment.wordId);
            return (assignment.replaceExisting ? base : base.is('image_url', null)).select().maybeSingle();
          }),
        );
        const updated = new Map<string, Word>();
        let failure: unknown = null;
        for (const response of responses) {
          if (response.error) failure ??= response.error;
          if (response.data) updated.set((response.data as Word).id, response.data as Word);
        }
        saved += updated.size;
        if (updated.size > 0) {
          setWords((previous) => previous.map((word) => updated.get(word.id) ?? word));
        }
        onProgress(start + batch.length);
        if (failure) return { saved, errorMessage: describeError(failure) };
      }
      return { saved, errorMessage: null };
    },
    [],
  );

  const insertWords = useCallback(
    async (rows: WordFormValues[], onProgress: (done: number) => void) => {
      let inserted = 0;
      const allCreated: Word[] = [];
      for (let start = 0; start < rows.length; start += IMPORT_BATCH_SIZE) {
        const batch = rows.slice(start, start + IMPORT_BATCH_SIZE);
        const nowIso = new Date().toISOString();
        const { data, error } = await supabase
          .from('words')
          .insert(batch.map((values) => ({
            ...values,
            updated_at: nowIso,
          })))
          .select();
        if (data) {
          const created = data as Word[];
          inserted += created.length;
          allCreated.push(...created);
          setWords((previous) => [...previous, ...created]);
        }
        if (error) return { inserted, createdWords: allCreated, errorMessage: describeError(error) };
        onProgress(start + batch.length);
      }
      return { inserted, createdWords: allCreated, errorMessage: null };
    },
    [],
  );

  const generateAiImages = useCallback(
    async (targetWords: Word[], onProgress: (done: number) => void) => {
      const toGenerate = targetWords.filter((word) => !word.image_url);
      if (toGenerate.length === 0) return { saved: 0, errorMessage: null };

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const functionUrl = `${supabaseUrl}/functions/v1/generate-word-image`;
      const AI_BATCH_SIZE = 3;
      let saved = 0;
      let failed = 0;
      let failureReason: string | null = null;

      for (let start = 0; start < toGenerate.length; start += AI_BATCH_SIZE) {
        const batch = toGenerate.slice(start, start + AI_BATCH_SIZE);
        const results = await Promise.all(
          batch.map(async (word) => {
            try {
              const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${supabaseAnonKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ finnish: word.finnish, turkish: word.turkish }),
              });
              const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
              if (!response.ok) {
                failed += 1;
                failureReason ??= describeAiGenerationError(data.error, response.status);
                return null;
              }
              if (!data.url) {
                failed += 1;
                failureReason ??= 'Sunucu geçerli bir görsel adresi döndürmedi.';
                return null;
              }
              return { wordId: word.id, url: data.url };
            } catch {
              failed += 1;
              failureReason ??= 'Görsel sunucusuna bağlanılamadı.';
              return null;
            }
          }),
        );

        const successful = results.filter((r): r is { wordId: string; url: string } => r !== null);
        if (successful.length > 0) {
          const nowIso = new Date().toISOString();
          const updateResponses = await Promise.all(
            successful.map((result) =>
              supabase
                .from('words')
                .update({
                  image_url: result.url,
                  image_source: 'ai_generated',
                  image_credit: 'Cloudflare Workers AI · Stable Diffusion XL',
                  updated_at: nowIso,
                })
                .eq('id', result.wordId)
                .select()
                .maybeSingle(),
            ),
          );
          const updated = new Map<string, Word>();
          for (const response of updateResponses) {
            if (response.error) {
              failed += 1;
              failureReason ??= `Görsel üretildi ancak kelimeye kaydedilemedi: ${describeError(response.error)}`;
            } else if (response.data) {
              updated.set((response.data as Word).id, response.data as Word);
            } else {
              failed += 1;
              failureReason ??= 'Görsel üretildi ancak kelime kaydı güncellenemedi.';
            }
          }
          saved += updated.size;
          if (updated.size > 0) {
            setWords((previous) => previous.map((word) => updated.get(word.id) ?? word));
          }
        }
        onProgress(start + batch.length);
      }
      return {
        saved,
        errorMessage: failed > 0 ? `${failed} görsel oluşturulamadı. Neden: ${failureReason ?? 'Bilinmeyen hata.'}` : null,
      };
    },
    [],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      categories: orderedCategories,
      categorySortMode,
      setCategorySortMode,
      words,
      isLoading,
      loadError,
      reload,
      addCategory,
      renameCategory,
      deleteCategory,
      seedDefaultCategories,
      reorderCategories,
      saveWord,
      deleteWord,
      updateWordStatus,
      toggleFavorite,
      recordAnswers,
      applyWordImages,
      insertWords,
      generateAiImages,
    }),
    [
      orderedCategories,
      categorySortMode,
      setCategorySortMode,
      words,
      isLoading,
      loadError,
      reload,
      addCategory,
      renameCategory,
      deleteCategory,
      seedDefaultCategories,
      reorderCategories,
      saveWord,
      deleteWord,
      updateWordStatus,
      toggleFavorite,
      recordAnswers,
      applyWordImages,
      insertWords,
      generateAiImages,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used inside LibraryProvider');
  return context;
}

export function findDuplicateWords(words: Word[], finnish: string, excludeId: string | null): Word[] {
  const key = normalizeFinnish(finnish);
  if (!key) return [];
  return words.filter((word) => word.id !== excludeId && normalizeFinnish(word.finnish) === key);
}

import { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  FileUp,
  Gamepad2,
  ImagePlus,
  List,
  Plus,
  SlidersHorizontal,
  Tags,
  X,
} from 'lucide-react';
import AutoImageModal from '@/components/AutoImageModal';
import BulkExportModal from '@/components/BulkExportModal';
import FlashcardGame from '@/components/games/FlashcardGame';
import GameFilterFields from '@/components/games/GameFilterFields';
import GameSession from '@/components/games/GameSession';
import ListeningPlayer from '@/components/listening/ListeningPlayer';
import MissingImageNotice from '@/components/MissingImageNotice';
import SortDropdown from '@/components/SortDropdown';
import WordFilterBar from '@/components/WordFilterBar';
import WordFormModal from '@/components/WordFormModal';
import WordImportModal from '@/components/WordImportModal';
import WordList from '@/components/WordList';
import { useDismissOnOutside } from '@/hooks/useDismissOnOutside';
import { useGameSettings } from '@/hooks/useGameSettings';
import { useStoredState } from '@/hooks/useStoredState';
import { useLibrary } from '@/contexts/LibraryContext';
import {
  getCandidateWords,
  getSetupIssues,
  selectGameWords,
  type GameSetupConfig,
} from '@/lib/games/gameConfig';
import { GAME_DEFINITIONS, getGameDefinition, type GameDefinition } from '@/lib/games/gameDefinitions';
import {
  DEFAULT_LISTENING_SETTINGS,
  selectListeningWordsFromConfig,
  type ListeningSettings,
} from '@/lib/listening';
import { EMPTY_WORD_FILTERS, filterWords, type WordFilters } from '@/lib/wordFilters';
import { sortWordsByListMode, WORD_LIST_SORT_OPTIONS, type WordListSort } from '@/lib/wordSort';
import type { Category, Word } from '@/lib/vocabulary';
import type { GameId, QuizGameId } from '@/lib/games/types';

const WORD_SORT_KEY = 'sanasto.wordListSort';

type CategoryTab = 'words' | 'games';

interface ActiveGame {
  gameId: GameId;
  words: Word[];
  attempt: number;
}

function isQuizGame(gameId: GameId): gameId is QuizGameId {
  return gameId !== 'flashcards';
}

function getNextGameDefinition(gameId: GameId): GameDefinition | undefined {
  const index = GAME_DEFINITIONS.findIndex((item) => item.id === gameId);
  return index === -1 ? undefined : GAME_DEFINITIONS[index + 1];
}

interface CategoryDetailPageProps {
  category: Category;
  onBack: () => void;
}

export default function CategoryDetailPage({ category, onBack }: CategoryDetailPageProps) {
  const isUncategorized = category.id === '__uncategorized__';
  const { words: allWords, categories, isLoading } = useLibrary();
  const categoryWords = useMemo(
    () => allWords.filter((word) =>
      isUncategorized ? !word.category_id : word.category_id === category.id,
    ),
    [allWords, category.id, isUncategorized],
  );

  const [tab, setTab] = useState<CategoryTab>('games');
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [listeningQueue, setListeningQueue] = useState<Word[] | null>(null);
  const [listeningSettings, setListeningSettings] = useStoredState<ListeningSettings>(
    'sanasto.listeningSettings',
    DEFAULT_LISTENING_SETTINGS,
  );

  const gameConfig = useGameSettings();
  const categoryConfig: GameSetupConfig = useMemo(
    () => ({ ...gameConfig.config, categoryIds: isUncategorized ? [] : [category.id] }),
    [gameConfig.config, category.id, isUncategorized],
  );
  const updateCategoryConfig = (next: GameSetupConfig) => {
    gameConfig.updateConfig({ ...next, categoryIds: gameConfig.config.categoryIds });
  };

  const poolByGame = useMemo(() => {
    const map = new Map<GameId, Word[]>();
    for (const def of GAME_DEFINITIONS) {
      map.set(def.id, getCandidateWords(categoryWords, categoryConfig, def.requiresImage));
    }
    return map;
  }, [categoryWords, categoryConfig]);

  const launchGame = (gameId: GameId) => {
    const def = getGameDefinition(gameId);
    const gameWords = selectGameWords(categoryWords, categoryConfig, def.requiresImage);
    const pool = poolByGame.get(gameId) ?? [];
    if (gameWords.length === 0 || getSetupIssues(def, pool, categoryWords, categoryConfig).length > 0) {
      return;
    }
    setActiveGame({ gameId, words: gameWords, attempt: 0 });
  };

  const startNextGame = (currentId: GameId) => {
    const next = getNextGameDefinition(currentId);
    if (!next) return;
    launchGame(next.id);
  };

  const exitToList = () => {
    setActiveGame(null);
    setTab('games');
  };

  const exitListeningToList = () => {
    setListeningQueue(null);
    setTab('games');
  };

  const retryWrong = (wordIds: string[]) => {
    setActiveGame((previous) =>
      previous && isQuizGame(previous.gameId)
        ? {
            gameId: previous.gameId,
            words: categoryWords.filter((word) => wordIds.includes(word.id)),
            attempt: previous.attempt + 1,
          }
        : previous,
    );
  };

  const restart = () => {
    setActiveGame((previous) => (previous ? { ...previous, attempt: previous.attempt + 1 } : previous));
  };

  if (isLoading) return null;

  if (listeningQueue) {
    return (
      <div className="space-y-4">
        <ListeningPlayer queue={listeningQueue} settings={listeningSettings} onBack={exitListeningToList} />
      </div>
    );
  }

  if (activeGame) {
    const title = GAME_DEFINITIONS.find((item) => item.id === activeGame.gameId)?.title ?? '';
    const hasNextGame = getNextGameDefinition(activeGame.gameId) !== undefined;
    const sessionKey = `${activeGame.gameId}-${activeGame.attempt}`;
    const onNext = hasNextGame ? () => startNextGame(activeGame.gameId) : undefined;
    return (
      <div className="space-y-4">
        {isQuizGame(activeGame.gameId) ? (
          <GameSession
            key={sessionKey}
            gameId={activeGame.gameId}
            words={activeGame.words}
            onExit={exitToList}
            onRetryWrong={retryWrong}
            onRestart={restart}
            onNext={onNext}
          />
        ) : (
          <FlashcardGame
            key={sessionKey}
            title={title}
            words={activeGame.words}
            onExit={exitToList}
            onRestart={restart}
            onNext={onNext}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Geri
        </button>
        <h1 className="truncate text-2xl font-bold text-slate-900">{category.name}</h1>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
          {categoryWords.length} kelime
        </span>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setTab('games')}
          aria-pressed={tab === 'games'}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'games' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Gamepad2 className="h-4 w-4" /> Oyunlar
        </button>
        <button
          type="button"
          onClick={() => setTab('words')}
          aria-pressed={tab === 'words'}
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            tab === 'words' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="h-4 w-4" /> Kelime ekle ve düzenle
        </button>
      </div>

      {tab === 'games' && (
        <CategoryGamesTab
          categoryWords={categoryWords}
          categoryConfig={categoryConfig}
          updateCategoryConfig={updateCategoryConfig}
          poolByGame={poolByGame}
          saveError={gameConfig.saveError}
          onLaunchGame={launchGame}
          onStartListening={() => {
            const queue = selectListeningWordsFromConfig(categoryWords, categoryConfig);
            setListeningQueue(queue);
          }}
        />
      )}

      {tab === 'words' && (
        <CategoryWordsTab
          categoryId={category.id}
          isUncategorized={isUncategorized}
          categoryWords={categoryWords}
          allWords={allWords}
          categories={categories}
        />
      )}
    </div>
  );
}

function CategoryWordsTab({
  categoryId,
  isUncategorized,
  categoryWords,
  allWords,
  categories,
}: {
  categoryId: string;
  isUncategorized: boolean;
  categoryWords: Word[];
  allWords: Word[];
  categories: Category[];
}) {
  const [filters, setFilters] = useState<WordFilters>(EMPTY_WORD_FILTERS);
  const [isCreating, setIsCreating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isAutoImaging, setIsAutoImaging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const filterContainerRef = useRef<HTMLDivElement>(null);
  useDismissOnOutside(filterContainerRef, showFilters, () => setShowFilters(false));
  const [sortSettings, setSortSettings] = useStoredState<{ mode: WordListSort }>(WORD_SORT_KEY, { mode: 'added' });
  const sortMode = sortSettings.mode;

  const scopedFilters = useMemo<WordFilters>(
    () => ({ ...filters, categoryIds: [categoryId] }),
    [filters, categoryId],
  );

  const visibleWords = useMemo(
    () => sortWordsByListMode(filterWords(categoryWords, scopedFilters), sortMode),
    [categoryWords, scopedFilters, sortMode],
  );

  const hasNonCategoryFilters =
    filters.search !== '' ||
    filters.status !== null ||
    filters.favoritesOnly ||
    filters.noImage;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => setIsImporting(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <FileUp className="h-4 w-4" /> Toplu ekle
        </button>
        <button
          type="button"
          onClick={() => setIsAutoImaging(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ImagePlus className="h-4 w-4" /> Otomatik görsel
        </button>
        <button
          type="button"
          onClick={() => setIsExporting(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <Download className="h-4 w-4" /> Dışa aktar
        </button>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" /> Yeni kelime
        </button>
      </div>

      <MissingImageNotice
        count={categoryWords.filter((word) => !word.image_url).length}
        onShow={() => setFilters({ ...EMPTY_WORD_FILTERS, noImage: true })}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold text-slate-600">
          <span>{categoryWords.length} kelime</span>
          <span>{visibleWords.length} gösteriliyor</span>
        </div>
        <div className="w-full space-y-2">
          <div ref={filterContainerRef} className="w-full">
            <button
              type="button"
              aria-label="Filtrele"
              aria-expanded={showFilters}
              onClick={() => setShowFilters((open) => !open)}
              className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition hover:border-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                hasNonCategoryFilters
                  ? 'border-blue-400 bg-blue-50 text-blue-800'
                  : 'border-slate-300 bg-white text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" />
                {hasNonCategoryFilters ? 'Filtrele (aktif)' : 'Filtrele'}
              </span>
              <div className="flex items-center gap-1.5">
                {hasNonCategoryFilters && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters(EMPTY_WORD_FILTERS);
                    }}
                    className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-700 transition hover:text-blue-900"
                  >
                    <X className="h-3.5 w-3.5" /> Temizle
                  </button>
                )}
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${showFilters ? 'rotate-180' : ''}`} aria-hidden="true" />
              </div>
            </button>

            {showFilters && (
              <div className="mt-2 w-full">
                <CategoryWordFilterBar filters={filters} onChange={setFilters} />
              </div>
            )}
          </div>
          <SortDropdown
            label="Kelime sıralaması"
            options={WORD_LIST_SORT_OPTIONS}
            value={sortMode}
            onChange={(mode) => setSortSettings({ mode })}
          />
        </div>
      </div>

      <WordList
        words={visibleWords}
        emptyTitle={hasNonCategoryFilters ? 'Bu filtrelere uyan kelime yok' : 'Bu kategoride henüz kelime yok'}
        emptyText={
          hasNonCategoryFilters
            ? 'Filtreleri temizleyerek bütün kelimeleri tekrar görebilirsiniz.'
            : 'Yukarıdaki "Yeni kelime" butonuyla ilk kelimenizi ekleyin.'
        }
      />

      {isCreating && (
        <WordFormModal word={null} onClose={() => setIsCreating(false)} defaultCategoryId={categoryId} />
      )}
      {isExporting && (
        <BulkExportModal
          words={allWords}
          visibleWords={visibleWords}
          categories={categories}
          onClose={() => setIsExporting(false)}
        />
      )}
      {isAutoImaging && <AutoImageModal onClose={() => setIsAutoImaging(false)} />}
      {isImporting && (
        <WordImportModal
          onClose={() => setIsImporting(false)}
          defaultCategoryId={isUncategorized ? null : categoryId}
        />
      )}
    </div>
  );
}

function CategoryWordFilterBar({ filters, onChange }: { filters: WordFilters; onChange: (filters: WordFilters) => void }) {
  return <WordFilterBar filters={filters} onChange={onChange} hideCategoryFilter />;
}

interface CategoryGamesTabProps {
  categoryWords: Word[];
  categoryConfig: GameSetupConfig;
  updateCategoryConfig: (config: GameSetupConfig) => void;
  poolByGame: Map<GameId, Word[]>;
  saveError: string | null;
  onLaunchGame: (gameId: GameId) => void;
  onStartListening: () => void;
}

function CategoryGamesTab({
  categoryWords,
  categoryConfig,
  updateCategoryConfig,
  poolByGame,
  saveError,
  onLaunchGame,
  onStartListening,
}: CategoryGamesTabProps) {
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  useDismissOnOutside(settingsRef, showSettings, () => setShowSettings(false));
  const selectedCount = useMemo(
    () => getCandidateWords(categoryWords, categoryConfig, false).length,
    [categoryWords, categoryConfig],
  );

  if (categoryWords.length === 0) {
    return (
      <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
        Bu kategoride henüz kelime yok. Oynamak için önce kelimeler sekmesinden kelime ekleyin.
      </p>
    );
  }

  return (
    <div ref={settingsRef} className="space-y-4">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowSettings((open) => !open)}
          aria-expanded={showSettings}
          className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-800 sm:w-auto sm:min-w-[22rem]"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtrele
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs">{selectedCount} kelime</span>
          <ChevronDown className={`h-4 w-4 transition ${showSettings ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showSettings && (
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <GameFilterFields
            config={categoryConfig}
            onChange={updateCategoryConfig}
            categories={[]}
            words={categoryWords}
            hideCategoryFilter
          />
          {saveError && (
            <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">Ayarlar kaydedilemedi: {saveError}</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onStartListening}
        className="group flex w-full items-center gap-4 rounded-2xl border border-teal-300 bg-teal-50 p-4 text-left shadow-sm transition hover:border-teal-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
          <Tags className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-lg font-bold text-slate-900">Dinleme</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-teal-600 transition group-hover:translate-x-0.5" aria-hidden="true" />
      </button>

      <ul className="grid grid-cols-2 gap-2 sm:gap-4">
        {GAME_DEFINITIONS.map((game) => {
          const Icon = game.icon;
          const pool = poolByGame.get(game.id) ?? [];
          const issues = getSetupIssues(game, pool, categoryWords, categoryConfig);
          const canPlay = pool.length > 0 && issues.length === 0;
          return (
            <li key={game.id}>
              <button
                type="button"
                onClick={() => (canPlay ? onLaunchGame(game.id) : setShowSettings(true))}
                className="group flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:rounded-3xl sm:p-6"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-700 group-hover:text-white">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="block text-base font-bold leading-tight text-slate-900 sm:text-lg">
                  {game.title}
                </span>
                {canPlay ? (
                  <span className="text-sm font-semibold text-blue-700">Oyna</span>
                ) : (
                  <span className="text-sm font-semibold text-slate-400">Ayar gerekli</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

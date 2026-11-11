import { useMemo, useState } from 'react';
import { ChevronRight, Headphones, Loader2, AlertTriangle, Info, Play, ArrowLeft } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import FlashcardGame from '@/components/games/FlashcardGame';
import GameSession from '@/components/games/GameSession';
import GameFilterFields from '@/components/games/GameFilterFields';
import ListeningPlayer from '@/components/listening/ListeningPlayer';
import ListeningSettingsPanel from '@/components/listening/ListeningSettingsPanel';
import { useLibrary } from '@/contexts/LibraryContext';
import { useGameSettings } from '@/hooks/useGameSettings';
import { useStoredState } from '@/hooks/useStoredState';
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
import type { GameId, QuizGameId } from '@/lib/games/types';
import type { Word } from '@/lib/vocabulary';

interface ActiveGame {
  gameId: GameId;
  words: Word[];
  attempt: number;
}

type Tab = 'games' | 'settings' | 'listening';

function isQuizGame(gameId: GameId): gameId is QuizGameId {
  return gameId !== 'flashcards';
}

function getNextGameDefinition(gameId: GameId): GameDefinition | undefined {
  const index = GAME_DEFINITIONS.findIndex((item) => item.id === gameId);
  return index === -1 ? undefined : GAME_DEFINITIONS[index + 1];
}

export default function GamesPage() {
  const { words, categories, isLoading, loadError } = useLibrary();
  const { config, updateConfig, saveError } = useGameSettings();
  const [tab, setTab] = useState<Tab>('games');
  const [active, setActive] = useState<ActiveGame | null>(null);
  const [listeningQueue, setListeningQueue] = useState<Word[] | null>(null);
  const [listeningSettings, setListeningSettings] = useStoredState<ListeningSettings>(
    'sanasto.listeningSettings',
    DEFAULT_LISTENING_SETTINGS,
  );

  const poolByGame = useMemo(() => {
    const map = new Map<GameId, Word[]>();
    for (const def of GAME_DEFINITIONS) {
      map.set(def.id, getCandidateWords(words, config, def.requiresImage));
    }
    return map;
  }, [words, config]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  if (loadError) {
    return (
      <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-800">
        Kelimeler yüklenemedi: {loadError}
      </p>
    );
  }

  const exitToList = () => {
    setActive(null);
    setTab('games');
  };

  const exitListeningToList = () => {
    setListeningQueue(null);
    setTab('games');
  };

  const retryWrong = (wordIds: string[]) => {
    setActive((previous) =>
      previous && isQuizGame(previous.gameId)
        ? {
            gameId: previous.gameId,
            words: words.filter((word) => wordIds.includes(word.id)),
            attempt: previous.attempt + 1,
          }
        : previous,
    );
  };

  const restart = () => {
    setActive((previous) => (previous ? { ...previous, attempt: previous.attempt + 1 } : previous));
  };

  const launchGame = (gameId: GameId) => {
    const def = getGameDefinition(gameId);
    const gameWords = selectGameWords(words, config, def.requiresImage);
    const pool = poolByGame.get(gameId) ?? [];
    if (gameWords.length === 0 || getSetupIssues(def, pool, words, config).length > 0) {
      setTab('settings');
      return;
    }
    setActive({ gameId, words: gameWords, attempt: 0 });
  };

  const startNextGame = (currentId: GameId) => {
    const next = getNextGameDefinition(currentId);
    if (!next) return;
    launchGame(next.id);
  };

  if (listeningQueue) {
    return (
      <div className="space-y-4">
        <ListeningPlayer queue={listeningQueue} settings={listeningSettings} onBack={exitListeningToList} />
      </div>
    );
  }

  if (active) {
    const title = GAME_DEFINITIONS.find((item) => item.id === active.gameId)?.title ?? '';
    const hasNextGame = getNextGameDefinition(active.gameId) !== undefined;
    const sessionKey = `${active.gameId}-${active.attempt}`;
    const onNext = hasNextGame ? () => startNextGame(active.gameId) : undefined;
    return (
      <div className="space-y-4">
        {isQuizGame(active.gameId) ? (
          <GameSession
            key={sessionKey}
            gameId={active.gameId}
            words={active.words}
            onExit={exitToList}
            onRetryWrong={retryWrong}
            onRestart={restart}
            onNext={onNext}
          />
        ) : (
          <FlashcardGame
            key={sessionKey}
            title={title}
            words={active.words}
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
      <PageHeader title="Karışık Oyna ve Dinle" description="Tüm kategorilerdeki kelimeleri seçip oynayın ve dinleyin." />

      {words.length === 0 && (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          Henüz kelimeniz yok. Oyunları oynamak için önce Kelimeler bölümünden kelime ekleyin.
        </p>
      )}

      {tab === 'games' && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setTab('settings')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-800"
            >
              Kategorileri Seç ve Filtrele
            </button>
          </div>

          <button
            type="button"
            onClick={() => setTab('listening')}
            className="group flex w-full items-center gap-4 rounded-2xl border border-teal-300 bg-teal-50 p-4 text-left shadow-sm transition hover:border-teal-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
              <Headphones className="h-6 w-6" aria-hidden="true" />
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
              const issues = getSetupIssues(game, pool, words, config);
              const canPlay = pool.length > 0 && issues.length === 0;
              return (
                <li key={game.id}>
                  <button
                    type="button"
                    onClick={() => (canPlay ? launchGame(game.id) : setTab('settings'))}
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
      )}

      {tab === 'settings' && (
        <div className="mx-auto max-w-3xl space-y-6">
          <GameSettingsPanel
            config={config}
            onChange={updateConfig}
            categories={categories}
            words={words}
            saveError={saveError}
            poolByGame={poolByGame}
            onDone={() => setTab('games')}
          />
        </div>
      )}

      {tab === 'listening' && (
        <ListeningView
          words={words}
          config={config}
          settings={listeningSettings}
          onSettingsChange={setListeningSettings}
          onStart={(queue) => setListeningQueue(queue)}
          onBack={() => setTab('games')}
        />
      )}
    </div>
  );
}

function GameSettingsPanel({
  config,
  onChange,
  categories,
  words,
  saveError,
  poolByGame,
  onDone,
}: {
  config: GameSetupConfig;
  onChange: (config: GameSetupConfig) => void;
  categories: ReturnType<typeof useLibrary>['categories'];
  words: Word[];
  saveError: string | null;
  poolByGame: Map<GameId, Word[]>;
  onDone: () => void;
}) {
  const issuesForAll = useMemo(() => {
    const all: { game: string; issues: string[] }[] = [];
    for (const def of GAME_DEFINITIONS) {
      const pool = poolByGame.get(def.id) ?? [];
      const issues = getSetupIssues(def, pool, words, config);
      if (issues.length > 0) {
        all.push({ game: def.title, issues });
      }
    }
    return all;
  }, [poolByGame, words, config]);

  return (
    <div className="space-y-6">
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Oyun Ayarları</h2>
          <p className="mt-1 text-sm text-slate-600">
            Buradaki ayarlar tüm oyunlar için ortak kullanılır. Bir oyuna tıkladığınızda doğrudan başlar.
          </p>
        </div>

        <GameFilterFields config={config} onChange={onChange} categories={categories} words={words} />

        {issuesForAll.length > 0 && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            {issuesForAll.map(({ game, issues }) => (
              <div key={game} className="space-y-1">
                {issues.map((issue) => (
                  <p key={issue} className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span><strong>{game}:</strong> {issue}</span>
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}

        {saveError && (
          <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
            Ayarlarınız kaydedilemedi: {saveError}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="flex items-start gap-2 text-sm text-slate-500">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Ayarlarınız otomatik kaydedilir ve uygulamayı tekrar açtığınızda korunur.
        </p>
        <button
          type="button"
          onClick={onDone}
          className="shrink-0 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          Oyunlara dön
        </button>
      </div>
    </div>
  );
}

function ListeningView({
  words,
  config,
  settings,
  onSettingsChange,
  onStart,
  onBack,
}: {
  words: Word[];
  config: GameSetupConfig;
  settings: ListeningSettings;
  onSettingsChange: (settings: ListeningSettings) => void;
  onStart: (queue: Word[]) => void;
  onBack: () => void;
}) {
  const queue = useMemo(() => selectListeningWordsFromConfig(words, config), [words, config]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Dinleme</h1>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Oyunlara dön
        </button>
      </div>

      <p className="text-sm text-slate-600">
        Dinleme, oyunlarla aynı kelime filtrelerini kullanır. {queue.length} kelime dinlenecek.
      </p>

      <ListeningSettingsPanel settings={settings} onChange={onSettingsChange} />

      <button
        type="button"
        onClick={() => onStart(queue)}
        disabled={queue.length === 0}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-700 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
      >
        {queue.length > 0 ? <Play className="h-6 w-6" /> : <Headphones className="h-6 w-6" />}
        {queue.length > 0 ? `Dinlemeye başla (${queue.length} kelime)` : 'Dinlenecek kelime yok'}
      </button>
    </div>
  );
}

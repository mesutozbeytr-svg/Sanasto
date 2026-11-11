import { useState, type ReactNode } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import AppShell, { type TabId } from '@/components/AppShell';
import { LibraryProvider, useLibrary } from '@/contexts/LibraryContext';
import GamesPage from '@/pages/GamesPage';
import LearnPage from '@/pages/LearnPage';
import WordsPage from '@/pages/WordsPage';

function SignedInContent() {
  const [activeTab, setActiveTab] = useState<TabId>('learn');
  const { isLoading, loadError, reload } = useLibrary();

  if (isLoading) {
    return (
      <FullScreenMessage>
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
        <p>Kelimeleriniz yükleniyor...</p>
      </FullScreenMessage>
    );
  }

  if (loadError) {
    return (
      <FullScreenMessage>
        <p className="text-center text-rose-700">{loadError}</p>
        <button
          type="button"
          onClick={() => void reload()}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
        >
          <RefreshCw className="h-4 w-4" /> Tekrar dene
        </button>
      </FullScreenMessage>
    );
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'learn' && <LearnPage />}
      {activeTab === 'games' && <GamesPage />}
      {activeTab === 'words' && <WordsPage />}
    </AppShell>
  );
}

function FullScreenMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-slate-700">
      {children}
    </div>
  );
}

export default function SignedInApp() {
  return (
    <LibraryProvider>
      <SignedInContent />
    </LibraryProvider>
  );
}

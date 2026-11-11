import { useState, type ReactNode } from 'react';
import { BookOpen, Gamepad2, LibraryBig, LogOut, GraduationCap, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { isSpeechSupported } from '@/lib/speech';
import { useAutoPickVoices, useVoices } from '@/hooks/useSpeechSettings';
import { describeError } from '@/lib/errors';

export type TabId = 'learn' | 'games' | 'words';

interface Tab {
  id: TabId;
  label: string;
  icon: LucideIcon;
}

export const TABS: Tab[] = [
  { id: 'learn', label: 'Öğren', icon: GraduationCap },
  { id: 'games', label: 'Karışık Oyna ve Dinle', icon: Gamepad2 },
  { id: 'words', label: 'Tüm Kelimeler', icon: LibraryBig },
];

interface AppShellProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}

export default function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const { user, signOut } = useAuth();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  useAutoPickVoices();
  const finnishVoices = useVoices('fi');
  const showVoiceWarning = isSpeechSupported() && finnishVoices.length === 0;

  const handleSignOut = async () => {
    setSignOutError(null);
    try {
      await signOut();
    } catch (err) {
      setSignOutError(describeError(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-slate-900">Sanasto</span>
          </div>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Ana menü">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden max-w-[180px] truncate text-sm text-slate-500 lg:inline">{user?.email}</span>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
        {signOutError && (
          <p className="bg-rose-50 px-4 py-2 text-center text-sm text-rose-700">{signOutError}</p>
        )}
      </header>

      {showVoiceWarning && (
        <div className="border-b border-amber-200 bg-amber-50">
          <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-3 text-sm text-amber-900 sm:px-6">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Bu cihazda Fince ses kurulmamuş. Tarayıcınızın veya işletim sisteminizin dil ayarlarından Fince (suomi) ses paketini ekleyebilirsiniz. Fince kelimeler yine de okunabilir ama telaffuz kalitesi düşük olabilir.
          </p>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-8">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
        aria-label="Ana menü"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 px-2 pb-[env(safe-area-inset-bottom)] pt-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition ${
                  isActive ? 'text-blue-800' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span className={`flex h-8 w-14 items-center justify-center rounded-full transition ${isActive ? 'bg-blue-100' : ''}`}>
                  <tab.icon className="h-5 w-5" />
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

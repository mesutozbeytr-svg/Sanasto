import { useState, type FormEvent } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { describeAuthError } from '@/lib/errors';

type Mode = 'signIn' | 'signUp';

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === 'signUp';

  const switchMode = () => {
    setMode(isSignUp ? 'signIn' : 'signUp');
    setError(null);
    setConfirmPassword('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError('E-posta ve şifre alanlarını doldurun.');
      return;
    }
    if (isSignUp && password !== confirmPassword) {
      setError('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp) {
        await signUp(trimmedEmail, password);
      } else {
        await signIn(trimmedEmail, password);
      }
    } catch (err) {
      setError(describeAuthError(err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-amber-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-lg shadow-blue-200">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Sanasto</h1>
          <p className="mt-2 text-slate-600">Fince kelimeleri oyunlarla ve dinleyerek öğren.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => isSignUp && switchMode()}
              className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                !isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Giriş yap
            </button>
            <button
              type="button"
              onClick={() => !isSignUp && switchMode()}
              className={`rounded-lg py-2.5 text-sm font-semibold transition ${
                isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hesap oluştur
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                E-posta
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
                placeholder="ornek@mail.com"
                required
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Şifre
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
                placeholder="En az 6 karakter"
                required
              />
            </div>
            {isSignUp && (
              <div>
                <label htmlFor="auth-confirm" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Şifre tekrar
                </label>
                <input
                  id="auth-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            )}

            {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3.5 font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-800 disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
              {isSignUp ? 'Hesap oluştur' : 'Giriş yap'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Verileriniz hesabınıza bağlı olarak saklanır ve giriş yaptığınız tüm cihazlarda görünür.
        </p>
      </div>
    </div>
  );
}

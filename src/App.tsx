import { Loader2 } from 'lucide-react';
import AuthScreen from '@/components/AuthScreen';
import SignedInApp from '@/components/SignedInApp';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function AuthGate() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return <SignedInApp key={user.id} />;
}

function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

export default App;

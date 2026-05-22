import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/lib/supabase';
import { loadPerfil } from '@/lib/auth';
import LoginPage from '@/pages/LoginPage';
import AppLayout from '@/components/AppLayout';

const Index = () => {
  const { isLoggedIn, isInitializing, login, logout, setInitializing } = useAppStore();

  useEffect(() => {
    // Restore session persisted in localStorage by Supabase (survives F5)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const perfil = await loadPerfil(session.user.id);
        if (perfil) {
          login(session.user, perfil);
        }
        // If no perfil, stay on login (isLoggedIn remains false)
      }
      setInitializing(false);
    });

    // Listen for session changes after initialization
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return isLoggedIn ? <AppLayout /> : <LoginPage />;
};

export default Index;

import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/lib/supabase';
import type { Perfil } from '@/store/appStore';
import { Lock, Mail } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError('Correo o contraseña incorrectos.');
      setLoading(false);
      return;
    }

    console.log('[Login] auth OK — user.id:', authData.user.id);
    console.log('[Login] user.email:', authData.user.email);

    const query = supabase
      .from('perfiles')
      .select('id, nombre, rol, sede_id, sedes(nombre)')
      .eq('id', authData.user.id)
      .single();

    console.log('[Login] ejecutando query a perfiles con id =', authData.user.id);

    const { data: row, error: perfilError } = await query;

    console.log('[Login] perfiles → data:', row);
    console.log('[Login] perfiles → error:', perfilError);

    if (perfilError || !row) {
      await supabase.auth.signOut();
      setError('Usuario sin perfil asignado. Contacta al administrador.');
      setLoading(false);
      return;
    }

    const perfil: Perfil = {
      id: row.id,
      nombre: row.nombre,
      rol: row.rol,
      sede_id: row.sede_id,
      sede_nombre: (row.sedes as { nombre: string } | null)?.nombre ?? row.sede_id,
    };

    login(authData.user, perfil);
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-lg border border-border shadow-sm p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-primary tracking-tight">RioTesorería</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestión de tesorería</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="usuario@riogrande.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Distribuciones Riogrande © 2026
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

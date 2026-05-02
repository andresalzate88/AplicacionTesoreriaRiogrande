import { ClipboardList, Scale, CalendarDays, CheckSquare, BarChart3, Settings, LogOut, Flag, Link, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { supabase } from '@/lib/supabase';

const menuItems = [
  { id: 'inicio-dia',          label: 'Inicio del Día',       icon: Flag },
  { id: 'planillas',           label: 'Estado de Planillas',  icon: ClipboardList },
  { id: 'cuadre',              label: 'Cuadre de Planillas',  icon: Scale },
  { id: 'recaudo',             label: 'Recaudo Diario',       icon: CalendarDays },
  { id: 'revision',            label: 'Revisión',             icon: CheckSquare },
  { id: 'conciliacion-alpina', label: 'Conciliación Alpina',  icon: Link },
  { id: 'sincronizacion-odoo', label: 'Sincronización Odoo',  icon: RefreshCw },
  { id: 'informes',            label: 'Informes',             icon: BarChart3 },
  { id: 'parametrizacion',     label: 'Parametrización',      icon: Settings },
];

// Items not listed here are visible to all roles.
const ROLE_RESTRICTIONS: Record<string, string[]> = {
  'revision':             ['analista', 'director', 'admin'],
  'conciliacion-alpina':  ['analista', 'director', 'admin'],
  'sincronizacion-odoo':  ['admin'],
  'parametrizacion':      ['admin'],
};

const ROL_LABELS: Record<string, string> = {
  auxiliar: 'Auxiliar de Tesorería',
  analista:  'Analista de Tesorería',
  director:  'Director de Tesorería',
  admin:     'Administrador',
};

const AppSidebar = () => {
  const { currentPage, setCurrentPage, logout, perfil, rol } = useAppStore();

  const visibleItems = menuItems.filter((item) => {
    const allowed = ROLE_RESTRICTIONS[item.id];
    return !allowed || allowed.includes(rol ?? '');
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-primary tracking-tight">RioTesorería</h1>
        <p className="text-xs text-sidebar-muted mt-0.5">Sistema de gestión</p>
      </div>

      {/* User */}
      <div className="px-5 py-4 border-b border-sidebar-border">
        <p className="text-sm font-medium text-sidebar-primary">{perfil?.nombre}</p>
        <p className="text-xs text-sidebar-muted">{ROL_LABELS[rol ?? ''] ?? rol}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-muted mb-1">Sede activa</p>
        <p className="text-sm font-medium text-sidebar-primary mb-3">
          {perfil?.sede_nombre ?? '—'}
        </p>
        <p className="text-xs text-sidebar-muted mt-1 mb-3">
          Rol: {ROL_LABELS[rol ?? ''] ?? rol}
        </p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-sidebar-muted hover:text-sidebar-primary transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;

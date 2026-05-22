import { useAppStore } from '@/store/appStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { isLoggedIn, isInitializing, rol } = useAppStore();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    // Index.tsx handles rendering LoginPage when isLoggedIn is false
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(rol ?? '')) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground">Sin acceso</p>
          <p className="text-sm text-muted-foreground mt-1">
            No tienes permisos para ver esta sección.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;

import AppSidebar from '@/components/AppSidebar';
import { useAppStore } from '@/store/appStore';
import InicioDia from '@/pages/InicioDia';
import EstadoPlanillas from '@/pages/EstadoPlanillas';
import CuadrePlanillas from '@/pages/CuadrePlanillas';
import RecaudoDiario from '@/pages/RecaudoDiario';
import Revision from '@/pages/Revision';
import Informes from '@/pages/Informes';
import Parametrizacion from '@/pages/Parametrizacion';
import ConciliacionAlpina from '@/pages/ConciliacionAlpina';
import SincronizacionOdoo from '@/pages/SincronizacionOdoo';

const pages: Record<string, React.FC> = {
  'inicio-dia': InicioDia,
  planillas: EstadoPlanillas,
  cuadre: CuadrePlanillas,
  recaudo: RecaudoDiario,
  revision: Revision,
  'conciliacion-alpina': ConciliacionAlpina,
  'sincronizacion-odoo': SincronizacionOdoo,
  informes: Informes,
  parametrizacion: Parametrizacion,
};

const AppLayout = () => {
  const { currentPage } = useAppStore();
  const PageComponent = pages[currentPage] || EstadoPlanillas;

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-muted/30">
        <PageComponent />
      </main>
    </div>
  );
};

export default AppLayout;

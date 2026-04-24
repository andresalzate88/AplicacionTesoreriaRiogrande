import { useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface SyncData {
  id: string;
  nit: string;
  nombre: string;
  operacion?: string;
  estado: 'PENDIENTE' | 'SINCRONIZADO' | 'ERROR' | 'ENVIADO' | 'CONFIRMADO';
  error?: string;
  // Para documentos
  tipo?: string;
  fecha?: string;
  valor?: number;
  estadoDian?: 'APROBADO_CON_NOTIFICACION' | 'PENDIENTE' | 'RECHAZADO';
  estadoEnvio?: string;
  // Para proveedores
  tipoTercero?: string;
  // Para asientos
  referencia?: string;
  debito?: string;
  credito?: string;
}

const mockClientes: SyncData[] = [
  { id: 'DA-1', nit: '1039760460', nombre: 'Tienda El Sol', operacion: 'DA', estado: 'PENDIENTE' },
  { id: 'DA-2', nit: '900123456', nombre: 'Minimercado Popalito', operacion: 'DA', estado: 'SINCRONIZADO' },
  { id: 'DC-5', nit: '800987654', nombre: 'Distribuidora JS', operacion: 'DC', estado: 'ERROR', error: 'NIT duplicado en Odoo' }
];

const mockDocumentos: SyncData[] = [
  { id: 'DMA779121', tipo: 'FAC. VENTA', fecha: '19/04/2026', nombre: 'Tienda El Sol', valor: 303156, estadoDian: 'APROBADO_CON_NOTIFICACION', estadoEnvio: 'PENDIENTE ENVÍO', nit: '', estado: 'PENDIENTE' },
  { id: 'DMA779122', tipo: 'NOTA CRÉDITO', fecha: '19/04/2026', nombre: 'Tienda Mixta', valor: -15000, estadoDian: 'APROBADO_CON_NOTIFICACION', estadoEnvio: 'ENVIADO', nit: '', estado: 'ENVIADO' }
];

const mockProveedores: SyncData[] = [
  { id: '1', nit: '900123456', nombre: 'Concesión Vial 4G', tipoTercero: 'Jurídico', estado: 'PENDIENTE' },
  { id: '2', nit: '800456789', nombre: 'EDS El Nogal', tipoTercero: 'Jurídico', estado: 'ERROR', error: 'Nombre requerido en Odoo' }
];

const mockAsientos: SyncData[] = [
  { id: '1', fecha: '19/04/2026', referencia: 'DMA-110426.01', tipo: 'RETENCION_CLIENTE', debito: '13551525', credito: '130501', valor: 7578, estado: 'PENDIENTE', nit: '', nombre: '' },
  { id: '2', fecha: '19/04/2026', referencia: 'DMA-110426.01', tipo: 'GASTO', debito: '520101', credito: '130501', valor: 29750, estado: 'CONFIRMADO', nit: '', nombre: '' },
  { id: '3', fecha: '19/04/2026', referencia: 'DMA-RD-190426', tipo: 'CONSIGNACION_RG', debito: '133131313', credito: '130501', valor: 3000000, estado: 'ERROR', error: 'Diario no configurado', nit: '', nombre: '' }
];

const SincronizacionOdoo = () => {
  const [syncManual, setSyncManual] = useState(true);
  const [syncAuto, setSyncAuto] = useState(false);

  const pendingClientes = mockClientes.filter(c => c.estado === 'PENDIENTE' || c.estado === 'ERROR').length;
  const pendingDocumentos = mockDocumentos.filter(d => d.estadoEnvio === 'PENDIENTE ENVÍO').length;
  const pendingProveedores = mockProveedores.filter(p => p.estado === 'PENDIENTE' || p.estado === 'ERROR').length;
  const pendingAsientos = mockAsientos.filter(a => a.estado === 'PENDIENTE' || a.estado === 'ERROR').length;

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-warning/20 text-warning-foreground border border-warning/30';
      case 'SINCRONIZADO': case 'CONFIRMADO': return 'bg-success/20 text-success-foreground border border-success/30';
      case 'ERROR': return 'bg-destructive/20 text-destructive border border-destructive/30';
      case 'ENVIADO': return 'bg-primary/20 text-primary border border-primary/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDianBadgeColor = (estado?: string) => {
    switch (estado) {
      case 'APROBADO_CON_NOTIFICACION': return 'bg-success/20 text-success-foreground border border-success/30';
      case 'PENDIENTE': return 'bg-warning/20 text-warning-foreground border border-warning/30';
      case 'RECHAZADO': return 'bg-destructive/20 text-destructive border border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="p-8 animate-fade-in max-w-6xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sincronización con Odoo</h2>
          <p className="text-sm text-muted-foreground mt-1">Gestión de envío de datos al ERP</p>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm font-medium">Sync manual</span>
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${syncManual ? 'bg-success' : 'bg-muted'}`} onClick={() => { setSyncManual(!syncManual); if (!syncManual) setSyncAuto(false); }}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${syncManual ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm font-medium">Sync automática</span>
            <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${syncAuto ? 'bg-success' : 'bg-muted'}`} onClick={() => { setSyncAuto(!syncAuto); if (!syncAuto) setSyncManual(false); }}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${syncAuto ? 'translate-x-6' : 'translate-x-1'}`} />
            </div>
          </label>
        </div>
      </div>

      {!syncAuto && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-8 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-warning-foreground">
            <span className="font-semibold">Modo manual activo</span> — ejecuta cada bloque manualmente cuando estés listo para enviar datos a Odoo.
          </p>
        </div>
      )}

      <div className="space-y-8">
        {/* BLOQUE 1 */}
        <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="border-b border-border p-4 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg text-foreground">1. Maestro de Clientes</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${pendingClientes > 0 ? 'bg-warning/20 text-warning-foreground' : 'bg-success/20 text-success-foreground'}`}>
                {pendingClientes} pendientes
              </span>
            </div>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              <RefreshCw className="h-4 w-4" /> Sincronizar Clientes
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID Externo</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">NIT</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Establecimiento</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Operación</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockClientes.map((c, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{c.id}</td>
                    <td className="px-4 py-3 font-mono">{c.nit}</td>
                    <td className="px-4 py-3 font-medium">{c.nombre}</td>
                    <td className="px-4 py-3">{c.operacion}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getBadgeColor(c.estado)}`}>{c.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-destructive text-xs">{c.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* BLOQUE 2 */}
        <section className={`bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-opacity ${pendingClientes > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="border-b border-border p-4 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg text-foreground">2. Documentos ERP</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${pendingDocumentos > 0 ? 'bg-warning/20 text-warning-foreground' : 'bg-success/20 text-success-foreground'}`}>
                {pendingDocumentos} pendientes
              </span>
            </div>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              <RefreshCw className="h-4 w-4" /> Sincronizar Documentos
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Documento</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado DIAN</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado Envío</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockDocumentos.map((d, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-primary font-medium">{d.id}</td>
                    <td className="px-4 py-3">{d.tipo}</td>
                    <td className="px-4 py-3">{d.fecha}</td>
                    <td className="px-4 py-3">{d.nombre}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(d.valor || 0)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-semibold ${getDianBadgeColor(d.estadoDian)}`}>{d.estadoDian?.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${d.estadoEnvio === 'ENVIADO' ? 'bg-primary/20 text-primary' : 'bg-warning/20 text-warning-foreground'}`}>{d.estadoEnvio}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* BLOQUE 3 */}
        <section className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="border-b border-border p-4 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg text-foreground">3. Maestro de Proveedores</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${pendingProveedores > 0 ? 'bg-warning/20 text-warning-foreground' : 'bg-success/20 text-success-foreground'}`}>
                {pendingProveedores} pendientes
              </span>
            </div>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              <RefreshCw className="h-4 w-4" /> Sincronizar Proveedores
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">NIT</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockProveedores.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-mono">{p.nit}</td>
                    <td className="px-4 py-3 font-medium">{p.nombre}</td>
                    <td className="px-4 py-3">{p.tipoTercero}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getBadgeColor(p.estado)}`}>{p.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-destructive text-xs">{p.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* BLOQUE 4 */}
        <section className={`bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-opacity ${(pendingClientes > 0 || pendingDocumentos > 0 || pendingProveedores > 0) ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="border-b border-border p-4 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-lg text-foreground">4. Asientos Contables</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${pendingAsientos > 0 ? 'bg-warning/20 text-warning-foreground' : 'bg-success/20 text-success-foreground'}`}>
                {pendingAsientos} pendientes
              </span>
            </div>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              <RefreshCw className="h-4 w-4" /> Sincronizar Asientos
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Referencia</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Débito</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Crédito</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mockAsientos.map((a, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">{a.fecha}</td>
                    <td className="px-4 py-3 font-mono">{a.referencia}</td>
                    <td className="px-4 py-3">{a.tipo}</td>
                    <td className="px-4 py-3 font-mono text-xs">{a.debito}</td>
                    <td className="px-4 py-3 font-mono text-xs">{a.credito}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium">{formatCurrency(a.valor || 0)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getBadgeColor(a.estado)}`}>{a.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-destructive text-xs">{a.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="mt-8 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg p-5">
        <p className="text-blue-800 dark:text-blue-300 text-sm">
          La integración con Odoo está en proceso de configuración. El formato exacto de envío se definirá con el implementador de Odoo 19. Los datos mostrados aquí están listos para ser enviados.
        </p>
      </div>
    </div>
  );
};

export default SincronizacionOdoo;

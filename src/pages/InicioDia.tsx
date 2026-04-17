import { useState } from 'react';
import {
  RefreshCw, FileText, Landmark, Package, CheckCircle2,
  AlertTriangle, Info, CloudUpload, Loader2
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type SyncStatus = 'Sincronizado' | 'Pendiente' | 'Error';

interface FuenteSync {
  id: string;
  nombre: string;
  ultimaSync: string;
  archivosNuevos: number;
  estado: SyncStatus;
  tipo: 'erp' | 'banco' | 'aliado';
}

interface Alerta {
  tipo: 'urgente' | 'atencion' | 'informativo';
  mensaje: string;
}

interface EstadoSede {
  nombre: string;
  estado: 'Abierto' | 'Cerrado-Auxiliar' | 'Aprobado';
  saldo: string;
  cuadres: number;
  diasSinAprobar: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const fuentesSync: FuenteSync[] = [
  // ERP
  { id: 'erp', nombre: 'Plano ERP (DA, DC, DF, CA, CC, CN, AA, QC, QN, QM)', ultimaSync: 'Hoy 06:47 a.m.', archivosNuevos: 3, estado: 'Sincronizado', tipo: 'erp' },
  // Bancos
  { id: 'bcol1', nombre: 'Extractos Bancolombia Cta1', ultimaSync: 'Hoy 06:47 a.m.', archivosNuevos: 0, estado: 'Sincronizado', tipo: 'banco' },
  { id: 'bcol2', nombre: 'Extractos Bancolombia Cta2', ultimaSync: 'Hoy 06:47 a.m.', archivosNuevos: 2, estado: 'Sincronizado', tipo: 'banco' },
  { id: 'cfa', nombre: 'Extractos CFA', ultimaSync: 'Hoy 06:47 a.m.', archivosNuevos: 0, estado: 'Pendiente', tipo: 'banco' },
  // Cárnicos por sede (DC / CC / QC)
  { id: 'carnicos_dc', nombre: 'Consig. Cárnicos — Donmatías (DC)', ultimaSync: 'Hoy 06:47 a.m.', archivosNuevos: 1, estado: 'Sincronizado', tipo: 'aliado' },
  { id: 'carnicos_cc', nombre: 'Consig. Cárnicos — Caucasia (CC)', ultimaSync: 'Hoy 06:47 a.m.', archivosNuevos: 0, estado: 'Sincronizado', tipo: 'aliado' },
  { id: 'carnicos_qc', nombre: 'Consig. Cárnicos — Quibdó (QC)', ultimaSync: 'Hoy 06:47 a.m.', archivosNuevos: 0, estado: 'Sincronizado', tipo: 'aliado' },
  // Nutresa por sede (CN / QN)
  { id: 'nutresa_cn', nombre: 'Consig. Nutresa — Caucasia (CN)', ultimaSync: 'Hoy 06:47 a.m.', archivosNuevos: 2, estado: 'Sincronizado', tipo: 'aliado' },
  { id: 'nutresa_qn', nombre: 'Consig. Nutresa — Quibdó (QN)', ultimaSync: 'Ayer 07:02 a.m.', archivosNuevos: 0, estado: 'Error', tipo: 'aliado' },
  // Meals por sede (QM — solo Quibdó)
  { id: 'meals_qm', nombre: 'Consig. Meals — Quibdó (QM)', ultimaSync: 'Hoy 06:47 a.m.', archivosNuevos: 0, estado: 'Sincronizado', tipo: 'aliado' },
  // Alpina — todas las sedes mezcladas en 1 archivo
  { id: 'alpina', nombre: 'Consig. Alpina — Todas las sedes (DA, CA, AA)', ultimaSync: 'Hoy 06:47 a.m.', archivosNuevos: 0, estado: 'Sincronizado', tipo: 'aliado' },
];

const alertas: Alerta[] = [
  { tipo: 'urgente', mensaje: '2 días sin aprobar en sede Caucasia' },
  { tipo: 'atencion', mensaje: 'Consignación bloqueada hace 45 min sin cuadre confirmado — Donmatías' },
  { tipo: 'informativo', mensaje: '3 planillas cerradas en ERP pendientes de cuadre — Quibdó' },
];

const estadoSedes: EstadoSede[] = [
  { nombre: 'Donmatías', estado: 'Abierto', saldo: '$14.613.305', cuadres: 2, diasSinAprobar: 0 },
  { nombre: 'Caucasia', estado: 'Cerrado-Auxiliar', saldo: '$8.200.000', cuadres: 1, diasSinAprobar: 2 },
  { nombre: 'Apartadó', estado: 'Aprobado', saldo: '$3.450.000', cuadres: 1, diasSinAprobar: 0 },
  { nombre: 'Quibdó', estado: 'Abierto', saldo: '$5.100.000', cuadres: 0, diasSinAprobar: 0 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const iconoPorTipo = (tipo: FuenteSync['tipo']) => {
  if (tipo === 'erp') return <FileText className="h-4 w-4 text-primary shrink-0" />;
  if (tipo === 'banco') return <Landmark className="h-4 w-4 text-primary shrink-0" />;
  return <Package className="h-4 w-4 text-primary shrink-0" />;
};

const badgeSync = (estado: SyncStatus) => {
  const base = 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ';
  if (estado === 'Sincronizado') return (
    <span className={base + 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'}>
      <CheckCircle2 className="h-3 w-3" /> Sincronizado
    </span>
  );
  if (estado === 'Pendiente') return (
    <span className={base + 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'}>
      <AlertTriangle className="h-3 w-3" /> Pendiente
    </span>
  );
  return (
    <span className={base + 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}>
      <AlertTriangle className="h-3 w-3" /> Error
    </span>
  );
};

const badgeEstadoSede = (estado: EstadoSede['estado']) => {
  const base = 'px-2.5 py-0.5 rounded-full text-xs font-semibold ';
  if (estado === 'Aprobado') return <span className={base + 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'}>Aprobado</span>;
  if (estado === 'Cerrado-Auxiliar') return <span className={base + 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'}>Cerrado-Auxiliar</span>;
  return <span className={base + 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'}>Abierto</span>;
};

const badgeAlerta = (tipo: Alerta['tipo']) => {
  if (tipo === 'urgente') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">Urgente</span>;
  if (tipo === 'atencion') return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">Atención</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">Informativo</span>;
};

// ─── Componente ───────────────────────────────────────────────────────────────

const InicioDia = () => {
  const [sincronizando, setSincronizando] = useState(false);

  const handleSync = () => {
    setSincronizando(true);
    setTimeout(() => setSincronizando(false), 2200);
  };

  return (
    <div className="p-8 animate-fade-in space-y-8 max-w-7xl">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">🏁 Inicio del Día</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Panel de control · {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* ── SECCIÓN A — Sincronización de fuentes ── */}
      <section>
        <h3 className="text-base font-semibold text-foreground mb-3">Sincronización de fuentes</h3>

        {/* Botón sync + timestamp */}
        <div className="flex items-center gap-4 mb-5">
          <button
            onClick={handleSync}
            disabled={sincronizando}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-70"
          >
            {sincronizando
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />}
            {sincronizando ? 'Sincronizando…' : '🔄 Sincronizar todas las fuentes'}
          </button>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            Última sync completa: <span className="font-medium text-foreground">Hoy 06:47 a.m.</span>
          </p>
        </div>

        {/* Cards de fuentes — 2 columnas en pantallas medianas, 3 en grandes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fuentesSync.map((f) => (
            <div
              key={f.id}
              className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {iconoPorTipo(f.tipo)}
                  <span className="text-xs font-medium text-foreground leading-snug">{f.nombre}</span>
                </div>
                <CloudUpload className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5" />
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Última sync: <span className="text-foreground font-medium">{f.ultimaSync}</span></p>
                <p>
                  Archivos nuevos:{' '}
                  <span className={`font-semibold ${f.archivosNuevos > 0 ? 'text-primary' : 'text-foreground'}`}>
                    {f.archivosNuevos}
                  </span>
                </p>
              </div>
              <div>{badgeSync(f.estado)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECCIÓN B — Alertas activas ── */}
      <section>
        <h3 className="text-base font-semibold text-foreground mb-3">Alertas activas</h3>
        <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
          {alertas.map((a, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              {a.tipo === 'informativo'
                ? <Info className="h-4 w-4 text-blue-500 shrink-0" />
                : <AlertTriangle className={`h-4 w-4 shrink-0 ${a.tipo === 'urgente' ? 'text-red-500' : 'text-yellow-500'}`} />
              }
              <p className="flex-1 text-sm text-foreground">{a.mensaje}</p>
              {badgeAlerta(a.tipo)}
            </div>
          ))}
        </div>
      </section>

      {/* ── SECCIÓN C — Estado del día por sede ── */}
      <section>
        <h3 className="text-base font-semibold text-foreground mb-3">Estado del día por sede</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {estadoSedes.map((s) => (
            <div
              key={s.nombre}
              className={`bg-card border rounded-lg p-5 space-y-4 ${s.diasSinAprobar >= 2 ? 'border-red-400 dark:border-red-600' : 'border-border'
                }`}
            >
              {/* Nombre y estado */}
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{s.nombre}</p>
                {badgeEstadoSede(s.estado)}
              </div>

              {/* Saldo */}
              <div>
                <p className="text-xs text-muted-foreground">Saldo actual de caja</p>
                <p className="text-xl font-bold text-foreground mt-0.5">{s.saldo}</p>
              </div>

              {/* Métricas */}
              <div className="flex justify-between text-xs text-muted-foreground border-t border-border pt-3">
                <span>
                  <span className="font-semibold text-foreground">{s.cuadres}</span> cuadre{s.cuadres !== 1 ? 's' : ''}
                </span>
                <span className={s.diasSinAprobar >= 2 ? 'font-bold text-red-600 dark:text-red-400' : ''}>
                  {s.diasSinAprobar === 0
                    ? '✓ Al día'
                    : `⚠️ ${s.diasSinAprobar} día${s.diasSinAprobar > 1 ? 's' : ''} sin aprobar`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default InicioDia;

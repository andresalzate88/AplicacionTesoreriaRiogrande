import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import { sedes } from '@/data/mockData';
import { Download, Filter, DatabaseZap } from 'lucide-react';

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const tabs = [
  'Estado de planillas',
  'Estado del día',
  'Detalle del día',
  'Planillas pendientes',
  'Saldos de efectivo',
  'Plano contable Odoo',
  'Cuadres anulados',
  'Consignaciones Banco',
  'Consignaciones Aliados',
  'Auditoría Máximo Detalle',
];

// ─── Mock data nuevos informes ────────────────────────────────────────────────

const consigBancoMock = [
  { fecha: '11/04', banco: 'Bancolombia Cta1', ref: 'REF-2847361', consignante: 'Tienda El Sol',       valor: 3000000,  sede: 'Donmatías', estado: 'En cuadre', cuadre: 'DMA-110426.01', recaudo: 'DMA-RD-110426', estadoCuadre: 'Enviado a revisión' },
  { fecha: '11/04', banco: 'Bancolombia Cta1', ref: 'REF-2847390', consignante: 'Sin identificar',     valor: 2000000,  sede: '—',         estado: 'Libre',      cuadre: '—',             recaudo: '—',              estadoCuadre: '—'                  },
  { fecha: '10/04', banco: 'CFA',              ref: 'REF-0091100', consignante: 'Minimercado Popalito', valor: 1500000,  sede: 'Donmatías', estado: 'Aprobada',   cuadre: 'DMA-100426.01', recaudo: 'DMA-RD-100426', estadoCuadre: 'Aprobado'           },
  { fecha: '11/04', banco: 'Bancolombia Cta2', ref: 'REF-5512890', consignante: 'Tienda Mixta',        valor: 4124400,  sede: 'Caucasia',  estado: 'Bloqueada',  cuadre: '—',             recaudo: '—',              estadoCuadre: '—'                  },
  { fecha: '10/04', banco: 'Bancolombia Cta1', ref: 'REF-2847100', consignante: 'Distribuidora JS',    valor: 2800000,  sede: 'Donmatías', estado: 'Aprobada',   cuadre: 'DMA-100426.02', recaudo: 'DMA-RD-100426', estadoCuadre: 'Aprobado'           },
  { fecha: '09/04', banco: 'CFA',              ref: 'REF-0090980', consignante: 'Sin identificar',     valor: 900000,   sede: '—',         estado: 'Libre',      cuadre: '—',             recaudo: '—',              estadoCuadre: '—'                  },
  { fecha: '11/04', banco: 'Bancolombia Cta2', ref: 'REF-5512901', consignante: 'Tienda Nogales',      valor: 1200000,  sede: 'Caucasia',  estado: 'En cuadre', cuadre: 'CAC-110426.01', recaudo: 'CAC-RD-110426', estadoCuadre: 'Borrador'           },
  { fecha: '09/04', banco: 'Bancolombia Cta1', ref: 'REF-2846990', consignante: 'Granero Silvania',    valor: 3500000,  sede: 'Donmatías', estado: 'Aprobada',   cuadre: 'DMA-090426.01', recaudo: 'DMA-RD-090426', estadoCuadre: 'Aprobado'           },
];

const consigAliadosMock = [
  { fecha: '11/04', aliado: 'Cárnicos', sede: 'Donmatías', ref: 'CARN-00123', valor: 2000000, certif: 'Certificada',    estadoCuadre: 'En cuadre', cuadre: 'DMA-110426.01', recaudo: 'DMA-RD-110426' },
  { fecha: '11/04', aliado: 'Alpina',   sede: 'Donmatías', ref: 'ALP-manual', valor: 1500000, certif: 'Sin certificar', estadoCuadre: 'En cuadre', cuadre: 'DMA-110426.01', recaudo: 'DMA-RD-110426' },
  { fecha: '10/04', aliado: 'Nutresa',  sede: 'Caucasia',  ref: 'NUT-00456',  valor: 800000,  certif: 'Certificada',    estadoCuadre: 'Aprobada',  cuadre: 'CAC-100426.01', recaudo: 'CAC-RD-100426' },
  { fecha: '08/04', aliado: 'Alpina',   sede: 'Donmatías', ref: 'ALP-manual', valor: 3000000, certif: 'Sin certificar', estadoCuadre: 'Aprobada',  cuadre: 'DMA-080426.01', recaudo: 'DMA-RD-080426' },
  { fecha: '11/04', aliado: 'Meals',    sede: 'Quibdó',    ref: 'MEA-00789',  valor: 1200000, certif: 'Certificada',    estadoCuadre: 'En cuadre', cuadre: 'QBO-110426.01', recaudo: 'QBO-RD-110426' },
  { fecha: '10/04', aliado: 'Cárnicos', sede: 'Caucasia',  ref: 'CARN-00124', valor: 2500000, certif: 'Certificada',    estadoCuadre: 'Aprobada',  cuadre: 'CAC-100426.01', recaudo: 'CAC-RD-100426' },
  { fecha: '09/04', aliado: 'Alpina',   sede: 'Caucasia',  ref: 'ALP-manual', valor: 1800000, certif: 'Sin certificar', estadoCuadre: 'Aprobada',  cuadre: 'CAC-090426.01', recaudo: 'CAC-RD-090426' },
  { fecha: '11/04', aliado: 'Cárnicos', sede: 'Quibdó',    ref: 'CARN-00125', valor: 900000,  certif: 'Diferencia',     estadoCuadre: 'Libre',     cuadre: '—',             recaudo: '—'             },
];

const auditoriaMock = [
  { recaudo: 'DMA-RD-110426', fecha: '11/04/2026', sede: 'Donmatías', cuadre: 'DMA-110426.01', planilla: 'DA-32926', tipo: 'FACTURA_VENTA',       subtipo: 'FACTURA DE VENTA',             doc: 'DMA782282', tercero: 'Tienda El Sol',          nit: '1039760460', valor: 303156,   cuenta: '41351219', analitica: '{"7":100}', diario: 'VDA', estCuadre: 'Enviado a revisión', estRecaudo: 'Enviado a revisión', conductor: 'Juan García',    placa: 'NTB-432', ejecutado: 'María González' },
  { recaudo: 'DMA-RD-110426', fecha: '11/04/2026', sede: 'Donmatías', cuadre: 'DMA-110426.01', planilla: 'DA-32926', tipo: 'NOTA_CREDITO',         subtipo: 'NOTA AVERIA-CAMBIO',           doc: 'DMA782283', tercero: 'Tienda El Sol',          nit: '1039760460', valor: -15000,   cuenta: '41752319', analitica: '{"7":100}', diario: 'VDA', estCuadre: 'Enviado a revisión', estRecaudo: 'Enviado a revisión', conductor: 'Juan García',    placa: 'NTB-432', ejecutado: 'María González' },
  { recaudo: 'DMA-RD-110426', fecha: '11/04/2026', sede: 'Donmatías', cuadre: 'DMA-110426.01', planilla: 'DA-32926', tipo: 'RETENCION',            subtipo: 'RETEFTE',                      doc: 'DMA782282', tercero: 'Tienda El Sol',          nit: '1039760460', valor: -9095,    cuenta: '23654001', analitica: '{"7":100}', diario: 'VDA', estCuadre: 'Enviado a revisión', estRecaudo: 'Enviado a revisión', conductor: 'Juan García',    placa: 'NTB-432', ejecutado: 'María González' },
  { recaudo: 'DMA-RD-110426', fecha: '11/04/2026', sede: 'Donmatías', cuadre: 'DMA-110426.01', planilla: 'DA-32926', tipo: 'GASTO_RUTA',           subtipo: 'PEAJE',                        doc: '—',         tercero: 'Concesión Vial',         nit: '900123456',  valor: 25000,    cuenta: '51309501', analitica: '{"7":100}', diario: 'VDA', estCuadre: 'Enviado a revisión', estRecaudo: 'Enviado a revisión', conductor: 'Juan García',    placa: 'NTB-432', ejecutado: 'María González' },
  { recaudo: 'DMA-RD-110426', fecha: '11/04/2026', sede: 'Donmatías', cuadre: 'DMA-110426.01', planilla: 'DA-32926', tipo: 'CONSIGNACION_BANCO',   subtipo: '—',                            doc: 'REF-2847361', tercero: '—',                   nit: '—',          valor: 3000000,  cuenta: '11100501', analitica: '{"7":100}', diario: 'VDA', estCuadre: 'Enviado a revisión', estRecaudo: 'Enviado a revisión', conductor: 'Juan García',    placa: 'NTB-432', ejecutado: 'María González' },
  { recaudo: 'DMA-RD-110426', fecha: '11/04/2026', sede: 'Donmatías', cuadre: 'DMA-110426.01', planilla: 'DA-32926', tipo: 'CONSIGNACION_ALIADO',  subtipo: 'ALPINA',                       doc: 'ALP-manual', tercero: 'Alpina S.A.',          nit: '860002552',  valor: 1500000,  cuenta: '23100501', analitica: '{"7":100}', diario: 'VDA', estCuadre: 'Enviado a revisión', estRecaudo: 'Enviado a revisión', conductor: 'Juan García',    placa: 'NTB-432', ejecutado: 'María González' },
  { recaudo: 'DMA-RD-110426', fecha: '11/04/2026', sede: 'Donmatías', cuadre: 'DMA-110426.01', planilla: 'DA-32926', tipo: 'ANTICIPO_CLIENTE',     subtipo: 'ANTICIPO',                     doc: 'ANT-00123', tercero: 'Tienda Mixta Nogales',   nit: '1039760461', valor: 500000,   cuenta: '28051001', analitica: '{"7":100}', diario: 'VDA', estCuadre: 'Enviado a revisión', estRecaudo: 'Enviado a revisión', conductor: 'Juan García',    placa: 'NTB-432', ejecutado: 'María González' },
  { recaudo: 'DMA-RD-110426', fecha: '11/04/2026', sede: 'Donmatías', cuadre: 'DMA-110426.01', planilla: 'DA-32926', tipo: 'ANTICIPO_NOMINA',      subtipo: 'ANT_NOMINA',                   doc: '—',         tercero: 'Carlos López',           nit: '98480254',   valor: 70000,    cuenta: '25050501', analitica: '{"7":100}', diario: 'VDA', estCuadre: 'Enviado a revisión', estRecaudo: 'Enviado a revisión', conductor: 'Juan García',    placa: 'NTB-432', ejecutado: 'María González' },
  { recaudo: 'DMA-RD-110426', fecha: '11/04/2026', sede: 'Donmatías', cuadre: 'DMA-110426.02', planilla: 'DC-32641', tipo: 'FACTURA_VENTA',        subtipo: 'FACTURA DE VENTA',             doc: 'DCM773827', tercero: 'Minimercado Popalito',   nit: '98480255',   valor: 150762,   cuenta: '41351205', analitica: '{"7":100}', diario: 'VDA', estCuadre: 'Enviado a revisión', estRecaudo: 'Enviado a revisión', conductor: 'Pedro Martínez', placa: 'OPQ-871', ejecutado: 'María González' },
  { recaudo: 'DMA-RD-110426', fecha: '11/04/2026', sede: 'Donmatías', cuadre: 'DMA-110426.02', planilla: 'DC-32641', tipo: 'DESC_CONDICIONADO',    subtipo: 'NOTA DESCUENTO CONDICIONADO',  doc: 'DCM773828', tercero: 'Minimercado Popalito',   nit: '98480255',   valor: -5000,    cuenta: '41755002', analitica: '{"7":100}', diario: 'VDA', estCuadre: 'Enviado a revisión', estRecaudo: 'Enviado a revisión', conductor: 'Pedro Martínez', placa: 'OPQ-871', ejecutado: 'María González' },
  { recaudo: 'DMA-RD-110426', fecha: '11/04/2026', sede: 'Donmatías', cuadre: '—',             planilla: '—',        tipo: 'DESTINO_EFECTIVO',     subtipo: 'TRASLADO',                     doc: '—',         tercero: 'Bancolombia Cta1',       nit: '—',          valor: 4000000,  cuenta: '11100502', analitica: '{"7":100}', diario: 'VDA', estCuadre: '—',                  estRecaudo: 'Enviado a revisión', conductor: '—',              placa: '—',       ejecutado: 'María González' },
  { recaudo: 'DMA-RD-110426', fecha: '11/04/2026', sede: 'Donmatías', cuadre: '—',             planilla: '—',        tipo: 'DESTINO_EFECTIVO',     subtipo: 'ANTICIPO_ALIADO',              doc: '—',         tercero: 'Alpina S.A.',            nit: '860002552',  valor: 2000000,  cuenta: '23100501', analitica: '{"7":100}', diario: 'VDA', estCuadre: '—',                  estRecaudo: 'Enviado a revisión', conductor: '—',              placa: '—',       ejecutado: 'María González' },
];

const TIPOS_MOV = [
  'FACTURA_VENTA','NOTA_CREDITO','NOTA_DEBITO','ANTICIPO_CLIENTE',
  'RETENCION','DESC_CONDICIONADO','GASTO_RUTA','CONSIGNACION_BANCO',
  'CONSIGNACION_ALIADO','ANTICIPO_NOMINA','HURTO_RUTA','DESTINO_EFECTIVO','HURTO_BODEGA',
];

// ─── Helpers de badges ────────────────────────────────────────────────────────

const badgeEstadoCB = (estado: string) => {
  const base = 'px-2 py-0.5 rounded-full text-xs font-semibold ';
  if (estado === 'Aprobada')   return <span className={base + 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'}>Aprobada</span>;
  if (estado === 'En cuadre')  return <span className={base + 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'}>En cuadre</span>;
  if (estado === 'Bloqueada')  return <span className={base + 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}>Bloqueada</span>;
  return                              <span className={base + 'bg-muted text-muted-foreground'}>Libre</span>;
};

const badgeCertif = (estado: string) => {
  const base = 'px-2 py-0.5 rounded-full text-xs font-semibold ';
  if (estado === 'Certificada')    return <span className={base + 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'}>Certificada</span>;
  if (estado === 'Sin certificar') return <span className={base + 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'}>Sin certificar</span>;
  return                                  <span className={base + 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}>Diferencia</span>;
};

const badgeTipoMov = (tipo: string) => {
  const colores: Record<string, string> = {
    FACTURA_VENTA:       'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    NOTA_CREDITO:        'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    NOTA_DEBITO:         'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    GASTO_RUTA:          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
    CONSIGNACION_BANCO:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    CONSIGNACION_ALIADO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    RETENCION:           'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    DESC_CONDICIONADO:   'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    ANTICIPO_CLIENTE:    'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400',
    ANTICIPO_NOMINA:     'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400',
    DESTINO_EFECTIVO:    'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
    HURTO_RUTA:          'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    HURTO_BODEGA:        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  };
  const cls = colores[tipo] || 'bg-muted text-muted-foreground';
  return <span className={`px-1.5 py-0.5 rounded text-xs font-mono font-semibold ${cls}`}>{tipo}</span>;
};

// ─── Componente ───────────────────────────────────────────────────────────────

const Informes = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([]);
  const [showTiposDropdown, setShowTiposDropdown] = useState(false);

  const toggleTipo = (tipo: string) => {
    setTiposSeleccionados(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  const isAuditoria = activeTab === 9;

  return (
    <div className="p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Informes</h2>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
          <Download className="h-4 w-4" /> Descargar Excel
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-border">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === i
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {i === 9 && <DatabaseZap className="h-3.5 w-3.5 shrink-0" />}
            {tab}
            {i === 9 && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">Completo</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Filtros estándar (tabs 0-8) ── */}
      {!isAuditoria && (
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
            {sedes.map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="text" placeholder="Desde" defaultValue="01/04/2026" className="border border-input rounded-md px-3 py-2 text-sm bg-background w-32" />
          <input type="text" placeholder="Hasta" defaultValue="11/04/2026" className="border border-input rounded-md px-3 py-2 text-sm bg-background w-32" />
          {/* Filtros extra según tab */}
          {activeTab === 7 && (
            <>
              <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
                <option>Todos los bancos</option>
                <option>Bancolombia Cta1</option>
                <option>Bancolombia Cta2</option>
                <option>CFA</option>
              </select>
              <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
                <option>Todos los estados</option>
                <option>Libre</option>
                <option>Bloqueada</option>
                <option>En cuadre</option>
                <option>Aprobada</option>
              </select>
            </>
          )}
          {activeTab === 8 && (
            <>
              <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
                <option>Todos los aliados</option>
                <option>Alpina</option>
                <option>Cárnicos</option>
                <option>Nutresa</option>
                <option>Meals</option>
              </select>
              <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
                <option>Todos los estados certif.</option>
                <option>Certificada</option>
                <option>Sin certificar</option>
                <option>Diferencia</option>
              </select>
              <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
                <option>Todos los estados cuadre</option>
                <option>Libre</option>
                <option>En cuadre</option>
                <option>Aprobada</option>
              </select>
            </>
          )}
          {activeTab < 7 && (
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
              <option>Todos los estados</option>
              <option>Aprobado</option>
              <option>Pendiente</option>
              <option>Devuelto</option>
            </select>
          )}
        </div>
      )}

      {/* ── Filtros Auditoría Máximo Detalle ── */}
      {isAuditoria && (
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <DatabaseZap className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Filtros — Auditoría Máximo Detalle</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <input type="text" placeholder="N° Recaudo (ej: DMA-RD-110426)" className="border border-input rounded-md px-3 py-2 text-sm bg-background col-span-2 lg:col-span-1" />
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
              <option>Todas las sedes</option>
              {sedes.map(s => <option key={s}>{s}</option>)}
            </select>
            <input type="text" placeholder="Desde" defaultValue="11/04/2026" className="border border-input rounded-md px-3 py-2 text-sm bg-background" />
            <input type="text" placeholder="Hasta" defaultValue="11/04/2026" className="border border-input rounded-md px-3 py-2 text-sm bg-background" />
            {/* Multi-select Tipo movimiento */}
            <div className="relative col-span-2 lg:col-span-2">
              <button
                onClick={() => setShowTiposDropdown(!showTiposDropdown)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-left flex items-center justify-between"
              >
                <span className="text-muted-foreground">
                  {tiposSeleccionados.length === 0
                    ? 'Tipo de movimiento (todos)'
                    : `${tiposSeleccionados.length} tipo(s) seleccionados`}
                </span>
                <span className="text-xs">▾</span>
              </button>
              {showTiposDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-lg shadow-lg p-3 grid grid-cols-2 gap-1 max-h-56 overflow-y-auto">
                  {TIPOS_MOV.map(t => (
                    <label key={t} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-accent rounded px-2 py-1">
                      <input type="checkbox" checked={tiposSeleccionados.includes(t)} onChange={() => toggleTipo(t)} className="accent-primary" />
                      <span className="font-mono">{t}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
              <option>Todos los estados recaudo</option>
              <option>Abierto</option>
              <option>Cerrado Auxiliar</option>
              <option>Enviado a revisión</option>
              <option>Aprobado</option>
              <option>Devuelto</option>
            </select>
            <button className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90 col-span-2 lg:col-span-1">
              <Download className="h-4 w-4" /> Descargar Excel
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────── */}
      {/* Contenido por tab                                       */}
      {/* ─────────────────────────────────────────────────────── */}

      <div className="bg-card rounded-lg border border-border overflow-hidden">

        {/* ── Tab 0: Estado de planillas ── */}
        {activeTab === 0 && (
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/70">{['Sede','N° Planilla','Fecha','Operación','Estado ERP','Valor','Estado','Cuadre'].map(h=><th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {[
                ['Donmatías','DA-32926','11/04/2026','Alpina','CERRADA',16973289,'Cuadrada','DMA-110426.01'],
                ['Donmatías','DC-32641','11/04/2026','Cárnicos','CERRADA',5589617,'Cuadrada','DMA-110426.02'],
                ['Donmatías','DA-32937','10/04/2026','Alpina','CERRADA',104157,'Aprobada','DMA-100426.01'],
                ['Donmatías','DC-32918','10/04/2026','Cárnicos','CERRADA',46245,'Aprobada','DMA-100426.01'],
                ['Medellín','DA-33001','11/04/2026','Alpina','CERRADA',8234500,'Pendiente','—'],
                ['Rionegro','DA-33010','11/04/2026','Alpina','ABIERTA',1250000,'No disponible','—'],
              ].map((row,i)=>(
                <tr key={i} className="border-t border-border table-row-alt">
                  {row.map((cell,j)=>(
                    <td key={j} className={`px-4 py-2.5 ${j===5?'font-mono text-right':''}`}>
                      {j===5?formatCurrency(cell as number):j===6?<span className={cell==='Cuadrada'?'badge-info':cell==='Aprobada'?'badge-neutral':cell==='Pendiente'?'badge-warning':'badge-neutral'}>{cell as string}</span>:cell as string}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Tab 1: Estado del día ── */}
        {activeTab === 1 && (
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/70">{['Fecha','Estado','Saldo inicial','Ingresos efectivo','Egresos efectivo','Saldo final'].map(h=><th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {[[11/4/2026,'Aprobado',14500000,1932922,3000000,13432922],[10/4/2026,'Aprobado',14200000,850000,550000,14500000],['09/04/2026','Aprobado',13800000,1200000,800000,14200000],['08/04/2026','Aprobado',14100000,600000,900000,13800000],['07/04/2026','Aprobado',13500000,1400000,800000,14100000]].map((row,i)=>(
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5">{['11/04/2026','10/04/2026','09/04/2026','08/04/2026','07/04/2026'][i]}</td>
                  <td className="px-4 py-2.5"><span className="badge-success">Aprobado</span></td>
                  <td className="px-4 py-2.5 font-mono text-right">{formatCurrency(row[2] as number)}</td>
                  <td className="px-4 py-2.5 font-mono text-right text-success">{formatCurrency(row[3] as number)}</td>
                  <td className="px-4 py-2.5 font-mono text-right text-destructive">{formatCurrency(row[4] as number)}</td>
                  <td className="px-4 py-2.5 font-mono text-right font-bold">{formatCurrency(row[5] as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Tab 2: Detalle del día ── */}
        {activeTab === 2 && (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Seleccione una fecha</p>
            <p className="text-sm">Use el filtro de fecha para ver el desglose completo del día</p>
          </div>
        )}

        {/* ── Tab 3: Planillas pendientes ── */}
        {activeTab === 3 && (
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/70">{['N° Planilla','Sede','Operación','Fecha','Días pendiente','Valor','Estado'].map(h=><th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {[['DA-32850','Medellín','Alpina','06/04/2026',5,3450000,'Pendiente'],['DC-32790','Rionegro','Cárnicos','05/04/2026',6,1230000,'Pendiente'],['DA-32810','Santa Rosa','Alpina','04/04/2026',7,890000,'Pendiente']].map((row,i)=>(
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono">{row[0]}</td><td className="px-4 py-2.5">{row[1]}</td><td className="px-4 py-2.5">{row[2]}</td><td className="px-4 py-2.5">{row[3]}</td>
                  <td className="px-4 py-2.5"><span className="badge-error">{row[4]} días</span></td>
                  <td className="px-4 py-2.5 font-mono text-right">{formatCurrency(row[5] as number)}</td>
                  <td className="px-4 py-2.5"><span className="badge-warning">{row[6]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Tab 4: Saldos de efectivo ── */}
        {activeTab === 4 && (
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/70">{['Fecha','Sede','Saldo inicial','Movimientos','Saldo final'].map(h=><th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {[['11/04/2026','Donmatías',14500000,-1067078,13432922],['11/04/2026','Medellín',8200000,450000,8650000],['11/04/2026','Rionegro',3100000,-200000,2900000],['11/04/2026','Santa Rosa',5400000,180000,5580000]].map((row,i)=>(
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5">{row[0]}</td><td className="px-4 py-2.5 font-medium">{row[1]}</td>
                  <td className="px-4 py-2.5 font-mono text-right">{formatCurrency(row[2] as number)}</td>
                  <td className={`px-4 py-2.5 font-mono text-right ${(row[3] as number)>=0?'text-success':'text-destructive'}`}>{(row[3] as number)>=0?'+':''}{formatCurrency(row[3] as number)}</td>
                  <td className="px-4 py-2.5 font-mono text-right font-bold">{formatCurrency(row[4] as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Tab 5: Plano contable Odoo ── */}
        {activeTab === 5 && (
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/70">{['Cuenta','Nombre cuenta','Débito','Crédito','Tercero','Referencia'].map(h=><th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {[['110505','Caja general',1113305,0,'Donmatías','DMA-110426'],['130505','Clientes nacionales',5070000,0,'Varios','DMA-110426'],['413536','Ingresos distribución',0,22562905,'Varios','DMA-110426'],['111005','Bancos nacionales',15574400,0,'Bancolombia','CON-001145'],['233595','Retenciones',0,55625,'Varios','DMA-110426'],['519530','Gastos de ruta',935000,0,'Varios','DMA-110426']].map((row,i)=>(
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono">{row[0]}</td><td className="px-4 py-2.5">{row[1]}</td>
                  <td className="px-4 py-2.5 font-mono text-right">{(row[2] as number)>0?formatCurrency(row[2] as number):'—'}</td>
                  <td className="px-4 py-2.5 font-mono text-right">{(row[3] as number)>0?formatCurrency(row[3] as number):'—'}</td>
                  <td className="px-4 py-2.5">{row[4]}</td><td className="px-4 py-2.5 font-mono text-xs">{row[5]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Tab 6: Cuadres anulados ── */}
        {activeTab === 6 && (
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/70">{['N° Cuadre','Fecha anulación','Planillas','Motivo','Anulado por'].map(h=><th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>)}</tr></thead>
            <tbody>
              {[['DMA-080426.02','09/04/2026','DA-32810','Error en consignación — monto duplicado','María González'],['DMA-050426.01','06/04/2026','DC-32750','Planilla con facturas incorrectas','Juan Ramírez']].map((row,i)=>(
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono text-primary">{row[0]}</td><td className="px-4 py-2.5">{row[1]}</td>
                  <td className="px-4 py-2.5 font-mono">{row[2]}</td><td className="px-4 py-2.5 text-muted-foreground">{row[3]}</td><td className="px-4 py-2.5">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Tab 7: Consignaciones Banco ── */}
        {activeTab === 7 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="bg-muted/70">
                  {['Fecha','Banco','Referencia','Consignante','Valor','Sede','Estado','N° Cuadre','N° Recaudo','Estado cuadre'].map(h=>(
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consigBancoMock.map((r, i) => (
                  <tr key={i} className="border-t border-border table-row-alt">
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.fecha}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.banco}</td>
                    <td className="px-4 py-2.5 font-mono text-xs whitespace-nowrap">{r.ref}</td>
                    <td className="px-4 py-2.5 text-xs">{r.consignante}</td>
                    <td className="px-4 py-2.5 font-mono text-right whitespace-nowrap font-medium">{formatCurrency(r.valor)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.sede}</td>
                    <td className="px-4 py-2.5">{badgeEstadoCB(r.estado)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-primary">{r.cuadre}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.recaudo}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.estadoCuadre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab 8: Consignaciones Aliados ── */}
        {activeTab === 8 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead>
                <tr className="bg-muted/70">
                  {['Fecha','Aliado','Sede','Referencia','Valor','Estado certificación','Estado cuadre','N° Cuadre','N° Recaudo'].map(h=>(
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consigAliadosMock.map((r, i) => (
                  <tr key={i} className="border-t border-border table-row-alt">
                    <td className="px-4 py-2.5 whitespace-nowrap">{r.fecha}</td>
                    <td className="px-4 py-2.5 font-medium">{r.aliado}</td>
                    <td className="px-4 py-2.5">{r.sede}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.ref}</td>
                    <td className="px-4 py-2.5 font-mono text-right font-medium whitespace-nowrap">{formatCurrency(r.valor)}</td>
                    <td className="px-4 py-2.5">{badgeCertif(r.certif)}</td>
                    <td className="px-4 py-2.5">{badgeEstadoCB(r.estadoCuadre)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-primary">{r.cuadre}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.recaudo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab 9: Auditoría Máximo Detalle ── */}
        {activeTab === 9 && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: '1800px' }}>
                <thead>
                  <tr className="bg-muted/70">
                    {['N° Recaudo','Fecha','Sede','N° Cuadre','Planilla','Tipo movimiento','Sub-tipo','Documento','Cliente/Proveedor/Empleado','NIT','Valor','Cuenta contable','Cuenta analítica','Diario Odoo','Estado cuadre','Estado recaudo','Conductor','Placa','Ejecutado por'].map(h=>(
                      <th key={h} className="text-left px-3 py-3 font-medium text-muted-foreground whitespace-nowrap text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditoriaMock.map((r, i) => (
                    <tr key={i} className="border-t border-border table-row-alt">
                      <td className="px-3 py-2 font-mono text-xs text-primary whitespace-nowrap">{r.recaudo}</td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">{r.fecha}</td>
                      <td className="px-3 py-2 text-xs">{r.sede}</td>
                      <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{r.cuadre}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.planilla}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{badgeTipoMov(r.tipo)}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{r.subtipo}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.doc}</td>
                      <td className="px-3 py-2 text-xs">{r.tercero}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.nit}</td>
                      <td className={`px-3 py-2 font-mono text-xs text-right whitespace-nowrap font-medium ${r.valor < 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {r.valor < 0 ? `−${formatCurrency(Math.abs(r.valor))}` : formatCurrency(r.valor)}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{r.cuenta}</td>
                      <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.analitica}</td>
                      <td className="px-3 py-2 text-xs">{r.diario}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{r.estCuadre}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{r.estRecaudo}</td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">{r.conductor}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.placa}</td>
                      <td className="px-3 py-2 text-xs">{r.ejecutado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Nota al pie */}
            <div className="border-t border-border px-5 py-3 bg-muted/30">
              <p className="text-xs text-muted-foreground">
                ℹ️ Este informe muestra el detalle de cada transacción individual. Para el plano de asientos contables usa el informe{' '}
                <button onClick={() => setActiveTab(5)} className="text-primary underline underline-offset-2 hover:no-underline">
                  Plano Asientos Odoo
                </button>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Informes;

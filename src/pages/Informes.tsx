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
  'Plano Documentos ERP',
  'Estado Documentos ERP',
  'Conciliación ERP vs DIAN',
  'Documentos listos para Odoo',
  'Asientos Contables',
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

const estadoDocMock = [
  { operacion: 'DA', planilla: 'DA-32926', documento: 'DMA779121', tipo: 'FAC. VENTA', fecha: '19/04/2026', crco: 'CONTADO', cliente: 'Tienda El Sol', base: 254510, iva: 48357, total: 303156, estadoAnalista: 'APROBADO', estadoDian: 'APROBADO_CON_NOTIFICACION', validadoDian: '20/04/2026' },
  { operacion: 'DA', planilla: 'DA-32926', documento: 'DMA779122', tipo: 'NOTA CRÉDITO', fecha: '19/04/2026', crco: 'CONTADO', cliente: 'Tienda El Sol', base: -12605, iva: -2395, total: -15000, estadoAnalista: 'APROBADO', estadoDian: 'APROBADO_CON_NOTIFICACION', validadoDian: '20/04/2026' },
  { operacion: 'DC', planilla: 'DC-11201', documento: 'DMA779130', tipo: 'FAC. VENTA', fecha: '19/04/2026', crco: 'CREDITO', cliente: 'Tienda Mixta', base: 180000, iva: 0, total: 180000, estadoAnalista: 'ENVIADO_REVISION', estadoDian: 'SIN_VALIDAR', validadoDian: '—' },
];

const concilNotDianMock = [
  { operacion: 'DA', planilla: 'DA-32926', documento: 'DMA779135', tipo: 'FAC. VENTA', fecha: '18/04/2026', cliente: 'Tienda Nogales', total: 89500, estadoAnalista: 'APROBADO' },
  { operacion: 'DC', planilla: 'DC-11201', documento: 'DMA779140', tipo: 'NOTA CRÉDITO', fecha: '17/04/2026', cliente: 'Minimercado LP', total: -25000, estadoAnalista: 'APROBADO' },
];

const concilNotERPMock = [
  { documento: 'DMA779150', prefijo: 'DMA', folio: '779150', tipo: 'FAC. VENTA', fecha: '16/04/2026', base: 50000, iva: 9500, total: 59500, estadoDian: 'APROBADO_CON_NOTIFICACION' },
];

const docsOdooMock = [
  { operacion: 'DA', planilla: 'DA-32926', documento: 'DMA779121', tipo: 'FAC. VENTA', fecha: '19/04/2026', cliente: 'Tienda El Sol', total: 303156, estadoDian: 'APROBADO_CON_NOTIFICACION', estadoEnvio: 'CONFIRMADO', enviado: '20/04/2026' },
  { operacion: 'DA', planilla: 'DA-32926', documento: 'DMA779122', tipo: 'NOTA CRÉDITO', fecha: '19/04/2026', cliente: 'Tienda El Sol', total: -15000, estadoDian: 'APROBADO_CON_NOTIFICACION', estadoEnvio: 'ENVIADO', enviado: '20/04/2026' },
  { operacion: 'DC', planilla: 'DC-11201', documento: 'DMA779131', tipo: 'FAC. VENTA', fecha: '19/04/2026', cliente: 'Tienda Mixta', total: 420000, estadoDian: 'APROBADO_CON_NOTIFICACION', estadoEnvio: 'PENDIENTE_ENVIO', enviado: '—' },
];

const asientosContablesMock = [
  { fecha: '19/04/2026', referencia: 'DMA-110426.01', tipo: 'RETENCION_CLIENTE', debitoCta: '13551525', debitoAnalitica: '{"7":100}', creditoCta: '130501', creditoAnalitica: '—', diario: 'VDA', nit: '1039760460', nombre: 'Tienda El Sol', valor: 7578, estadoOdoo: 'PENDIENTE', error: '—' },
  { fecha: '19/04/2026', referencia: 'FE-001', tipo: 'GASTO', debitoCta: '520101', debitoAnalitica: '{"7":100}', creditoCta: '130501', creditoAnalitica: '—', diario: 'VDA', nit: '900123456', nombre: 'Concesión Vial', valor: 29750, estadoOdoo: 'CONFIRMADO', error: '—' },
  { fecha: '19/04/2026', referencia: 'DMA-RD-190426', tipo: 'CONSIGNACION_RG', debitoCta: '133131313', debitoAnalitica: '—', creditoCta: '130501', creditoAnalitica: '—', diario: 'VDA', nit: '811012258', nombre: 'DISTRIBUCIONES RIOGRANDE', valor: 3000000, estadoOdoo: 'ERROR', error: 'Diario no configurado' },
  { fecha: '19/04/2026', referencia: 'DMA-110426.01', tipo: 'ANTICIPO_NOMINA', debitoCta: '2822222', debitoAnalitica: '{"7":100}', creditoCta: '130501', creditoAnalitica: '—', diario: 'VDA', nit: '98480254', nombre: 'Juan García', valor: 70000, estadoOdoo: 'PENDIENTE', error: '—' },
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

const badgeEstadoAnalista = (estado: string) => {
  const cls = estado === 'APROBADO' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
              estado === 'ENVIADO_REVISION' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
              estado === 'EN_CUADRE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>{estado}</span>;
};

const badgeEstadoDIAN = (estado: string) => {
  const cls = estado === 'APROBADO_CON_NOTIFICACION' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
              estado === 'RECHAZADO' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
              estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>{estado}</span>;
};

const badgeEstadoOdoo = (estado: string, errorMsg?: string) => {
  const cls = estado === 'CONFIRMADO' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
              estado === 'ENVIADO' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
              estado === 'ERROR' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' :
              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`} title={estado === 'ERROR' ? errorMsg : ''}>{estado}</span>;
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

  const isCustomFilters = [9, 10, 11, 12, 13, 14].includes(activeTab);
  const [concilTab, setConcilTab] = useState(0);

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
            {i === 12 && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">Nuevo</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Filtros estándar (tabs 0-8) ── */}
      {!isCustomFilters && (
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

      {/* ── Filtros Custom (9-12) ── */}
      {isCustomFilters && activeTab === 9 && (
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

      {/* ── Filtros Plano y Estado ERP (10 y 11) ── */}
      {isCustomFilters && (activeTab === 10 || activeTab === 11) && (
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DatabaseZap className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Filtros — {tabs[activeTab]}</p>
            </div>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90">
              <Download className="h-4 w-4" /> Descargar Excel
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
              <option>Todas las sedes</option>
              {sedes.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
              <option>Todas las operaciones</option>
              <option>DA</option>
              <option>DC</option>
            </select>
            <input type="text" placeholder="Desde" defaultValue="11/04/2026" className="border border-input rounded-md px-3 py-2 text-sm bg-background" />
            <input type="text" placeholder="Hasta" defaultValue="11/04/2026" className="border border-input rounded-md px-3 py-2 text-sm bg-background" />
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
              <option>Todos los tipos</option>
              <option>FACTURA DE VENTA</option>
              <option>NOTA CREDITO</option>
              <option>NOTA DEBITO</option>
              <option>ANTICIPO</option>
            </select>
            {activeTab === 10 && (
              <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
                <option>CR/CO (Todos)</option>
                <option>CONTADO</option>
                <option>CREDITO</option>
              </select>
            )}
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
              <option>Estado analista (Todos)</option>
              <option>PENDIENTE</option>
              <option>EN_CUADRE</option>
              <option>ENVIADO_REVISION</option>
              <option>APROBADO</option>
            </select>
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
              <option>Estado DIAN (Todos)</option>
              <option>SIN_VALIDAR</option>
              <option>PENDIENTE</option>
              <option>APROBADO_CON_NOTIFICACION</option>
              <option>RECHAZADO</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Filtros Conciliación ERP vs DIAN (12) ── */}
      {isCustomFilters && activeTab === 12 && (
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DatabaseZap className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Filtros — {tabs[activeTab]}</p>
            </div>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90">
              <Download className="h-4 w-4" /> Descargar Excel (2 pestañas)
            </button>
          </div>
          <div className="flex gap-4">
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background w-1/4">
              <option>Todas las sedes</option>
              {sedes.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background w-1/4">
              <option>Todas las operaciones</option>
              <option>DA</option>
              <option>DC</option>
            </select>
            <input type="text" placeholder="Desde" defaultValue="11/04/2026" className="border border-input rounded-md px-3 py-2 text-sm bg-background w-1/4" />
            <input type="text" placeholder="Hasta" defaultValue="11/04/2026" className="border border-input rounded-md px-3 py-2 text-sm bg-background w-1/4" />
          </div>
        </div>
      )}

      {/* ── Filtros Documentos listos para Odoo (13) ── */}
      {isCustomFilters && activeTab === 13 && (
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DatabaseZap className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Filtros — {tabs[activeTab]}</p>
            </div>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90">
              <Download className="h-4 w-4" /> Descargar Excel
            </button>
          </div>
          <div className="flex gap-4 flex-wrap">
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background w-48">
              <option>Todas las sedes</option>
              {sedes.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background w-48">
              <option>Todas las operaciones</option>
              <option>DA</option>
              <option>DC</option>
            </select>
            <input type="text" placeholder="Desde" defaultValue="11/04/2026" className="border border-input rounded-md px-3 py-2 text-sm bg-background w-32" />
            <input type="text" placeholder="Hasta" defaultValue="11/04/2026" className="border border-input rounded-md px-3 py-2 text-sm bg-background w-32" />
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background w-48">
              <option>Estado envío Odoo (Todos)</option>
              <option>PENDIENTE_ENVIO</option>
              <option>ENVIADO</option>
              <option>CONFIRMADO</option>
              <option>ERROR</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Filtros Asientos Contables (14) ── */}
      {isCustomFilters && activeTab === 14 && (
        <div className="bg-card border border-border rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DatabaseZap className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Filtros — {tabs[activeTab]}</p>
            </div>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold hover:opacity-90">
              <Download className="h-4 w-4" /> Descargar Excel
            </button>
          </div>
          <div className="flex gap-4 flex-wrap">
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background w-48">
              <option>Todas las sedes</option>
              {sedes.map(s => <option key={s}>{s}</option>)}
            </select>
            <input type="text" placeholder="Desde" defaultValue="11/04/2026" className="border border-input rounded-md px-3 py-2 text-sm bg-background w-32" />
            <input type="text" placeholder="Hasta" defaultValue="11/04/2026" className="border border-input rounded-md px-3 py-2 text-sm bg-background w-32" />
            <div className="relative w-64">
              <button
                onClick={() => setShowTiposDropdown(!showTiposDropdown)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background text-left flex items-center justify-between"
              >
                <span className="text-muted-foreground truncate mr-2">
                  {tiposSeleccionados.length === 0
                    ? 'Tipo de movimiento (todos)'
                    : `${tiposSeleccionados.length} tipo(s) seleccionados`}
                </span>
                <span className="text-xs shrink-0">▾</span>
              </button>
              {showTiposDropdown && (
                <div className="absolute z-20 mt-1 w-72 bg-card border border-border rounded-lg shadow-lg p-3 grid grid-cols-1 gap-1 max-h-56 overflow-y-auto">
                  {['APROVECHAMIENTO', 'RETENCION_CLIENTE', 'GASTO', 'CONSIGNACION_RG', 'CONSIGNACION_ALIADO', 'ANTICIPO_NOMINA', 'TRASLADO_EFECTIVO', 'ANTICIPO_CLIENTE', 'DESCUENTO_ANTICIPO_CLIENTE'].map(t => (
                    <label key={t} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-accent rounded px-2 py-1">
                      <input type="checkbox" checked={tiposSeleccionados.includes(t)} onChange={() => toggleTipo(t)} className="accent-primary" />
                      <span className="font-mono">{t}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <select className="border border-input rounded-md px-3 py-2 text-sm bg-background w-48">
              <option>Estado Odoo (Todos)</option>
              <option>PENDIENTE</option>
              <option>ENVIADO</option>
              <option>CONFIRMADO</option>
              <option>ERROR</option>
            </select>
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
        {/* ── Tab 10: Plano Documentos ERP ── */}
        {activeTab === 10 && (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <DatabaseZap className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-foreground mb-2">Detalle completo de facturas, notas y anticipos del ERP</h3>
            <p className="text-muted-foreground max-w-md mb-8">
              Este informe contiene demasiadas columnas y registros para mostrarse en pantalla. Por favor, descargue el archivo para su análisis.
            </p>
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-md text-base font-semibold hover:opacity-90 shadow-sm">
              <Download className="h-5 w-5" /> Descargar Excel
            </button>
            <p className="text-xs text-muted-foreground mt-4 italic">
              Este informe se descarga directamente como Excel por el volumen de información.
            </p>
          </div>
        )}

        {/* ── Tab 11: Estado Documentos ERP ── */}
        {activeTab === 11 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/70">
                  {['Operación', 'Planilla', 'Documento electrónico', 'Tipo', 'Fecha', 'CR/CO', 'Cliente', 'Valor base', 'IVA', 'Total', 'Estado analista', 'Estado DIAN', 'Validado DIAN'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {estadoDocMock.map((r, i) => (
                  <tr key={i} className="border-t border-border table-row-alt">
                    <td className="px-4 py-2.5 font-medium">{r.operacion}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.planilla}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-primary">{r.documento}</td>
                    <td className="px-4 py-2.5 text-xs">{r.tipo}</td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap">{r.fecha}</td>
                    <td className="px-4 py-2.5 text-xs">{r.crco}</td>
                    <td className="px-4 py-2.5 text-xs">{r.cliente}</td>
                    <td className={`px-4 py-2.5 font-mono text-xs text-right whitespace-nowrap ${r.base < 0 ? 'text-destructive' : ''}`}>{r.base < 0 ? `−${formatCurrency(Math.abs(r.base))}` : formatCurrency(r.base)}</td>
                    <td className={`px-4 py-2.5 font-mono text-xs text-right whitespace-nowrap ${r.iva < 0 ? 'text-destructive' : ''}`}>{r.iva < 0 ? `−${formatCurrency(Math.abs(r.iva))}` : formatCurrency(r.iva)}</td>
                    <td className={`px-4 py-2.5 font-mono text-xs font-bold text-right whitespace-nowrap ${r.total < 0 ? 'text-destructive' : ''}`}>{r.total < 0 ? `−${formatCurrency(Math.abs(r.total))}` : formatCurrency(r.total)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-center">{badgeEstadoAnalista(r.estadoAnalista)}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-center">{badgeEstadoDIAN(r.estadoDian)}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap text-center">{r.validadoDian}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab 12: Conciliación ERP vs DIAN ── */}
        {activeTab === 12 && (
          <div>
            <div className="flex border-b border-border bg-muted/20">
              <button onClick={() => setConcilTab(0)} className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${concilTab === 0 ? 'border-warning text-warning-foreground bg-warning/10' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}>
                En ERP pero NO en DIAN
              </button>
              <button onClick={() => setConcilTab(1)} className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${concilTab === 1 ? 'border-destructive text-destructive bg-destructive/10' : 'border-transparent text-muted-foreground hover:bg-muted/50'}`}>
                En DIAN pero NO en ERP
              </button>
            </div>
            
            <div className="p-4 bg-muted/30 border-b border-border">
              <p className="text-sm text-muted-foreground">
                {concilTab === 0 ? 'Documentos registrados en nuestros ERPs que no aparecen en el informe de la DIAN.' : 'Documentos validados por la DIAN que no encontramos en nuestros ERPs. Requieren investigación.'}
              </p>
            </div>

            <div className="overflow-x-auto">
              {concilTab === 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/70">
                      {['Operación', 'Planilla', 'Documento electrónico', 'Tipo', 'Fecha', 'Cliente', 'Valor total', 'Estado analista'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {concilNotDianMock.map((r, i) => (
                      <tr key={i} className="border-t border-border table-row-alt">
                        <td className="px-4 py-2.5 font-medium">{r.operacion}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{r.planilla}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-primary">{r.documento}</td>
                        <td className="px-4 py-2.5 text-xs">{r.tipo}</td>
                        <td className="px-4 py-2.5 text-xs">{r.fecha}</td>
                        <td className="px-4 py-2.5 text-xs">{r.cliente}</td>
                        <td className={`px-4 py-2.5 font-mono text-xs font-bold text-right whitespace-nowrap ${r.total < 0 ? 'text-destructive' : ''}`}>{r.total < 0 ? `−${formatCurrency(Math.abs(r.total))}` : formatCurrency(r.total)}</td>
                        <td className="px-4 py-2.5 text-center">{badgeEstadoAnalista(r.estadoAnalista)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/70">
                      {['Documento electrónico', 'Prefijo', 'Folio', 'Tipo', 'Fecha', 'Base', 'IVA', 'Total', 'Estado DIAN'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {concilNotERPMock.map((r, i) => (
                      <tr key={i} className="border-t border-border table-row-alt">
                        <td className="px-4 py-2.5 font-mono text-xs text-primary">{r.documento}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{r.prefijo}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{r.folio}</td>
                        <td className="px-4 py-2.5 text-xs">{r.tipo}</td>
                        <td className="px-4 py-2.5 text-xs">{r.fecha}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-right">{formatCurrency(r.base)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-right">{formatCurrency(r.iva)}</td>
                        <td className="px-4 py-2.5 font-mono text-xs font-bold text-right">{formatCurrency(r.total)}</td>
                        <td className="px-4 py-2.5 text-center">{badgeEstadoDIAN(r.estadoDian)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Tab 13: Documentos listos para Odoo ── */}
        {activeTab === 13 && (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/70">
                    {['Operación', 'Planilla', 'Documento', 'Tipo', 'Fecha', 'Cliente', 'Valor total', 'Estado DIAN', 'Estado envío Odoo', 'Enviado el'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docsOdooMock.map((r, i) => (
                    <tr key={i} className="border-t border-border table-row-alt">
                      <td className="px-4 py-2.5 font-medium">{r.operacion}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{r.planilla}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-primary">{r.documento}</td>
                      <td className="px-4 py-2.5 text-xs">{r.tipo}</td>
                      <td className="px-4 py-2.5 text-xs whitespace-nowrap">{r.fecha}</td>
                      <td className="px-4 py-2.5 text-xs">{r.cliente}</td>
                      <td className={`px-4 py-2.5 font-mono text-xs font-bold text-right whitespace-nowrap ${r.total < 0 ? 'text-destructive' : ''}`}>{r.total < 0 ? `−${formatCurrency(Math.abs(r.total))}` : formatCurrency(r.total)}</td>
                      <td className="px-4 py-2.5 text-center">{badgeEstadoDIAN(r.estadoDian)}</td>
                      <td className="px-4 py-2.5 text-center">{badgeEstadoEnvioOdoo(r.estadoEnvio)}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap text-center">{r.enviado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Nota al pie */}
            <div className="border-t border-border px-5 py-3 bg-blue-50/50 dark:bg-blue-900/10">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                ℹ️ Solo se muestran documentos con estado analista = <span className="font-semibold">APROBADO</span> y estado DIAN = <span className="font-semibold">APROBADO CON NOTIFICACIÓN</span>.
              </p>
            </div>
          </div>
        )}

        {/* ── Tab 14: Asientos Contables ── */}
        {activeTab === 14 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1400px]">
              <thead>
                <tr className="bg-muted/70">
                  {['Fecha', 'Referencia', 'Tipo movimiento', 'Déb. Cuenta', 'Déb. Analítica', 'Cré. Cuenta', 'Cré. Analítica', 'Diario', 'NIT Tercero', 'Nombre Tercero', 'Valor', 'Estado Odoo', 'Error'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {asientosContablesMock.map((r, i) => (
                  <tr key={i} className="border-t border-border table-row-alt">
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap">{r.fecha}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-primary whitespace-nowrap">{r.referencia}</td>
                    <td className="px-4 py-2.5 whitespace-nowrap">{badgeTipoMov(r.tipo)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.debitoCta}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.debitoAnalitica}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.creditoCta}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.creditoAnalitica}</td>
                    <td className="px-4 py-2.5 text-xs">{r.diario}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.nit}</td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap">{r.nombre}</td>
                    <td className="px-4 py-2.5 font-mono text-xs font-bold text-right whitespace-nowrap">{formatCurrency(r.valor)}</td>
                    <td className="px-4 py-2.5 text-center">{badgeEstadoOdoo(r.estadoOdoo, r.error)}</td>
                    <td className="px-4 py-2.5 text-xs text-destructive max-w-[150px] truncate" title={r.error !== '—' ? r.error : ''}>{r.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Informes;

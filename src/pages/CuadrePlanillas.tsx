import { useState } from 'react';
import { facturasMock, planillasMock, bancos, empleados, tiposRetencion } from '@/data/mockData';
import { formatCurrency } from '@/lib/format';
import { useAppStore } from '@/store/appStore';
import { Plus, Trash2, AlertTriangle, Check, Paperclip, ChevronRight, X } from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ConsigDisponible {
  id: string;
  fecha: string;
  banco: string;
  referencia: string;
  valor: number;
  bloqueada: boolean;
}

interface ConsigSeleccionada {
  id: string;
  fecha: string;
  banco: string;
  referencia: string;
  valor: number;
}

interface ConsigAliadoCert {
  id: string;
  fecha: string;
  banco: string;
  referencia: string;
  valor: number;
  bloqueada: boolean;
}

// ─── Mock data local ──────────────────────────────────────────────────────────

// Consignaciones Riogrande — disponibles en extracto
const consigDisponiblesMock: ConsigDisponible[] = [
  { id: 'c1', fecha: '11/04/2026', banco: 'Bancolombia Cta1', referencia: 'REF-2847361', valor: 3000000,  bloqueada: false },
  { id: 'c2', fecha: '11/04/2026', banco: 'Bancolombia Cta1', referencia: 'REF-2847390', valor: 2000000,  bloqueada: false },
  { id: 'c3', fecha: '12/04/2026', banco: 'CFA',              referencia: 'REF-0091234', valor: 1000000,  bloqueada: false },
  { id: 'c4', fecha: '11/04/2026', banco: 'Bancolombia Cta2', referencia: 'REF-5512890', valor: 4124400,  bloqueada: true  },
];

// Consignaciones ya seleccionadas (mock inicial)
const consigSeleccionadasIniciales: ConsigSeleccionada[] = [
  { id: 'c1', fecha: '11/04/2026', banco: 'Bancolombia Cta1', referencia: 'REF-2847361', valor: 3000000 },
  { id: 'c3', fecha: '12/04/2026', banco: 'CFA',              referencia: 'REF-0091234', valor: 1000000 },
];

// Consignaciones aliados certificadas por aliado
const consigAliadosCertMock: Record<string, ConsigAliadoCert[]> = {
  Cárnicos: [
    { id: 'ca1', fecha: '11/04/2026', banco: 'Bancolombia Cta1', referencia: 'CAR-001234', valor: 2400000, bloqueada: false },
    { id: 'ca2', fecha: '10/04/2026', banco: 'Davivienda',        referencia: 'CAR-001189', valor: 1800000, bloqueada: true  },
  ],
  Nutresa: [
    { id: 'nu1', fecha: '11/04/2026', banco: 'BBVA',             referencia: 'NUT-003412', valor: 1200000, bloqueada: false },
  ],
  Meals: [
    { id: 'me1', fecha: '11/04/2026', banco: 'Bancolombia Cta1', referencia: 'MEA-000891', valor: 950000,  bloqueada: false },
  ],
};

const conductoresMock  = ['Juan García', 'Carlos López', 'Pedro Martínez'];
const placasMock       = ['NTB-432', 'OPQ-871', 'KLM-234'];
const ALIADOS24        = ['Alpina', 'Cárnicos', 'Nutresa', 'Meals'] as const;
type Aliado24          = typeof ALIADOS24[number];

// Anticipos mock de clientes (en la sección 2.1)
const anticiposMock21 = [
  { planilla: 'DA-32926', numero: 'ANT-00045', cliente: 'Tienda La Esquina',  valor:  500000 },
  { planilla: 'DA-32937', numero: 'ANT-00046', cliente: 'Supermercado Norte', valor: -200000 },
];

// ── §2.2 — Tipos y catálogos locales ────────────────────────────────────────

interface GastoRuta22 {
  id: string;
  tipoGastoId: string;
  tipoGastoNombre: string;
  requiereDocElec: boolean;
  topeMaximo: number;
  proveedorNit: string;
  proveedorNombre: string;
  nFactura: string;
  cuentaAnaliticaId: string;
  cuentaAnaliticaNombre: string;
  tarifaIva: number;
  retencionId: string;
  retencionNombre: string;
  retencionPct: number;
  valorBase: number;
  superaTope: boolean;
  justificacion: string;
}

interface Proveedor22 {
  id: string;
  nit: string;
  nombre: string;
  tipoTercero: 'Natural' | 'Jurídico';
  tipoIdentificacion: string;
  sincronizado_odoo: boolean;
}

const parametrosGasto22 = [
  { id: 'g1', nombre_asiento: 'Peajes',               requiere_documento_electronico: true,  tope_maximo: 50000  },
  { id: 'g2', nombre_asiento: 'Combustible',           requiere_documento_electronico: true,  tope_maximo: 100000 },
  { id: 'g3', nombre_asiento: 'Alimentación',          requiere_documento_electronico: false, tope_maximo: 50000  },
  { id: 'g4', nombre_asiento: 'Mantenimiento vehículo',requiere_documento_electronico: true,  tope_maximo: 80000  },
  { id: 'g5', nombre_asiento: 'Parqueadero',           requiere_documento_electronico: false, tope_maximo: 30000  },
];

const proveedoresInit: Proveedor22[] = [
  { id: 'p1', nit: '900123456', nombre: 'Concesión Vial 4G', tipoTercero: 'Jurídico', tipoIdentificacion: 'NIT', sincronizado_odoo: true },
  { id: 'p2', nit: '900456789', nombre: 'EDS El Nogal',      tipoTercero: 'Jurídico', tipoIdentificacion: 'NIT', sincronizado_odoo: true },
  { id: 'p3', nit: '800111333', nombre: 'Parqueadero Central',tipoTercero: 'Jurídico', tipoIdentificacion: 'NIT', sincronizado_odoo: true },
];

const cuentasAnaliticas22 = [
  { id: 'ca1', nombre: 'DMA-Alpina 100%'           },
  { id: 'ca2', nombre: 'DMA-Alpina+Cárnicos 50/50' },
  { id: 'ca3', nombre: 'DMA-Cárnicos 100%'         },
];

const ivasDisponibles = [
  { pct: 0,  label: '0%'  },
  { pct: 5,  label: '5%'  },
  { pct: 19, label: '19%' },
];

const retencionesProveedor = [
  { id: 'r1', nombre: 'Retefte 2.5%',  pct: 2.5   },
  { id: 'r2', nombre: 'Retefte 3.5%',  pct: 3.5   },
  { id: 'r3', nombre: 'Reteica 0.414%',pct: 0.414 },
];

const gastosMock22: GastoRuta22[] = [
  {
    id: 'g22-1', tipoGastoId: 'g1', tipoGastoNombre: 'Peajes',
    requiereDocElec: true, topeMaximo: 50000,
    proveedorNit: '900123456', proveedorNombre: 'Concesión Vial 4G',
    nFactura: 'FE-001', cuentaAnaliticaId: 'ca1', cuentaAnaliticaNombre: 'DMA-Alpina 100%',
    tarifaIva: 19, retencionId: '', retencionNombre: '', retencionPct: 0,
    valorBase: 25000, superaTope: false, justificacion: '',
  },
  {
    id: 'g22-2', tipoGastoId: 'g2', tipoGastoNombre: 'Combustible',
    requiereDocElec: true, topeMaximo: 100000,
    proveedorNit: '900456789', proveedorNombre: 'EDS El Nogal',
    nFactura: 'FE-002', cuentaAnaliticaId: 'ca2', cuentaAnaliticaNombre: 'DMA-Alpina+Cárnicos 50/50',
    tarifaIva: 5, retencionId: 'r1', retencionNombre: 'Retefte 2.5%', retencionPct: 2.5,
    valorBase: 80000, superaTope: false, justificacion: '',
  },
];

// ── §2.6 — Anticipos de nómina ──
type Concepto26 = 'ANT_NOMINA' | 'PASAJE' | 'ANT_VIATICOS';
const conceptoLabels: Record<Concepto26, string> = {
  ANT_NOMINA:   'Anticipo de nómina',
  PASAJE:       'Pasaje',
  ANT_VIATICOS: 'Anticipo viáticos',
};
interface AnticipoNomina26 {
  id: string;
  empleado: string;
  concepto: Concepto26;
  cuentaAnaliticaId: string;
  cuentaAnaliticaNombre: string;
  valor: number;
}
const anticiposMock26: AnticipoNomina26[] = [
  { id: 'an1', empleado: 'Juan García',  concepto: 'ANT_NOMINA',   cuentaAnaliticaId: 'ca1', cuentaAnaliticaNombre: 'DMA-Alpina 100%',           valor: 70000  },
  { id: 'an2', empleado: 'Carlos López', concepto: 'ANT_VIATICOS', cuentaAnaliticaId: 'ca2', cuentaAnaliticaNombre: 'DMA-Alpina+Cárnicos 50/50', valor: 150000 },
];

const steps = ['Tripulación', 'Facturas', 'Gastos ruta', 'Consig. Riogrande', 'Consig. Aliados', 'Efectivo', 'Anticipos', 'Resumen'];

// ─── Componente ───────────────────────────────────────────────────────────────

const CuadrePlanillas = () => {
  const { selectedPlanillas, setCurrentPage } = useAppStore();
  const [currentStep] = useState(7); // step 7 = Resumen (último)

  // ── Tripulación ──
  const [conductor,  setConductor]  = useState('Juan García');
  const [auxiliar1,  setAuxiliar1]  = useState('Carlos López');
  const [auxiliar2,  setAuxiliar2]  = useState('Ninguno');
  const [placa,      setPlaca]      = useState('NTB-432');

  // ── Gastos / anticipos nómina ──
  const [gastos22, setGastos22] = useState<GastoRuta22[]>(gastosMock22);
  const [anticipos26, setAnticipos26] = useState<AnticipoNomina26[]>(anticiposMock26);

  // ── Sección 2.3 — Consig. Riogrande ──
  const [consigDisponibles]    = useState<ConsigDisponible[]>(consigDisponiblesMock);
  const [consigSeleccionadas, setConsigSeleccionadas] = useState<ConsigSeleccionada[]>(consigSeleccionadasIniciales);

  const toggleConsigRG = (c: ConsigDisponible) => {
    if (c.bloqueada) return;
    const estaSeleccionada = consigSeleccionadas.some(s => s.id === c.id);
    if (estaSeleccionada) {
      setConsigSeleccionadas(prev => prev.filter(s => s.id !== c.id));
    } else {
      setConsigSeleccionadas(prev => [...prev, { id: c.id, fecha: c.fecha, banco: c.banco, referencia: c.referencia, valor: c.valor }]);
    }
  };

  // ── Sección 2.4 — Consig. Aliados ──
  const [aliadoActivo, setAliadoActivo] = useState<Aliado24>('Alpina');
  // Alpina libre
  const [consigAlpina, setConsigAlpina] = useState([
    { id: 'alp1', fecha: '11/04/2026', banco: bancos[0], referencia: 'ALP-883421', valor: 4800000, soporte: false },
  ]);
  // Certificadas seleccionadas por aliado
  const [certSeleccionadas, setCertSeleccionadas] = useState<Record<string, ConsigAliadoCert[]>>({
    Cárnicos: [], Nutresa: [], Meals: [],
  });

  const toggleCert = (aliado: string, c: ConsigAliadoCert) => {
    if (c.bloqueada) return;
    setCertSeleccionadas(prev => {
      const lista = prev[aliado] || [];
      const existe = lista.some(s => s.id === c.id);
      return { ...prev, [aliado]: existe ? lista.filter(s => s.id !== c.id) : [...lista, c] };
    });
  };

  // ── Efectivo ──
  const [efectivoReal, setEfectivoReal] = useState(12987205);

  // ── Modal confirm ──
  const [showConfirm, setShowConfirm] = useState(false);

  // ── §2.2 state ──
  const [proveedores22, setProveedores22] = useState<Proveedor22[]>(proveedoresInit);
  const [provSearch, setProvSearch] = useState<Record<string, string>>({});
  const [provDropOpen, setProvDropOpen] = useState<string | null>(null);
  const [showModalProv, setShowModalProv] = useState(false);
  const [modalProvGastoId, setModalProvGastoId] = useState<string | null>(null);
  const [nuevoNit, setNuevoNit]     = useState('');
  const [nuevoDigito, setNuevoDigito] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo]   = useState<'Natural'|'Jurídico'>('Jurídico');
  const [nuevoTipoId, setNuevoTipoId] = useState('NIT');
  const [retencionRow, setRetencionRow] = useState<string | null>(null);

  // ── Cálculos ──
  const selectedNums = planillasMock.filter(p => selectedPlanillas.includes(p.id)).map(p => p.numero);

  const totalContado      = facturasMock.filter(f => f.crco === 'CONTADO').reduce((s, f) => s + f.totalCuadrar, 0);
  const totalAnticipos21  = anticiposMock21.reduce((s, a) => s + a.valor, 0); // neto (puede ser < 0)
  const totalGastos = gastos22.reduce((s, g) => {
    const iva = Math.round(g.valorBase * g.tarifaIva / 100);
    const ret = Math.round(g.valorBase * g.retencionPct / 100);
    return s + g.valorBase + iva - ret;
  }, 0);
  const totalConsigRio    = consigSeleccionadas.reduce((s, c) => s + c.valor, 0);
  const totalConsigAli    = (() => {
    if (aliadoActivo === 'Alpina') return consigAlpina.reduce((s, c) => s + c.valor, 0);
    const cert = certSeleccionadas[aliadoActivo] || [];
    return cert.reduce((s, c) => s + c.valor, 0);
  })();
  const totalAnticipos    = anticipos26.reduce((s, a) => s + a.valor, 0);
  const efectivoTeorico   = totalContado + totalAnticipos21 - totalGastos - totalConsigRio - totalConsigAli - totalAnticipos;
  const diferencia        = efectivoReal - efectivoTeorico;
  const aprovechamientos  = diferencia > 0 ? diferencia : 0;
  const diferenciaFinal   = totalContado + totalAnticipos21 - totalGastos - totalConsigRio - totalConsigAli - totalAnticipos - efectivoReal + aprovechamientos;

  return (
    <div className="p-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cuadre de Planillas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedNums.length > 0 ? selectedNums.join(' // ') : 'DA-32926 // DA-32937'}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${
              i <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              <span className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center text-xs">{i + 1}</span>
              {step}
            </div>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />}
          </div>
        ))}
      </div>

      {/* ── §0 Tripulación ── */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Tripulación de la Ruta</h3>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Conductor */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Conductor <span className="text-destructive">*</span>
              </label>
              <select
                value={conductor}
                onChange={e => setConductor(e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {conductoresMock.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {/* Auxiliar 1 */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Auxiliar 1 <span className="text-destructive">*</span>
              </label>
              <select
                value={auxiliar1}
                onChange={e => setAuxiliar1(e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>Ninguno</option>
                {conductoresMock.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {/* Auxiliar 2 */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Auxiliar 2</label>
              <select
                value={auxiliar2}
                onChange={e => setAuxiliar2(e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>Ninguno</option>
                {conductoresMock.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            {/* Placa */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Placa <span className="text-destructive">*</span>
              </label>
              <select
                value={placa}
                onChange={e => setPlaca(e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {placasMock.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          {/* Resumen selección */}
          <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>🚗 <span className="font-medium text-foreground">{conductor}</span></span>
            {auxiliar1 !== 'Ninguno' && <span>👤 <span className="font-medium text-foreground">{auxiliar1}</span></span>}
            {auxiliar2 !== 'Ninguno' && <span>👤 <span className="font-medium text-foreground">{auxiliar2}</span></span>}
            <span>🚛 <span className="font-medium text-foreground">{placa}</span></span>
          </div>
        </div>
      </section>

      {/* ── §2.1 Facturas ── */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">2.1 — Detalle de facturas, notas y anticipos</h3>
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Planilla</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Documento</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">CR/CO</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor base</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor neto (facturas − notas)</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Desc. cond.</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Retenciones</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Anticipos</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total a cuadrar</th>
              </tr>
            </thead>
            <tbody>
              {/* Filas de facturas */}
              {facturasMock.map((f, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono text-xs">{f.planilla}</td>
                  <td className="px-4 py-2.5 font-mono">{f.numero}</td>
                  <td className="px-4 py-2.5">
                    <span className={f.crco === 'CONTADO' ? 'badge-success' : 'badge-neutral'}>{f.crco}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(f.valorBase)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(f.valorNeto)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{f.descCondicionado > 0 ? formatCurrency(f.descCondicionado) : '—'}</td>
                  <td className="px-4 py-2.5 text-right font-mono">
                    <div className="flex items-center justify-end gap-2">
                      {f.retenciones > 0 ? formatCurrency(f.retenciones) : '—'}
                      <button
                        onClick={() => setRetencionRow(retencionRow === f.numero ? null : f.numero)}
                        className="text-primary hover:bg-accent rounded p-0.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {retencionRow === f.numero && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <select className="border border-input rounded px-2 py-1 bg-background text-xs">
                          {tiposRetencion.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <input type="text" placeholder="Valor" className="border border-input rounded px-2 py-1 w-24 bg-background text-xs" />
                        <button className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs">OK</button>
                      </div>
                    )}
                  </td>
                  {/* Anticipos — vacío para facturas normales */}
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">—</td>
                  <td className={`px-4 py-2.5 text-right font-mono font-medium ${f.crco === 'CRÉDITO' ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {f.crco === 'CRÉDITO' ? '$0' : formatCurrency(f.totalCuadrar)}
                  </td>
                </tr>
              ))}

              {/* Filas de anticipos de clientes */}
              {anticiposMock21.map((a, i) => (
                <tr key={`ant-${i}`} className="border-t border-border table-row-alt bg-blue-50/30 dark:bg-blue-900/10">
                  <td className="px-4 py-2.5 font-mono text-xs">{a.planilla}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{a.numero}</td>
                  <td className="px-4 py-2.5">
                    <span className="badge-neutral text-xs">ANTICIPO</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">—</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">—</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">—</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">—</td>
                  {/* Columna Anticipos — coloreada */}
                  <td className={`px-4 py-2.5 text-right font-mono font-semibold ${a.valor >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {a.valor >= 0 ? formatCurrency(a.valor) : `−${formatCurrency(Math.abs(a.valor))}`}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-mono font-medium ${a.valor >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {a.valor >= 0 ? formatCurrency(a.valor) : `−${formatCurrency(Math.abs(a.valor))}`}
                  </td>
                </tr>
              ))}

              {/* Totales */}
              <tr className="border-t-2 border-primary/20 bg-accent">
                <td colSpan={3} className="px-4 py-3 font-semibold">TOTALES</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(facturasMock.reduce((s, f) => s + f.valorBase, 0))}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(facturasMock.reduce((s, f) => s + f.valorNeto, 0))}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(facturasMock.reduce((s, f) => s + f.descCondicionado, 0))}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(facturasMock.reduce((s, f) => s + f.retenciones, 0))}</td>
                <td className={`px-4 py-3 text-right font-mono font-semibold ${totalAnticipos21 >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {totalAnticipos21 >= 0 ? formatCurrency(totalAnticipos21) : `−${formatCurrency(Math.abs(totalAnticipos21))}`}
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                  {formatCurrency(totalContado + totalAnticipos21)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── §2.2 Gastos de ruta ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">2.2 — Gastos de ruta</h3>
          <button
            onClick={() => {
              const primerTipo = parametrosGasto22[0];
              setGastos22(prev => [...prev, {
                id: String(Date.now()),
                tipoGastoId: primerTipo.id, tipoGastoNombre: primerTipo.nombre_asiento,
                requiereDocElec: primerTipo.requiere_documento_electronico, topeMaximo: primerTipo.tope_maximo,
                proveedorNit: '', proveedorNombre: '', nFactura: '',
                cuentaAnaliticaId: cuentasAnaliticas22[0].id, cuentaAnaliticaNombre: cuentasAnaliticas22[0].nombre,
                tarifaIva: 0, retencionId: '', retencionNombre: '', retencionPct: 0,
                valorBase: 0, superaTope: false, justificacion: '',
              }]);
            }}
            className="flex items-center gap-2 text-sm text-primary hover:bg-accent px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" /> Agregar gasto
          </button>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-xs" style={{ minWidth: '1100px' }}>
            <thead>
              <tr className="bg-muted/70">
                <th className="text-left px-2 py-3 font-medium text-muted-foreground whitespace-nowrap">Tipo de gasto</th>
                <th className="text-left px-2 py-3 font-medium text-muted-foreground whitespace-nowrap">Proveedor</th>
                <th className="text-left px-2 py-3 font-medium text-muted-foreground whitespace-nowrap">N° Factura</th>
                <th className="text-left px-2 py-3 font-medium text-muted-foreground whitespace-nowrap">Cuenta analítica</th>
                <th className="text-left px-2 py-3 font-medium text-muted-foreground whitespace-nowrap">Tarifa IVA</th>
                <th className="text-left px-2 py-3 font-medium text-muted-foreground whitespace-nowrap">Retención</th>
                <th className="text-right px-2 py-3 font-medium text-muted-foreground whitespace-nowrap">Valor base</th>
                <th className="text-right px-2 py-3 font-medium text-muted-foreground whitespace-nowrap">IVA</th>
                <th className="text-right px-2 py-3 font-medium text-muted-foreground whitespace-nowrap">Retención $</th>
                <th className="text-right px-2 py-3 font-medium text-muted-foreground whitespace-nowrap">Total</th>
                <th className="px-2 py-3 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {gastos22.map((g) => {
                const ivaCalc  = Math.round(g.valorBase * g.tarifaIva / 100);
                const retCalc  = Math.round(g.valorBase * g.retencionPct / 100);
                const total    = g.valorBase + ivaCalc - retCalc;
                const superaTope = total > g.topeMaximo;
                const searchVal = provSearch[g.id] ?? `${g.proveedorNombre}${g.proveedorNombre && g.proveedorNit ? ' / ' : ''}${g.proveedorNit}`;
                const filteredProvs = proveedores22.filter(p =>
                  p.nombre.toLowerCase().includes((provSearch[g.id] || '').toLowerCase()) ||
                  p.nit.includes(provSearch[g.id] || '')
                );
                const noMatch = (provSearch[g.id] || '').length > 1 && filteredProvs.length === 0;

                const updateG = (patch: Partial<GastoRuta22>) =>
                  setGastos22(prev => prev.map(x => x.id === g.id ? { ...x, ...patch } : x));

                return (
                  <>
                    <tr key={g.id} className={`border-t border-border transition-colors ${superaTope ? 'bg-red-50 dark:bg-red-900/15' : 'hover:bg-muted/30'}`}>

                      {/* 1. TIPO DE GASTO */}
                      <td className="px-2 py-2">
                        <select
                          value={g.tipoGastoId}
                          onChange={e => {
                            const t = parametrosGasto22.find(x => x.id === e.target.value)!;
                            updateG({ tipoGastoId: t.id, tipoGastoNombre: t.nombre_asiento, requiereDocElec: t.requiere_documento_electronico, topeMaximo: t.tope_maximo });
                          }}
                          className="border border-input rounded px-1.5 py-1 bg-background text-xs w-40 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {parametrosGasto22.map(t => <option key={t.id} value={t.id}>{t.nombre_asiento}</option>)}
                        </select>
                      </td>

                      {/* 2. PROVEEDOR */}
                      <td className="px-2 py-2">
                        <div className="relative">
                          <div className="flex items-center gap-1">
                            <input
                              value={searchVal}
                              onChange={e => {
                                setProvSearch(prev => ({ ...prev, [g.id]: e.target.value }));
                                setProvDropOpen(g.id);
                              }}
                              onFocus={() => setProvDropOpen(g.id)}
                              onBlur={() => setTimeout(() => setProvDropOpen(null), 200)}
                              placeholder="Buscar por nombre o NIT…"
                              className="border border-input rounded px-1.5 py-1 bg-background text-xs w-44 focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            {noMatch && (
                              <button
                                onMouseDown={e => { e.preventDefault(); setModalProvGastoId(g.id); setShowModalProv(true); setNuevoNit(provSearch[g.id] || ''); setNuevoDigito(''); setNuevoNombre(''); }}
                                className="flex items-center justify-center w-6 h-6 rounded bg-primary text-primary-foreground hover:opacity-80 shrink-0"
                                title="Crear nuevo proveedor"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          {provDropOpen === g.id && filteredProvs.length > 0 && (
                            <div className="absolute z-20 top-full left-0 mt-1 bg-card border border-border rounded shadow-lg w-64 max-h-40 overflow-y-auto">
                              {filteredProvs.map(p => (
                                <button
                                  key={p.id}
                                  onMouseDown={e => { e.preventDefault(); }}
                                  onClick={() => {
                                    updateG({ proveedorNit: p.nit, proveedorNombre: p.nombre });
                                    setProvSearch(prev => ({ ...prev, [g.id]: `${p.nombre} / ${p.nit}` }));
                                    setProvDropOpen(null);
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-accent text-xs flex flex-col"
                                >
                                  <span className="font-medium">{p.nombre}</span>
                                  <span className="text-muted-foreground">{p.nit}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. N° FACTURA — condicional */}
                      <td className="px-2 py-2">
                        {g.requiereDocElec ? (
                          <input
                            value={g.nFactura}
                            onChange={e => updateG({ nFactura: e.target.value })}
                            placeholder="N° factura *"
                            className="border border-input rounded px-1.5 py-1 bg-background text-xs w-24 focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>

                      {/* 4. CUENTA ANALÍTICA */}
                      <td className="px-2 py-2">
                        <select
                          value={g.cuentaAnaliticaId}
                          onChange={e => {
                            const ca = cuentasAnaliticas22.find(x => x.id === e.target.value)!;
                            updateG({ cuentaAnaliticaId: ca.id, cuentaAnaliticaNombre: ca.nombre });
                          }}
                          className="border border-input rounded px-1.5 py-1 bg-background text-xs w-48 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {cuentasAnaliticas22.map(ca => <option key={ca.id} value={ca.id}>{ca.nombre}</option>)}
                        </select>
                      </td>

                      {/* 5. TARIFA IVA */}
                      <td className="px-2 py-2">
                        <select
                          value={g.tarifaIva}
                          onChange={e => updateG({ tarifaIva: Number(e.target.value) })}
                          className="border border-input rounded px-1.5 py-1 bg-background text-xs w-20 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {ivasDisponibles.map(i => <option key={i.pct} value={i.pct}>{i.label}</option>)}
                        </select>
                      </td>

                      {/* 6. RETENCIÓN PROVEEDOR — nullable */}
                      <td className="px-2 py-2">
                        <select
                          value={g.retencionId}
                          onChange={e => {
                            if (!e.target.value) { updateG({ retencionId: '', retencionNombre: '', retencionPct: 0 }); return; }
                            const r = retencionesProveedor.find(x => x.id === e.target.value)!;
                            updateG({ retencionId: r.id, retencionNombre: r.nombre, retencionPct: r.pct });
                          }}
                          className="border border-input rounded px-1.5 py-1 bg-background text-xs w-36 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">— Sin retención</option>
                          {retencionesProveedor.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select>
                      </td>

                      {/* 7. VALOR BASE */}
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={g.valorBase === 0 ? '' : g.valorBase.toLocaleString('es-CO')}
                          onChange={e => {
                            const v = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                            updateG({ valorBase: v });
                          }}
                          placeholder="0"
                          className="border border-input rounded px-1.5 py-1 bg-background text-xs w-28 text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </td>

                      {/* 8. IVA — calculado, visible si tarifaIva > 0 */}
                      <td className="px-2 py-2 text-right font-mono">
                        {g.tarifaIva > 0 ? (
                          <span className="text-blue-600 dark:text-blue-400">{formatCurrency(ivaCalc)}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>

                      {/* 9. RETENCIÓN $ — calculado, visible si hay retención */}
                      <td className="px-2 py-2 text-right font-mono">
                        {g.retencionId ? (
                          <span className="text-amber-600 dark:text-amber-400">−{formatCurrency(retCalc)}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>

                      {/* 10. TOTAL — solo lectura */}
                      <td className="px-2 py-2 text-right font-mono font-semibold">
                        {superaTope && <AlertTriangle className="h-3 w-3 text-red-500 inline mr-1" />}
                        <span className={superaTope ? 'text-red-600 dark:text-red-400' : 'text-foreground'}>
                          {formatCurrency(total)}
                        </span>
                      </td>

                      {/* DELETE */}
                      <td className="px-2 py-2">
                        <button
                          onClick={() => setGastos22(prev => prev.filter(x => x.id !== g.id))}
                          className="text-destructive hover:bg-destructive/10 rounded p-1 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>

                    {/* ALERTA DE TOPE — fila de justificación */}
                    {superaTope && (
                      <tr key={`tope-${g.id}`} className="bg-red-50 dark:bg-red-900/10 border-t border-red-200 dark:border-red-800/40">
                        <td colSpan={11} className="px-3 py-2">
                          <div className="flex items-center gap-2 text-xs">
                            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                            <span className="font-medium text-red-700 dark:text-red-400 whitespace-nowrap">
                              ⚠ Total supera tope máximo ({formatCurrency(g.topeMaximo)}) — justificación obligatoria:
                            </span>
                            <input
                              value={g.justificacion}
                              onChange={e => updateG({ justificacion: e.target.value })}
                              placeholder="Escribir justificación…"
                              className="flex-1 border border-red-400 dark:border-red-600 rounded px-2 py-1 bg-background text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}

              {/* TOTAL GASTOS */}
              <tr className="border-t-2 border-primary/20 bg-accent">
                <td colSpan={9} className="px-3 py-3 font-semibold text-sm">TOTAL GASTOS</td>
                <td className="px-2 py-3 text-right font-mono font-bold text-sm">{formatCurrency(totalGastos)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Modal: Nuevo proveedor ── */}
      {showModalProv && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50" onClick={() => setShowModalProv(false)}>
          <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-base font-bold text-foreground">Nuevo proveedor</h4>
              <button onClick={() => setShowModalProv(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">NIT <span className="text-destructive">*</span></label>
                  <input value={nuevoNit} onChange={e => setNuevoNit(e.target.value)} placeholder="900123456" className="w-full border border-input rounded px-2.5 py-1.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Dígito V.</label>
                  <input value={nuevoDigito} onChange={e => setNuevoDigito(e.target.value)} placeholder="0" maxLength={1} className="w-full border border-input rounded px-2.5 py-1.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre / Razón social <span className="text-destructive">*</span></label>
                <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} placeholder="Nombre del proveedor" className="w-full border border-input rounded px-2.5 py-1.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo tercero</label>
                  <select value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value as 'Natural'|'Jurídico')} className="w-full border border-input rounded px-2.5 py-1.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>Natural</option>
                    <option>Jurídico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo identificación</label>
                  <select value={nuevoTipoId} onChange={e => setNuevoTipoId(e.target.value)} className="w-full border border-input rounded px-2.5 py-1.5 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option>NIT</option>
                    <option>CC</option>
                    <option>CE</option>
                    <option>Pasaporte</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded px-3 py-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Pendiente sincronización con Odoo
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowModalProv(false)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-accent rounded-md transition-colors">Cancelar</button>
              <button
                disabled={!nuevoNit || !nuevoNombre}
                onClick={() => {
                  const nuevo: Proveedor22 = { id: String(Date.now()), nit: nuevoNit, nombre: nuevoNombre, tipoTercero: nuevoTipo, tipoIdentificacion: nuevoTipoId, sincronizado_odoo: false };
                  setProveedores22(prev => [...prev, nuevo]);
                  if (modalProvGastoId) {
                    setGastos22(prev => prev.map(x => x.id === modalProvGastoId ? { ...x, proveedorNit: nuevo.nit, proveedorNombre: nuevo.nombre } : x));
                    setProvSearch(prev => ({ ...prev, [modalProvGastoId]: `${nuevo.nombre} / ${nuevo.nit}` }));
                  }
                  setShowModalProv(false);
                  setNuevoNit(''); setNuevoDigito(''); setNuevoNombre(''); setNuevoTipo('Jurídico'); setNuevoTipoId('NIT');
                }}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar proveedor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── §2.3 Consignaciones Riogrande — Selector ── */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">2.3 — Consignaciones a Riogrande</h3>

        {/* Disponibles */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Consignaciones disponibles</p>
        <div className="bg-card rounded-lg border border-border overflow-hidden mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Banco</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Referencia</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Seleccionar</th>
              </tr>
            </thead>
            <tbody>
              {consigDisponibles.map(c => {
                const seleccionada = consigSeleccionadas.some(s => s.id === c.id);
                return (
                  <tr key={c.id} className={`border-t border-border table-row-alt ${c.bloqueada ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-2.5">{c.fecha}</td>
                    <td className="px-4 py-2.5">{c.banco}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{c.referencia}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium">{formatCurrency(c.valor)}</td>
                    <td className="px-4 py-2.5 text-center">
                      {c.bloqueada
                        ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">Bloqueada</span>
                        : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">Disponible</span>
                      }
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="checkbox"
                        disabled={c.bloqueada}
                        checked={seleccionada}
                        onChange={() => toggleConsigRG(c)}
                        className="h-4 w-4 rounded border-input accent-primary cursor-pointer disabled:cursor-not-allowed"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Seleccionadas */}
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Consignaciones seleccionadas</p>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Banco</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Referencia</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {consigSeleccionadas.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-muted-foreground text-sm">Ninguna seleccionada aún</td></tr>
              )}
              {consigSeleccionadas.map(c => (
                <tr key={c.id} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5">{c.fecha}</td>
                  <td className="px-4 py-2.5">{c.banco}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{c.referencia}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">{formatCurrency(c.valor)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => setConsigSeleccionadas(prev => prev.filter(s => s.id !== c.id))}
                      className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 rounded px-2 py-1"
                    >
                      <X className="h-3.5 w-3.5" /> Quitar
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-primary/20 bg-accent">
                <td colSpan={3} className="px-4 py-3 font-semibold">TOTAL SELECCIONADO</td>
                <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(totalConsigRio)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── §2.4 Consignaciones Aliados ── */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">2.4 — Consignaciones a Aliados</h3>

        {/* Tabs de aliado */}
        <div className="flex gap-1 mb-5 border-b border-border">
          {ALIADOS24.map(a => (
            <button
              key={a}
              onClick={() => setAliadoActivo(a)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                aliadoActivo === a
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Panel Alpina — libre */}
        {aliadoActivo === 'Alpina' && (
          <div>
            {/* Nota advertencia */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg px-4 py-3 mb-5 text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ Las consignaciones de Alpina se registran con comprobante físico y quedan pendientes de certificación hasta la conciliación mensual. El asiento contable se generará <span className="font-semibold">después de la conciliación</span>.
            </div>
            <div className="flex justify-end mb-3">
              <button
                onClick={() => setConsigAlpina([...consigAlpina, { id: String(Date.now()), fecha: '11/04/2026', banco: bancos[0], referencia: '', valor: 0, soporte: false }])}
                className="flex items-center gap-2 text-sm text-primary hover:bg-accent px-3 py-1.5 rounded-md"
              >
                <Plus className="h-4 w-4" /> Agregar consignación Alpina
              </button>
            </div>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/70">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Banco</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Referencia</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Soporte</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {consigAlpina.map((c, i) => (
                    <tr key={c.id} className="border-t border-border table-row-alt">
                      <td className="px-4 py-2.5">{c.fecha}</td>
                      <td className="px-4 py-2.5">
                        <select defaultValue={c.banco} className="border border-input rounded px-2 py-1 bg-background text-sm">
                          {bancos.map(b => <option key={b}>{b}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2.5 font-mono">
                        <input defaultValue={c.referencia} placeholder="Referencia" className="border border-input rounded px-2 py-1 w-32 bg-background text-sm" />
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-medium">{formatCurrency(c.valor)}</td>
                      <td className="px-4 py-2.5 text-center">
                        {c.soporte
                          ? <Check className="h-4 w-4 text-success mx-auto" />
                          : <button className="flex items-center gap-1 text-xs text-primary mx-auto"><Paperclip className="h-3.5 w-3.5" /> Adjuntar</button>
                        }
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => setConsigAlpina(consigAlpina.filter((_, j) => j !== i))} className="text-destructive hover:bg-destructive/10 rounded p-1">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-primary/20 bg-accent">
                    <td colSpan={3} className="px-4 py-3 font-semibold">TOTAL ALPINA</td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(consigAlpina.reduce((s, c) => s + c.valor, 0))}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Panel Cárnicos / Nutresa / Meals — Selector certificadas */}
        {aliadoActivo !== 'Alpina' && (() => {
          const disponibles = consigAliadosCertMock[aliadoActivo] || [];
          const seleccionadas = certSeleccionadas[aliadoActivo] || [];
          const total = seleccionadas.reduce((s, c) => s + c.valor, 0);
          return (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Consignaciones certificadas disponibles — {aliadoActivo}</p>
              <div className="bg-card rounded-lg border border-border overflow-hidden mb-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/70">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Banco</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Referencia</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Estado</th>
                      <th className="text-center px-4 py-3 font-medium text-muted-foreground">Seleccionar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disponibles.map(c => {
                      const estaSeleccionada = seleccionadas.some(s => s.id === c.id);
                      return (
                        <tr key={c.id} className={`border-t border-border table-row-alt ${c.bloqueada ? 'opacity-60' : ''}`}>
                          <td className="px-4 py-2.5">{c.fecha}</td>
                          <td className="px-4 py-2.5">{c.banco}</td>
                          <td className="px-4 py-2.5 font-mono text-xs">{c.referencia}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-medium">{formatCurrency(c.valor)}</td>
                          <td className="px-4 py-2.5 text-center">
                            {c.bloqueada
                              ? <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">Bloqueada</span>
                              : <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">Disponible</span>
                            }
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <input
                              type="checkbox"
                              disabled={c.bloqueada}
                              checked={estaSeleccionada}
                              onChange={() => toggleCert(aliadoActivo, c)}
                              className="h-4 w-4 rounded border-input accent-primary cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Seleccionadas — {aliadoActivo}</p>
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/70">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Banco</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Referencia</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {seleccionadas.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-4 text-center text-muted-foreground text-sm">Ninguna seleccionada</td></tr>
                    )}
                    {seleccionadas.map(c => (
                      <tr key={c.id} className="border-t border-border table-row-alt">
                        <td className="px-4 py-2.5">{c.fecha}</td>
                        <td className="px-4 py-2.5">{c.banco}</td>
                        <td className="px-4 py-2.5 font-mono text-xs">{c.referencia}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-medium">{formatCurrency(c.valor)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => toggleCert(aliadoActivo, c)}
                            className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 rounded px-2 py-1"
                          >
                            <X className="h-3.5 w-3.5" /> Quitar
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-primary/20 bg-accent">
                      <td colSpan={3} className="px-4 py-3 font-semibold">TOTAL {aliadoActivo.toUpperCase()}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(total)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </section>

      {/* ── §2.5 Conteo de efectivo ── */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">2.5 — Conteo de efectivo</h3>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Efectivo teórico</label>
              <div className="text-2xl font-bold text-muted-foreground bg-muted rounded-lg px-4 py-3">{formatCurrency(efectivoTeorico)}</div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Efectivo real</label>
              <input
                type="text"
                value={formatCurrency(efectivoReal)}
                onChange={(e) => {
                  const num = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                  setEfectivoReal(num);
                }}
                className="text-2xl font-bold w-full rounded-lg border-2 border-primary/30 px-4 py-3 bg-background focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Diferencia</label>
              <div className={`text-2xl font-bold rounded-lg px-4 py-3 ${
                diferencia >= 0 ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
              }`}>
                {formatCurrency(diferencia)}
              </div>
              <p className={`text-sm mt-2 font-medium ${diferencia > 0 ? 'text-success' : diferencia === 0 ? 'text-success' : 'text-destructive'}`}>
                {diferencia > 0  && 'Sobrante → va a Aprovechamientos'}
                {diferencia === 0 && '✓ Cuadra exacto'}
                {diferencia < 0  && '⚠ Faltante — debe registrar anticipo de nómina'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── §2.6 Anticipos de nómina ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">2.6 — Anticipos de nómina</h3>
          <button
            onClick={() => setAnticipos26(prev => [...prev, {
              id: String(Date.now()),
              empleado: empleados[0],
              concepto: 'ANT_NOMINA',
              cuentaAnaliticaId: cuentasAnaliticas22[0].id,
              cuentaAnaliticaNombre: cuentasAnaliticas22[0].nombre,
              valor: 0,
            }])}
            className="flex items-center gap-2 text-sm text-primary hover:bg-accent px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" /> Agregar anticipo
          </button>
        </div>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empleado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Concepto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cuenta analítica</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {anticipos26.map((a) => {
                const updateA = (patch: Partial<AnticipoNomina26>) =>
                  setAnticipos26(prev => prev.map(x => x.id === a.id ? { ...x, ...patch } : x));
                return (
                  <tr key={a.id} className="border-t border-border hover:bg-muted/30 transition-colors">

                    {/* 1. EMPLEADO */}
                    <td className="px-4 py-2.5">
                      <select
                        value={a.empleado}
                        onChange={e => updateA({ empleado: e.target.value })}
                        className="border border-input rounded px-2 py-1 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {empleados.map(e => <option key={e}>{e}</option>)}
                      </select>
                    </td>

                    {/* 2. CONCEPTO */}
                    <td className="px-4 py-2.5">
                      <select
                        value={a.concepto}
                        onChange={e => updateA({ concepto: e.target.value as Concepto26 })}
                        className="border border-input rounded px-2 py-1 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {(Object.keys(conceptoLabels) as Concepto26[]).map(k => (
                          <option key={k} value={k}>{conceptoLabels[k]}</option>
                        ))}
                      </select>
                    </td>

                    {/* 3. CUENTA ANALÍTICA */}
                    <td className="px-4 py-2.5">
                      <select
                        value={a.cuentaAnaliticaId}
                        onChange={e => {
                          const ca = cuentasAnaliticas22.find(x => x.id === e.target.value)!;
                          updateA({ cuentaAnaliticaId: ca.id, cuentaAnaliticaNombre: ca.nombre });
                        }}
                        className="border border-input rounded px-2 py-1 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {cuentasAnaliticas22.map(ca => <option key={ca.id} value={ca.id}>{ca.nombre}</option>)}
                      </select>
                    </td>

                    {/* 4. VALOR */}
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="text"
                        value={a.valor === 0 ? '' : a.valor.toLocaleString('es-CO')}
                        onChange={e => {
                          const v = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                          updateA({ valor: v });
                        }}
                        placeholder="0"
                        className="border border-input rounded px-2 py-1 bg-background text-sm w-32 text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </td>

                    {/* DELETE */}
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => setAnticipos26(prev => prev.filter(x => x.id !== a.id))}
                        className="text-destructive hover:bg-destructive/10 rounded p-1 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-primary/20 bg-accent">
                <td colSpan={3} className="px-4 py-3 font-semibold">TOTAL ANTICIPOS</td>
                <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(totalAnticipos)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── §2.7 Resumen ── */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">2.7 — Resumen del cuadre</h3>
        <div className={`bg-card rounded-lg border-2 p-8 ${diferenciaFinal === 0 ? 'border-success' : 'border-destructive'}`}>
          <div className="max-w-lg mx-auto space-y-2.5 font-mono text-base">

            <div className="flex justify-between">
              <span>Total a cuadrar (contado):</span>
              <span className="font-bold">{formatCurrency(totalContado)}</span>
            </div>

            {/* Anticipos clientes — nueva línea */}
            <div className={`flex justify-between ${totalAnticipos21 >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              <span>{totalAnticipos21 >= 0 ? '+ Anticipos clientes (neto):' : '− Anticipos clientes (neto):'}</span>
              <span className="font-semibold">
                {totalAnticipos21 >= 0 ? formatCurrency(totalAnticipos21) : `−${formatCurrency(Math.abs(totalAnticipos21))}`}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground">
              <span>− Gastos de ruta:</span>
              <span>{formatCurrency(totalGastos)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>− Consignaciones Riogrande:</span>
              <span>{formatCurrency(totalConsigRio)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>− Consignaciones Aliados:</span>
              <span>{formatCurrency(totalConsigAli)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>− Anticipos nómina:</span>
              <span>{formatCurrency(totalAnticipos)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>− Efectivo real:</span>
              <span>{formatCurrency(efectivoReal)}</span>
            </div>
            {aprovechamientos > 0 && (
              <div className="flex justify-between text-success">
                <span>+ Aprovechamientos:</span>
                <span>{formatCurrency(aprovechamientos)}</span>
              </div>
            )}

            <hr className="border-border my-2" />

            <div className={`flex justify-between text-xl font-bold ${diferenciaFinal === 0 ? 'text-success' : 'text-destructive'}`}>
              <span>DIFERENCIA:</span>
              <span>{formatCurrency(diferenciaFinal)} {diferenciaFinal === 0 ? '✓' : ''}</span>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            {diferenciaFinal === 0 ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="bg-success text-success-foreground px-8 py-3 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Confirmar cuadre
              </button>
            ) : (
              <button
                disabled
                className="bg-muted text-muted-foreground px-8 py-3 rounded-md text-sm font-semibold cursor-not-allowed"
                title="El cuadre debe cerrar en cero"
              >
                Confirmar cuadre
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── Modal Confirmar ── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border shadow-lg p-8 max-w-md w-full animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Cuadre confirmado</h3>
              <p className="text-muted-foreground mb-1">Consecutivo generado:</p>
              <p className="text-2xl font-bold font-mono text-primary mb-6">DMA-110426.01</p>
              <button
                onClick={() => { setShowConfirm(false); setCurrentPage('recaudo'); }}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Ir al Recaudo Diario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CuadrePlanillas;

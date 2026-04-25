import { useState } from 'react';
import { Plus, Edit2, Ban, X, Save, AlertTriangle } from 'lucide-react';
import { aliados, parametrosContables, cuentasAnaliticasMock } from '@/data/mockData';

const paramTabs = [
  'Sedes',
  'Aliados',
  'Operaciones',
  'Bancos',
  'Parámetros Contables',
  'Parámetros Generales',
  'Cuentas Analíticas',
  'Empleados',
  'Vehículos',
  'Parámetros del Sistema',
];

const mockSedes = [
  { codigo: 'DMA', nombre: 'Donmatías', letra: 'D', cuentaCaja: '130501', diarioCaja: 'CAJA_DMA', estado: 'Activa' },
  { codigo: 'CAC', nombre: 'Caucasia',  letra: 'C', cuentaCaja: '130502', diarioCaja: 'CAJA_CAC', estado: 'Activa' },
  { codigo: 'APA', nombre: 'Apartadó',  letra: 'A', cuentaCaja: '130503', diarioCaja: 'CAJA_APA', estado: 'Activa' },
  { codigo: 'QBO', nombre: 'Quibdó',    letra: 'Q', cuentaCaja: '130504', diarioCaja: 'CAJA_QBO', estado: 'Activa' },
];

const mockOperaciones = [
  { codigo: 'DA', sede: 'DMA', aliado: 'ALPINA',   erp: 'SIDIS', estado: 'Activa' },
  { codigo: 'DC', sede: 'DMA', aliado: 'CARNICOS', erp: 'ECOM',  estado: 'Activa' },
  { codigo: 'DF', sede: 'DMA', aliado: 'FAMILIA',  erp: 'SIDIS', estado: 'Activa' },
  { codigo: 'CA', sede: 'CAC', aliado: 'ALPINA',   erp: 'ECOM',  estado: 'Activa' },
  { codigo: 'CC', sede: 'CAC', aliado: 'CARNICOS', erp: 'ECOM',  estado: 'Activa' },
  { codigo: 'CN', sede: 'CAC', aliado: 'NUTRESA',  erp: 'ECOM',  estado: 'Activa' },
  { codigo: 'AA', sede: 'APA', aliado: 'ALPINA',   erp: 'SIDIS', estado: 'Activa' },
  { codigo: 'QC', sede: 'QBO', aliado: 'CARNICOS', erp: 'ECOM',  estado: 'Activa' },
  { codigo: 'QN', sede: 'QBO', aliado: 'NUTRESA',  erp: 'ECOM',  estado: 'Activa' },
  { codigo: 'QM', sede: 'QBO', aliado: 'MEALS',    erp: 'ECOM',  estado: 'Activa' },
];

const mockBancos = [
  { id: 1, nombre: 'Bancolombia',               tipo: 'EXTERNO',   estado: 'Activo' },
  { id: 2, nombre: 'Banco de Bogotá',            tipo: 'EXTERNO',   estado: 'Activo' },
  { id: 3, nombre: 'Davivienda',                 tipo: 'EXTERNO',   estado: 'Activo' },
  { id: 4, nombre: 'CFA',                        tipo: 'EXTERNO',   estado: 'Activo' },
  { id: 5, nombre: 'Banco Agrario',              tipo: 'EXTERNO',   estado: 'Activo' },
  { id: 6, nombre: 'AV Villas',                  tipo: 'EXTERNO',   estado: 'Activo' },
  { id: 7, nombre: 'Bancolombia Ahorros RIO',    tipo: 'RIOGRANDE', estado: 'Activo' },
  { id: 8, nombre: 'Bancolombia Corriente RIO',  tipo: 'RIOGRANDE', estado: 'Activo' },
  { id: 9, nombre: 'CFA RIO',                    tipo: 'RIOGRANDE', estado: 'Activo' },
];

const mockEmpleados = [
  { nit: '1037567890', nombre: 'Carlos Pérez',   cargo: 'CONDUCTOR',           sede: 'DMA', enOdoo: true,  estado: 'Activo' },
  { nit: '1017234567', nombre: 'Andrés Ríos',    cargo: 'AUXILIAR_RUTA',       sede: 'DMA', enOdoo: false, estado: 'Activo' },
  { nit: '1040890123', nombre: 'Laura Gómez',    cargo: 'AUXILIAR_TESORERIA',  sede: 'CAC', enOdoo: true,  estado: 'Activo' },
  { nit: '1020456789', nombre: 'Jorge Martínez', cargo: 'CONDUCTOR',           sede: 'APA', enOdoo: true,  estado: 'Activo' },
  { nit: '1035678901', nombre: 'Diana López',    cargo: 'AUXILIAR_RUTA',       sede: 'QBO', enOdoo: false, estado: 'Activo' },
];

const mockVehiculos = [
  { placa: 'NTB-432', tipo: 'Camión', sede: 'DMA', estado: 'Activo'   },
  { placa: 'OPQ-871', tipo: 'Furgón', sede: 'DMA', estado: 'Activo'   },
  { placa: 'KLM-234', tipo: 'Furgón', sede: 'CAC', estado: 'Activo'   },
  { placa: 'RST-567', tipo: 'Moto',   sede: 'QBO', estado: 'Activo'   },
  { placa: 'ABC-123', tipo: 'Camión', sede: 'APA', estado: 'Inactivo' },
];

interface ParamGeneral { clave: string; descripcion: string; valor: string; }
const mockParamsGenerales: ParamGeneral[] = [
  { clave: 'CUENTA_POR_PAGAR', descripcion: 'Cuenta transitoria para causación de gastos', valor: '(pendiente con contador)' },
  { clave: 'CUENTA_POR_COBRAR', descripcion: 'Para uso futuro', valor: '(pendiente)' },
];

interface ParamSistema { clave: string; descripcion: string; valor: string; }
const mockParamsSistema: ParamSistema[] = [
  { clave: 'MARGEN_DIAS_ANTES',             descripcion: 'Días antes para buscar consignaciones',                     valor: '3'     },
  { clave: 'MARGEN_DIAS_DESPUES',           descripcion: 'Días después para buscar consignaciones',                   valor: '1'     },
  { clave: 'TIMEOUT_SESION_MINUTOS',        descripcion: 'Minutos de inactividad para liberar bloqueos',              valor: '30'    },
  { clave: 'HORA_SYNC_AUTOMATICA',          descripcion: 'Hora diaria de sincronización con SharePoint',              valor: '06:00' },
  { clave: 'MAX_DIAS_SIN_APROBAR',          descripcion: 'Días cerrados sin aprobación antes de bloquear auxiliar',   valor: '2'     },
  { clave: 'DIAS_ATRAS_REGISTRO_GASTO',     descripcion: 'Días hacia atrás permitidos para fecha de gasto vs cuadre', valor: '2'     },
  { clave: 'DIAS_ADELANTE_REGISTRO_GASTO',  descripcion: 'Días hacia adelante permitidos para fecha de gasto vs cuadre', valor: '0' },
  { clave: 'INGESTA_MANUAL_ACTIVA',         descripcion: 'Habilita ingesta manual desde SharePoint',                  valor: 'true'  },
  { clave: 'INGESTA_AUTOMATICA_ACTIVA',     descripcion: 'Habilita ingesta automática programada',                    valor: 'false' },
  { clave: 'SYNC_ODOO_MANUAL_ACTIVA',       descripcion: 'Habilita botones de sync manual con Odoo',                  valor: 'true'  },
  { clave: 'SYNC_ODOO_AUTOMATICA_ACTIVA',   descripcion: 'Habilita sync automática con Odoo',                         valor: 'false' },
];

const BadgeEstado = ({ estado }: { estado: string }) => (
  <span className={estado === 'Activo' || estado === 'Activa' ? 'badge-success' : 'badge-neutral'}>{estado}</span>
);

const AccionesTabla = () => (
  <div className="flex items-center justify-end gap-2">
    <button className="text-primary hover:bg-accent rounded p-1.5" title="Editar"><Edit2 className="h-4 w-4" /></button>
    <button className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded p-1.5" title="Desactivar"><Ban className="h-4 w-4" /></button>
  </div>
);

const Parametrizacion = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [paramsGen, setParamsGen] = useState<ParamGeneral[]>(mockParamsGenerales);
  const [params, setParams] = useState<ParamSistema[]>(mockParamsSistema);
  const [editingItem, setEditingItem] = useState<(ParamGeneral | ParamSistema) | null>(null);
  const [editValue, setEditValue] = useState('');

  const openEdit = (p: ParamGeneral | ParamSistema) => { setEditingItem(p); setEditValue(p.valor); };
  const saveEdit = () => {
    if (!editingItem) return;
    if (activeTab === paramTabs.indexOf('Parámetros Generales')) {
      setParamsGen(prev => prev.map(p => p.clave === editingItem.clave ? { ...p, valor: editValue } : p));
    } else {
      setParams(prev => prev.map(p => p.clave === editingItem.clave ? { ...p, valor: editValue } : p));
    }
    setEditingItem(null);
  };

  const currentTab = paramTabs[activeTab];

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Parametrización</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-border">
        {paramTabs.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === i ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* SEDES */}
      {currentTab === 'Sedes' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"><Plus className="h-4 w-4" /> Agregar sede</button>
          </div>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/70">{['Código','Nombre','Letra','Cuenta Caja','Diario Caja Odoo','Estado','Acciones'].map(c => <th key={c} className="text-left px-4 py-3 font-medium text-muted-foreground">{c}</th>)}</tr></thead>
              <tbody>{mockSedes.map((s, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono font-bold text-primary">{s.codigo}</td>
                  <td className="px-4 py-2.5 font-medium">{s.nombre}</td>
                  <td className="px-4 py-2.5">{s.letra}</td>
                  <td className="px-4 py-2.5 font-mono">{s.cuentaCaja}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{s.diarioCaja}</td>
                  <td className="px-4 py-2.5"><BadgeEstado estado={s.estado} /></td>
                  <td className="px-4 py-2.5"><AccionesTabla /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* ALIADOS */}
      {currentTab === 'Aliados' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"><Plus className="h-4 w-4" /> Agregar aliado</button>
          </div>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/70">{['Nombre','Letra','NIT','Razón Social','Estado','Acciones'].map(c => <th key={c} className="text-left px-4 py-3 font-medium text-muted-foreground">{c}</th>)}</tr></thead>
              <tbody>{aliados.map((a, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-semibold">{a.nombre}</td>
                  <td className="px-4 py-2.5 font-mono">{a.letra}</td>
                  <td className="px-4 py-2.5 font-mono">{a.nit}</td>
                  <td className="px-4 py-2.5 text-sm text-muted-foreground">{a.razonSocial}</td>
                  <td className="px-4 py-2.5"><BadgeEstado estado="Activo" /></td>
                  <td className="px-4 py-2.5"><AccionesTabla /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* OPERACIONES */}
      {currentTab === 'Operaciones' && (
        <div>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/70">{['Código','Sede','Aliado','ERP','Estado'].map(c => <th key={c} className="text-left px-4 py-3 font-medium text-muted-foreground">{c}</th>)}</tr></thead>
              <tbody>{mockOperaciones.map((o, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono font-bold text-primary">{o.codigo}</td>
                  <td className="px-4 py-2.5">{o.sede}</td>
                  <td className="px-4 py-2.5">{o.aliado}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{o.erp}</td>
                  <td className="px-4 py-2.5"><BadgeEstado estado={o.estado} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Las operaciones son registros fijos del sistema. Contacta al administrador para modificaciones.</p>
        </div>
      )}

      {/* BANCOS */}
      {currentTab === 'Bancos' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"><Plus className="h-4 w-4" /> Agregar banco</button>
          </div>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/70">{['ID','Nombre','Tipo','Estado','Acciones'].map(c => <th key={c} className="text-left px-4 py-3 font-medium text-muted-foreground">{c}</th>)}</tr></thead>
              <tbody>{mockBancos.map((b, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono text-muted-foreground">{b.id}</td>
                  <td className="px-4 py-2.5 font-medium">{b.nombre}</td>
                  <td className="px-4 py-2.5"><span className={`text-xs font-mono px-2 py-0.5 rounded ${b.tipo === 'RIOGRANDE' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{b.tipo}</span></td>
                  <td className="px-4 py-2.5"><BadgeEstado estado={b.estado} /></td>
                  <td className="px-4 py-2.5"><AccionesTabla /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* PARÁMETROS CONTABLES */}
      {currentTab === 'Parámetros Contables' && (
        <div>
          <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 rounded-lg px-4 py-3 mb-4">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800 dark:text-yellow-300">
              <span className="font-semibold">Guía de parametrización:</span> <span className="font-medium">id_externo_odoo</span> es obligatorio para retenciones clientes, retenciones a proveedores, gastos e impuestos en gastos. <span className="font-medium">diario_odoo</span> es obligatorio para consignaciones a riogrande y traslados entre cajas.
            </p>
          </div>
          <div className="flex justify-end mb-4">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"><Plus className="h-4 w-4" /> Agregar parámetro</button>
          </div>
          <div className="bg-card rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/70">{['Tipo Asiento','Detalle','Cuenta','ID Externo Odoo','Diario Odoo','Sede','Estado','Acciones'].map(c => <th key={c} className="text-left px-3 py-3 font-medium text-muted-foreground whitespace-nowrap">{c}</th>)}</tr></thead>
              <tbody>{parametrosContables.map((p, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground whitespace-nowrap">{p.tipoAsiento}</td>
                  <td className="px-3 py-2.5 font-medium">{p.detalleAsiento}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{p.cuenta || '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-primary">{p.idExternoOdoo || <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{p.diarioOdoo || <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-3 py-2.5 text-xs">{p.sede || 'Todas'}</td>
                  <td className="px-3 py-2.5"><BadgeEstado estado="Activo" /></td>
                  <td className="px-3 py-2.5"><AccionesTabla /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* PARÁMETROS GENERALES */}
      {currentTab === 'Parámetros Generales' && (
        <div>
          <p className="text-xs text-muted-foreground mb-4">Cuentas contables transversales al sistema — no ligadas a un tipo de asiento específico.</p>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/70">{['Clave','Descripción','Valor','Acciones'].map(c => <th key={c} className={`text-left px-4 py-3 font-medium text-muted-foreground ${c === 'Acciones' ? 'text-right' : ''}`}>{c}</th>)}</tr></thead>
              <tbody>{paramsGen.map((p, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{p.clave}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{p.descripcion}</td>
                  <td className="px-4 py-2.5 font-mono font-semibold">{p.valor}</td>
                  <td className="px-4 py-2.5 text-right"><button onClick={() => openEdit(p)} className="text-primary hover:bg-accent rounded p-1.5"><Edit2 className="h-4 w-4" /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUENTAS ANALÍTICAS */}
      {currentTab === 'Cuentas Analíticas' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"><Plus className="h-4 w-4" /> Agregar cuenta</button>
          </div>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/70">{['Sede','Nombre','Código Odoo (JSON)','Estado','Acciones'].map(c => <th key={c} className="text-left px-4 py-3 font-medium text-muted-foreground">{c}</th>)}</tr></thead>
              <tbody>{cuentasAnaliticasMock.map((c, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono font-bold text-primary">{c.sede}</td>
                  <td className="px-4 py-2.5 font-medium">{c.nombre}</td>
                  <td className="px-4 py-2.5 font-mono text-xs bg-muted/30 rounded">{c.codigoOdoo}</td>
                  <td className="px-4 py-2.5"><BadgeEstado estado="Activa" /></td>
                  <td className="px-4 py-2.5"><AccionesTabla /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPLEADOS */}
      {currentTab === 'Empleados' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"><Plus className="h-4 w-4" /> Agregar empleado</button>
          </div>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/70">{['NIT','Nombre','Cargo','Sede','En Odoo','Estado','Acciones'].map(c => <th key={c} className="text-left px-4 py-3 font-medium text-muted-foreground">{c}</th>)}</tr></thead>
              <tbody>{mockEmpleados.map((e, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono text-xs">{e.nit}</td>
                  <td className="px-4 py-2.5 font-medium">{e.nombre}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-muted-foreground">{e.cargo}</td>
                  <td className="px-4 py-2.5">{e.sede}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${e.enOdoo ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                      {e.enOdoo ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5"><BadgeEstado estado={e.estado} /></td>
                  <td className="px-4 py-2.5"><AccionesTabla /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* VEHÍCULOS */}
      {currentTab === 'Vehículos' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"><Plus className="h-4 w-4" /> Agregar vehículo</button>
          </div>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/70">{['Placa','Tipo','Sede','Estado','Acciones'].map(c => <th key={c} className="text-left px-4 py-3 font-medium text-muted-foreground">{c}</th>)}</tr></thead>
              <tbody>{mockVehiculos.map((v, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono font-medium">{v.placa}</td>
                  <td className="px-4 py-2.5">{v.tipo}</td>
                  <td className="px-4 py-2.5">{v.sede}</td>
                  <td className="px-4 py-2.5"><BadgeEstado estado={v.estado} /></td>
                  <td className="px-4 py-2.5"><AccionesTabla /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* PARÁMETROS DEL SISTEMA */}
      {currentTab === 'Parámetros del Sistema' && (
        <div>
          <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
            Solo visible y editable para el rol <span className="font-semibold text-foreground">Admin</span>
          </p>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/70">{['Parámetro','Descripción','Valor actual','Acciones'].map(c => <th key={c} className={`text-left px-4 py-3 font-medium text-muted-foreground ${c === 'Acciones' ? 'text-right' : ''}`}>{c}</th>)}</tr></thead>
              <tbody>{params.map((p, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono text-xs text-primary">{p.clave}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{p.descripcion}</td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-foreground">{p.valor}</td>
                  <td className="px-4 py-2.5 text-right"><button onClick={() => openEdit(p)} className="text-primary hover:bg-accent rounded p-1.5"><Edit2 className="h-4 w-4" /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL EDITAR */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Editar parámetro</h3>
              <button onClick={() => setEditingItem(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">{editingItem.clave}</p>
            <p className="text-xs text-muted-foreground mb-4">{editingItem.descripcion}</p>
            <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-5" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors">Cancelar</button>
              <button onClick={saveEdit} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"><Save className="h-3.5 w-3.5" /> Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parametrizacion;

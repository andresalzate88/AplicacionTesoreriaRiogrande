import { useState } from 'react';
import { Plus, Edit2, Ban, X, Save } from 'lucide-react';

// ─── Pestañas ─────────────────────────────────────────────────────────────────

const paramTabs = [
  'Sedes y operaciones',
  'Bancos',
  'Tipos de gasto',
  'Tipos de retención',
  'Empleados',
  'Vehículos',
  'Aliados',
  'Cuentas contables',
  'Parámetros del Sistema',
];

// ─── Mock Data estándar por pestaña ───────────────────────────────────────────

const mockData: Record<string, { columns: string[]; rows: string[][] }> = {
  'Sedes y operaciones': {
    columns: ['Sede', 'Código', 'Operaciones', 'Estado'],
    rows: [
      ['Donmatías', 'DMA', 'Alpina, Cárnicos, Familia', 'Activa'],
      ['Caucasia',  'CAC', 'Alpina, Cárnicos, Nutresa', 'Activa'],
      ['Apartadó',  'APA', 'Alpina',                    'Activa'],
      ['Quibdó',    'QBO', 'Cárnicos, Nutresa, Meals',  'Activa'],
    ],
  },
  'Bancos': {
    columns: ['Banco', 'Código', 'Cuenta', 'Tipo', 'Estado'],
    rows: [
      ['Bancolombia',    'BCOL', '04512345678', 'Ahorros',   'Activo'],
      ['Davivienda',     'DAVI', '01298765432', 'Corriente', 'Activo'],
      ['BBVA',           'BBVA', '08834567890', 'Ahorros',   'Activo'],
      ['Banco de Bogotá','BBOG', '03145678901', 'Corriente', 'Inactivo'],
    ],
  },
  'Tipos de gasto': {
    columns: ['Tipo', 'Cuenta contable', 'Tope diario', 'Requiere IVA', 'Estado'],
    rows: [
      ['Combustible',          '519535', '$600.000', 'Sí',  'Activo'],
      ['Peajes',               '519540', '$150.000', 'No',  'Activo'],
      ['Alimentación',         '519545', '$250.000', 'No',  'Activo'],
      ['Mantenimiento vehículo','519550', '$500.000', 'Sí', 'Activo'],
      ['Parqueadero',          '519555', '$50.000',  'Sí',  'Activo'],
    ],
  },
  'Tipos de retención': {
    columns: ['Tipo', 'Base mínima', 'Porcentaje', 'Cuenta contable', 'Estado'],
    rows: [
      ['Reteica',    '$0',          '0,69%', '233505', 'Activo'],
      ['Retefuente', '$1.062.000',  '2,5%',  '233595', 'Activo'],
      ['Reteiva',    '$0',          '15%',   '233605', 'Activo'],
      ['Estampilla', '$0',          '1%',    '233705', 'Activo'],
    ],
  },
  'Empleados': {
    columns: ['Nombre', 'Cédula', 'Cargo', 'Sede', 'Estado'],
    rows: [
      ['Carlos Pérez',   '1.037.567.890', 'Conductor', 'Donmatías', 'Activo'],
      ['Andrés Ríos',    '1.017.234.567', 'Auxiliar',  'Donmatías', 'Activo'],
      ['Laura Gómez',    '1.040.890.123', 'Conductora','Caucasia',  'Activo'],
      ['Jorge Martínez', '1.020.456.789', 'Conductor', 'Apartadó',  'Activo'],
      ['Diana López',    '1.035.678.901', 'Auxiliar',  'Quibdó',    'Activo'],
    ],
  },
  'Aliados': {
    columns: ['Aliado', 'NIT', 'Cuenta bancaria', 'Banco', 'Estado'],
    rows: [
      ['Alpina',   '860.025.900-2', '04578901234', 'Bancolombia',    'Activo'],
      ['Cárnicos', '890.900.123-4', '01234567890', 'Davivienda',     'Activo'],
      ['Nutresa',  '890.900.456-7', '08845678901', 'BBVA',           'Activo'],
      ['Meals',    '900.123.789-0', '04590123456', 'Bancolombia',    'Activo'],
      ['Familia',  '890.900.321-6', '01267890123', 'Banco de Bogotá','Activo'],
    ],
  },
  'Cuentas contables': {
    columns: ['Cuenta', 'Nombre', 'Tipo', 'Uso', 'Estado'],
    rows: [
      ['110505', 'Caja general',          'Activo',  'Efectivo sede',     'Activa'],
      ['111005', 'Bancos nacionales',     'Activo',  'Consignaciones',    'Activa'],
      ['130505', 'Clientes nacionales',   'Activo',  'Créditos',          'Activa'],
      ['233595', 'Retenciones y aportes', 'Pasivo',  'Retenciones',       'Activa'],
      ['413536', 'Ingresos distribución', 'Ingreso', 'Ventas contado',    'Activa'],
      ['519530', 'Gastos distribución',   'Gasto',   'Gastos ruta',       'Activa'],
      ['421040', 'Aprovechamientos',      'Ingreso', 'Sobrantes efectivo','Activa'],
    ],
  },
};

// ─── Mock Vehículos ───────────────────────────────────────────────────────────

interface Vehiculo {
  placa: string;
  tipo: string;
  sede: string;
  estado: 'Activo' | 'Inactivo';
}

const mockVehiculos: Vehiculo[] = [
  { placa: 'NTB-432', tipo: 'Camión', sede: 'Donmatías', estado: 'Activo'   },
  { placa: 'OPQ-871', tipo: 'Furgón', sede: 'Donmatías', estado: 'Activo'   },
  { placa: 'KLM-234', tipo: 'Furgón', sede: 'Caucasia',  estado: 'Activo'   },
  { placa: 'RST-567', tipo: 'Moto',   sede: 'Quibdó',    estado: 'Activo'   },
  { placa: 'ABC-123', tipo: 'Camión', sede: 'Apartadó',  estado: 'Inactivo' },
];

// ─── Mock Parámetros del Sistema ──────────────────────────────────────────────

interface ParamSistema {
  clave: string;
  descripcion: string;
  valor: string;
}

const mockParamsSistema: ParamSistema[] = [
  { clave: 'Días de margen hacia atrás',       descripcion: 'Días antes de la planilla para buscar consignaciones',                   valor: '0'     },
  { clave: 'Días de margen hacia adelante',    descripcion: 'Días después de la planilla para buscar consignaciones',                 valor: '3'     },
  { clave: 'Timeout de sesión (minutos)',       descripcion: 'Minutos de inactividad para cerrar sesión y liberar bloqueos',           valor: '30'    },
  { clave: 'Hora de sincronización automática',descripcion: 'Hora diaria de sincronización con SharePoint',                           valor: '07:00' },
  { clave: 'Máximo días sin aprobar',          descripcion: 'Días cerrados sin aprobación antes de bloquear a la auxiliar',           valor: '2'     },
];

// ─── Componente ───────────────────────────────────────────────────────────────

const Parametrizacion = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Estado modal Parámetros del Sistema
  const [params, setParams] = useState<ParamSistema[]>(mockParamsSistema);
  const [editingParam, setEditingParam] = useState<ParamSistema | null>(null);
  const [editValue, setEditValue] = useState('');

  const openEdit = (p: ParamSistema) => {
    setEditingParam(p);
    setEditValue(p.valor);
  };
  const saveEdit = () => {
    if (!editingParam) return;
    setParams(prev => prev.map(p => p.clave === editingParam.clave ? { ...p, valor: editValue } : p));
    setEditingParam(null);
  };

  const currentTab = paramTabs[activeTab];
  const data = mockData[currentTab];

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Parametrización</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto border-b border-border">
        {paramTabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === i
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── PESTAÑA: Vehículos ── */}
      {currentTab === 'Vehículos' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
              <Plus className="h-4 w-4" /> Agregar vehículo
            </button>
          </div>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/70">
                  {['Placa', 'Tipo', 'Sede', 'Estado', 'Acciones'].map(col => (
                    <th key={col} className={`text-left px-4 py-3 font-medium text-muted-foreground ${col === 'Acciones' ? 'text-right' : ''}`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockVehiculos.map((v, i) => (
                  <tr key={i} className="border-t border-border table-row-alt">
                    <td className="px-4 py-2.5 font-mono font-medium">{v.placa}</td>
                    <td className="px-4 py-2.5">{v.tipo}</td>
                    <td className="px-4 py-2.5">{v.sede}</td>
                    <td className="px-4 py-2.5">
                      <span className={v.estado === 'Activo' ? 'badge-success' : 'badge-neutral'}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-primary hover:bg-accent rounded p-1.5" title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded p-1.5" title="Desactivar">
                          <Ban className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PESTAÑA: Parámetros del Sistema ── */}
      {currentTab === 'Parámetros del Sistema' && (
        <div>
          <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
            Solo visible y editable para el rol <span className="font-semibold text-foreground">Admin</span>
          </p>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/70">
                  {['Parámetro', 'Descripción', 'Valor actual', 'Acciones'].map(col => (
                    <th key={col} className={`text-left px-4 py-3 font-medium text-muted-foreground ${col === 'Acciones' ? 'text-right' : ''}`}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {params.map((p, i) => (
                  <tr key={i} className="border-t border-border table-row-alt">
                    <td className="px-4 py-2.5 font-medium text-foreground">{p.clave}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.descripcion}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono font-semibold text-primary">{p.valor}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-primary hover:bg-accent rounded p-1.5"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PESTAÑAS ESTÁNDAR (tabla genérica) ── */}
      {data && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
              <Plus className="h-4 w-4" /> Agregar
            </button>
          </div>
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/70">
                  {data.columns.map(col => (
                    <th key={col} className="text-left px-4 py-3 font-medium text-muted-foreground">{col}</th>
                  ))}
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className="border-t border-border table-row-alt">
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-2.5">
                        {j === row.length - 1 ? (
                          <span className={cell === 'Activo' || cell === 'Activa' ? 'badge-success' : 'badge-neutral'}>{cell}</span>
                        ) : cell}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-primary hover:bg-accent rounded p-1.5" title="Editar">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded p-1.5" title="Desactivar">
                          <Ban className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL Editar Parámetro del Sistema ── */}
      {editingParam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Editar parámetro</h3>
              <button onClick={() => setEditingParam(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm font-medium text-foreground mb-1">{editingParam.clave}</p>
            <p className="text-xs text-muted-foreground mb-4">{editingParam.descripcion}</p>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-5"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingParam(null)}
                className="px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveEdit}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Save className="h-3.5 w-3.5" /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parametrizacion;

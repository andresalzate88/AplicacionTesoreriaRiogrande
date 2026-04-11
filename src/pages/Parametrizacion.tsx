import { useState } from 'react';
import { Plus, Edit2, Ban } from 'lucide-react';

const paramTabs = ['Sedes y operaciones', 'Bancos', 'Tipos de gasto', 'Tipos de retención', 'Empleados', 'Aliados', 'Cuentas contables'];

const mockData: Record<string, { columns: string[]; rows: string[][] }> = {
  'Sedes y operaciones': {
    columns: ['Sede', 'Código', 'Operaciones', 'Estado'],
    rows: [
      ['Donmatías', 'DMA', 'Alpina, Cárnicos', 'Activa'],
      ['Medellín', 'MDE', 'Alpina, Nutresa, Meals', 'Activa'],
      ['Rionegro', 'RNG', 'Alpina, Familia', 'Activa'],
      ['Santa Rosa', 'SRS', 'Cárnicos', 'Activa'],
    ],
  },
  'Bancos': {
    columns: ['Banco', 'Código', 'Cuenta', 'Tipo', 'Estado'],
    rows: [
      ['Bancolombia', 'BCOL', '04512345678', 'Ahorros', 'Activo'],
      ['Davivienda', 'DAVI', '01298765432', 'Corriente', 'Activo'],
      ['BBVA', 'BBVA', '08834567890', 'Ahorros', 'Activo'],
      ['Banco de Bogotá', 'BBOG', '03145678901', 'Corriente', 'Inactivo'],
    ],
  },
  'Tipos de gasto': {
    columns: ['Tipo', 'Cuenta contable', 'Tope diario', 'Requiere IVA', 'Estado'],
    rows: [
      ['Combustible', '519535', '$600.000', 'Sí', 'Activo'],
      ['Peajes', '519540', '$150.000', 'No', 'Activo'],
      ['Alimentación', '519545', '$250.000', 'No', 'Activo'],
      ['Mantenimiento vehículo', '519550', '$500.000', 'Sí', 'Activo'],
      ['Parqueadero', '519555', '$50.000', 'Sí', 'Activo'],
    ],
  },
  'Tipos de retención': {
    columns: ['Tipo', 'Base mínima', 'Porcentaje', 'Cuenta contable', 'Estado'],
    rows: [
      ['Reteica', '$0', '0,69%', '233505', 'Activo'],
      ['Retefuente', '$1.062.000', '2,5%', '233595', 'Activo'],
      ['Reteiva', '$0', '15%', '233605', 'Activo'],
      ['Estampilla', '$0', '1%', '233705', 'Activo'],
    ],
  },
  'Empleados': {
    columns: ['Nombre', 'Cédula', 'Cargo', 'Sede', 'Estado'],
    rows: [
      ['Carlos Pérez', '1.037.567.890', 'Conductor', 'Donmatías', 'Activo'],
      ['Andrés Ríos', '1.017.234.567', 'Auxiliar', 'Donmatías', 'Activo'],
      ['Laura Gómez', '1.040.890.123', 'Conductora', 'Medellín', 'Activo'],
      ['Jorge Martínez', '1.020.456.789', 'Conductor', 'Rionegro', 'Activo'],
      ['Diana López', '1.035.678.901', 'Auxiliar', 'Santa Rosa', 'Activo'],
    ],
  },
  'Aliados': {
    columns: ['Aliado', 'NIT', 'Cuenta bancaria', 'Banco', 'Estado'],
    rows: [
      ['Alpina', '860.025.900-2', '04578901234', 'Bancolombia', 'Activo'],
      ['Cárnicos', '890.900.123-4', '01234567890', 'Davivienda', 'Activo'],
      ['Nutresa', '890.900.456-7', '08845678901', 'BBVA', 'Activo'],
      ['Meals', '900.123.789-0', '04590123456', 'Bancolombia', 'Activo'],
      ['Familia', '890.900.321-6', '01267890123', 'Banco de Bogotá', 'Activo'],
    ],
  },
  'Cuentas contables': {
    columns: ['Cuenta', 'Nombre', 'Tipo', 'Uso', 'Estado'],
    rows: [
      ['110505', 'Caja general', 'Activo', 'Efectivo sede', 'Activa'],
      ['111005', 'Bancos nacionales', 'Activo', 'Consignaciones', 'Activa'],
      ['130505', 'Clientes nacionales', 'Activo', 'Créditos', 'Activa'],
      ['233595', 'Retenciones y aportes', 'Pasivo', 'Retenciones', 'Activa'],
      ['413536', 'Ingresos distribución', 'Ingreso', 'Ventas contado', 'Activa'],
      ['519530', 'Gastos distribución', 'Gasto', 'Gastos ruta', 'Activa'],
      ['421040', 'Aprovechamientos', 'Ingreso', 'Sobrantes efectivo', 'Activa'],
    ],
  },
};

const Parametrizacion = () => {
  const [activeTab, setActiveTab] = useState(0);
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

      {/* Add button */}
      <div className="flex justify-end mb-4">
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
          <Plus className="h-4 w-4" /> Agregar
        </button>
      </div>

      {/* Table */}
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
                  <td key={j} className={`px-4 py-2.5 ${
                    j === row.length - 1 ? (cell === 'Activo' || cell === 'Activa' ? 'text-success' : 'text-muted-foreground') : ''
                  }`}>
                    {(j === row.length - 1) ? (
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
  );
};

export default Parametrizacion;

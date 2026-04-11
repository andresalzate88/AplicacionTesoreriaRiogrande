import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import { sedes } from '@/data/mockData';
import { Download, Filter } from 'lucide-react';

const tabs = [
  'Estado de planillas',
  'Estado del día',
  'Detalle del día',
  'Planillas pendientes',
  'Saldos de efectivo',
  'Plano contable Odoo',
  'Cuadres anulados',
];

const Informes = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="p-8 animate-fade-in">
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

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
          {sedes.map(s => <option key={s}>{s}</option>)}
        </select>
        <input type="text" placeholder="Desde" defaultValue="01/04/2026" className="border border-input rounded-md px-3 py-2 text-sm bg-background w-32" />
        <input type="text" placeholder="Hasta" defaultValue="11/04/2026" className="border border-input rounded-md px-3 py-2 text-sm bg-background w-32" />
        <select className="border border-input rounded-md px-3 py-2 text-sm bg-background">
          <option>Todos los estados</option>
          <option>Aprobado</option>
          <option>Pendiente</option>
          <option>Devuelto</option>
        </select>
      </div>

      {/* Content */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {activeTab === 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                {['Sede', 'N° Planilla', 'Fecha', 'Operación', 'Estado ERP', 'Valor', 'Estado', 'Cuadre'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Donmatías', 'DA-32926', '11/04/2026', 'Alpina', 'CERRADA', 16973289, 'Cuadrada', 'DMA-110426.01'],
                ['Donmatías', 'DC-32641', '11/04/2026', 'Cárnicos', 'CERRADA', 5589617, 'Cuadrada', 'DMA-110426.02'],
                ['Donmatías', 'DA-32937', '10/04/2026', 'Alpina', 'CERRADA', 104157, 'Aprobada', 'DMA-100426.01'],
                ['Donmatías', 'DC-32918', '10/04/2026', 'Cárnicos', 'CERRADA', 46245, 'Aprobada', 'DMA-100426.01'],
                ['Medellín', 'DA-33001', '11/04/2026', 'Alpina', 'CERRADA', 8234500, 'Pendiente', '—'],
                ['Rionegro', 'DA-33010', '11/04/2026', 'Alpina', 'ABIERTA', 1250000, 'No disponible', '—'],
              ].map((row, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  {row.map((cell, j) => (
                    <td key={j} className={`px-4 py-2.5 ${j === 5 ? 'font-mono text-right' : ''}`}>
                      {j === 5 ? formatCurrency(cell as number) :
                       j === 6 ? <span className={
                        cell === 'Cuadrada' ? 'badge-info' : cell === 'Aprobada' ? 'badge-neutral' : cell === 'Pendiente' ? 'badge-warning' : 'badge-neutral'
                       }>{cell as string}</span> : cell as string}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {activeTab === 1 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                {['Fecha', 'Estado', 'Saldo inicial', 'Ingresos efectivo', 'Egresos efectivo', 'Saldo final'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['11/04/2026', 'Aprobado', 14500000, 1932922, 3000000, 13432922],
                ['10/04/2026', 'Aprobado', 14200000, 850000, 550000, 14500000],
                ['09/04/2026', 'Aprobado', 13800000, 1200000, 800000, 14200000],
                ['08/04/2026', 'Aprobado', 14100000, 600000, 900000, 13800000],
                ['07/04/2026', 'Aprobado', 13500000, 1400000, 800000, 14100000],
              ].map((row, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5">{row[0] as string}</td>
                  <td className="px-4 py-2.5"><span className="badge-success">{row[1] as string}</span></td>
                  <td className="px-4 py-2.5 font-mono text-right">{formatCurrency(row[2] as number)}</td>
                  <td className="px-4 py-2.5 font-mono text-right text-success">{formatCurrency(row[3] as number)}</td>
                  <td className="px-4 py-2.5 font-mono text-right text-destructive">{formatCurrency(row[4] as number)}</td>
                  <td className="px-4 py-2.5 font-mono text-right font-bold">{formatCurrency(row[5] as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {activeTab === 2 && (
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Seleccione una fecha</p>
            <p className="text-sm">Use el filtro de fecha para ver el desglose completo del día</p>
          </div>
        )}
        {activeTab === 3 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                {['N° Planilla', 'Sede', 'Operación', 'Fecha', 'Días pendiente', 'Valor', 'Estado'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['DA-32850', 'Medellín', 'Alpina', '06/04/2026', 5, 3450000, 'Pendiente'],
                ['DC-32790', 'Rionegro', 'Cárnicos', '05/04/2026', 6, 1230000, 'Pendiente'],
                ['DA-32810', 'Santa Rosa', 'Alpina', '04/04/2026', 7, 890000, 'Pendiente'],
              ].map((row, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono">{row[0] as string}</td>
                  <td className="px-4 py-2.5">{row[1] as string}</td>
                  <td className="px-4 py-2.5">{row[2] as string}</td>
                  <td className="px-4 py-2.5">{row[3] as string}</td>
                  <td className="px-4 py-2.5"><span className="badge-error">{row[4]} días</span></td>
                  <td className="px-4 py-2.5 font-mono text-right">{formatCurrency(row[5] as number)}</td>
                  <td className="px-4 py-2.5"><span className="badge-warning">{row[6] as string}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {activeTab === 4 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                {['Fecha', 'Sede', 'Saldo inicial', 'Movimientos', 'Saldo final'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['11/04/2026', 'Donmatías', 14500000, -1067078, 13432922],
                ['11/04/2026', 'Medellín', 8200000, 450000, 8650000],
                ['11/04/2026', 'Rionegro', 3100000, -200000, 2900000],
                ['11/04/2026', 'Santa Rosa', 5400000, 180000, 5580000],
              ].map((row, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5">{row[0] as string}</td>
                  <td className="px-4 py-2.5 font-medium">{row[1] as string}</td>
                  <td className="px-4 py-2.5 font-mono text-right">{formatCurrency(row[2] as number)}</td>
                  <td className={`px-4 py-2.5 font-mono text-right ${(row[3] as number) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {(row[3] as number) >= 0 ? '+' : ''}{formatCurrency(row[3] as number)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-right font-bold">{formatCurrency(row[4] as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {activeTab === 5 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                {['Cuenta', 'Nombre cuenta', 'Débito', 'Crédito', 'Tercero', 'Referencia'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['110505', 'Caja general', 1113305, 0, 'Donmatías', 'DMA-110426'],
                ['130505', 'Clientes nacionales', 5070000, 0, 'Varios', 'DMA-110426'],
                ['413536', 'Ingresos distribución', 0, 22562905, 'Varios', 'DMA-110426'],
                ['111005', 'Bancos nacionales', 15574400, 0, 'Bancolombia', 'CON-001145'],
                ['233595', 'Retenciones', 0, 55625, 'Varios', 'DMA-110426'],
                ['519530', 'Gastos de ruta', 935000, 0, 'Varios', 'DMA-110426'],
              ].map((row, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono">{row[0] as string}</td>
                  <td className="px-4 py-2.5">{row[1] as string}</td>
                  <td className="px-4 py-2.5 font-mono text-right">{(row[2] as number) > 0 ? formatCurrency(row[2] as number) : '—'}</td>
                  <td className="px-4 py-2.5 font-mono text-right">{(row[3] as number) > 0 ? formatCurrency(row[3] as number) : '—'}</td>
                  <td className="px-4 py-2.5">{row[4] as string}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{row[5] as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {activeTab === 6 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                {['N° Cuadre', 'Fecha anulación', 'Planillas', 'Motivo', 'Anulado por'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['DMA-080426.02', '09/04/2026', 'DA-32810', 'Error en consignación — monto duplicado', 'María González'],
                ['DMA-050426.01', '06/04/2026', 'DC-32750', 'Planilla con facturas incorrectas', 'Juan Ramírez'],
              ].map((row, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5 font-mono text-primary">{row[0]}</td>
                  <td className="px-4 py-2.5">{row[1]}</td>
                  <td className="px-4 py-2.5 font-mono">{row[2]}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{row[3]}</td>
                  <td className="px-4 py-2.5">{row[4]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Informes;

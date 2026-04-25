import { useState } from 'react';
import { checklistItems } from '@/data/mockData';
import { formatCurrency } from '@/lib/format';
import { CheckSquare, AlertTriangle, Send } from 'lucide-react';

const cuadresMock = [
  { num: 'DMA-110426.01', planillas: 'DA-32926 / DA-32937', ventasCO: 22562905, ventasCR: 5070000, gastos: 935000, consigRio: 15574400, consigAli: 4800000, anticipos: 140000, hurtos: 0, efectivo: 1113305, difEfectivo: 500 },
  { num: 'DMA-110426.02', planillas: 'DC-32641', ventasCO: 5589617, ventasCR: 0, gastos: 320000, consigRio: 3200000, consigAli: 1200000, anticipos: 50000, hurtos: 0, efectivo: 819617, difEfectivo: 0 },
];

const estados = ['', 'Pendiente', 'OK', 'Con observación', 'Faltante', 'No aplica'];

const Revision = () => {
  const [checklist, setChecklist] = useState(checklistItems.map(c => ({ ...c })));
  const [showApprove, setShowApprove] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [returnNote, setReturnNote] = useState('');

  const allDefined = checklist.every(c => c.estado !== '');

  const updateItem = (id: number, field: 'estado' | 'nota', value: string) => {
    setChecklist(checklist.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Revisión</h2>
          <p className="text-sm text-muted-foreground mt-1">11 de abril de 2026 — Donmatías</p>
        </div>
        <span className="badge-warning">Pendiente revisión</span>
      </div>

      {/* Read-only summary */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Resumen de cuadres del día</h3>
        <div className="bg-card rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-muted/70">
                {['N° Cuadre', 'Planillas', 'Ventas CO', 'Ventas CR', 'Gastos', 'Consig. Rio', 'Consig. Ali', 'Anticipos', 'Hurtos', 'Efectivo', 'Dif.'].map(h => (
                  <th key={h} className="text-left px-3 py-3 font-medium text-muted-foreground text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cuadresMock.map((c, i) => (
                <tr key={i} className="border-t border-border table-row-alt">
                  <td className="px-3 py-2.5 font-mono font-medium text-primary">{c.num}</td>
                  <td className="px-3 py-2.5 text-xs">{c.planillas}</td>
                  <td className="px-3 py-2.5 font-mono text-right">{formatCurrency(c.ventasCO)}</td>
                  <td className="px-3 py-2.5 font-mono text-right">{formatCurrency(c.ventasCR)}</td>
                  <td className="px-3 py-2.5 font-mono text-right">{formatCurrency(c.gastos)}</td>
                  <td className="px-3 py-2.5 font-mono text-right">{formatCurrency(c.consigRio)}</td>
                  <td className="px-3 py-2.5 font-mono text-right">{formatCurrency(c.consigAli)}</td>
                  <td className="px-3 py-2.5 font-mono text-right">{formatCurrency(c.anticipos)}</td>
                  <td className="px-3 py-2.5 font-mono text-right">{formatCurrency(c.hurtos)}</td>
                  <td className="px-3 py-2.5 font-mono text-right">{formatCurrency(c.efectivo)}</td>
                  <td className="px-3 py-2.5 font-mono text-right">
                    <span className={c.difEfectivo === 0 ? 'text-success' : 'text-warning'}>{formatCurrency(c.difEfectivo)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Checklist */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Checklist de revisión</h3>
        <div className="bg-card rounded-lg border border-border divide-y divide-border">
          {checklist.map((item) => (
            <div key={item.id} className="px-6 py-4">
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">{item.id}</span>
                <span className="flex-1 text-sm font-medium">{item.descripcion}</span>
                <select
                  value={item.estado}
                  onChange={(e) => updateItem(item.id, 'estado', e.target.value)}
                  className={`border border-input rounded-md px-3 py-1.5 text-sm bg-background min-w-[160px] ${
                    item.estado === 'OK' ? 'text-success border-success/30' :
                    item.estado === 'Faltante' ? 'text-destructive border-destructive/30' :
                    item.estado === 'Con observación' ? 'text-warning border-warning/30' : ''
                  }`}
                >
                  {estados.map(e => <option key={e} value={e}>{e || '— Seleccionar —'}</option>)}
                </select>
              </div>
              {item.estado && item.estado !== 'OK' && item.estado !== 'No aplica' && (
                <div className="mt-3 ml-12">
                  <input
                    placeholder="Agregar nota..."
                    value={item.nota}
                    onChange={(e) => updateItem(item.id, 'nota', e.target.value)}
                    className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => setShowReturn(true)}
          className="border-2 border-destructive text-destructive px-6 py-2.5 rounded-md text-sm font-medium hover:bg-destructive/5 transition-colors"
        >
          Devolver con nota
        </button>
        <button
          onClick={() => setShowApprove(true)}
          disabled={!allDefined}
          className="bg-success text-success-foreground px-8 py-2.5 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Aprobar día
        </button>
      </div>

      {/* Approve modal */}
      {showApprove && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border shadow-lg p-8 max-w-md w-full animate-fade-in text-center">
            <CheckSquare className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Aprobar día</h3>
            <p className="text-muted-foreground mb-3">El día 11/04/2026 quedará aprobado.</p>
            <p className="text-sm text-muted-foreground/80 mb-6 bg-muted/40 rounded-md px-4 py-3 border border-border">
              <Send className="h-3.5 w-3.5 inline mr-1.5 text-primary" />
              Al aprobar, las transacciones Odoo quedan listas para envío directo a Odoo vía API.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowApprove(false)} className="border border-border px-5 py-2.5 rounded-md text-sm font-medium hover:bg-muted">Cancelar</button>
              <button onClick={() => setShowApprove(false)} className="bg-success text-success-foreground px-6 py-2.5 rounded-md text-sm font-semibold hover:opacity-90">Confirmar aprobación</button>
            </div>
          </div>
        </div>
      )}

      {/* Return modal */}
      {showReturn && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border shadow-lg p-8 max-w-md w-full animate-fade-in">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2 text-center">Devolver con nota</h3>
            <textarea
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="Escribir nota obligatoria..."
              className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background mt-4 h-24 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-3 justify-center mt-6">
              <button onClick={() => setShowReturn(false)} className="border border-border px-6 py-2.5 rounded-md text-sm font-medium hover:bg-muted">Cancelar</button>
              <button
                disabled={!returnNote.trim()}
                onClick={() => setShowReturn(false)}
                className="bg-destructive text-destructive-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4 inline mr-1" /> Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Revision;

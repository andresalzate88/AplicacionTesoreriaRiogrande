import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import { Check, Paperclip, AlertTriangle } from 'lucide-react';

const cuadresMock = [
  { num: 'DMA-110426.01', planillas: 'DA-32926 / DA-32937', ventasCO: 22562905, ventasCR: 5070000, gastos: 935000, consigRio: 15574400, consigAli: 4800000, anticipos: 140000, hurtos: 0, efectivo: 1113305, difEfectivo: 500 },
  { num: 'DMA-110426.02', planillas: 'DC-32641', ventasCO: 5589617, ventasCR: 0, gastos: 320000, consigRio: 3200000, consigAli: 1200000, anticipos: 50000, hurtos: 0, efectivo: 819617, difEfectivo: 0 },
];

const soportesMock = [
  { nombre: 'Planillas liquidadas', estado: 'Adjunto' },
  { nombre: 'Comprobantes consignaciones Riogrande', estado: 'Adjunto' },
  { nombre: 'Comprobantes consignaciones aliados', estado: 'Pendiente' },
  { nombre: 'Soportes gastos de ruta', estado: 'Adjunto' },
  { nombre: 'Formato anticipos de nómina', estado: 'Pendiente' },
];

const RecaudoDiario = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [destinos, setDestinos] = useState([
    { id: '1', tipo: 'Traslado', destino: 'Caja Medellín', valor: 2000000, descripcion: 'Traslado semanal', soporte: true },
    { id: '2', tipo: 'Anticipo aliado', destino: 'Alpina', valor: 800000, descripcion: 'Anticipo entregas', soporte: false },
    { id: '3', tipo: 'Dinero cliente', destino: 'Tienda El Roble', valor: 200000, descripcion: 'Devolución cambio', soporte: true },
  ]);

  const totalEfectivoPlanillas = cuadresMock.reduce((s, c) => s + c.efectivo, 0);
  const totalDispersado = destinos.reduce((s, d) => s + d.valor, 0);

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Recaudo Diario</h2>
          <p className="text-sm text-muted-foreground mt-1">11 de abril de 2026</p>
        </div>
        <span className="badge-info">En proceso</span>
      </div>

      {/* 3.1 Resumen cuadres */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">3.1 — Resumen de cuadres del día</h3>
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
              <tr className="border-t-2 border-primary/20 bg-accent">
                <td colSpan={2} className="px-3 py-3 font-semibold">TOTALES</td>
                <td className="px-3 py-3 font-mono text-right font-bold">{formatCurrency(cuadresMock.reduce((s, c) => s + c.ventasCO, 0))}</td>
                <td className="px-3 py-3 font-mono text-right font-bold">{formatCurrency(cuadresMock.reduce((s, c) => s + c.ventasCR, 0))}</td>
                <td className="px-3 py-3 font-mono text-right font-bold">{formatCurrency(cuadresMock.reduce((s, c) => s + c.gastos, 0))}</td>
                <td className="px-3 py-3 font-mono text-right font-bold">{formatCurrency(cuadresMock.reduce((s, c) => s + c.consigRio, 0))}</td>
                <td className="px-3 py-3 font-mono text-right font-bold">{formatCurrency(cuadresMock.reduce((s, c) => s + c.consigAli, 0))}</td>
                <td className="px-3 py-3 font-mono text-right font-bold">{formatCurrency(cuadresMock.reduce((s, c) => s + c.anticipos, 0))}</td>
                <td className="px-3 py-3 font-mono text-right font-bold">{formatCurrency(cuadresMock.reduce((s, c) => s + c.hurtos, 0))}</td>
                <td className="px-3 py-3 font-mono text-right font-bold">{formatCurrency(totalEfectivoPlanillas)}</td>
                <td className="px-3 py-3 font-mono text-right font-bold">{formatCurrency(cuadresMock.reduce((s, c) => s + c.difEfectivo, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 3.2 Destinos de efectivo */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">3.2 — Destinos de efectivo</h3>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Destino</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descripción</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Soporte</th>
              </tr>
            </thead>
            <tbody>
              {destinos.map((d) => (
                <tr key={d.id} className={`border-t border-border table-row-alt ${d.tipo === 'Hurto bodega' ? 'bg-destructive/5' : ''}`}>
                  <td className="px-4 py-2.5">
                    <select defaultValue={d.tipo} className="border border-input rounded px-2 py-1 bg-background text-sm">
                      <option>Traslado</option>
                      <option>Anticipo aliado</option>
                      <option>Dinero cliente</option>
                      <option>Hurto bodega</option>
                    </select>
                    {d.tipo === 'Hurto bodega' && <span className="badge-error ml-2">Requiere autorización director</span>}
                  </td>
                  <td className="px-4 py-2.5">{d.destino}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">{formatCurrency(d.valor)}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{d.descripcion}</td>
                  <td className="px-4 py-2.5 text-center">
                    {d.soporte ? <Check className="h-4 w-4 text-success mx-auto" /> : (
                      <button className="flex items-center gap-1 text-xs text-primary mx-auto"><Paperclip className="h-3.5 w-3.5" /> Adjuntar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3.3 Saldo de efectivo */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">3.3 — Saldo de efectivo</h3>
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="space-y-4 max-w-md">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Saldo anterior:</span>
              <span className="text-lg font-mono text-muted-foreground">{formatCurrency(14500000)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-success font-medium">Efectivo de planillas:</span>
              <span className="text-lg font-mono text-success font-medium">+{formatCurrency(totalEfectivoPlanillas)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-destructive font-medium">− Efectivo dispersado:</span>
              <span className="text-lg font-mono text-destructive font-medium">−{formatCurrency(totalDispersado)}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between items-center bg-accent rounded-lg px-4 py-3">
              <span className="font-bold text-lg">Nuevo saldo:</span>
              <span className="text-2xl font-bold font-mono text-primary">{formatCurrency(14500000 + totalEfectivoPlanillas - totalDispersado)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3.4 Soportes */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">3.4 — Soportes</h3>
        <div className="bg-card rounded-lg border border-border divide-y divide-border">
          {soportesMock.map((s, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-4">
              <span className="text-sm font-medium">{s.nombre}</span>
              {s.estado === 'Adjunto' ? (
                <span className="badge-success">Adjunto ✓</span>
              ) : (
                <button className="flex items-center gap-2 text-sm text-primary hover:bg-accent px-3 py-1.5 rounded-md">
                  <Paperclip className="h-4 w-4" /> Adjuntar
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Action */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowConfirm(true)}
          className="bg-primary text-primary-foreground px-10 py-3 rounded-md text-base font-semibold hover:opacity-90 transition-opacity"
        >
          Cerrar día y enviar a revisión
        </button>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-foreground/40 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg border border-border shadow-lg p-8 max-w-md w-full animate-fade-in">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">¿Cerrar día?</h3>
              <p className="text-muted-foreground mb-6">Esta acción enviará toda la información a revisión. No podrá editarse después.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setShowConfirm(false)} className="border border-border px-6 py-2.5 rounded-md text-sm font-medium hover:bg-muted">Cancelar</button>
                <button onClick={() => setShowConfirm(false)} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:opacity-90">Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecaudoDiario;

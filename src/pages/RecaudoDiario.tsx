import { useState } from 'react';
import { formatCurrency } from '@/lib/format';
import { Check, Paperclip, AlertTriangle, Plus, Trash2, X, Upload } from 'lucide-react';

const cuadresMock = [
  { num: 'DMA-110426.01', planillas: 'DA-32926 / DA-32937', ventasCO: 22562905, ventasCR: 5070000, gastos: 935000, consigRio: 15574400, consigAli: 4800000, anticipos: 140000, hurtos: 0, efectivo: 1113305, difEfectivo: 500 },
  { num: 'DMA-110426.02', planillas: 'DC-32641', ventasCO: 5589617, ventasCR: 0, gastos: 320000, consigRio: 3200000, consigAli: 1200000, anticipos: 50000, hurtos: 0, efectivo: 819617, difEfectivo: 0 },
];

const soportesBase: { nombre: string; estado: string; descripcion?: string; icono?: any }[] = [
  { nombre: 'Planillas liquidadas', estado: 'Adjunto' },
  { nombre: 'Comprobantes consignaciones Riogrande', estado: 'Adjunto' },
  { nombre: 'Comprobantes consignaciones aliados', estado: 'Pendiente' },
  { nombre: 'Soportes gastos de ruta', estado: 'Adjunto' },
  { nombre: 'Formato anticipos de nómina', estado: 'Pendiente' },
];

type TipoDestino32 = 'Consignación a Riogrande' | 'Anticipo a Aliado' | 'Gasto' | 'Anticipo Nómina' | 'Traslado de Caja';

interface Destino32 {
  id: string;
  tipo: TipoDestino32;
  destinoNombre: string;
  detalle: string;
  valor: number;
}

const destinosInit32: Destino32[] = [
  { id: '1', tipo: 'Consignación a Riogrande', destinoNombre: 'Bancolombia Ahorros RIO', detalle: 'REF-2847361', valor: 3000000 },
  { id: '2', tipo: 'Anticipo a Aliado', destinoNombre: 'Anticipo Cárnicos DMA', detalle: 'CARN-00123', valor: 2000000 },
  { id: '3', tipo: 'Traslado de Caja', destinoNombre: 'Caja Menor DMA', detalle: '—', valor: 500000 },
];

const parametrosDestinos: Record<TipoDestino32, string[]> = {
  'Consignación a Riogrande': ['Bancolombia Ahorros RIO', 'CFA RIO'],
  'Anticipo a Aliado': ['Anticipo Alpina DMA', 'Anticipo Cárnicos DMA'],
  'Gasto': ['Peajes', 'Combustible', 'Robos'],
  'Anticipo Nómina': ['Anticipo Juan', 'Anticipo Carlos'],
  'Traslado de Caja': ['Caja menor DMA', 'TVS QBO', 'Istmina QBO', 'Prosegur CAC'],
};

const RecaudoDiario = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [destinos, setDestinos] = useState<Destino32[]>(destinosInit32);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTipo, setAddTipo] = useState<TipoDestino32 | ''>('');
  const [addDestinoNombre, setAddDestinoNombre] = useState('');
  const [addValor, setAddValor] = useState(0);
  const [addDetalle, setAddDetalle] = useState('');

  const totalEfectivoPlanillas = cuadresMock.reduce((s, c) => s + c.efectivo, 0);
  const totalDispersado = destinos.reduce((s, d) => s + d.valor, 0);

  const soportes = [...soportesBase];
  if (destinos.length > 0) {
    soportes.push({
      nombre: 'TRASLADOS DE CAJA',
      estado: 'Pendiente',
      descripcion: 'Soportes de consignaciones, gastos y traslados registrados en la sección de destinos de efectivo.',
      icono: Upload
    });
  }
  soportes.push({ nombre: 'Arqueo', estado: 'Pendiente' });

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">3.2 — Destinos de efectivo</h3>
          <button
            onClick={() => { setShowAddModal(true); setAddTipo(''); setAddDestinoNombre(''); setAddValor(0); setAddDetalle(''); }}
            className="flex items-center gap-2 text-sm bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-md transition-opacity shadow-sm"
          >
            <Plus className="h-4 w-4" /> Agregar Destino
          </button>
        </div>

        {showAddModal && (
          <div className="bg-card rounded-lg border border-border p-5 mb-5 shadow-sm animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-foreground">Nuevo Destino de Efectivo</h4>
              <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">PASO 1 — TIPO DE DESTINO</label>
                  <select
                    value={addTipo}
                    onChange={(e) => { setAddTipo(e.target.value as TipoDestino32); setAddDestinoNombre(''); }}
                    className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Seleccione...</option>
                    <option value="Consignación a Riogrande">Consignación a Riogrande</option>
                    <option value="Anticipo a Aliado">Anticipo a Aliado</option>
                    <option value="Gasto">Gasto</option>
                    <option value="Anticipo Nómina">Anticipo Nómina</option>
                    <option value="Traslado de Caja">Traslado de Caja</option>
                  </select>
                </div>

                {addTipo && (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">PASO 2 — DESTINO</label>
                    <select value={addDestinoNombre} onChange={e => setAddDestinoNombre(e.target.value)} className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="">Seleccione...</option>
                      {parametrosDestinos[addTipo].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {addTipo === 'Traslado de Caja' && (
                      <p className="text-xs text-muted-foreground mt-1">Solo se muestran traslados parametrizados para tu sede (DMA)</p>
                    )}
                  </div>
                )}
              </div>

              {addTipo === 'Gasto' && addDestinoNombre && (
                <div className="grid grid-cols-3 gap-3 p-4 bg-muted/30 rounded-md border border-border animate-fade-in">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Proveedor</label>
                    <div className="flex gap-1">
                      <input placeholder="Buscar..." className="w-full border border-input rounded px-2 py-1 bg-background text-sm" />
                      <button className="bg-primary text-primary-foreground px-2 rounded shrink-0"><Plus className="h-3 w-3" /></button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">N° Factura</label>
                    <input placeholder="OPCIONAL" className="w-full border border-input rounded px-2 py-1 bg-background text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Cuenta analítica</label>
                    <select className="w-full border border-input rounded px-2 py-1 bg-background text-sm">
                      <option>DMA-Alpina 100%</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Tarifa IVA</label>
                    <select className="w-full border border-input rounded px-2 py-1 bg-background text-sm"><option>0%</option><option>5%</option><option>19%</option></select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Retención</label>
                    <select className="w-full border border-input rounded px-2 py-1 bg-background text-sm"><option>— Sin retención</option></select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Valor base</label>
                    <input type="number" onChange={e => setAddValor(Number(e.target.value))} className="w-full border border-input rounded px-2 py-1 bg-background text-sm" />
                  </div>
                </div>
              )}

              {addTipo === 'Anticipo Nómina' && addDestinoNombre && (
                <div className="grid grid-cols-3 gap-3 p-4 bg-muted/30 rounded-md border border-border animate-fade-in">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Empleado</label>
                    <select className="w-full border border-input rounded px-2 py-1 bg-background text-sm"><option>Juan García</option></select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Concepto</label>
                    <select className="w-full border border-input rounded px-2 py-1 bg-background text-sm"><option>ANT_NOMINA</option><option>PASAJE</option><option>HURTO_RUTA</option></select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Cuenta analítica</label>
                    <select className="w-full border border-input rounded px-2 py-1 bg-background text-sm"><option>DMA-Alpina 100%</option></select>
                  </div>
                </div>
              )}

              {addTipo && addDestinoNombre && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in pt-2">
                  {(addTipo !== 'Gasto') && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">PASO 3 — VALOR</label>
                      <input
                        type="text"
                        value={addValor === 0 ? '' : formatCurrency(addValor)}
                        onChange={(e) => setAddValor(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
                        placeholder="$0"
                        className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono text-lg"
                      />
                    </div>
                  )}
                  {['Consignación a Riogrande', 'Traslado de Caja', 'Anticipo a Aliado'].includes(addTipo) && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Detalle / Referencia (Opcional)</label>
                      <input
                        type="text"
                        value={addDetalle}
                        onChange={(e) => setAddDetalle(e.target.value)}
                        placeholder="..."
                        className="w-full border border-input rounded-md px-3 py-2 bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  disabled={!addTipo || !addDestinoNombre || addValor <= 0}
                  onClick={() => {
                    setDestinos([...destinos, { id: String(Date.now()), tipo: addTipo as TipoDestino32, destinoNombre: addDestinoNombre, detalle: addDetalle || '—', valor: addValor }]);
                    setShowAddModal(false);
                  }}
                  className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  Guardar Destino
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Destino</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Detalle</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground w-16">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {destinos.map((d) => (
                <tr key={d.id} className="border-t border-border table-row-alt hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5">{d.tipo}</td>
                  <td className="px-4 py-2.5 font-medium">{d.destinoNombre}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{d.detalle}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">{formatCurrency(d.valor)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => setDestinos(destinos.filter(x => x.id !== d.id))}
                      className="text-destructive hover:bg-destructive/10 rounded p-1.5 transition-colors inline-block"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {destinos.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No hay destinos registrados.</td></tr>
              )}
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
        <h3 className="text-lg font-semibold text-foreground mb-4">3.4 — Soportes del día</h3>
        <div className="bg-card rounded-lg border border-border divide-y divide-border">
          {soportes.map((s, i) => {
            const Icon = s.icono;
            return (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <div className="flex gap-4 items-center">
                  {Icon && <div className="bg-primary/10 p-2 rounded-md"><Icon className="h-5 w-5 text-primary" /></div>}
                  <div>
                    <span className="text-sm font-medium block">{s.nombre}</span>
                    {s.descripcion && <span className="text-xs text-muted-foreground mt-0.5 block max-w-lg">{s.descripcion}</span>}
                  </div>
                </div>
                {s.estado === 'Adjunto' ? (
                  <span className="badge-success whitespace-nowrap">Adjunto ✓</span>
                ) : (
                  <button className="flex items-center gap-2 text-sm text-primary hover:bg-accent px-3 py-1.5 rounded-md whitespace-nowrap shrink-0">
                    <Paperclip className="h-4 w-4" /> Adjuntar
                  </button>
                )}
              </div>
            );
          })}
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

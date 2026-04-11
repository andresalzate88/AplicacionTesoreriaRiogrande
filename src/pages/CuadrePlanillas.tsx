import { useState } from 'react';
import { facturasMock, gastosMock, consignacionesRiograndeMock, consignacionesAliadosMock, anticiposMock, planillasMock, aliados, bancos, empleados, tiposGasto, tiposRetencion } from '@/data/mockData';
import { formatCurrency } from '@/lib/format';
import { useAppStore } from '@/store/appStore';
import { Plus, Trash2, AlertTriangle, Check, Paperclip, ChevronRight } from 'lucide-react';

const steps = ['Facturas', 'Gastos ruta', 'Consig. Riogrande', 'Consig. Aliados', 'Efectivo', 'Anticipos', 'Resumen'];

const CuadrePlanillas = () => {
  const { selectedPlanillas, setCurrentPage } = useAppStore();
  const [currentStep] = useState(6);
  const [efectivoReal, setEfectivoReal] = useState(1113305);
  const [gastos, setGastos] = useState(gastosMock);
  const [consigRio, setConsigRio] = useState(consignacionesRiograndeMock);
  const [consigAli, setConsigAli] = useState(consignacionesAliadosMock);
  const [anticipos, setAnticipos] = useState(anticiposMock);
  const [showConfirm, setShowConfirm] = useState(false);
  const [retencionRow, setRetencionRow] = useState<string | null>(null);

  const selectedNums = planillasMock
    .filter(p => selectedPlanillas.includes(p.id))
    .map(p => p.numero);

  const totalContado = facturasMock.filter(f => f.crco === 'CONTADO').reduce((s, f) => s + f.totalCuadrar, 0);
  const totalGastos = gastos.reduce((s, g) => s + g.total, 0);
  const totalConsigRio = consigRio.reduce((s, c) => s + c.valor, 0);
  const totalConsigAli = consigAli.reduce((s, c) => s + c.valor, 0);
  const totalAnticipos = anticipos.reduce((s, a) => s + a.valor, 0);
  const efectivoTeorico = totalContado - totalGastos - totalConsigRio - totalConsigAli - totalAnticipos;
  const diferencia = efectivoReal - efectivoTeorico;
  const aprovechamientos = diferencia > 0 ? diferencia : 0;
  const diferenciaFinal = totalContado - totalGastos - totalConsigRio - totalConsigAli - totalAnticipos - efectivoReal + aprovechamientos;

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

      {/* 2.1 Facturas */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">2.1 — Detalle de facturas y notas</h3>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Planilla</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Factura</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">CR/CO</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor base</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor neto</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Desc. cond.</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Retenciones</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total a cuadrar</th>
              </tr>
            </thead>
            <tbody>
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
                  <td className={`px-4 py-2.5 text-right font-mono font-medium ${f.crco === 'CRÉDITO' ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {f.crco === 'CRÉDITO' ? '$0' : formatCurrency(f.totalCuadrar)}
                  </td>
                </tr>
              ))}
              {/* Totals */}
              <tr className="border-t-2 border-primary/20 bg-accent">
                <td colSpan={3} className="px-4 py-3 font-semibold">TOTALES</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(facturasMock.reduce((s, f) => s + f.valorBase, 0))}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(facturasMock.reduce((s, f) => s + f.valorNeto, 0))}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(facturasMock.reduce((s, f) => s + f.descCondicionado, 0))}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold">{formatCurrency(facturasMock.reduce((s, f) => s + f.retenciones, 0))}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-foreground">{formatCurrency(totalContado)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2.2 Gastos de ruta */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">2.2 — Gastos de ruta</h3>
          <button onClick={() => setGastos([...gastos, { id: String(Date.now()), nit: '', nombre: '', tipoGasto: tiposGasto[0], valorBase: 0, iva: 0, total: 0, superaTope: false, justificacion: '' }])}
            className="flex items-center gap-2 text-sm text-primary hover:bg-accent px-3 py-1.5 rounded-md">
            <Plus className="h-4 w-4" /> Agregar gasto
          </button>
        </div>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">NIT</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor base</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">IVA</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((g, i) => (
                <tr key={g.id} className={`border-t border-border table-row-alt ${g.superaTope ? 'bg-warning/10' : ''}`}>
                  <td className="px-4 py-2.5"><input defaultValue={g.nit} className="border border-input rounded px-2 py-1 w-28 bg-background text-sm" /></td>
                  <td className="px-4 py-2.5"><input defaultValue={g.nombre} className="border border-input rounded px-2 py-1 w-full bg-background text-sm" /></td>
                  <td className="px-4 py-2.5">
                    <select defaultValue={g.tipoGasto} className="border border-input rounded px-2 py-1 bg-background text-sm">
                      {tiposGasto.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(g.valorBase)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(g.iva)}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">
                    {g.superaTope && <AlertTriangle className="h-3.5 w-3.5 text-warning inline mr-1" />}
                    {formatCurrency(g.total)}
                  </td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => setGastos(gastos.filter((_, j) => j !== i))} className="text-destructive hover:bg-destructive/10 rounded p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {gastos.some(g => g.superaTope) && (
                <tr className="border-t border-warning/30 bg-warning/5">
                  <td colSpan={7} className="px-4 py-2.5">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span className="text-foreground font-medium">Gasto supera tope — justificación requerida:</span>
                      <input placeholder="Escribir justificación..." className="flex-1 border border-warning/50 rounded px-2 py-1 bg-background text-sm" />
                    </div>
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-primary/20 bg-accent">
                <td colSpan={5} className="px-4 py-3 font-semibold">TOTAL GASTOS</td>
                <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(totalGastos)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2.3 Consignaciones Riogrande */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">2.3 — Consignaciones a Riogrande</h3>
          <button onClick={() => setConsigRio([...consigRio, { id: String(Date.now()), fecha: '11/04/2026', banco: bancos[0], referencia: '', valor: 0, soporte: false }])}
            className="flex items-center gap-2 text-sm text-primary hover:bg-accent px-3 py-1.5 rounded-md">
            <Plus className="h-4 w-4" /> Agregar consignación
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
              </tr>
            </thead>
            <tbody>
              {consigRio.map((c) => (
                <tr key={c.id} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5">{c.fecha}</td>
                  <td className="px-4 py-2.5">
                    <select defaultValue={c.banco} className="border border-input rounded px-2 py-1 bg-background text-sm">
                      {bancos.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 font-mono">{c.referencia}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">{formatCurrency(c.valor)}</td>
                  <td className="px-4 py-2.5 text-center">
                    {c.soporte ? <Check className="h-4 w-4 text-success mx-auto" /> : (
                      <button className="flex items-center gap-1 text-xs text-primary mx-auto"><Paperclip className="h-3.5 w-3.5" /> Adjuntar</button>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-primary/20 bg-accent">
                <td colSpan={3} className="px-4 py-3 font-semibold">TOTAL</td>
                <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(totalConsigRio)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2.4 Consignaciones Aliados */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">2.4 — Consignaciones a Aliados</h3>
          <button onClick={() => setConsigAli([...consigAli, { id: String(Date.now()), fecha: '11/04/2026', banco: bancos[0], referencia: '', valor: 0, soporte: false, aliado: aliados[0] }])}
            className="flex items-center gap-2 text-sm text-primary hover:bg-accent px-3 py-1.5 rounded-md">
            <Plus className="h-4 w-4" /> Agregar consignación
          </button>
        </div>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Aliado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Banco</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Referencia</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Soporte</th>
              </tr>
            </thead>
            <tbody>
              {consigAli.map((c) => (
                <tr key={c.id} className="border-t border-border table-row-alt">
                  <td className="px-4 py-2.5">
                    <select defaultValue={c.aliado} className="border border-input rounded px-2 py-1 bg-background text-sm">
                      {aliados.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">{c.fecha}</td>
                  <td className="px-4 py-2.5">
                    <select defaultValue={c.banco} className="border border-input rounded px-2 py-1 bg-background text-sm">
                      {bancos.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 font-mono">{c.referencia}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">{formatCurrency(c.valor)}</td>
                  <td className="px-4 py-2.5 text-center">
                    {c.soporte ? <Check className="h-4 w-4 text-success mx-auto" /> : (
                      <button className="flex items-center gap-1 text-xs text-primary mx-auto"><Paperclip className="h-3.5 w-3.5" /> Adjuntar</button>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-primary/20 bg-accent">
                <td colSpan={4} className="px-4 py-3 font-semibold">TOTAL</td>
                <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(totalConsigAli)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2.5 Conteo de efectivo */}
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
                diferencia > 0 ? 'text-success bg-success/10' : diferencia === 0 ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'
              }`}>
                {formatCurrency(diferencia)}
              </div>
              <p className={`text-sm mt-2 font-medium ${diferencia > 0 ? 'text-success' : diferencia === 0 ? 'text-success' : 'text-destructive'}`}>
                {diferencia > 0 && 'Sobrante → va a Aprovechamientos'}
                {diferencia === 0 && '✓ Cuadra exacto'}
                {diferencia < 0 && '⚠ Faltante — debe registrar anticipo de nómina'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2.6 Anticipos de nómina */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">2.6 — Anticipos de nómina</h3>
          <button onClick={() => setAnticipos([...anticipos, { id: String(Date.now()), fecha: '11/04/2026', empleado: empleados[0], concepto: 'Anticipo nómina', valor: 0, soporte: false }])}
            className="flex items-center gap-2 text-sm text-primary hover:bg-accent px-3 py-1.5 rounded-md">
            <Plus className="h-4 w-4" /> Agregar anticipo
          </button>
        </div>
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/70">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empleado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Concepto</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Denuncia</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Soporte</th>
              </tr>
            </thead>
            <tbody>
              {anticipos.map((a) => (
                <tr key={a.id} className={`border-t border-border table-row-alt ${a.concepto === 'Hurto en ruta' ? 'bg-destructive/5' : ''}`}>
                  <td className="px-4 py-2.5">{a.fecha}</td>
                  <td className="px-4 py-2.5">
                    <select defaultValue={a.empleado} className="border border-input rounded px-2 py-1 bg-background text-sm">
                      {empleados.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <select defaultValue={a.concepto} className="border border-input rounded px-2 py-1 bg-background text-sm">
                      <option>Anticipo nómina</option>
                      <option>Pasaje</option>
                      <option>Hurto en ruta</option>
                    </select>
                    {a.concepto === 'Hurto en ruta' && <span className="badge-error ml-2">Pendiente autorización</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">{formatCurrency(a.valor)}</td>
                  <td className="px-4 py-2.5">
                    {a.concepto === 'Hurto en ruta' ? (
                      <input defaultValue={a.numDenuncia || ''} placeholder="N° denuncia" className="border border-input rounded px-2 py-1 w-28 bg-background text-sm" />
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {a.soporte ? <Check className="h-4 w-4 text-success mx-auto" /> : (
                      <button className="flex items-center gap-1 text-xs text-primary mx-auto"><Paperclip className="h-3.5 w-3.5" /> Adjuntar</button>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-primary/20 bg-accent">
                <td colSpan={3} className="px-4 py-3 font-semibold">TOTAL</td>
                <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(totalAnticipos)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 2.7 Resumen */}
      <section className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">2.7 — Resumen del cuadre</h3>
        <div className={`bg-card rounded-lg border-2 p-8 ${diferenciaFinal === 0 ? 'border-success' : 'border-destructive'}`}>
          <div className="max-w-lg mx-auto space-y-3 font-mono text-base">
            <div className="flex justify-between"><span>Total a cuadrar (contado):</span><span className="font-bold">{formatCurrency(totalContado)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>− Gastos de ruta:</span><span>{formatCurrency(totalGastos)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>− Consignaciones Riogrande:</span><span>{formatCurrency(totalConsigRio)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>− Consignaciones Aliados:</span><span>{formatCurrency(totalConsigAli)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>− Anticipos nómina:</span><span>{formatCurrency(totalAnticipos)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>− Efectivo real:</span><span>{formatCurrency(efectivoReal)}</span></div>
            {aprovechamientos > 0 && (
              <div className="flex justify-between text-success"><span>+ Aprovechamientos:</span><span>{formatCurrency(aprovechamientos)}</span></div>
            )}
            <hr className="border-border my-2" />
            <div className={`flex justify-between text-xl font-bold ${diferenciaFinal === 0 ? 'text-success' : 'text-destructive'}`}>
              <span>DIFERENCIA:</span>
              <span>{formatCurrency(diferenciaFinal)} {diferenciaFinal === 0 ? '✓' : ''}</span>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            {diferenciaFinal === 0 ? (
              <button onClick={() => setShowConfirm(true)} className="bg-success text-success-foreground px-8 py-3 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity">
                Confirmar cuadre
              </button>
            ) : (
              <button disabled className="bg-muted text-muted-foreground px-8 py-3 rounded-md text-sm font-semibold cursor-not-allowed" title="El cuadre debe cerrar en cero">
                Confirmar cuadre
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Confirm Modal */}
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

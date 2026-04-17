import { useState } from 'react';
import { RefreshCw, ChevronDown, ChevronRight, Check, X, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CandidataAlpina {
  ref: string;
  valor: number;
  fecha: string;
  sede: string;
  sugerida?: boolean;
}

interface ItemRevision {
  id: string;
  auxiliar: { valor: number; fecha: string; sede: string; ref: string };
  candidatas: CandidataAlpina[];
  sinCoincidencia: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const emparejadas = [
  { fecha: '15/03/2026', valor: 2000000, sede: 'Donmatías', refAux: 'ALP-manual-001', refAlpina: 'ALP-RG-00234' },
  { fecha: '17/03/2026', valor: 1500000, sede: 'Caucasia',  refAux: 'ALP-manual-002', refAlpina: 'ALP-RG-00235' },
  { fecha: '20/03/2026', valor: 3000000, sede: 'Donmatías', refAux: 'ALP-manual-003', refAlpina: 'ALP-RG-00236' },
];

const revisionInicialMock: ItemRevision[] = [
  {
    id: 'r1',
    auxiliar: { valor: 1000000, fecha: '15/03/2026', sede: 'Donmatías', ref: 'ALP-manual-004' },
    candidatas: [
      { ref: 'ALP-RG-00240', valor: 1000000, fecha: '15/03/2026', sede: 'Donmatías', sugerida: true },
      { ref: 'ALP-RG-00241', valor: 1000000, fecha: '15/03/2026', sede: 'Donmatías' },
    ],
    sinCoincidencia: false,
  },
  {
    id: 'r2',
    auxiliar: { valor: 2500000, fecha: '18/03/2026', sede: 'Caucasia', ref: 'ALP-manual-005' },
    candidatas: [
      { ref: 'ALP-RG-00242', valor: 2500000, fecha: '18/03/2026', sede: 'Caucasia', sugerida: true },
    ],
    sinCoincidencia: false,
  },
  {
    id: 'r3',
    auxiliar: { valor: 800000, fecha: '22/03/2026', sede: 'Donmatías', ref: 'ALP-manual-006' },
    candidatas: [],
    sinCoincidencia: true,
  },
];

const diferenciasIniciales = [
  { tipo: 'Solo en auxiliar', fecha: '22/03/2026', valor: 800000, sede: 'Donmatías', ref: 'ALP-manual-006', nota: '' },
];

// ─── Componente ───────────────────────────────────────────────────────────────

const ConciliacionAlpina = () => {
  // Header state
  const [periodo, setPeriodo] = useState('Marzo 2026');
  const [sede, setSede] = useState('Todas');
  const [sincronizando, setSincronizando] = useState(false);

  // Sección B — colapso
  const [emparejadaExpandida, setEmparejadaExpandida] = useState(false);

  // Sección C — revisión manual
  const [items, setItems] = useState<ItemRevision[]>(revisionInicialMock);
  const [seleccion, setSeleccion] = useState<Record<string, string>>({
    r2: 'ALP-RG-00242', // pre-seleccionada por ser única
  });
  const [confirmados, setConfirmados] = useState<Record<string, boolean>>({});
  const [movidos, setMovidos] = useState<Record<string, boolean>>({});       // movidos a diferencias

  // Sección D — diferencias
  const [diferencias, setDiferencias] = useState(diferenciasIniciales);
  const [notaEditando, setNotaEditando] = useState<number | null>(null);
  const [notaTexto, setNotaTexto] = useState('');

  // Modal generar asientos
  const [showModal, setShowModal] = useState(false);

  const handleSync = () => {
    setSincronizando(true);
    setTimeout(() => setSincronizando(false), 1800);
  };

  const pendientesDeRevisar = items.filter(it => !it.sinCoincidencia && !confirmados[it.id]).length;
  const puedeGenerar = pendientesDeRevisar === 0;

  const confirmarEmparejamiento = (id: string) => {
    setConfirmados(prev => ({ ...prev, [id]: true }));
  };

  const marcarDiferencia = (item: ItemRevision) => {
    setMovidos(prev => ({ ...prev, [item.id]: true }));
    setDiferencias(prev => [
      ...prev,
      { tipo: 'Solo en auxiliar', fecha: item.auxiliar.fecha, valor: item.auxiliar.valor, sede: item.auxiliar.sede, ref: item.auxiliar.ref, nota: '' },
    ]);
  };

  const guardarNota = (idx: number) => {
    setDiferencias(prev => prev.map((d, i) => (i === idx ? { ...d, nota: notaTexto } : d)));
    setNotaEditando(null);
    setNotaTexto('');
  };

  // Counts para resumen
  const certCount = emparejadas.length + Object.keys(confirmados).length;
  const certValor = 2000000 + 1500000 + 3000000 + Object.entries(confirmados).reduce((s, [id]) => {
    const it = items.find(i => i.id === id);
    return s + (it?.auxiliar.valor || 0);
  }, 0);
  const pendCount = items.filter(it => !it.sinCoincidencia && !confirmados[it.id]).length;
  const pendValor = items.filter(it => !it.sinCoincidencia && !confirmados[it.id]).reduce((s, it) => s + it.auxiliar.valor, 0);

  return (
    <div className="p-8 animate-fade-in space-y-8 max-w-5xl">

      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">🔗 Conciliación Alpina</h2>
          <p className="text-sm text-muted-foreground mt-1">Cruce mensual · solo visible para Analista y Admin</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={periodo}
            onChange={e => setPeriodo(e.target.value)}
            className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {['Marzo 2026', 'Febrero 2026', 'Enero 2026'].map(p => <option key={p}>{p}</option>)}
          </select>
          <select
            value={sede}
            onChange={e => setSede(e.target.value)}
            className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {['Todas', 'Donmatías', 'Caucasia', 'Apartadó'].map(s => <option key={s}>{s}</option>)}
          </select>
          <button
            onClick={handleSync}
            disabled={sincronizando}
            className="flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/5 transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} />
            {sincronizando ? 'Sincronizando…' : 'Sincronizar reporte Alpina'}
          </button>
        </div>
      </div>

      {/* ── SECCIÓN A — Resumen ── */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Resumen del período — {periodo} · {sede}</h3>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Total registradas */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-5">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Total registradas por auxiliares</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">$18.500.000</p>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">12 consignaciones</p>
          </div>
          {/* Certificadas */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-xl p-5">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Certificadas automáticamente</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{formatCurrency(certValor)}</p>
            <p className="text-xs text-green-500 dark:text-green-400 mt-1">{certCount} consignaciones</p>
          </div>
          {/* Pendientes */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-xl p-5">
            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mb-1">Pendientes de revisión manual</p>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{formatCurrency(pendValor > 0 ? pendValor : 5500000)}</p>
            <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1">{pendCount > 0 ? `${pendCount} consignaciones` : '3 consignaciones'}</p>
          </div>
          {/* Diferencias */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-xl p-5">
            <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Diferencias sin resolver</p>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">{formatCurrency(diferencias.reduce((s, d) => s + d.valor, 0))}</p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">{diferencias.length} consignación{diferencias.length !== 1 ? 'es' : ''}</p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN B — Emparejadas automáticamente (colapsable) ── */}
      <section>
        <button
          onClick={() => setEmparejadaExpandida(!emparejadaExpandida)}
          className="w-full flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-xl px-5 py-4 hover:bg-green-100/60 dark:hover:bg-green-900/30 transition-colors"
        >
          <span className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
            <Check className="h-4 w-4" />
            Emparejadas automáticamente ({emparejadas.length + Object.keys(confirmados).length})
          </span>
          {emparejadaExpandida
            ? <ChevronDown className="h-4 w-4 text-green-600 dark:text-green-400" />
            : <ChevronRight className="h-4 w-4 text-green-600 dark:text-green-400" />}
        </button>

        {emparejadaExpandida && (
          <div className="mt-2 bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60">
                  {['Fecha', 'Valor', 'Sede', 'Referencia auxiliar', 'Referencia Alpina', 'Estado'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {emparejadas.map((e, i) => (
                  <tr key={i} className="border-t border-border table-row-alt">
                    <td className="px-4 py-2.5">{e.fecha}</td>
                    <td className="px-4 py-2.5 font-mono font-medium">{formatCurrency(e.valor)}</td>
                    <td className="px-4 py-2.5">{e.sede}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{e.refAux}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-green-700 dark:text-green-400">{e.refAlpina}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">Certificada</span>
                    </td>
                  </tr>
                ))}
                {/* Confirmados manualmente */}
                {items.filter(it => confirmados[it.id]).map(it => (
                  <tr key={it.id} className="border-t border-border table-row-alt">
                    <td className="px-4 py-2.5">{it.auxiliar.fecha}</td>
                    <td className="px-4 py-2.5 font-mono font-medium">{formatCurrency(it.auxiliar.valor)}</td>
                    <td className="px-4 py-2.5">{it.auxiliar.sede}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{it.auxiliar.ref}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-green-700 dark:text-green-400">{seleccion[it.id] || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">Certificada</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── SECCIÓN C — Revisión manual ── */}
      <section>
        <div className="w-full flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-xl px-5 py-4 mb-4">
          <span className="font-semibold text-yellow-700 dark:text-yellow-400">
            ⚠ Requieren revisión manual ({items.filter(it => !confirmados[it.id] && !movidos[it.id]).length})
          </span>
        </div>

        <div className="space-y-4">
          {items.map(item => {
            if (confirmados[item.id] || movidos[item.id]) return null;
            const haySeleccion = !!seleccion[item.id];

            return (
              <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">

                  {/* Izquierda — Auxiliar */}
                  <div className="p-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Registrada por auxiliar</p>
                    <div className="space-y-1.5 text-sm">
                      <p><span className="text-muted-foreground">Fecha:</span> <span className="font-medium">{item.auxiliar.fecha}</span></p>
                      <p><span className="text-muted-foreground">Valor:</span> <span className="font-bold text-foreground font-mono">{formatCurrency(item.auxiliar.valor)}</span></p>
                      <p><span className="text-muted-foreground">Sede:</span> <span className="font-medium">{item.auxiliar.sede}</span></p>
                      <p><span className="text-muted-foreground">Referencia:</span> <span className="font-mono text-xs">{item.auxiliar.ref}</span></p>
                    </div>
                  </div>

                  {/* Derecha — Candidatas */}
                  <div className="p-5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Candidatas en reporte Alpina</p>

                    {item.sinCoincidencia ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground italic">Sin coincidencia en reporte Alpina</p>
                        <button
                          onClick={() => marcarDiferencia(item)}
                          className="flex items-center gap-2 border border-red-400 text-red-600 dark:text-red-400 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <X className="h-4 w-4" /> Marcar como diferencia
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {item.candidatas.map(c => (
                          <label key={c.ref} className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="radio"
                              name={`cand-${item.id}`}
                              value={c.ref}
                              checked={seleccion[item.id] === c.ref}
                              onChange={() => setSeleccion(prev => ({ ...prev, [item.id]: c.ref }))}
                              className="mt-0.5 accent-primary"
                            />
                            <div className="flex-1 text-sm">
                              <span className="font-mono text-xs text-foreground">{c.ref}</span>
                              <span className="text-muted-foreground ml-2">{formatCurrency(c.valor)} · {c.fecha} · {c.sede}</span>
                              {c.sugerida && (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">Sugerida</span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer del card */}
                {!item.sinCoincidencia && (
                  <div className="border-t border-border px-5 py-3 flex justify-end bg-muted/20">
                    <button
                      onClick={() => confirmarEmparejamiento(item.id)}
                      disabled={!haySeleccion}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                        haySeleccion
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      <Check className="h-4 w-4" /> Confirmar emparejamiento
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {items.every(it => confirmados[it.id] || movidos[it.id]) && (
            <div className="text-center py-6 text-sm text-green-600 dark:text-green-400 font-medium">
              ✓ Todos los ítems han sido revisados
            </div>
          )}
        </div>
      </section>

      {/* ── SECCIÓN D — Diferencias ── */}
      {diferencias.length > 0 && (
        <section>
          <div className="w-full flex items-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-t-xl px-5 py-4">
            <span className="font-semibold text-red-700 dark:text-red-400">
              <X className="h-4 w-4 inline mr-1.5" />
              Diferencias sin resolver ({diferencias.length})
            </span>
          </div>
          <div className="bg-card border border-border border-t-0 rounded-b-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60">
                  {['Tipo', 'Fecha', 'Valor', 'Sede', 'Referencia', 'Nota', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diferencias.map((d, i) => (
                  <tr key={i} className="border-t border-border table-row-alt">
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        d.tipo === 'Solo en auxiliar'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                      }`}>{d.tipo}</span>
                    </td>
                    <td className="px-4 py-2.5">{d.fecha}</td>
                    <td className="px-4 py-2.5 font-mono font-medium">{formatCurrency(d.valor)}</td>
                    <td className="px-4 py-2.5">{d.sede}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{d.ref}</td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground max-w-xs">
                      {notaEditando === i ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={notaTexto}
                            onChange={e => setNotaTexto(e.target.value)}
                            placeholder="Escribir nota..."
                            className="border border-input rounded px-2 py-1 text-xs bg-background w-40"
                          />
                          <button onClick={() => guardarNota(i)} className="text-green-600 hover:text-green-700"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setNotaEditando(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        d.nota || <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => { setNotaEditando(i); setNotaTexto(d.nota); }}
                        className="flex items-center gap-1.5 text-xs border border-border rounded px-2.5 py-1.5 hover:bg-accent transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" /> Agregar nota
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Botón Generar asientos ── */}
      <section>
        <button
          onClick={() => puedeGenerar && setShowModal(true)}
          disabled={!puedeGenerar}
          className={`w-full py-4 rounded-xl text-base font-bold transition-all ${
            puedeGenerar
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          {puedeGenerar
            ? '✓ Generar asientos certificados'
            : `Generar asientos certificados — quedan ${pendientesDeRevisar} ítem${pendientesDeRevisar !== 1 ? 's' : ''} por revisar`}
        </button>
        {!puedeGenerar && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Confirma o marca como diferencia todos los ítems pendientes para habilitar este botón.
          </p>
        )}
      </section>

      {/* ── Modal confirmación ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-4">
                <Check className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">¿Confirmar generación de asientos?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Se generarán asientos por{' '}
                <span className="font-semibold text-foreground">$12.000.000</span>{' '}
                correspondientes a{' '}
                <span className="font-semibold text-foreground">8 consignaciones certificadas</span>{' '}
                del período{' '}
                <span className="font-semibold text-foreground">{periodo} — {sede === 'Todas' ? 'Todas las sedes' : sede}</span>.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-border rounded-lg py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-green-600 text-white rounded-lg py-2.5 text-sm font-bold hover:bg-green-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConciliacionAlpina;

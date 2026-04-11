import { useState } from 'react';
import { planillasMock, sedes } from '@/data/mockData';
import { formatCurrency } from '@/lib/format';
import { useAppStore } from '@/store/appStore';
import { CheckSquare, Square, Filter } from 'lucide-react';

const EstadoPlanillas = () => {
  const { selectedPlanillas, togglePlanilla, setSelectedPlanillas, setCurrentPage, selectedSede, selectedDate } = useAppStore();
  
  const disponibles = planillasMock.filter(p => p.estadoERP === 'CERRADA' && p.estadoPlataforma === 'Pendiente de cuadre');
  const abiertas = planillasMock.filter(p => p.estadoERP === 'ABIERTA');

  const getBadge = (p: typeof planillasMock[0]) => {
    if (p.estadoERP === 'ABIERTA') return <span className="badge-warning">ABIERTA</span>;
    if (p.estadoPlataforma === 'Pendiente de cuadre') return <span className="badge-success">Pendiente de cuadre</span>;
    if (p.estadoPlataforma === 'Cuadrada') return <span className="badge-info">Cuadrada</span>;
    if (p.estadoPlataforma === 'Aprobada') return <span className="badge-neutral">Aprobada</span>;
    return <span className="badge-neutral">{p.estadoPlataforma}</span>;
  };

  const canSelect = (p: typeof planillasMock[0]) =>
    p.estadoERP === 'CERRADA' && p.estadoPlataforma === 'Pendiente de cuadre';

  const handleCuadrar = () => {
    if (selectedPlanillas.length > 0) setCurrentPage('cuadre');
  };

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Estado de Planillas</h2>
          <p className="text-sm text-muted-foreground mt-1">Gestión y control de planillas de distribución</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring">
            {sedes.map(s => <option key={s} selected={s === selectedSede}>{s}</option>)}
          </select>
        </div>
        <input
          type="text"
          value={selectedDate}
          readOnly
          className="border border-input rounded-md px-3 py-2 text-sm bg-background w-36"
        />
      </div>

      {/* Counter */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="badge-success">{disponibles.length} planillas disponibles para cuadre</span>
        <span className="badge-warning">{abiertas.length} planillas abiertas en ERP</span>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/70">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-10"></th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Operación</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Planilla</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado ERP</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor total</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado plataforma</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cuadre asignado</th>
            </tr>
          </thead>
          <tbody>
            {planillasMock.map((p) => {
              const selectable = canSelect(p);
              const selected = selectedPlanillas.includes(p.id);
              return (
                <tr
                  key={p.id}
                  className={`border-t border-border table-row-alt ${!selectable ? 'opacity-60' : 'hover:bg-muted/50 cursor-pointer'} ${selected ? 'bg-accent' : ''}`}
                  onClick={() => selectable && togglePlanilla(p.id)}
                >
                  <td className="px-4 py-3">
                    {selectable && (
                      selected
                        ? <CheckSquare className="h-4 w-4 text-primary" />
                        : <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{p.operacion}</td>
                  <td className="px-4 py-3 font-mono text-sm">{p.numero}</td>
                  <td className="px-4 py-3">{p.fecha}</td>
                  <td className="px-4 py-3">
                    <span className={p.estadoERP === 'CERRADA' ? 'badge-success' : 'badge-warning'}>{p.estadoERP}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(p.valorTotal)}</td>
                  <td className="px-4 py-3">{getBadge(p)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.cuadreAsignado || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleCuadrar}
          disabled={selectedPlanillas.length === 0}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Cuadrar seleccionadas ({selectedPlanillas.length})
        </button>
      </div>
    </div>
  );
};

export default EstadoPlanillas;

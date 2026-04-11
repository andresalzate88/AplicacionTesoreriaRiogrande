export interface Planilla {
  id: string;
  operacion: string;
  numero: string;
  fecha: string;
  estadoERP: 'CERRADA' | 'ABIERTA';
  valorTotal: number;
  estadoPlataforma: 'Pendiente de cuadre' | 'Cuadrada' | 'Aprobada' | 'No disponible';
  cuadreAsignado: string | null;
}

export interface Factura {
  planilla: string;
  numero: string;
  crco: 'CONTADO' | 'CRÉDITO';
  valorBase: number;
  valorNeto: number;
  descCondicionado: number;
  retenciones: number;
  totalCuadrar: number;
}

export interface GastoRuta {
  id: string;
  nit: string;
  nombre: string;
  tipoGasto: string;
  valorBase: number;
  iva: number;
  total: number;
  superaTope: boolean;
  justificacion: string;
}

export interface Consignacion {
  id: string;
  fecha: string;
  banco: string;
  referencia: string;
  valor: number;
  soporte: boolean;
  aliado?: string;
}

export interface AnticipoNomina {
  id: string;
  fecha: string;
  empleado: string;
  concepto: 'Anticipo nómina' | 'Pasaje' | 'Hurto en ruta';
  valor: number;
  numDenuncia?: string;
  soporte: boolean;
}

export interface ChecklistItem {
  id: number;
  descripcion: string;
  estado: 'Pendiente' | 'OK' | 'Con observación' | 'Faltante' | 'No aplica' | '';
  nota: string;
}

export const planillasMock: Planilla[] = [
  { id: '1', operacion: 'Alpina', numero: 'DA-32926', fecha: '11/04/2026', estadoERP: 'CERRADA', valorTotal: 16973289, estadoPlataforma: 'Pendiente de cuadre', cuadreAsignado: null },
  { id: '2', operacion: 'Cárnicos', numero: 'DC-32641', fecha: '11/04/2026', estadoERP: 'CERRADA', valorTotal: 5589617, estadoPlataforma: 'Cuadrada', cuadreAsignado: 'DMA-110426.01' },
  { id: '3', operacion: 'Alpina', numero: 'DA-32928', fecha: '11/04/2026', estadoERP: 'ABIERTA', valorTotal: 16640, estadoPlataforma: 'No disponible', cuadreAsignado: null },
  { id: '4', operacion: 'Alpina', numero: 'DA-32937', fecha: '10/04/2026', estadoERP: 'CERRADA', valorTotal: 104157, estadoPlataforma: 'Pendiente de cuadre', cuadreAsignado: null },
  { id: '5', operacion: 'Cárnicos', numero: 'DC-32918', fecha: '10/04/2026', estadoERP: 'CERRADA', valorTotal: 46245, estadoPlataforma: 'Aprobada', cuadreAsignado: null },
];

export const facturasMock: Factura[] = [
  { planilla: 'DA-32926', numero: 'FV-89001', crco: 'CONTADO', valorBase: 2350000, valorNeto: 2350000, descCondicionado: 0, retenciones: 0, totalCuadrar: 2350000 },
  { planilla: 'DA-32926', numero: 'FV-89002', crco: 'CONTADO', valorBase: 1870500, valorNeto: 1870500, descCondicionado: 47000, retenciones: 0, totalCuadrar: 1823500 },
  { planilla: 'DA-32926', numero: 'FV-89003', crco: 'CRÉDITO', valorBase: 3420000, valorNeto: 3420000, descCondicionado: 0, retenciones: 0, totalCuadrar: 0 },
  { planilla: 'DA-32926', numero: 'FV-89004', crco: 'CONTADO', valorBase: 985000, valorNeto: 985000, descCondicionado: 0, retenciones: 24625, totalCuadrar: 960375 },
  { planilla: 'DA-32926', numero: 'FV-89005', crco: 'CONTADO', valorBase: 4250000, valorNeto: 4250000, descCondicionado: 85000, retenciones: 0, totalCuadrar: 4165000 },
  { planilla: 'DA-32926', numero: 'FV-89006', crco: 'CRÉDITO', valorBase: 1650000, valorNeto: 1650000, descCondicionado: 0, retenciones: 0, totalCuadrar: 0 },
  { planilla: 'DA-32926', numero: 'FV-89007', crco: 'CONTADO', valorBase: 3100000, valorNeto: 3100000, descCondicionado: 62000, retenciones: 31000, totalCuadrar: 3007000 },
  { planilla: 'DA-32926', numero: 'FV-89008', crco: 'CONTADO', valorBase: 2780000, valorNeto: 2780000, descCondicionado: 0, retenciones: 0, totalCuadrar: 2780000 },
  { planilla: 'DA-32937', numero: 'FV-88901', crco: 'CONTADO', valorBase: 54157, valorNeto: 54157, descCondicionado: 0, retenciones: 0, totalCuadrar: 54157 },
  { planilla: 'DA-32937', numero: 'FV-88902', crco: 'CONTADO', valorBase: 50000, valorNeto: 50000, descCondicionado: 0, retenciones: 0, totalCuadrar: 50000 },
  { planilla: 'DA-32926', numero: 'FV-89009', crco: 'CONTADO', valorBase: 5200000, valorNeto: 5200000, descCondicionado: 104000, retenciones: 0, totalCuadrar: 5096000 },
  { planilla: 'DA-32926', numero: 'FV-89010', crco: 'CONTADO', valorBase: 2376873, valorNeto: 2376873, descCondicionado: 49900, retenciones: 0, totalCuadrar: 2326973 },
];

export const gastosMock: GastoRuta[] = [
  { id: '1', nit: '900123456', nombre: 'Estación Terpel KM 12', tipoGasto: 'Combustible', valorBase: 450000, iva: 85500, total: 535500, superaTope: false, justificacion: '' },
  { id: '2', nit: '800987654', nombre: 'Peaje Hatillo', tipoGasto: 'Peajes', valorBase: 28000, iva: 0, total: 28000, superaTope: false, justificacion: '' },
  { id: '3', nit: '901234567', nombre: 'Restaurante La Fonda', tipoGasto: 'Alimentación', valorBase: 312000, iva: 0, total: 312000, superaTope: true, justificacion: '' },
  { id: '4', nit: '800111222', nombre: 'Llantas Express', tipoGasto: 'Mantenimiento vehículo', valorBase: 50000, iva: 9500, total: 59500, superaTope: false, justificacion: '' },
];

export const consignacionesRiograndeMock: Consignacion[] = [
  { id: '1', fecha: '11/04/2026', banco: 'Bancolombia', referencia: 'CON-001145', valor: 8500000, soporte: true },
  { id: '2', fecha: '11/04/2026', banco: 'Davivienda', referencia: 'CON-001146', valor: 4574400, soporte: true },
  { id: '3', fecha: '11/04/2026', banco: 'Bancolombia', referencia: 'CON-001147', valor: 2500000, soporte: false },
];

export const consignacionesAliadosMock: Consignacion[] = [
  { id: '1', fecha: '11/04/2026', banco: 'Bancolombia', referencia: 'ALI-000891', valor: 3200000, soporte: true, aliado: 'Alpina' },
  { id: '2', fecha: '11/04/2026', banco: 'Davivienda', referencia: 'ALI-000892', valor: 1600000, soporte: false, aliado: 'Cárnicos' },
];

export const anticiposMock: AnticipoNomina[] = [
  { id: '1', fecha: '11/04/2026', empleado: 'Carlos Pérez', concepto: 'Anticipo nómina', valor: 100000, soporte: true },
  { id: '2', fecha: '11/04/2026', empleado: 'Andrés Ríos', concepto: 'Pasaje', valor: 40000, soporte: true },
];

export const aliados = ['Alpina', 'Cárnicos', 'Nutresa', 'Meals', 'Familia'];
export const bancos = ['Bancolombia', 'Davivienda', 'BBVA', 'Banco de Bogotá', 'Banco Popular'];
export const empleados = ['Carlos Pérez', 'Andrés Ríos', 'Laura Gómez', 'Jorge Martínez', 'Diana López'];
export const tiposGasto = ['Combustible', 'Peajes', 'Alimentación', 'Mantenimiento vehículo', 'Parqueadero', 'Papelería'];
export const tiposRetencion = ['Reteica', 'Retefuente', 'Reteiva', 'Estampilla'];
export const sedes = ['Donmatías', 'Medellín', 'Rionegro', 'Santa Rosa'];

export const checklistItems: ChecklistItem[] = [
  { id: 1, descripcion: 'Liquidación planillas distribución', estado: '', nota: '' },
  { id: 2, descripcion: 'Créditos firmados por cliente', estado: '', nota: '' },
  { id: 3, descripcion: 'Notas de descuento condicionado firmadas', estado: '', nota: '' },
  { id: 4, descripcion: 'Retenciones escaneadas y firmadas', estado: '', nota: '' },
  { id: 5, descripcion: 'Soporte gastos de ruta', estado: '', nota: '' },
  { id: 6, descripcion: 'Soportes consignaciones Riogrande', estado: '', nota: '' },
  { id: 7, descripcion: 'Soportes consignaciones aliados', estado: '', nota: '' },
  { id: 8, descripcion: 'Anticipos de nómina firmados', estado: '', nota: '' },
  { id: 9, descripcion: 'Soportes destinos de efectivo', estado: '', nota: '' },
  { id: 10, descripcion: 'Arqueo de efectivo', estado: '', nota: '' },
  { id: 11, descripcion: 'Denuncias por hurto', estado: '', nota: '' },
];

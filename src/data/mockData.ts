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
  valorImpuesto: number;
  tipoImpuesto: string;
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
  { id: '1', nit: '900123456', nombre: 'Estación Terpel KM 12', tipoGasto: 'Combustible', valorBase: 450000, valorImpuesto: 85500, tipoImpuesto: '', total: 535500, superaTope: false, justificacion: '' },
  { id: '2', nit: '800987654', nombre: 'Peaje Hatillo', tipoGasto: 'Peajes', valorBase: 28000, valorImpuesto: 0, tipoImpuesto: '', total: 28000, superaTope: false, justificacion: '' },
  { id: '3', nit: '901234567', nombre: 'Restaurante La Fonda', tipoGasto: 'Alimentación', valorBase: 312000, valorImpuesto: 0, tipoImpuesto: '', total: 312000, superaTope: true, justificacion: '' },
  { id: '4', nit: '800111222', nombre: 'Llantas Express', tipoGasto: 'Mantenimiento vehículo', valorBase: 50000, valorImpuesto: 9500, tipoImpuesto: '', total: 59500, superaTope: false, justificacion: '' },
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

export const aliados = [
  { id: 'a1', nombre: 'ALPINA',   letra: 'A', nit: '860002623', razonSocial: 'Alpina Productos Alimenticios S.A.' },
  { id: 'a2', nombre: 'CARNICOS', letra: 'C', nit: '890900608', razonSocial: 'Industria de Alimentos Zenú S.A.S.' },
  { id: 'a3', nombre: 'FAMILIA',  letra: 'F', nit: '860003978', razonSocial: 'Productos Familia S.A.' },
  { id: 'a4', nombre: 'NUTRESA',  letra: 'N', nit: '890900000', razonSocial: 'Grupo Nutresa S.A.' },
  { id: 'a5', nombre: 'MEALS',    letra: 'M', nit: '900100000', razonSocial: 'Meals de Colombia S.A.S.' },
];

export const parametrosContables = [
  { id: 'pc1',  tipoAsiento: 'gastos',                    detalleAsiento: 'Peajes',                   cuenta: '5210101', idExternoOdoo: '',              diarioOdoo: '',              sede: null   },
  { id: 'pc2',  tipoAsiento: 'gastos',                    detalleAsiento: 'Combustible',               cuenta: '5210102', idExternoOdoo: '',              diarioOdoo: '',              sede: null   },
  { id: 'pc3',  tipoAsiento: 'gastos',                    detalleAsiento: 'Alimentación',              cuenta: '5210103', idExternoOdoo: '',              diarioOdoo: '',              sede: null   },
  { id: 'pc4',  tipoAsiento: 'gastos',                    detalleAsiento: 'Mantenimiento vehículo',    cuenta: '5210104', idExternoOdoo: '',              diarioOdoo: '',              sede: null   },
  { id: 'pc5',  tipoAsiento: 'gastos',                    detalleAsiento: 'Hurto',                     cuenta: '5210105', idExternoOdoo: '',              diarioOdoo: '',              sede: null   },
  { id: 'pc6',  tipoAsiento: 'retenciones clientes',      detalleAsiento: 'Retefuente 2.5%',           cuenta: '2365',    idExternoOdoo: 'RET_FTE_25',   diarioOdoo: '',              sede: null   },
  { id: 'pc7',  tipoAsiento: 'retenciones clientes',      detalleAsiento: 'Retefuente 10%',            cuenta: '2366',    idExternoOdoo: 'RET_FTE_10',   diarioOdoo: '',              sede: null   },
  { id: 'pc8',  tipoAsiento: 'retenciones a proveedores', detalleAsiento: 'Retefte 2.5%',              cuenta: '236701',  idExternoOdoo: 'RET_PROV_25',  diarioOdoo: '',              sede: null   },
  { id: 'pc9',  tipoAsiento: 'impuestos en gastos',       detalleAsiento: 'IVA base 5 compras',        cuenta: '240810',  idExternoOdoo: 'IVA_5',        diarioOdoo: '',              sede: null   },
  { id: 'pc10', tipoAsiento: 'impuestos en gastos',       detalleAsiento: 'IVA base 19 compras',       cuenta: '240810',  idExternoOdoo: 'IVA_19',       diarioOdoo: '',              sede: null   },
  { id: 'pc11', tipoAsiento: 'impuestos en gastos',       detalleAsiento: 'Impuesto al consumo',       cuenta: '240820',  idExternoOdoo: 'ICONSUMO',     diarioOdoo: '',              sede: null   },
  { id: 'pc12', tipoAsiento: 'consignaciones a riogrande',detalleAsiento: 'Bancolombia Ahorros 454',   cuenta: '133131',  idExternoOdoo: '',              diarioOdoo: 'BANCO_BCOL_AH', sede: 'DMA'  },
  { id: 'pc13', tipoAsiento: 'consignaciones a riogrande',detalleAsiento: 'Bancolombia Corriente 4552',cuenta: '133132',  idExternoOdoo: '',              diarioOdoo: 'BANCO_BCOL_CO', sede: 'DMA'  },
  { id: 'pc14', tipoAsiento: 'consignaciones a riogrande',detalleAsiento: 'CFA',                       cuenta: '133133',  idExternoOdoo: '',              diarioOdoo: 'BANCO_CFA',     sede: 'DMA'  },
  { id: 'pc15', tipoAsiento: 'anticipos a aliados',       detalleAsiento: 'Anticipo Alpina',           cuenta: '280521',  idExternoOdoo: '',              diarioOdoo: '',              sede: null   },
  { id: 'pc16', tipoAsiento: 'anticipos a aliados',       detalleAsiento: 'Anticipo Cárnicos',         cuenta: '280521',  idExternoOdoo: '',              diarioOdoo: '',              sede: null   },
  { id: 'pc17', tipoAsiento: 'anticipo de nomina',        detalleAsiento: 'Anticipo Nómina',           cuenta: '130303',  idExternoOdoo: '',              diarioOdoo: '',              sede: null   },
  { id: 'pc18', tipoAsiento: 'anticipo de nomina',        detalleAsiento: 'Anticipo Pasajes',          cuenta: '130303',  idExternoOdoo: '',              diarioOdoo: '',              sede: null   },
  { id: 'pc19', tipoAsiento: 'aprovechamientos',          detalleAsiento: 'Aprovechamientos',          cuenta: '4200011', idExternoOdoo: '',              diarioOdoo: '',              sede: null   },
  { id: 'pc20', tipoAsiento: 'traslado entre cajas',      detalleAsiento: 'Caja menor DMA',            cuenta: '4200011', idExternoOdoo: '',              diarioOdoo: 'CAJA_MENOR_DMA',sede: 'DMA'  },
  { id: 'pc21', tipoAsiento: 'traslado entre cajas',      detalleAsiento: 'TVS QBO',                   cuenta: '4200015', idExternoOdoo: '',              diarioOdoo: 'TVS_QBO',       sede: 'QBO'  },
  { id: 'pc22', tipoAsiento: 'traslado entre cajas',      detalleAsiento: 'Istmina QBO',               cuenta: '4200017', idExternoOdoo: '',              diarioOdoo: 'ISTMINA_QBO',   sede: 'QBO'  },
];

export const cuentasAnaliticasMock = [
  { id: 'cta1', sede: 'DMA', nombre: 'DMA-Alpina 100%',            codigoOdoo: '{"7":100}'      },
  { id: 'cta2', sede: 'DMA', nombre: 'DMA-Cárnicos 100%',          codigoOdoo: '{"8":100}'      },
  { id: 'cta3', sede: 'DMA', nombre: 'DMA-Familia 100%',           codigoOdoo: '{"9":100}'      },
  { id: 'cta4', sede: 'DMA', nombre: 'DMA-Alpina+Cárnicos 50/50',  codigoOdoo: '{"7":50,"8":50}'},
  { id: 'cta5', sede: 'CAC', nombre: 'CAC-Alpina 100%',            codigoOdoo: '{"10":100}'     },
  { id: 'cta6', sede: 'QBO', nombre: 'QBO-Cárnicos 100%',          codigoOdoo: '{"14":100}'     },
];

# Documento Maestro — Plataforma de Tesorería
## Distribuciones Riogrande · Versión 7.3
**Fecha:** 2026-05-22
**Stack:** React + Vite + TypeScript + Supabase (PostgreSQL) · Deploy: Google Cloud Platform
**Migración futura:** Azure

---

## 1. CONTEXTO DEL NEGOCIO

Distribuciones Riogrande es una empresa de distribución TAT (Tienda a Tienda) con 27 años de experiencia. Opera en 4 sedes, 10 operaciones comerciales y 5 aliados estratégicos.

### 1.1 Sedes

| Código | Nombre | Letra | Cuenta Caja | Diario Caja Odoo |
|--------|--------|-------|-------------|-----------------|
| DMA | Donmatías | D | 130501 | (parametrizar con contador) |
| CAC | Caucasia  | C | 130502 | (parametrizar con contador) |
| APA | Apartadó  | A | 130503 | (parametrizar con contador) |
| QBO | Quibdó    | Q | 130504 | (parametrizar con contador) |

### 1.2 Aliados

| Aliado | Letra | NIT | Razón Social |
|--------|-------|-----|-------------|
| Alpina | A | 860002623 | Alpina Productos Alimenticios S.A. |
| Cárnicos (Zenú) | C | 890900608 | Industria de Alimentos Zenú S.A.S. |
| Familia | F | 860003978 | Productos Familia S.A. |
| Nutresa | N | (parametrizar) | Grupo Nutresa S.A. |
| Meals (Crem Helado) | M | (parametrizar) | Meals de Colombia S.A.S. |

### 1.3 Operaciones

| Código | Sede | Aliado | ERP |
|--------|------|--------|-----|
| DA | Donmatías | Alpina   | SIDIS |
| DC | Donmatías | Cárnicos | ECOM  |
| DF | Donmatías | Familia  | SIDIS |
| CA | Caucasia  | Alpina   | ECOM  |
| CC | Caucasia  | Cárnicos | ECOM  |
| CN | Caucasia  | Nutresa  | ECOM  |
| AA | Apartadó  | Alpina   | SIDIS |
| QC | Quibdó    | Cárnicos | ECOM  |
| QN | Quibdó    | Nutresa  | ECOM  |
| QM | Quibdó    | Meals    | ECOM  |

### 1.4 Tipo de certificación por aliado

| Aliado | Tipo certificación |
|--------|-------------------|
| Alpina | Registro manual por auxiliar — pasa directo al histórico sin conciliación mensual |
| Cárnicos (Zenú) | Archivo certificado por aliado |
| Familia | Archivo certificado por aliado |
| Nutresa | Archivo certificado por aliado |
| Meals (Crem Helado) | Archivo certificado por aliado |

---

## 2. PROBLEMA Y SOLUCIÓN

**Problema actual:** El cuadre diario de caja se hace en Excel. Los registros contables se hacen al final del mes. No hay trazabilidad, hay riesgo de fraude y hay 10 fuentes de datos sin consolidar.

**Solución:** Plataforma web que reemplaza el Excel. Automatiza el cuadre diario y sincroniza directamente con Odoo via API — cada tabla histórica tiene todos los campos necesarios para el envío sin transformaciones intermedias.

---

## 3. ROLES Y PERMISOS

| Rol | Acceso |
|-----|--------|
| **auxiliar** | Solo su sede. Hace cuadres, gestiona recaudo, adjunta soportes, descarga informes propios. NO accede a planos SharePoint. |
| **analista** | Todas las sedes. Puede hacer cuadres (cubre vacaciones — log registra quién). Revisa y aprueba. |
| **director** | Todo lo anterior + anular cuadres aprobados (motivo obligatorio) + autorizar hurtos. |
| **admin** | Parametrización completa, gestión usuarios, editar saldo inicial de caja, habilitadores de ingesta y sync. |
| **contabilidad** | Deposita planos en SharePoint, descarga informes Odoo, solo lectura en informes. |

**Control de acceso por vista:**

| Vista | Auxiliar | Analista | Director | Admin |
|-------|----------|----------|----------|-------|
| Inicio del Día | ✅ | ✅ | ✅ | ✅ |
| Estado de Planillas | ✅ | ✅ | ✅ | ✅ |
| Cuadre de Planillas | ✅ | ✅ | ✅ | ✅ |
| Recaudo Diario | ✅ | ✅ | ✅ | ✅ |
| Revisión | ❌ | ✅ | ✅ | ✅ |
| Sincronización Odoo | ❌ | ❌ | ❌ | ✅ |
| Informes | ✅ (solo su sede) | ✅ | ✅ | ✅ |
| Parametrización | ❌ | ❌ | ❌ | ✅ |

> **Nota:** La vista Conciliación Alpina y los bloques de sync de proveedores/empleados en Sincronización Odoo están desactivados en la UI (implementación futura). Las tablas y campos relacionados se conservan en la base de datos para facilitar su activación cuando se requiera.

Ver detalle completo en USUARIOS_v1.md.

---

## 4. ARQUITECTURA SHAREPOINT

```
📁 RioTesorería/
├── 📁 Planos/
│   ├── ERP/           → DA_2026_04.xlsx (incluye facturas, notas, anticipos y cruces)
│   ├── Bancos/        → BANCOLOMBIA_CTA1_2026.xlsx (1/cuenta/año, 12 pestañas)
│   └── Aliados/
│       ├── Carnicos/  → DC_2026_04.xlsx, CC_2026_04.xlsx, QC_2026_04.xlsx
│       ├── Nutresa/   → CN_2026_04.xlsx, QN_2026_04.xlsx
│       ├── Meals/     → QM_2026_04.xlsx
│       └── Alpina/    → ALPINA_2026_03.xlsx (todas las sedes, col Caja obligatoria)
├── 📁 DIAN/           → DIAN_DA_2026_04.xlsx (informe DIAN por operación)
└── 📁 Soportes/
    ├── DMA/2026/04/19/ → archivos adjuntos sincronizados localmente
    ├── CAC/
    ├── APA/
    └── QBO/
```

**Nota sobre el plano ERP:** los anticipos de clientes (ANTICIPO y CRUCE ANTICIPO) van en el mismo archivo del plano ERP, no en un archivo separado. El `tipo_documento` identifica el tipo de registro dentro del mismo archivo.

**Reglas de ingesta:**
- Planos ERP: upsert en `documentos_erp` y `clientes` usando `operacion_documento` como clave
- Extractos banco: upsert en `consignaciones_banco` usando `banco_id` + `referencia` como clave. El `banco_id` lo pone contabilidad en el Excel.
- Aliados (Cárnicos/Nutresa/Meals): upsert en `consignaciones_aliados` — 1 archivo por operación
- Alpina: registro manual por auxiliar en el cuadre — pasa directo al histórico sin certificación previa
- DIAN: upsert en `documentos_dian` usando `documento_electronico` como clave. Al insertar, trigger actualiza automáticamente `documentos_erp.estado_dian`

**Habilitadores de ingesta (`parametros_sistema`):**
- `INGESTA_MANUAL_ACTIVA`: habilita botón "Sincronizar" en la UI — el admin lo activa y el script corre en ese momento
- `INGESTA_AUTOMATICA_ACTIVA`: habilita sync automática via Supabase Edge Functions a la hora de `HORA_SYNC_AUTOMATICA`

**Motor de ingesta:** Supabase Edge Functions (TypeScript). Lee los archivos de SharePoint, parsea los Excel y hace upsert en Supabase. Soporta procesamiento en batches de 1.000 filas para manejar el volumen de 70K documentos/mes sin timeouts.

**Antifraude:**
- Para Cárnicos/Nutresa/Meals: el sistema cruza sede del nombre del archivo vs columna Caja. Discrepancia → alerta al admin y bloqueo
- Hash del archivo al procesar para detectar modificaciones post-ingesta

**Soportes — carpeta local sincronizada con SharePoint:**
- La ruta raíz se parametriza por sede en `parametros_sistema` (RUTA_SOPORTES_DMA, etc.)
- El sistema crea subcarpetas año/mes/día automáticamente si no existen
- Nombre estándar: `DMA_20260419_RETENCIONES_DMA-RD-190426.pdf`

---

## 5. FLUJO GENERAL

```
Contabilidad → SharePoint (planos ERP, extractos banco, cert. aliados, informe DIAN)
        ↓ sync (manual con botón o automática según habilitadores)
Vista 01: Inicio del día — panel de fuentes + estado sedes + alertas
        ↓
Vista 02: Cuadre (7 secciones) → genera consecutivo DMA-110426.01
        ↓
Vista 03: Recaudo diario → destinos efectivo → saldo → soportes → cierra día
        ↓ (bloqueado para auxiliar)
Vista 04: Analista revisa checklist → aprueba
        ↓
promover_a_historico() → BD Temporal → BD Histórica
        ↓
Vista 05: Sync Odoo
  Bloque 1: Sync maestro clientes (automático)
  Bloque 2: Sync documentos_erp (solo APROBADO + APROBADO_CON_NOTIFICACION)
  Bloque 3: Sync transacciones (retenciones, gastos, consignaciones, anticipos, traslados)
  [Bloque Proveedores — implementación futura]
  [Bloque Empleados — implementación futura]
```

**Reglas críticas del flujo:**
- Auxiliar NO puede iniciar nuevo recaudo sin cerrar el anterior
- Máximo `MAX_DIAS_SIN_APROBAR` días en estado CERRADO_AUXILIAR sin aprobar → bloquea la auxiliar
- Días sin movimiento (domingos) igual deben abrirse y cerrarse (`sin_movimiento = true`)
- Consecutivo cuadre: DMA-110426.01 (reinicia cada día por sede)
- Consecutivo recaudo: DMA-RD-110426 (único por sede por día; rehecho: -R1, -R2)
- Estado BORRADOR: permite retomar el recaudo si la consignación del día aún no aparece en el extracto
- Alpina: las consignaciones registradas por el auxiliar pasan al histórico junto con los demás aliados al aprobar el recaudo — sin bloqueo por certificación

---

## 6. MODELO DE DATOS — 41 TABLAS

### 6.1 Tablas maestras y parámetros (11)

**`sedes`** — 4 registros fijos. El Admin puede editar `cuenta_caja` y `diario_caja` desde la UI.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | Identificador único |
| `codigo` | text UNIQUE | DMA / CAC / APA / QBO |
| `nombre` | text | Donmatías, Caucasia, Apartadó, Quibdó |
| `letra` | text UNIQUE | D / C / A / Q |
| `cuenta_caja` | text | Cuenta PUC de efectivo en caja (130501/02/03/04) |
| `diario_caja` | text | Diario de Odoo que identifica la caja de esta sede — requerido para todos los movimientos que salen de caja |
| `activa` | boolean | Default true |
| `created_at` | timestamptz | — |

**`aliados`** — 5 registros. El Admin puede editar NIT y razón social.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | Identificador único |
| `nombre` | text UNIQUE | ALPINA / CARNICOS / FAMILIA / NUTRESA / MEALS |
| `letra` | text UNIQUE | A / C / F / N / M |
| `nit` | text | NIT del aliado — se desnormaliza en `consignaciones_aliados` |
| `razon_social` | text | Razón social — se desnormaliza en `consignaciones_aliados` |
| `activo` | boolean | Default true |
| `created_at` | timestamptz | — |

**`operaciones`** — 10 registros. El Admin puede editar.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | Identificador único |
| `codigo` | text UNIQUE | DA, DC, DF, CA, CC, CN, AA, QC, QN, QM |
| `sede_id` | uuid FK → sedes | — |
| `aliado_id` | uuid FK → aliados | — |
| `tipo_erp` | text | SIDIS / ECOM |
| `activa` | boolean | Default true |

**`bancos`** — Catálogo con ID numérico (se usa en Excel de ingesta). `tipo`: RIOGRANDE / EXTERNO. El UI de consignaciones RG usa `parametros_contables`, no esta tabla directamente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer PK | ID numérico — clave del Excel de ingesta |
| `nombre` | text UNIQUE | Bancolombia, Banco de Bogotá, CFA, etc. |
| `tipo` | text | RIOGRANDE / EXTERNO (EXTERNO se muestra en dropdown Alpina) |
| `activo` | boolean | Default true |

**`cuentas_analiticas`** — Distribuciones analíticas en formato JSON para Odoo. La distribución ya está implícita en `codigo_odoo`. El sistema calcula las combinadas automáticamente dividiendo en partes iguales según las operaciones del cuadre. Ejemplo: cuadre DA+DC → `{"7":50,"8":50}`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `sede_id` | uuid FK → sedes | — |
| `codigo_odoo` | text | JSON: `{"7":100}` / `{"7":50,"8":50}` |
| `nombre` | text | Nombre legible para dropdown: "DMA-Alpina 100%" |
| `activo` | boolean | Default true |

**`parametros_contables`** — 9 tipos fijos. Los tipos NO se pueden crear ni eliminar desde la UI. Solo se pueden agregar más `detalle_asiento` dentro de cada tipo existente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `sede_id` | uuid FK → sedes nullable | NULL = todas las sedes. UUID = solo esa sede. En UI muestra nombre de sede. |
| `tipo_asiento` | text | 9 tipos fijos (ver guía abajo) |
| `detalle_asiento` | text | Nombre del concepto para dropdown UI (ej: "Peajes", "Retefuente 2.5%") |
| `cuenta` | text nullable | Cuenta PUC. Obligatoria para: anticipos aliados, anticipo nómina. |
| `id_externo_odoo` | text nullable | Identificador exacto en Odoo. Obligatorio para: retenciones clientes, retenciones proveedores, gastos, impuestos en gastos. |
| `diario_odoo` | text nullable | Diario Odoo destino. Obligatorio para: consignaciones a riogrande, traslado entre cajas. |
| `banco_id` | integer FK → bancos nullable | Solo consignaciones a riogrande — vincula parámetro con extracto bancario para filtrar consignaciones disponibles en el cuadre sección 2.3. |
| `requiere_documento_electronico` | boolean nullable | Solo gastos. True = peajes, combustible. False = robos. |
| `tope_maximo` | numeric nullable | Solo gastos. Monto máximo por ocurrencia — si el auxiliar supera el tope, el sistema exige justificación. |
| `activo` | boolean | Default true |

**Guía de parametrización — qué campos llenar por tipo:**

| Tipo asiento | `id_externo_odoo` | `diario_odoo` | `banco_id` | `cuenta` |
|---|---|---|---|---|
| retenciones clientes | ✅ obligatorio | ❌ | ❌ | opcional |
| retenciones a proveedores | ✅ obligatorio | ❌ | ❌ | opcional |
| gastos | ✅ obligatorio | ❌ | ❌ | opcional |
| impuestos en gastos | ✅ obligatorio | ❌ | ❌ | opcional |
| consignaciones a riogrande | ❌ | ✅ obligatorio | ✅ obligatorio | opcional |
| anticipos a aliados | ❌ | ❌ | ❌ | ✅ obligatorio |
| traslado entre cajas | ❌ | ✅ obligatorio | ❌ | opcional |
| anticipo de nomina | ❌ | ❌ | ❌ | ✅ obligatorio |
| aprovechamientos | ❌ | ❌ | ❌ | opcional |

**Nota:** `id_externo_odoo` debe coincidir exactamente con el External ID configurado en Odoo (ej: `RET_FTE_COM_25`). Coordinar con el implementador de Odoo antes de parametrizar.

**Nota de `sede_id`:** si un parámetro aplica a todas las sedes → dejar NULL. Si aplica solo a una sede (ej: "Caja menor DMA", "TVS QBO") → seleccionar la sede específica. La UI filtra: `WHERE tipo_asiento = :tipo AND (sede_id = :sede_actual OR sede_id IS NULL)`.

**`parametros_contables_generales`** — Cuentas contables transversales al sistema no ligadas a un tipo de asiento específico.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `clave` | text UNIQUE | CUENTA_POR_PAGAR / CUENTA_POR_COBRAR |
| `valor` | text | Cuenta PUC o código Odoo |
| `descripcion` | text | Explicación del parámetro |
| `activo` | boolean | Default true |
| `updated_at` | timestamptz | — |

`CUENTA_POR_PAGAR`: cuenta transitoria para causación de gastos en Odoo — definir con contador.
`CUENTA_POR_COBRAR`: reservada para uso futuro.

**`parametros_sistema`** — Configuración operativa del sistema. Editable por Admin.

| Clave | Valor inicial | Descripción |
|-------|--------------|-------------|
| MARGEN_DIAS_ANTES | 3 | Días antes para buscar consignaciones |
| MARGEN_DIAS_DESPUES | 1 | Días después para buscar consignaciones |
| TIMEOUT_SESION_MINUTOS | 30 | Timeout de bloqueo de consignaciones |
| HORA_SYNC_AUTOMATICA | 06:00 | Hora de sync automática desde SharePoint |
| MAX_DIAS_SIN_APROBAR | 2 | Máximo días sin aprobar antes de bloquear a la auxiliar |
| RUTA_SOPORTES_DMA | C:/RioTesoreria/Soportes/DMA/ | Ruta soportes Donmatías |
| RUTA_SOPORTES_CAC | C:/RioTesoreria/Soportes/CAC/ | Ruta soportes Caucasia |
| RUTA_SOPORTES_APA | C:/RioTesoreria/Soportes/APA/ | Ruta soportes Apartadó |
| RUTA_SOPORTES_QBO | C:/RioTesoreria/Soportes/QBO/ | Ruta soportes Quibdó |
| INGESTA_MANUAL_ACTIVA | true | Habilita botón de ingesta manual en la UI |
| INGESTA_AUTOMATICA_ACTIVA | false | Habilita ingesta automática programada via Edge Functions |
| SYNC_ODOO_MANUAL_ACTIVA | true | Habilita botones de sync manual con Odoo |
| SYNC_ODOO_AUTOMATICA_ACTIVA | false | Habilita sync automática con Odoo |
| DIAS_ATRAS_REGISTRO_GASTO | 2 | Días hacia atrás permitidos para fecha de gasto vs fecha cuadre |
| DIAS_ADELANTE_REGISTRO_GASTO | 0 | Días hacia adelante permitidos para fecha de gasto vs fecha cuadre |

**`empleados`** — Conductores, auxiliares y personal de tesorería. Desactivar en lugar de borrar.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `sede_id` | uuid FK → sedes | — |
| `nit` | text UNIQUE | Número de identificación |
| `nombre_completo` | text | — |
| `cargo` | text | CONDUCTOR / AUXILIAR_RUTA / AUXILIAR_TESORERIA / ANALISTA / OTRO |
| `sincronizado_odoo` | boolean | Default false. Reservado para sync futura. |
| `activo` | boolean | Default true |
| `updated_at` | timestamptz | — |

**`vehiculos`** — Maestro de placas por sede. Desactivar en lugar de borrar.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `sede_id` | uuid FK → sedes | — |
| `placa` | text UNIQUE | — |
| `tipo` | text | CAMION / FURGON / MOTO / OTRO |
| `activo` | boolean | Default true |

**`consecutivos_cuadre`** — Un registro por sede. El sistema lo actualiza al confirmar cada cuadre. Reinicia el contador cuando cambia la fecha.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sede_id` | uuid PK FK → sedes | Un registro por sede |
| `fecha` | date | Fecha del último consecutivo |
| `ultimo_numero` | integer | Último número generado hoy. Si la fecha cambia, reinicia a 1. |

---

### 6.2 Tablas maestras de terceros (2)

**`clientes`** — Alimentado desde el plano ERP via upsert. Clave única: `operacion_codigo_cliente` (ej: DA-1). Es el ID externo en Odoo para cartera diferenciada por establecimiento.

**Lógica de upsert clientes:**
```
Llega cliente DA-1 del plano ERP
        ↓
¿Existe en tabla clientes?
SÍ → UPDATE. ¿Cambiaron datos? → requiere_sync_odoo = true, sincronizado_odoo = false
NO → INSERT. sincronizado_odoo = false
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `operacion_codigo_cliente` | text UNIQUE | DA-1 — clave única de upsert e ID externo en Odoo |
| `operacion_id` | uuid FK → operaciones | — |
| `numero_identificacion` | text | NIT del cliente |
| `digito_verificacion` | text | Nullable |
| `tipo_tercero` | text | Natural / Jurídico |
| `tipo_identificacion` | text | cedula, nit, etc. |
| `nombre_establecimiento` | text | Nombre de la tienda |
| `nombre_completo` | text | Nombre completo del propietario |
| `nombre1` | text | Nullable |
| `nombre2` | text | Nullable |
| `apellido1` | text | Nullable |
| `apellido2` | text | Nullable |
| `pais` | text | Colombia |
| `departamento` | text | — |
| `municipio` | text | — |
| `zip` | text | Código postal |
| `direccion` | text | Dirección del establecimiento |
| `correo` | text | Nullable |
| `telefono` | text | Nullable |
| `sincronizado_odoo` | boolean | Default false. True cuando Odoo confirma. |
| `sincronizado_at` | timestamptz | Cuándo se sincronizó |
| `requiere_sync_odoo` | boolean | True cuando hay cambios pendientes |
| `error_sync` | text | Mensaje de error si Odoo rechazó |
| `activo` | boolean | Default true |
| `updated_at` | timestamptz | — |

**`proveedores`** — Pre-cargado por Admin. La auxiliar puede agregar nuevos desde el cuadre (botón "Agregar proveedor"). Los nuevos quedan con `sincronizado_odoo = false`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `nit` | text UNIQUE | NIT del proveedor |
| `digito_verificacion` | text | Nullable |
| `nombre` | text | Nombre del proveedor |
| `tipo_identificacion` | text | nit, cedula, etc. |
| `tipo_tercero` | text | Natural / Jurídico |
| `sincronizado_odoo` | boolean | Default false. Reservado para sync futura. |
| `sincronizado_at` | timestamptz | Nullable |
| `requiere_sync_odoo` | boolean | Reservado para sync futura. |
| `error_sync` | text | Mensaje de error si Odoo rechazó |
| `creado_por` | uuid | → auth.users. Nullable si fue pre-cargado. |
| `activo` | boolean | Default true |
| `updated_at` | timestamptz | — |

---

### 6.3 Tablas de ingesta (4)

**`documentos_erp`** — Facturas, notas crédito/débito, anticipos y cruces de anticipos de clientes. Todo en el mismo archivo de plano ERP. Clave de upsert: `operacion_documento`. El campo `documento_electronico` es la clave de cruce con `documentos_dian`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `operacion_id` | uuid FK → operaciones | — |
| `cliente_id` | uuid FK → clientes | Nullable |
| `operacion_planilla` | text | DA-32825 — clave de agrupación |
| `estado_planilla_erp` | text | CERRADA (cuadrable) / ABIERTA (solo lectura) |
| `tipo_documento` | text | FACTURA DE VENTA / NOTA CREDITO / NOTA DEBITO / ANTICIPO / CRUCE ANTICIPO |
| `sub_tipo` | text | FACTURA DE VENTA / NOTA AVERIA-CAMBIO / NOTA BUEN ESTADO / NOTA DESCUENTO CONDICIONADO / ANTICIPO / CRUCE ANTICIPO |
| `documento_electronico` | text | Clave de cruce con documentos_dian |
| `operacion_documento` | text UNIQUE | Clave única de upsert |
| `factura_referencia` | text | Factura a la que aplica la nota |
| `cr_co` | text | CONTADO / CREDITO |
| `fecha_emision` | date | — |
| `fecha_vencimiento` | date | — |
| `producto` | text | — |
| `cantidad` | numeric | — |
| `valor_sin_iva` | numeric | — |
| `iva` | numeric | — |
| `valor_base_iva` | numeric GENERATED | valor_sin_iva + iva |
| `cuenta_contable` | text | Del plano ERP |
| `cuenta_analitica` | text | Del plano ERP — se desnormaliza en cuadre_retenciones |
| `diario_odoo` | text | Del plano ERP |
| `estado_dian` | text | SIN_VALIDAR / APROBADO_CON_NOTIFICACION / RECHAZADO / PENDIENTE |
| `validado_dian_at` | timestamptz | — |
| `estado_at` | text | PENDIENTE / EN_CUADRE / ENVIADO_REVISION / APROBADO |
| `numero_cuadre` | text | → cuadres.consecutivo |
| `recaudo_id` | uuid | → recaudos_dia |
| `hash_archivo` | text | Antifraude |
| `leido_sharepoint_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

**Condición para enviar a Odoo:** `estado_at = APROBADO` AND `estado_dian = APROBADO_CON_NOTIFICACION`

**Anticipos de clientes:** el plano ERP incluye dos tipos de documento para el manejo de anticipos:
- `tipo_documento = ANTICIPO`, `sub_tipo = ANTICIPO` → dinero recibido del cliente. Valor siempre positivo. La `cuenta_contable` viene del plano ERP.
- `tipo_documento = CRUCE ANTICIPO`, `sub_tipo = CRUCE ANTICIPO` → cruce del anticipo contra una factura. Valor siempre positivo. La `cuenta_contable` viene del plano ERP.

Ambos tipos viajan a Odoo directamente desde `hist_documentos_erp` usando la cuenta contable que trae el ERP — no requieren parametrización adicional en `parametros_contables`.

**Descuentos condicionados:** cuando no vienen ligados a una factura en el ERP, la auxiliar selecciona la factura del mismo NIT manualmente. El sistema llena automáticamente `factura_referencia` desde la factura seleccionada.

**`documentos_dian`** — Informe DIAN importado por contabilidad. Clave: `documento_electronico`. Al insertar o actualizar, un trigger actualiza automáticamente `documentos_erp.estado_dian`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `operacion_id` | uuid FK → operaciones | Nullable |
| `prefijo` | text | — |
| `folio` | text | — |
| `documento_electronico` | text UNIQUE | prefijo + folio — clave de cruce |
| `fecha_emision` | date | — |
| `base` | numeric | — |
| `iva` | numeric | — |
| `total` | numeric | — |
| `tipo_documento` | text | — |
| `estado_dian` | text | APROBADO_CON_NOTIFICACION / RECHAZADO / PENDIENTE |
| `leido_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

**`consignaciones_banco`** — Extractos bancarios de Riogrande. El `banco_id` lo pone contabilidad en el Excel. El UI de la sección 2.3 usa `parametros_contables`, no esta tabla directamente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `sede_id` | uuid FK → sedes | — |
| `operacion_id` | uuid FK → operaciones | Nullable |
| `banco_id` | integer FK → bancos | Para ingesta y trazabilidad |
| `parametro_id` | uuid FK → parametros_contables | Trae diario_odoo destino al seleccionar en UI |
| `diario_caja` | text | DEN: sedes.diario_caja — diario origen para Odoo |
| `diario_destino` | text | DEN: parametros_contables.diario_odoo — diario destino para Odoo |
| `cuenta_bancaria` | text | Código de la cuenta bancaria |
| `fecha` | date | — |
| `valor` | numeric | — |
| `referencia` | text | Nullable |
| `nit_consignante` | text | Nullable |
| `nombre_consignante` | text | Nullable |
| `origen` | text | PLANILLA / DESTINO_EFECTIVO |
| `estado_cuadre` | text | LIBRE / BLOQUEADA / EN_CUADRE / ENVIADO_REVISION / APROBADO |
| `cuadre_id` | uuid | → cuadres. Nullable. |
| `recaudo_id` | uuid | → recaudos_dia. Nullable. |
| `bloqueada_por` | uuid | → auth.users |
| `bloqueada_at` | timestamptz | Expira según TIMEOUT_SESION_MINUTOS |
| `hash_archivo` | text | Antifraude |
| `leido_sharepoint_at` | timestamptz | — |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

**Para Odoo:** `fecha`, `diario_caja`, `diario_destino`, `valor`, `referencia`. Notas = concatenación de `cuadre_id + recaudo_id` en el momento del envío.

**Regla de bloqueo:** Al seleccionar en el cuadre → `estado_cuadre = BLOQUEADA` + se registra `bloqueada_por` y `bloqueada_at`. Timeout = `TIMEOUT_SESION_MINUTOS` → función `liberar_bloqueos_expirados()` las libera automáticamente.

**`consignaciones_aliados`** — Consignaciones de aliados. Cárnicos/Nutresa/Meals vienen del archivo certificado (estado inicial: CERTIFICADA). Alpina la registra manualmente el auxiliar (estado inicial: SIN_CERTIFICAR) y pasa al histórico sin requerir certificación previa.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `sede_id` | uuid FK → sedes | — |
| `operacion_id` | uuid FK → operaciones | Nullable |
| `aliado` | text | ALPINA / CARNICOS / FAMILIA / NUTRESA / MEALS |
| `parametro_id` | uuid FK → parametros_contables | → tipo anticipos a aliados |
| `banco_id` | integer FK → bancos | tipo EXTERNO. Solo trazabilidad. |
| `diario_caja` | text | DEN: sedes.diario_caja — diario origen para Odoo |
| `cuenta_anticipo` | text | DEN: parametros_contables.cuenta — cuenta del anticipo al aliado |
| `nit_aliado` | text | DEN: aliados.nit via operacion_id |
| `nombre_aliado` | text | DEN: aliados.razon_social via operacion_id |
| `numero_documento` | text | ID de la consignación del aliado |
| `referencia` | text | Nullable |
| `fecha` | date | — |
| `valor` | numeric | — |
| `moneda` | text | COP por defecto |
| `origen` | text | PLANILLA / DESTINO_EFECTIVO |
| `estado_certificacion` | text | CERTIFICADA / SIN_CERTIFICAR / DIFERENCIA |
| `certificada_at` | timestamptz | Nullable |
| `estado_cuadre` | text | LIBRE / BLOQUEADA / EN_CUADRE / ENVIADO_REVISION / APROBADO |
| `cuadre_id` | uuid | → cuadres. Nullable. |
| `recaudo_id` | uuid | → recaudos_dia. Nullable. |
| `bloqueada_por` | uuid | → auth.users. Nullable. |
| `bloqueada_at` | timestamptz | — |
| `registrada_por` | uuid | → auth.users. Solo Alpina manual. |
| `hash_archivo` | text | Null si registro manual Alpina |
| `leido_sharepoint_at` | timestamptz | Null si registro manual Alpina |
| `created_at` | timestamptz | — |
| `updated_at` | timestamptz | — |

**Para Odoo:** `fecha`, `diario_caja`, `cuenta_anticipo`, `nit_aliado`, `nombre_aliado`, `valor`, `referencia`.

---

### 6.4 Tablas operativas — Cuadre (5)

**`recaudos_dia`** — Un recaudo por sede por día. UNIQUE(sede_id, fecha). Es el paraguas de todos los cuadres del día.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `consecutivo` | text UNIQUE | DMA-RD-110426. Rehecho: -R1, -R2. |
| `sede_id` | uuid FK → sedes | UNIQUE con fecha |
| `fecha` | date | UNIQUE con sede_id |
| `estado` | text | BORRADOR / ABIERTO / CERRADO_AUXILIAR / APROBADO / DEVUELTO |
| `saldo_anterior` | numeric | Automático del último día aprobado. Solo Admin edita. |
| `efectivo_planillas` | numeric | Suma efectivo_real de todos los cuadres |
| `efectivo_dispersado` | numeric | Suma total de destinos |
| `nuevo_saldo` | numeric GENERATED | saldo_anterior + efectivo_planillas - efectivo_dispersado |
| `sin_movimiento` | boolean | True para domingos sin cuadres |
| `auxiliar_id` | uuid | → auth.users |
| `cerrado_at` | timestamptz | — |
| `analista_id` | uuid | → auth.users |
| `aprobado_at` | timestamptz | — |
| `nota_devolucion` | text | Obligatorio si DEVUELTO |
| `created_at` | timestamptz | — |

**Estados del recaudo:**
```
BORRADOR         → recaudo iniciado, aún no hay cuadres confirmados
ABIERTO          → al menos un cuadre confirmado
CERRADO_AUXILIAR → auxiliar cerró el día, en espera de revisión
APROBADO         → analista aprobó, promover_a_historico() ejecutado
DEVUELTO         → analista devolvió con nota
```

**`cuadres`** — Un cuadre por conjunto de planillas por día. Múltiples cuadres por recaudo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `consecutivo` | text UNIQUE | DMA-110426.01 |
| `recaudo_id` | uuid FK → recaudos_dia | — |
| `sede_id` | uuid FK → sedes | — |
| `planillas` | text[] | Array de planillas incluidas |
| `conductor_id` | uuid FK → empleados | — |
| `auxiliar1_id` | uuid FK → empleados | Nullable |
| `auxiliar2_id` | uuid FK → empleados | Nullable |
| `vehiculo_id` | uuid FK → vehiculos | — |
| `ventas_co` | numeric | Suma facturas contado |
| `ventas_cr` | numeric | Suma facturas crédito |
| `retenciones` | numeric | Suma retenciones |
| `gastos` | numeric | Suma gastos |
| `consig_riogrande` | numeric | Suma consignaciones RG |
| `consig_aliados` | numeric | Suma consignaciones aliados |
| `anticipos_nomina` | numeric | Suma anticipos nómina |
| `anticipos_recibidos` | numeric | Suma anticipos clientes (ANTICIPO) |
| `anticipos_cruce` | numeric | Suma cruces anticipo (CRUCE ANTICIPO) |
| `efectivo_teorico` | numeric GENERATED | Calculado |
| `efectivo_real` | numeric | Ingresado por auxiliar |
| `diferencia` | numeric GENERATED | efectivo_real - efectivo_teorico |
| `estado` | text | BORRADOR / CONFIRMADO / ANULADO |
| `ejecutado_por` | uuid | → auth.users |
| `anulado_por` | uuid | → auth.users. Nullable. |
| `motivo_anulacion` | text | Obligatorio si ANULADO |
| `created_at` | timestamptz | — |

**`cuadre_retenciones`** — Retenciones de clientes. 10 campos desnormalizados para Odoo.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `cuadre_id` | uuid FK → cuadres | — |
| `documento_erp_id` | uuid FK → documentos_erp | — |
| `parametro_id` | uuid FK → parametros_contables | tipo retenciones clientes |
| `nit_cliente` | text | DEN: clientes.numero_identificacion |
| `nombre_cliente` | text | DEN: clientes.nombre_establecimiento |
| `numero_factura` | text | DEN: documentos_erp.operacion_documento |
| `fecha` | date | DEN: cuadres fecha via recaudo_id |
| `codigo_externo_odoo` | text | DEN: parametros_contables.id_externo_odoo |
| `base_retencion` | numeric | DEN: documentos_erp.valor_sin_iva |
| `porcentaje` | numeric | Porcentaje aplicado (ej: 2.5) |
| `valor` | numeric | Valor retenido |
| `created_at` | timestamptz | — |

**Para Odoo:** `nit_cliente`, `numero_factura`, `fecha`, `codigo_externo_odoo`, `base_retencion`, `porcentaje`, `valor`.

**`gastos`** — Gastos de ruta. Cubre secciones 2.2 (PLANILLA) y 3.2 (DESTINO_EFECTIVO).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `cuadre_id` | uuid FK → cuadres | Nullable si origen=DESTINO_EFECTIVO |
| `recaudo_id` | uuid FK → recaudos_dia | — |
| `origen` | text | PLANILLA / DESTINO_EFECTIVO |
| `fecha` | date | Ingresado por auxiliar. Restringido por DIAS_ATRAS/ADELANTE_REGISTRO_GASTO. |
| `parametro_id` | uuid FK → parametros_contables | tipo gastos |
| `parametro_impuesto_id` | uuid FK → parametros_contables | tipo impuestos en gastos. Nullable. |
| `parametro_retencion_id` | uuid FK → parametros_contables | tipo retenciones a proveedores. Nullable. |
| `proveedor_id` | uuid FK → proveedores | Nullable |
| `cuenta_analitica_id` | uuid FK → cuentas_analiticas | Nullable |
| `documento_electronico_proveedor` | text | N° factura proveedor. Obligatorio según parametro.requiere_documento_electronico. |
| `valor_base` | numeric | Sin impuesto — ingresado por auxiliar |
| `valor_impuesto` | numeric | Ingresado manualmente. Default 0. |
| `valor_retencion` | numeric | Ingresado manualmente. Default 0. |
| `valor_total` | numeric GENERATED | valor_base + valor_impuesto - valor_retencion |
| `tipo_impuesto` | text | DEN: parametros_contables.detalle_asiento (impuesto) |
| `nit_proveedor` | text | DEN: proveedores.nit |
| `nombre_proveedor` | text | DEN: proveedores.nombre |
| `detalle_gasto` | text | DEN: parametros_contables.detalle_asiento (gasto) |
| `id_externo_gasto` | text | DEN: parametros_contables.id_externo_odoo (gasto) |
| `detalle_impuesto` | text | DEN: parametros_contables.detalle_asiento (impuesto). Nullable. |
| `id_externo_impuesto` | text | DEN: parametros_contables.id_externo_odoo (impuesto). Nullable. |
| `detalle_retencion` | text | DEN: parametros_contables.detalle_asiento (retención). Nullable. |
| `id_externo_retencion` | text | DEN: parametros_contables.id_externo_odoo (retención). Nullable. |
| `codigo_analitica_odoo` | text | DEN: cuentas_analiticas.codigo_odoo |
| `diario_caja` | text | DEN: sedes.diario_caja |
| `supera_tope` | boolean | True si valor_base > parametro.tope_maximo |
| `justificacion_tope` | text | Obligatorio si supera_tope = true |
| `created_at` | timestamptz | — |

**Para Odoo — Causación:** `fecha`, `nit_proveedor`, `nombre_proveedor`, `valor_base`, `id_externo_gasto`, `valor_impuesto`, `id_externo_impuesto`, `valor_retencion`, `id_externo_retencion`, `codigo_analitica_odoo`.
**Para Odoo — Egreso:** `fecha`, `diario_caja`, `valor_total`, `nit_proveedor`, `nombre_proveedor`.

**`cuadre_anticipos_nomina`** — Anticipos de nómina, pasajes y hurtos en ruta. Cubre secciones 2.6 (PLANILLA) y 3.2 (DESTINO_EFECTIVO). HURTO_RUTA queda en estado PENDIENTE hasta que la analista confirme la denuncia.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `cuadre_id` | uuid FK → cuadres | Nullable si origen=DESTINO_EFECTIVO |
| `recaudo_id` | uuid FK → recaudos_dia | — |
| `empleado_id` | uuid FK → empleados | — |
| `parametro_id` | uuid FK → parametros_contables | tipo anticipo de nomina |
| `cuenta_analitica_id` | uuid FK → cuentas_analiticas | Nullable |
| `origen` | text | PLANILLA / DESTINO_EFECTIVO |
| `fecha` | date | Ingresado por auxiliar |
| `concepto` | text | ANT_NOMINA / PASAJE / HURTO_RUTA |
| `valor` | numeric | — |
| `nit_empleado` | text | DEN: empleados.nit |
| `nombre_empleado` | text | DEN: empleados.nombre_completo |
| `cuenta_anticipo` | text | DEN: parametros_contables.cuenta |
| `codigo_analitica_odoo` | text | DEN: cuentas_analiticas.codigo_odoo |
| `diario_caja` | text | DEN: sedes.diario_caja |
| `estado_autorizacion` | text | APROBADO / PENDIENTE (HURTO_RUTA requiere denuncia) |
| `created_at` | timestamptz | — |

**Para Odoo:** `fecha`, `diario_caja`, `nit_empleado`, `nombre_empleado`, `cuenta_anticipo`, `codigo_analitica_odoo`, `concepto`, `valor`.

---

### 6.5 Tablas operativas — Recaudo y revisión (4)

**`traslados_caja`** — SOLO para traslados entre cajas (caja menor, TVS, Istmina, Prosegur). Los demás destinos de la sección 3.2 van a sus propias tablas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `recaudo_id` | uuid FK → recaudos_dia | — |
| `parametro_id` | uuid FK → parametros_contables | tipo traslado entre cajas |
| `fecha` | date | DEN: recaudos_dia.fecha |
| `detalle` | text | DEN: parametros_contables.detalle_asiento |
| `diario_caja` | text | DEN: sedes.diario_caja |
| `diario_destino` | text | DEN: parametros_contables.diario_odoo |
| `valor` | numeric | — |
| `descripcion` | text | Nullable — nota libre |
| `created_at` | timestamptz | — |

**Para Odoo:** `fecha`, `diario_caja`, `diario_destino`, `detalle`, `valor`.

**Tabla destino según tipo en sección 3.2:**

| Tipo de destino | Tabla destino | Campo origen |
|-----------------|--------------|--------------|
| Consignación RG | `consignaciones_banco` | `origen = DESTINO_EFECTIVO` |
| Anticipo aliado | `consignaciones_aliados` | `origen = DESTINO_EFECTIVO` |
| Gasto | `gastos` | `origen = DESTINO_EFECTIVO` |
| Anticipo nómina | `cuadre_anticipos_nomina` | `origen = DESTINO_EFECTIVO` |
| Traslado entre cajas | `traslados_caja` | — |

**`soportes_dia`** — Archivos adjuntos del día.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `recaudo_id` | uuid FK → recaudos_dia | — |
| `tipo_soporte` | text | LIQUIDACION_PLANILLAS / CREDITOS_FIRMADOS / NOTAS_CONDICIONADAS / RETENCIONES / GASTOS / CONSIG_RIOGRANDE / CONSIG_ALIADOS / ANTICIPOS_NOMINA / TRASLADOS_CAJA / ARQUEO / DENUNCIA |
| `url` | text | Ruta local estandarizada |
| `nombre_archivo` | text | DMA_20260419_RETENCIONES_DMA-RD-190426.pdf |
| `subido_por` | uuid | → auth.users |
| `created_at` | timestamptz | — |

**`checklist_revision`** — 11 ítems que revisa la analista en Vista 04. El campo `aplica` se calcula automáticamente (false si no hay registros de ese tipo en el día). Al aprobar todos los ítems se ejecuta `promover_a_historico()`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `recaudo_id` | uuid FK → recaudos_dia | UNIQUE con item |
| `item` | integer | 1 al 11 |
| `descripcion` | text | Nombre del ítem |
| `aplica` | boolean | Sistema calcula. False si no hay registros de ese tipo en el día. |
| `estado` | text | PENDIENTE / OK / CON_OBSERVACION / FALTANTE / NO_APLICA |
| `nota` | text | Obligatorio si no es OK ni NO_APLICA |
| `revisado_por` | uuid | → auth.users |
| `revisado_at` | timestamptz | — |

---

### 6.6 Tablas históricas (15)

Al aprobar un recaudo, `promover_a_historico()` copia los datos a las tablas `hist_`. Son **inmutables** en su contenido operativo — solo INSERT vía `promover_a_historico()`.

**Campos adicionales en TODAS las históricas:**
```
promovido_at    timestamptz    — cuándo se promovió
```

**Campos adicionales solo en históricas que viajan a Odoo:**
```
estado_odoo     text           — PENDIENTE / ENVIADO / CONFIRMADO / ERROR
referencia_odoo text nullable  — ID del registro en Odoo (lo confirma Odoo)
error_sync      text nullable  — Mensaje de error si Odoo rechazó
```

**Campo adicional exclusivo de `hist_documentos_erp`:**
```
fecha_recaudo   date           — DEN: recaudos_dia.fecha via recaudo_id
                               — Se resuelve al momento de promover_a_historico()
                               — Permite que la API de Odoo filtre documentos por fecha del recaudo
```

| Tabla histórica | Origen | ¿Viaja a Odoo? |
|----------------|--------|---------------|
| `hist_recaudos_dia` | recaudos_dia | ❌ |
| `hist_cuadres` | cuadres | ❌ |
| `hist_retenciones` | cuadre_retenciones | ✅ |
| `hist_gastos` | gastos | ✅ |
| `hist_anticipos_nomina` | cuadre_anticipos_nomina | ✅ |
| `hist_traslados_caja` | traslados_caja | ✅ |
| `hist_soportes_dia` | soportes_dia | ❌ |
| `hist_checklist_revision` | checklist_revision | ❌ |
| `hist_documentos_erp` | documentos_erp + fecha_recaudo | ✅ |
| `hist_consignaciones_banco` | consignaciones_banco | ✅ |
| `hist_consignaciones_aliados` | consignaciones_aliados (todos los aliados, incluido Alpina) | ✅ |
| `hist_clientes` | clientes | ✅ |
| `hist_proveedores` | proveedores | ❌ (reservado para sync futura) |
| `hist_empleados` | empleados | ❌ (reservado para sync futura) |
| `hist_documentos_dian` | documentos_dian | ❌ |

**Nota Alpina:** las consignaciones de Alpina (`estado_certificacion = SIN_CERTIFICAR`) se copian al histórico junto con los demás aliados al momento de aprobar el recaudo — sin bloqueo por certificación previa.

---

### 6.7 Audit log (1)

**`audit_log`** — Registra todas las acciones del sistema. Alimentado por triggers de PostgreSQL. Solo INSERT. Inmutable.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `tabla` | text | Nombre de la tabla afectada |
| `registro_id` | uuid | ID del registro modificado |
| `accion` | text | INSERT / UPDATE / DELETE |
| `usuario_id` | uuid | NULLIF(...,'')::uuid — protegido para sesiones sin contexto |
| `usuario_email` | text | Desnormalizado para consulta sin join |
| `ip_address` | text | IP del cliente |
| `valor_anterior` | jsonb | Estado completo antes del cambio |
| `valor_nuevo` | jsonb | Estado completo después del cambio |
| `created_at` | timestamptz | — |

---

## 7. FUNCIONES SQL CRÍTICAS

| Función | Descripción |
|---------|-------------|
| `generar_consecutivo_cuadre(sede_id, fecha)` | Genera DMA-110426.01 con FOR UPDATE para evitar duplicados |
| `generar_consecutivo_recaudo(sede_id, fecha, rehecho)` | Genera DMA-RD-110426 con sufijo -R1 si rehecho |
| `get_saldo_anterior(sede_id, fecha)` | Último nuevo_saldo aprobado de la sede |
| `validar_dias_sin_aprobar(sede_id)` | Lee MAX_DIAS_SIN_APROBAR y verifica |
| `liberar_bloqueos_expirados(sede_id?)` | Libera consignaciones BLOQUEADAS con timeout vencido. Parámetro sede_id opcional — si NULL libera todas las sedes. |
| `cruzar_documentos_dian()` | Actualiza estado_dian en documentos_erp desde documentos_dian |
| `promover_a_historico(recaudo_id)` | Copia 15 tablas al histórico con columnas explícitas. En hist_documentos_erp resuelve fecha_recaudo via join a recaudos_dia. Alpina pasa sin bloqueo por certificación. |

---

## 8. FLUJO DE VISTAS

### Vista 01 — Inicio del día
Panel de control con dos secciones:
- **Sincronización de fuentes:** estado de cada fuente (ERP, bancos, aliados) con botón "Sincronizar todas las fuentes" que dispara el script de ingesta manualmente.
- **Estado del día por sede:** saldo de caja, cantidad de cuadres, estado del recaudo y alertas activas de cada sede.

### Vista 02 — Cuadre de planillas (7 secciones)

**Sección 2.1 — Liquidación planillas**
Tabla con facturas, notas crédito, notas débito, descuentos condicionados y anticipos de clientes. Columnas: tipo, documento, cliente, valor sin IVA, IVA, total, CR/CO. El sistema calcula totales. Los descuentos condicionados sin factura referencia: la auxiliar selecciona la factura del mismo NIT manualmente.

**Sección 2.2 — Gastos de ruta**

| Columna UI | Fuente |
|------------|--------|
| Fecha | Input manual — restringido por `DIAS_ATRAS_REGISTRO_GASTO` y `DIAS_ADELANTE_REGISTRO_GASTO` vs fecha del cuadre |
| Tipo de gasto | `parametros_contables` WHERE `tipo_asiento = 'gastos'` AND (sede_id = :sede OR sede_id IS NULL) → muestra `detalle_asiento` |
| Proveedor | Búsqueda en `proveedores`. Botón "+" para crear nuevo. |
| N° Factura | Ingreso manual |
| Cuenta analítica | `cuentas_analiticas` de la sede. Sistema propone según operaciones del cuadre. |
| Tipo impuesto | `parametros_contables` WHERE `tipo_asiento = 'impuestos en gastos'`. Nullable. Si "Sin impuesto" → valor_impuesto = 0 y deshabilitado. |
| Valor impuesto ($) | Ingreso manual. Nullable. No se calcula automáticamente. |
| Retención proveedor | `parametros_contables` WHERE `tipo_asiento = 'retenciones a proveedores'`. Nullable. |
| Valor retención ($) | Ingreso manual. Nullable. No se calcula automáticamente. |
| Valor base | Ingreso manual |
| Total a pagar ($) | Calculado (solo lectura): `valor_base + valor_impuesto - valor_retencion` |

Si el `valor_base` supera `tope_maximo` del parámetro → sistema lo marca y exige justificación. Al confirmar, el sistema desnormaliza automáticamente todos los campos de Odoo desde los parámetros seleccionados.

**Sección 2.3 — Consignaciones a Riogrande**
Dropdown "Cuenta destino" apunta a `parametros_contables WHERE tipo_asiento = 'consignaciones a riogrande'` filtrado por sede — NO a la tabla `bancos`. Solo se pueden seleccionar consignaciones que existen en `consignaciones_banco`. Al seleccionar → bloqueo inmediato + desnormalización de diarios.

**Sección 2.4 — Anticipos a aliados**
- Cárnicos/Nutresa/Meals: solo consignaciones que existen en `consignaciones_aliados` con estado CERTIFICADA.
- Alpina: registro libre con dropdown banco tipo EXTERNO. Queda SIN_CERTIFICAR. Al registrar, el sistema desnormaliza `nit_aliado`, `nombre_aliado`, `cuenta_anticipo` y `diario_caja`. Pasa al histórico sin necesidad de conciliación posterior.

**Sección 2.5 — Anticipos de clientes**
Muestra documentos de `documentos_erp` con `tipo_documento IN ('ANTICIPO', 'CRUCE ANTICIPO')` del cuadre activo. Se muestran en dos grupos diferenciados visualmente:
- **ANTICIPO** — dinero recibido del cliente. Valor positivo. Suma al total de la liquidación.
- **CRUCE ANTICIPO** — cruce del anticipo contra una factura. Valor positivo. Resta del total de la liquidación.

La cuenta contable de cada registro viene directamente del plano ERP en el campo `cuenta_contable` de `documentos_erp` — no requiere selección manual.

**Sección 2.6 — Anticipos nómina**

| Columna UI | Fuente |
|------------|--------|
| Fecha | Input manual |
| Empleado | Dropdown `empleados` de la sede |
| Concepto | ANT_NOMINA / PASAJE / HURTO_RUTA |
| Cuenta analítica | `cuentas_analiticas` de la sede |
| Valor | Ingreso manual |
| Estado | APROBADO por defecto. PENDIENTE si HURTO_RUTA. |

**Sección 2.7 — Resumen del cuadre**
Ecuación: Contado - Gastos - Consig.RG - Consig.Aliados - Anticipos.Nómina = Efectivo teórico. La auxiliar ingresa el conteo físico (efectivo real). Diferencia = real - teórico. Si positivo → aprovechamiento registrado automáticamente.

Botón "Confirmar cuadre" → genera consecutivo, actualiza estados, asigna recaudo_id.

### Vista 03 — Recaudo diario (4 secciones)

**Sección 3.1 — Resumen del día**
Cards con totales de todos los cuadres del día. Saldo anterior, efectivo total, efectivo dispersado, nuevo saldo.

**Sección 3.2 — Destinos de efectivo**
Botón "Agregar Destino". Flujo cascada de dos niveles:

```
Nivel 1 (fijo por código):
  [Consignación RG | Anticipo aliado | Gasto | Anticipo nómina | Traslado entre cajas]
        ↓
Nivel 2 (dinámico desde parametros_contables filtrado por tipo y sede):
  WHERE tipo_asiento = :tipo AND (sede_id = :sede_actual OR sede_id IS NULL)
        ↓
Sistema crea registro en tabla correspondiente con origen = DESTINO_EFECTIVO
```

Para tipo "Traslado entre cajas" → solo se muestran opciones parametrizadas para la sede del usuario.
Para tipo "Gasto" → mismo formulario de la sección 2.2 con valor impuesto y retención manuales.

**Sección 3.3 — Saldo de caja**
`nuevo_saldo = saldo_anterior + efectivo_planillas - efectivo_dispersado`. Solo lectura.

**Sección 3.4 — Soportes del día**
El sistema detecta qué ítems aplican según lo registrado. La auxiliar adjunta cada archivo. El sistema lo renombra con nomenclatura estándar y lo guarda en la carpeta local parametrizada.

Tipos: LIQUIDACION_PLANILLAS / CREDITOS_FIRMADOS / NOTAS_CONDICIONADAS / RETENCIONES / GASTOS / CONSIG_RIOGRANDE / CONSIG_ALIADOS / ANTICIPOS_NOMINA / TRASLADOS_CAJA / ARQUEO / DENUNCIA.

Botón "Cerrar día" → cambia estado a CERRADO_AUXILIAR.

### Vista 04 — Revisión analista
Checklist de 11 ítems. Estado por ítem: OK / CON_OBSERVACION / FALTANTE / NO_APLICA. Si `aplica = false` → NO_APLICA automático. Nota obligatoria si no es OK.

Botón "Aprobar" → ejecuta `promover_a_historico()`. Todos los campos para Odoo quedan listos en las históricas.
Botón "Devolver" → cambia estado a DEVUELTO con nota obligatoria.

### Vista 05 — Sincronización Odoo
Solo visible para roles: Admin.

**3 bloques activos:**

**Bloque 1 — Clientes pendientes de sync**
`clientes` WHERE `sincronizado_odoo = false` OR `requiere_sync_odoo = true`. Sync automático. Bloque 2 se habilita cuando todos están CONFIRMADO.

**Bloque 2 — Documentos ERP pendientes**
`hist_documentos_erp` WHERE `estado_at = APROBADO` AND `estado_dian = APROBADO_CON_NOTIFICACION` AND `estado_odoo = PENDIENTE`. Solo se habilita cuando bloque 1 completo.

**Bloque 3 — Transacciones pendientes**
Solo se habilita cuando bloques 1 y 2 están completos. Envía en este orden:
1. `hist_retenciones` WHERE `estado_odoo = PENDIENTE`
2. `hist_gastos` WHERE `estado_odoo = PENDIENTE` (causación + egreso)
3. `hist_consignaciones_banco` WHERE `estado_odoo = PENDIENTE`
4. `hist_consignaciones_aliados` WHERE `estado_odoo = PENDIENTE`
5. `hist_anticipos_nomina` WHERE `estado_odoo = PENDIENTE`
6. `hist_traslados_caja` WHERE `estado_odoo = PENDIENTE`

Cada registro muestra badge: PENDIENTE (gris) / ENVIADO (azul) / CONFIRMADO (verde) / ERROR (rojo con detalle en `error_sync`).

**Habilitadores:**
- `SYNC_ODOO_MANUAL_ACTIVA = true` → botones activos
- `SYNC_ODOO_AUTOMATICA_ACTIVA = true` → sync programática

> **Nota:** Los bloques de sync de proveedores y empleados con Odoo están desactivados en la UI (implementación futura). Los campos `sincronizado_odoo` y `requiere_sync_odoo` en esas tablas se conservan para cuando se activen.

---

## 9. INFORMES

| Informe | Fuente | Roles |
|---------|--------|-------|
| Estado de planillas | cuadres + recaudos_dia | Todos |
| Estado del día | recaudos_dia | Todos |
| Detalle del día | cuadres detalle | Todos |
| Planillas pendientes | documentos_erp estado CERRADA sin cuadre | Analista, Admin |
| Saldos de efectivo | recaudos_dia histórico | Analista, Admin |
| Consignaciones Banco | consignaciones_banco | Analista, Admin |
| Consignaciones Aliados | consignaciones_aliados | Analista, Admin |
| Auditoría Máximo Detalle | todas las tablas hist_ | Analista, Director, Admin |
| Plano Documentos ERP | hist_documentos_erp + clientes | Admin |
| Estado Documentos ERP | hist_documentos_erp | Admin |
| Conciliación ERP vs DIAN | hist_documentos_erp + documentos_dian | Admin |
| Documentos listos para Odoo | hist_documentos_erp | Admin |
| Transacciones pendientes Odoo | hist_retenciones, hist_gastos, hist_consignaciones_banco, hist_consignaciones_aliados, hist_anticipos_nomina, hist_traslados_caja | Admin |

### Informe — Plano Documentos ERP
Filtros: Sede, Operación, Rango de fechas, Tipo documento, CR/CO, Estado analista, Estado DIAN. Columnas: todos los campos relevantes + datos del cliente desde `clientes`. Siempre se descarga como Excel por volumen.

### Informe — Estado Documentos ERP
Filtros: Sede, Operación, Rango de fechas, Tipo documento, Estado analista (estado_at), Estado DIAN (estado_dian). Columnas: Operación, Planilla, Documento electrónico, Tipo, Fecha recaudo, Fecha emisión, CR/CO, Cliente, Valor base, IVA, Total, Estado analista, Estado DIAN, Validado DIAN at.

### Informe — Conciliación ERP vs DIAN
Descargable como Excel con 2 pestañas:
- **Pestaña 1:** En ERP pero NO en DIAN (documentos sin validar)
- **Pestaña 2:** En DIAN pero NO en ERP

Filtros: Sede, Operación, Rango de fechas.

### Informe — Documentos listos para Odoo
Filtro fijo: `estado_at = APROBADO` AND `estado_dian = APROBADO_CON_NOTIFICACION`. Filtros adicionales: Sede, Operación, Rango de fechas. Badge de estado: PENDIENTE / ENVIADO / CONFIRMADO / ERROR.

### Informe — Transacciones pendientes Odoo
Muestra todas las transacciones históricas con `estado_odoo = PENDIENTE / ERROR` agrupadas por tipo. Filtros: Sede, Rango de fechas, Tipo, Estado Odoo.

---

## 10. PENDIENTES DE DEFINIR CON IMPLEMENTADOR ODOO

1. **Endpoints API:** URL y estructura JSON exacta para cada tipo de transacción.
2. **`id_externo_odoo` por tipo:** listado exacto de External IDs configurados en Odoo para retenciones clientes, retenciones proveedores, gastos e impuestos.
3. **Diarios por tipo:** qué diario de Odoo corresponde a cada parámetro de consignaciones RG y traslados entre cajas.
4. **Diario de caja por sede:** el código exacto del diario en Odoo para cada una de las 4 sedes.
5. **Confirmación de recepción:** cómo confirma Odoo que procesó un registro — para actualizar `estado_odoo = CONFIRMADO` y guardar `referencia_odoo`.
6. **Causación vs egreso gastos:** confirmar si Odoo los recibe como un solo objeto o dos llamadas separadas a la API.

---

## 11. INFRAESTRUCTURA Y DEPLOY

| Componente | Tecnología | Descripción |
|-----------|-----------|-------------|
| Frontend | React + Vite + TypeScript | Aplicación web |
| Base de datos | Supabase (PostgreSQL) | BD principal — DEV y PROD como proyectos separados |
| Autenticación | Supabase Auth | Email + password, roles via tabla `perfiles` |
| Motor de ingesta | Supabase Edge Functions | Parsea Excel de SharePoint e inserta en Supabase. Soporta modo manual (botón en UI) y automático (cron a `HORA_SYNC_AUTOMATICA`) |
| Deploy app web | Google Cloud Platform | Cloud Run para la app React |
| RPA ECOM | Google Cloud Platform (implementación futura) | Python + pandas. Automatiza descarga de ECOM, cruza archivos y genera plano para SharePoint |
| Piloto | Sede Donmatías (DMA) | Primera sede en producción |
| Migración futura | Azure | Cuando el almacenamiento supere ~20GB (~4-5 años) |

---

## 12. HISTORIAL DE CAMBIOS

### v7.2 → v7.3

| Elemento | Cambio |
|----------|--------|
| **Stack** | Reemplazado Lovable + Antigravity por React + Vite + TypeScript. Deploy en GCP en lugar de Vercel. |
| **Ingesta** | Aclarado: manual = botón en UI que dispara el script. Automático = Supabase Edge Functions con cron. |
| **Plano ERP** | Aclarado: anticipos (ANTICIPO y CRUCE ANTICIPO) van en el mismo archivo del plano ERP, no en archivo separado. |
| **Conciliación Alpina** | Vista desactivada en UI (implementación futura). Alpina pasa al histórico sin bloqueo por certificación. |
| **`promover_a_historico()`** | Eliminada condición `AND NOT (aliado = 'ALPINA' AND estado_certificacion = 'SIN_CERTIFICAR')`. |
| **Sync Odoo** | Reducido a 3 bloques activos. Bloques de proveedores y empleados desactivados en UI (implementación futura). |
| **`hist_proveedores` / `hist_empleados`** | Marcadas como reservadas para sync futura — no viajan a Odoo en esta versión. |
| **Roles** | Eliminada Conciliación Alpina del acceso del analista (vista desactivada). |
| **Informes** | Eliminado informe "Conciliación Alpina". Ampliada tabla de informes con los reportes completos. |

---

*Documento interno — Distribuciones Riogrande · Plataforma Tesorería v7.3 · 2026-05-22*

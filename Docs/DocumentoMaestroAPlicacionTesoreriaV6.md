# Documento Maestro — Plataforma de Tesorería
## Distribuciones Riogrande · Versión 6
**Fecha:** 2026-04-23  
**Stack:** Lovable + Antigravity + Supabase (PostgreSQL)  
**Migración futura:** Azure

---

## 1. CONTEXTO DEL NEGOCIO

Distribuciones Riogrande es una empresa de distribución TAT (Tienda a Tienda) con 27 años de experiencia. Opera en 4 sedes, 10 operaciones comerciales y 5 aliados estratégicos.

### 1.1 Sedes

| Código | Nombre | Letra | Cuenta Caja |
|--------|--------|-------|-------------|
| DMA | Donmatías | D | 130501 |
| CAC | Caucasia | C | 130502 |
| APA | Apartadó | A | 130503 |
| QBO | Quibdó | Q | 130504 |

### 1.2 Operaciones

| Código | Sede | Aliado | ERP |
|--------|------|--------|-----|
| DA | Donmatías | Alpina | SIDIS |
| DC | Donmatías | Cárnicos | ECOM |
| DF | Donmatías | Familia | SIDIS |
| CA | Caucasia | Alpina | ECOM |
| CC | Caucasia | Cárnicos | ECOM |
| CN | Caucasia | Nutresa | ECOM |
| AA | Apartadó | Alpina | SIDIS |
| QC | Quibdó | Cárnicos | ECOM |
| QN | Quibdó | Nutresa | ECOM |
| QM | Quibdó | Meals | ECOM |

### 1.3 Aliados

| Aliado | Letra | Tipo certificación |
|--------|-------|-------------------|
| Alpina | A | Manual por auxiliar — conciliación mensual |
| Cárnicos (Zenú) | C | Archivo certificado por aliado |
| Familia | F | Archivo certificado por aliado |
| Nutresa | N | Archivo certificado por aliado |
| Meals (Crem Helado) | M | Archivo certificado por aliado |

---

## 2. PROBLEMA Y SOLUCIÓN

**Problema actual:** El cuadre diario de caja se hace en Excel. Los asientos contables se registran al final del mes. No hay trazabilidad, hay riesgo de fraude y hay 10 fuentes de datos sin consolidar.

**Solución:** Plataforma web que reemplaza el Excel. Automatiza el cuadre diario, genera asientos contables y sincroniza con Odoo.

---

## 3. ROLES Y PERMISOS

| Rol | Acceso |
|-----|--------|
| **auxiliar** | Solo su sede. Hace cuadres, gestiona recaudo, adjunta soportes, descarga informes propios. NO accede a planos SharePoint. |
| **analista** | Todas las sedes. Puede hacer cuadres (cubre vacaciones — log registra quién). Revisa y aprueba. Conciliación Alpina. |
| **director** | Todo lo anterior + anular cuadres aprobados (motivo obligatorio) + autorizar hurtos. |
| **admin** | Parametrización completa, gestión usuarios, editar saldo inicial de caja, habilitadores de ingesta y sync. |
| **contabilidad** | Deposita planos en SharePoint, descarga plano contable Odoo, solo lectura en informes. |

---

## 4. ARQUITECTURA SHAREPOINT

```
📁 RioTesorería/
├── 📁 Planos/
│   ├── ERP/           → DA_2026_04.xlsx, ANTICIPOS_DA_2026_04.xlsx
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

**Reglas de ingesta:**
- Planos ERP: upsert en `documentos_erp` y `clientes` usando `operacion_documento` como clave
- Extractos banco: upsert en `consignaciones_banco` usando `banco_id` + `referencia` como clave. El `banco_id` lo pone contabilidad en el Excel.
- Aliados (Cárnicos/Nutresa/Meals): upsert en `consignaciones_aliados` — 1 archivo por operación
- Alpina: upsert en `consignaciones_aliados` — 1 archivo con todas las sedes, columna Caja identifica la sede
- DIAN: upsert en `documentos_dian` usando `documento_electronico` como clave. Al insertar, trigger actualiza automáticamente `documentos_erp.estado_dian`

**Habilitadores de ingesta (parametros_sistema):**
- `INGESTA_MANUAL_ACTIVA`: habilita botón "Sincronizar" manual
- `INGESTA_AUTOMATICA_ACTIVA`: habilita sync automática a la hora de `HORA_SYNC_AUTOMATICA`

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
        ↓ sync (manual o automática según habilitadores)
Vista 01: Inicio del día — auxiliar selecciona planillas CERRADAS en ERP
        ↓
Vista 02: Cuadre (7 secciones) → genera consecutivo DMA-110426.01
        ↓
Vista 03: Recaudo diario → destinos efectivo → saldo → soportes → cierra día
        ↓ (bloqueado para auxiliar)
Vista 04: Analista revisa checklist → aprueba
        ↓
promover_a_historico() → BD Temporal → BD Histórica
generar_asientos() → asientos_contables
        ↓
Vista 05: Sync Odoo
  Paso 1: Sync maestro clientes (todos deben estar antes de enviar facturas)
  Paso 2: Sync documentos_erp (solo estado_dian = APROBADO_CON_NOTIFICACION AND estado_at = APROBADO)
  Paso 3: Sync maestro proveedores
  Paso 4: Sync asientos_contables (estado_odoo = PENDIENTE)
```

**Reglas críticas del flujo:**
- Auxiliar NO puede iniciar nuevo recaudo sin cerrar el anterior
- Máximo `MAX_DIAS_SIN_APROBAR` días en estado CERRADO_AUXILIAR sin aprobar → bloquea la auxiliar
- Días sin movimiento (domingos) igual deben abrirse y cerrarse (`sin_movimiento = true`)
- Consecutivo cuadre: DMA-110426.01 (reinicia cada día por sede)
- Consecutivo recaudo: DMA-RD-110426 (único por sede por día; rehecho: -R1, -R2)
- Estado BORRADOR: permite retomar el recaudo si la consignación del día aún no aparece en el extracto

---

## 6. MODELO DE DATOS — 39 TABLAS

### 6.1 Tablas maestras y parámetros (9)

**`sedes`** — 4 registros fijos. `cuenta_caja` es la cuenta contable de efectivo de cada sede.

**`operaciones`** — 10 registros fijos. Una operación = una sede + un aliado + un ERP.

**`bancos`** — Catálogo de bancos con ID numérico (se usa en Excel de ingesta). `tipo`: RIOGRANDE (cuentas propias) / EXTERNO (aliados y clientes).

**`cuentas_analiticas`** — Distribuciones analíticas en formato JSON para Odoo. Registros simples (100% una operación) pre-cargados. El sistema calcula las combinadas automáticamente dividiendo en partes iguales según las operaciones del cuadre. Ejemplo: cuadre DA+DC → `{"7":50,"8":50}`.

**`parametros_contables`** — Corazón de la contabilidad. Tipos:
- `RETENCION_CLIENTE` — retenciones que hacen los clientes sobre las facturas
- `RETENCION_PROVEEDOR` — retenciones que Riogrande hace a proveedores de gastos
- `GASTO` — gastos de ruta (peajes, combustible, alimentación, robos, etc.)
- `CONSIGNACION_RG` — consignaciones a cuentas bancarias de Riogrande. Un parámetro por banco (la cuenta débito depende del banco).
- `CONSIGNACION_ALIADO` — anticipos a aliados. Un parámetro por aliado por sede (el banco NO afecta la cuenta contable — solo se guarda para trazabilidad).
- `ANTICIPO_NOMINA` — anticipos, pasajes y faltantes a empleados
- `APROVECHAMIENTO` — sobrantes de efectivo
- `TRASLADO_EFECTIVO` — traslados a caja menor, TVS, Istmina
- `IVA_DESCONTABLE` — IVA de compras descontable (5% o 19%)
- `ANTICIPO_CLIENTE` — anticipos recibidos de clientes (valor positivo)
- `DESCUENTO_ANTICIPO_CLIENTE` — cruce de anticipo con factura (valor negativo)

**Lógica cuenta crédito:** `COALESCE(cuenta_contable_credito, sedes.cuenta_caja)`. Si `cuenta_contable_credito` es NULL, el sistema usa la cuenta de caja de la sede automáticamente. En pantalla muestra el valor real calculado, no vacío.

**`parametros_sistema`** — Claves configurables:

| Clave | Valor inicial | Descripción |
|-------|--------------|-------------|
| MARGEN_DIAS_ANTES | 3 | Días antes para buscar consignaciones |
| MARGEN_DIAS_DESPUES | 1 | Días después para buscar consignaciones |
| TIMEOUT_SESION_MINUTOS | 30 | Timeout de bloqueo de consignaciones |
| HORA_SYNC_AUTOMATICA | 06:00 | Hora de sync automática |
| MAX_DIAS_SIN_APROBAR | 2 | Máximo días sin aprobar |
| RUTA_SOPORTES_DMA | C:\RioTesoreria\Soportes\DMA\ | Ruta soportes Donmatías |
| RUTA_SOPORTES_CAC | C:\RioTesoreria\Soportes\CAC\ | Ruta soportes Caucasia |
| RUTA_SOPORTES_APA | C:\RioTesoreria\Soportes\APA\ | Ruta soportes Apartadó |
| RUTA_SOPORTES_QBO | C:\RioTesoreria\Soportes\QBO\ | Ruta soportes Quibdó |
| INGESTA_MANUAL_ACTIVA | true | Habilita ingesta manual |
| INGESTA_AUTOMATICA_ACTIVA | false | Habilita ingesta automática |
| SYNC_ODOO_MANUAL_ACTIVA | true | Habilita sync manual con Odoo |
| SYNC_ODOO_AUTOMATICA_ACTIVA | false | Habilita sync automática con Odoo |

**`empleados`** — Conductores, auxiliares y personal de tesorería. Desactivar en lugar de borrar.

**`vehiculos`** — Maestro de placas por sede. Desactivar en lugar de borrar.

**`consecutivos_cuadre`** — Un registro por sede. El sistema lo actualiza al confirmar cada cuadre. Reinicia el contador cuando cambia la fecha.

---

### 6.2 Tablas maestras de terceros (2)

**`clientes`** — Alimentado desde el plano ERP via upsert. Clave única: `operacion_codigo_cliente` (ej: DA-1). Es el ID externo en Odoo para cartera diferenciada por establecimiento. Todos los clientes de Odoo vienen del ERP.

**Lógica de upsert clientes:**
```
Llega cliente DA-1 del plano ERP
        ↓
¿Existe en tabla clientes?
SÍ → UPDATE. ¿Cambiaron datos? → requiere_sync_odoo = true, sincronizado_odoo = false
NO → INSERT. sincronizado_odoo = false
```

**`proveedores`** — Pre-cargado por Admin. La auxiliar puede agregar nuevos desde el cuadre (botón "Agregar proveedor"). Los nuevos quedan con `sincronizado_odoo = false` y bloquean el envío de asientos a Odoo hasta que estén sincronizados.

**Campos de sincronización en ambas tablas:**
- `sincronizado_odoo`: true cuando Odoo confirma recepción
- `sincronizado_at`: cuándo se sincronizó
- `requiere_sync_odoo`: true cuando hay cambios pendientes de re-sincronizar
- `error_sync`: mensaje de error si Odoo rechazó

---

### 6.3 Tablas de ingesta (4)

**`documentos_erp`** — Facturas, notas crédito/débito y anticipos de clientes. Clave de upsert: `operacion_documento`. Datos del cliente en tabla `clientes` (FK `cliente_id`). El campo `documento_electronico` es la clave de cruce con `documentos_dian`.

**Estados:**
- `estado_planilla_erp`: CERRADA (cuadrable) / ABIERTA (solo lectura)
- `estado_at`: PENDIENTE / EN_CUADRE / ENVIADO_REVISION / APROBADO
- `estado_dian`: SIN_VALIDAR / APROBADO_CON_NOTIFICACION / RECHAZADO / PENDIENTE

**Condición para enviar a Odoo:** `estado_at = APROBADO` AND `estado_dian = APROBADO_CON_NOTIFICACION`

**Descuentos condicionados:** cuando no vienen ligados a una factura en el ERP, la auxiliar selecciona la factura del mismo NIT manualmente. El sistema llena automáticamente `factura_referencia`, `planilla` y `operacion_planilla` desde la factura seleccionada.

**`documentos_dian`** — Informe DIAN importado por contabilidad. Clave: `documento_electronico` (prefijo + folio). Al insertar o actualizar, un trigger actualiza automáticamente `documentos_erp.estado_dian` en todos los documentos que coincidan por `documento_electronico`.

**`consignaciones_banco`** — Extractos bancarios de Riogrande. El `banco_id` (numérico) lo pone contabilidad en el Excel antes de subirlo. La `sede_id` se deduce del cruce con la tabla de referencias del Excel de contabilidad.

**`consignaciones_aliados`** — Consignaciones de aliados:
- Cárnicos/Nutresa/Meals: vienen del archivo certificado del aliado. Estado inicial: CERTIFICADA.
- Alpina: la auxiliar las registra manualmente con comprobante físico. Estado inicial: SIN_CERTIFICAR. Sus asientos se generan al conciliar mensualmente (~día 15).
- El `banco_id` lo selecciona la auxiliar de un dropdown que muestra solo `tipo = EXTERNO`. Solo para trazabilidad — no afecta el asiento contable.
- El `parametro_id` lo resuelve el sistema al importar buscando en `parametros_contables` donde `tipo = CONSIGNACION_ALIADO` AND `sede_id = X` AND aliado coincide.

**Regla de bloqueo de consignaciones:**
- Al seleccionar en el cuadre → estado_cuadre = BLOQUEADA + se registra `bloqueada_por` y `bloqueada_at`
- Timeout = `TIMEOUT_SESION_MINUTOS` → función `liberar_bloqueos_expirados()` las libera automáticamente
- Solo se pueden halar si existen en BD (Cárnicos/Nutresa/Meals y banco RG)
- Alpina: registro libre → queda SIN_CERTIFICAR

---

### 6.4 Tablas operativas — Cuadre (4)

**`cuadres`** — Un cuadre agrupa 1 o varias planillas de la misma sede. Incluye tripulación (conductor, auxiliar_1, auxiliar_2, vehículo). El consecutivo se genera al confirmar. El `recaudo_id` se asigna al pasar al recaudo.

**`cuadre_retenciones`** — Retenciones de clientes por factura. Solo facturas CONTADO. El sistema calcula la base (`valor_sin_iva` - notas crédito). La auxiliar puede corregir. Cuenta analítica y diario se heredan de `documentos_erp`.

**`gastos`** — Gastos de ruta Y hurtos. Cubre secciones 2.2 (PLANILLA) y 3.2 (TRASLADO_CAJA). El campo `origen` identifica de dónde viene. Incluye soporte para IVA descontable (tarifa 0/5/19) y retención al proveedor. El `proveedor_id` referencia la tabla `proveedores`. Si el proveedor no existe, la auxiliar puede crearlo desde el formulario.

**`cuadre_anticipos_nomina`** — Anticipos de nómina, pasajes y hurtos en ruta. Cubre secciones 2.6 (PLANILLA) y 3.2 (TRASLADO_CAJA — cuando la descuadrada es la auxiliar de tesorería). HURTO_RUTA queda en estado PENDIENTE hasta que la analista confirme la denuncia.

---

### 6.5 Tablas operativas — Recaudo y revisión (4)

**`recaudos_dia`** — Un recaudo por sede por día. UNIQUE(sede_id, fecha). Es el paraguas de todos los cuadres del día.

**Estados del recaudo:**
```
BORRADOR → ABIERTO → CERRADO_AUXILIAR → APROBADO → (históricas)
                   ↘ DEVUELTO (analista devuelve con nota)
```
Estado BORRADOR: permite guardar y retomar sin cerrar (útil cuando la consignación del día 19 aún no aparece en el extracto del día 20).

**`destinos_efectivo`** — SOLO traslados de caja (caja menor, TVS, Istmina). Los demás destinos de la sección 3.2 van a sus propias tablas:

| Tipo de destino en sección 3.2 | Tabla destino |
|--------------------------------|--------------|
| CONSIGNACION_RG | `consignaciones_banco` con origen=TRASLADO_CAJA |
| CONSIGNACION_ALIADO | `consignaciones_aliados` con origen=TRASLADO_CAJA |
| GASTO | `gastos` con origen=TRASLADO_CAJA |
| ANTICIPO_NOMINA | `cuadre_anticipos_nomina` con origen=TRASLADO_CAJA |
| TRASLADO_EFECTIVO | `destinos_efectivo` |

**Flujo cascada sección 3.2:**
```
Auxiliar elige Tipo → sistema filtra parametros_contables
        ↓
Auxiliar elige Destino (nombre_asiento)
        ↓
Sistema crea registro en la tabla correspondiente
```

**`soportes_dia`** — Archivos adjuntos del día. El sistema detecta qué ítems aplican según lo registrado. Nomenclatura: `DMA_20260419_RETENCIONES_DMA-RD-190426.pdf`. Tipos: LIQUIDACION_PLANILLAS / CREDITOS_FIRMADOS / NOTAS_CONDICIONADAS / RETENCIONES / GASTOS / CONSIG_RIOGRANDE / CONSIG_ALIADOS / ANTICIPOS_NOMINA / DESTINOS_EFECTIVO / ARQUEO / DENUNCIA.

**`checklist_revision`** — 11 ítems que revisa la analista en Vista 04. El campo `aplica` se calcula automáticamente (false si no hay registros de ese tipo en el día). Al aprobar todos los ítems se ejecuta `promover_a_historico()` y `generar_asientos()`.

---

### 6.6 Asientos contables (1)

**`asientos_contables`** — Una fila por línea de débito o crédito. Generada por `generar_asientos()` al aprobar el día. NO incluye facturas ni notas — esas viajan a Odoo directamente desde `hist_documentos_erp`.

**Lógica general de la cuenta crédito:**
```sql
credito_cuenta = COALESCE(parametro.cuenta_contable_credito, sedes.cuenta_caja)
```

**Los 10 tipos de asiento:**

| # | Tipo | Débito | Crédito | Referencia | Analítica |
|---|------|--------|---------|------------|-----------|
| 1 | APROVECHAMIENTO | sedes.cuenta_caja | param.cuenta_contable_debito | cuadres.consecutivo | param.cuenta_analitica |
| 2 | RETENCION_CLIENTE | param.cuenta_contable_debito | COALESCE(param.credito, caja) | documentos_erp.factura_referencia | documentos_erp.cuenta_analitica |
| 3 | GASTO | param.cuenta_contable_debito | COALESCE(param.credito, caja) | doc_electronico_proveedor o consecutivo | gastos.cuenta_analitica_id |
| 3b | GASTO + IVA | param_iva.cuenta_contable_debito | COALESCE(param.credito, caja) | idem | idem |
| 3c | GASTO + RETENCION | param.cuenta_contable_debito / COALESCE(param.credito,caja) | param_ret.cuenta_contable_debito / COALESCE(param.credito,caja) | idem | idem |
| 4 | CONSIGNACION_RG | param.cuenta_contable_debito | COALESCE(param.credito, caja) | consignaciones_banco.referencia | — |
| 5 | CONSIGNACION_ALIADO | param.cuenta_contable_debito | COALESCE(param.credito, caja) | consecutivo recaudo | param.cuenta_analitica |
| 6 | ANTICIPO_NOMINA | param.cuenta_contable_debito | COALESCE(param.credito, caja) | consecutivo cuadre | cuadre_anticipos_nomina.cuenta_analitica_id |
| 7 | TRASLADO_EFECTIVO | param.cuenta_contable_debito | COALESCE(param.credito, caja) | consecutivo recaudo | — |
| 8 | ANTICIPO_CLIENTE (+) | sedes.cuenta_caja | param.cuenta_contable_debito | operacion_codigo_cliente | documentos_erp.cuenta_analitica |
| 9 | DESCUENTO_ANTICIPO_CLIENTE (-) | param.cuenta_contable_debito | param.cuenta_contable_credito | documentos_erp.factura_referencia | documentos_erp.cuenta_analitica |

**Nota sobre Alpina:** sus asientos se generan con `generar_asientos_alpina()` al certificar la conciliación mensual, no al aprobar el día.

**Nota sobre retenciones clientes:** solo se generan para documentos con `cr_co = CONTADO`. Las de crédito las maneja cartera cuando registra el pago. La integración exacta con Odoo (cruce con factura, recibo de caja automático) está pendiente de definir con el implementador de Odoo.

**Estado de sincronización:** `estado_odoo`: PENDIENTE / ENVIADO / CONFIRMADO / ERROR. Si Odoo rechaza, se registra en `error_sync`.

---

### 6.7 Tablas históricas (14)

Al aprobar un recaudo, `promover_a_historico()` copia los datos a las tablas hist_. Son **inmutables** — solo INSERT. Cada tabla hist_ es copia exacta de su origen más el campo `promovido_at`.

Tablas: hist_recaudos_dia, hist_cuadres, hist_retenciones, hist_gastos, hist_anticipos_nomina, hist_destinos_efectivo, hist_soportes_dia, hist_checklist_revision, hist_documentos_erp, hist_consignaciones_banco, hist_consignaciones_aliados, hist_clientes, hist_proveedores, hist_documentos_dian.

**Excepción:** Alpina con estado SIN_CERTIFICAR NO se copia al histórico hasta completar la conciliación mensual.

---

### 6.8 Audit log (1)

**`audit_log`** — Registra todas las acciones del sistema incluyendo cambios en tablas maestras. Alimentado por triggers de PostgreSQL. Solo INSERT. Inmutable.

---

## 7. FUNCIONES SQL CRÍTICAS

| Función | Descripción |
|---------|-------------|
| `generar_consecutivo_cuadre(sede_id, fecha)` | Genera DMA-110426.01 con lock para evitar duplicados |
| `generar_consecutivo_recaudo(sede_id, fecha, rehecho)` | Genera DMA-RD-110426 con sufijo -R1 si rehecho |
| `get_saldo_anterior(sede_id, fecha)` | Último nuevo_saldo aprobado de la sede |
| `validar_dias_sin_aprobar(sede_id)` | Lee MAX_DIAS_SIN_APROBAR y verifica |
| `liberar_bloqueos_expirados()` | Libera consignaciones BLOQUEADAS con timeout vencido |
| `cruzar_documentos_dian()` | Actualiza estado_dian en documentos_erp desde documentos_dian |
| `promover_a_historico(recaudo_id)` | Copia 14 tablas al histórico |
| `generar_asientos(recaudo_id)` | Construye los 10 tipos de asientos contables |
| `generar_asientos_alpina(sede_id, mes, anio)` | Asientos de Alpina al conciliar mensualmente |

---

## 8. FLUJO DE VISTAS

### Vista 01 — Inicio del día
- Auxiliar selecciona sede y fecha
- Sistema muestra planillas disponibles con estado CERRADA en el ERP
- Auxiliar selecciona las planillas a cuadrar
- Botón "Inicio del Día" — habilita el cuadre

### Vista 02 — Cuadre de planillas (7 secciones)

**Sección 2.1 — Liquidación planillas**
Tabla con facturas, notas crédito, notas débito, descuentos condicionados y anticipos de clientes. Columnas: tipo, documento, cliente, valor sin IVA, IVA, total, CR/CO. El sistema calcula totales. Los descuentos condicionados sin factura referencia: la auxiliar selecciona la factura del mismo NIT manualmente.

**Sección 2.2 — Gastos de ruta**
| Columna | Descripción |
|---------|-------------|
| Tipo de gasto | Dropdown parametros_contables tipo GASTO de la sede |
| Proveedor | Búsqueda en tabla proveedores. Botón "+" para crear nuevo. |
| Doc. electrónico proveedor | Obligatorio según parámetro `requiere_documento_electronico` |
| Cuenta analítica | Dropdown cuentas_analiticas de la sede. Sistema propone según operaciones del cuadre. |
| Tarifa IVA | Dropdown parametros_contables tipo IVA_DESCONTABLE (0%, 5%, 19%) |
| Retención proveedor | Dropdown parametros_contables tipo RETENCION_PROVEEDOR. Nullable. |
| Valor base | Sin IVA |
| IVA | Calculado |
| Retención | Calculada |
| Total | Generado: base + IVA - retención |

Si el total supera el `tope_maximo` del parámetro → sistema lo marca y exige justificación.

**Sección 2.3 — Consignaciones a Riogrande**
Solo se pueden halar consignaciones que existen en `consignaciones_banco`. Dropdown de banco filtra tipo RIOGRANDE. Al seleccionar → bloqueo inmediato.

**Sección 2.4 — Anticipos a aliados**
- Cárnicos/Nutresa/Meals: solo se pueden halar consignaciones que existen en `consignaciones_aliados` con estado CERTIFICADA.
- Alpina: registro libre con dropdown banco tipo EXTERNO. Queda SIN_CERTIFICAR.

**Sección 2.5 — Anticipos de clientes**
Muestra anticipos de `documentos_erp` con `tipo_documento = ANTICIPO`. Positivos y negativos según corresponda.

**Sección 2.6 — Anticipos nómina**
| Columna | Descripción |
|---------|-------------|
| Empleado | Dropdown empleados de la sede |
| Concepto | ANT_NOMINA / PASAJE / HURTO_RUTA |
| Cuenta analítica | Dropdown cuentas_analiticas. Sistema propone. |
| Valor | — |
| Estado | APROBADO por defecto. PENDIENTE si HURTO_RUTA. |

**Sección 2.7 — Resumen del cuadre**
Muestra la ecuación: Contado - Gastos - Consig.RG - Consig.Aliados - Anticipos.Nómina = Efectivo teórico. La auxiliar ingresa el conteo físico (efectivo real). Diferencia = real - teórico. Si positivo → aprovechamientos.

Botón "Confirmar cuadre" → genera consecutivo, actualiza estados, asigna recaudo_id.

### Vista 03 — Recaudo diario (4 secciones)

**Sección 3.1 — Resumen del día**
Cards con totales de todos los cuadres del día. Saldo anterior, efectivo total, efectivo dispersado, nuevo saldo.

**Sección 3.2 — Destinos de efectivo**
Botón "Agregar Destino". Flujo cascada:
```
Tipo → [CONSIGNACION_RG | CONSIGNACION_ALIADO | GASTO | ANTICIPO_NOMINA | TRASLADO_EFECTIVO]
        ↓
Destino → dropdown de parametros_contables filtrado por tipo y sede
        ↓ (para GASTO y ANTICIPO_NOMINA)
Cuenta analítica → dropdown cuentas_analiticas de la sede
```

**Sección 3.3 — Saldo de caja**
nuevo_saldo = saldo_anterior + efectivo_planillas - efectivo_dispersado. Solo lectura.

**Sección 3.4 — Soportes del día**
El sistema detecta qué ítems aplican según lo registrado en el día. La auxiliar adjunta cada archivo. El sistema lo renombra con nomenclatura estándar y lo guarda en la carpeta local parametrizada. Tipos: LIQUIDACION_PLANILLAS / CREDITOS_FIRMADOS / NOTAS_CONDICIONADAS / RETENCIONES / GASTOS / CONSIG_RIOGRANDE / CONSIG_ALIADOS / ANTICIPOS_NOMINA / DESTINOS_EFECTIVO / ARQUEO / DENUNCIA.

Botón "Cerrar día" → cambia estado a CERRADO_AUXILIAR.

### Vista 04 — Revisión analista
Checklist de 11 ítems. Cada ítem tiene estado: OK / CON_OBSERVACION / FALTANTE / NO_APLICA. Si aplica=false el ítem se muestra como NO_APLICA automáticamente. Nota obligatoria si no es OK. Botón "Aprobar" → ejecuta promover_a_historico() y generar_asientos(). Botón "Devolver" → cambia estado a DEVUELTO con nota obligatoria.

### Vista 05 — Sincronización Odoo
Solo visible para roles: Contabilidad y Admin.

**4 bloques secuenciales y bloqueantes:**

**Bloque 1 — Clientes pendientes de sync**
Tabla: clientes donde `sincronizado_odoo = false` OR `requiere_sync_odoo = true`. Botón "Sincronizar clientes". Estado por cliente: PENDIENTE / SINCRONIZADO / ERROR. El bloque 2 solo se habilita cuando todos están SINCRONIZADO.

**Bloque 2 — Documentos ERP pendientes**
Tabla: `hist_documentos_erp` donde `estado_at = APROBADO` AND `estado_dian = APROBADO_CON_NOTIFICACION` AND aún no enviados. Solo se habilita cuando bloque 1 está completo. Botón "Sincronizar documentos".

**Bloque 3 — Proveedores pendientes de sync**
Tabla: proveedores donde `sincronizado_odoo = false` OR `requiere_sync_odoo = true`. Puede correr en paralelo con bloque 1. Botón "Sincronizar proveedores". El bloque 4 solo se habilita cuando bloques 1, 2 y 3 estén completos.

**Bloque 4 — Asientos contables pendientes**
Tabla: `asientos_contables` donde `estado_odoo = PENDIENTE`. Botón "Sincronizar asientos". Muestra errores en campo `error_sync` si Odoo rechazó.

**Nota sobre integración Odoo:** el formato exacto de envío (endpoints, estructura JSON, manejo de errores) está pendiente de definir con el implementador de Odoo 19. La tabla `asientos_contables` es el contrato de datos — cualquier formato que Odoo necesite se construye desde ahí.

**Habilitadores (parametros_sistema):**
- `SYNC_ODOO_MANUAL_ACTIVA = true` → botones visibles y activos
- `SYNC_ODOO_AUTOMATICA_ACTIVA = true` → sync programática a hora definida

### Vista 06 — Conciliación Alpina
Solo visible para roles: Analista y Admin. Detalle en sección 9.

---

## 9. CONCILIACIÓN ALPINA

- Analista sube reporte Alpina (tiene columna Caja = todas las sedes en 1 archivo)
- Cruce automático: valor EXACTO + fecha EXACTA + sede
- Ambigüedades (mismo valor/fecha/sede, múltiples candidatas) → revisión manual
- Sin coincidencia → DIFERENCIA para investigar
- Al certificar → genera asientos pendientes de Alpina via `generar_asientos_alpina()`
- Timing: ~día 15 del mes siguiente

**Resumen del período:** 4 cards — Total registradas / Certificadas automáticamente / Pendientes revisión / Diferencias.

**Emparejadas automáticamente:** tabla colapsable, fondo verde.

**Revisión manual:** cards con dos columnas (registrada por auxiliar vs candidatas en reporte Alpina). Radio button para seleccionar. Botón "Confirmar emparejamiento".

**Diferencias:** tabla con tipos SOLO_EN_AUXILIAR / SOLO_EN_ALPINA. Botón "Agregar nota".

**Botón "Generar asientos certificados":** deshabilitado si hay ítems pendientes de revisión manual.

---

## 10. INFORMES

| Informe | Fuente | Roles |
|---------|--------|-------|
| Cuadres del día | cuadres + recaudos_dia | Todos |
| Consignaciones Banco | consignaciones_banco | Analista, Admin, Contabilidad |
| Consignaciones Aliados | consignaciones_aliados | Analista, Admin, Contabilidad |
| Auditoría Máximo Detalle | todas las tablas hist_ | Analista, Director, Admin |
| Conciliación Alpina | hist_consignaciones_aliados | Analista, Admin |
| **Plano Documentos ERP** | hist_documentos_erp + clientes | Contabilidad, Admin |
| **Estado Documentos ERP** | hist_documentos_erp | Contabilidad, Admin |
| **Conciliación ERP vs DIAN** | hist_documentos_erp + documentos_dian | Contabilidad, Admin |
| **Documentos listos para Odoo** | hist_documentos_erp | Contabilidad, Admin |
| **Asientos contables** | asientos_contables | Contabilidad, Admin |

### Informe — Plano Documentos ERP
Filtros: Sede, Operación, Rango de fechas, Tipo documento, CR/CO, Estado analista, Estado DIAN.
Columnas: todos los campos relevantes + datos del cliente desde `clientes`. Siempre se descarga como Excel por volumen.

### Informe — Estado Documentos ERP
Filtros: Sede, Operación, Rango de fechas, Tipo documento, Estado analista (estado_at), Estado DIAN (estado_dian).
Columnas: Operación, Planilla, Documento electrónico, Tipo, Fecha, CR/CO, Cliente, Valor base, IVA, Total, Estado analista, Estado DIAN, Validado DIAN at.

### Informe — Conciliación ERP vs DIAN
Descargable como Excel con 2 pestañas:
- **Pestaña 1:** En ERP pero NO en DIAN (documentos sin validar)
- **Pestaña 2:** En DIAN pero NO en ERP (documentos que llegaron al DIAN sin pasar por aquí)
Filtros: Sede, Operación, Rango de fechas.

### Informe — Documentos listos para Odoo
Filtro fijo: `estado_at = APROBADO` AND `estado_dian = APROBADO_CON_NOTIFICACION`.
Filtros adicionales: Sede, Operación, Rango de fechas.
Badge de estado: PENDIENTE_ENVIO / ENVIADO / CONFIRMADO / ERROR.

### Informe — Asientos contables
Filtros: Sede, Rango de fechas, Tipo movimiento, Estado Odoo (estado_odoo).
Columnas: fecha, referencia, tipo, débito cuenta, débito analítica, crédito cuenta, crédito analítica, NIT tercero, nombre tercero, valor, estado Odoo, error sync.
Badge de estado Odoo: PENDIENTE (gris) / ENVIADO (azul) / CONFIRMADO (verde) / ERROR (rojo).

---

## 11. PENDIENTES DE DEFINIR CON IMPLEMENTADOR ODOO

Los siguientes puntos requieren al implementador de Odoo 19 para ser documentados:

1. **Formato de envío:** endpoints de la API REST de Odoo, estructura JSON requerida para facturas, notas y asientos.
2. **Retenciones clientes:** cómo recibe Odoo las retenciones — como asiento separado, como campo en la factura, o via módulo de localización colombiana.
3. **Cruce de retenciones con facturas:** para que el saldo pendiente sea correcto en cartera.
4. **Recibo de caja automático:** script para que las facturas de contado queden pagadas automáticamente al llegar a Odoo.
5. **Anticipos de clientes:** cómo maneja Odoo los anticipos y su cruce con facturas futuras.
6. **Diarios de Odoo:** qué diario corresponde a cada tipo de asiento. Actualmente `diario_odoo` está nullable en `parametros_contables`.
7. **Confirmación de recepción:** cómo confirma Odoo que recibió y procesó un documento — para actualizar `estado_odoo = CONFIRMADO` y guardar `referencia_odoo`.

---

## 12. CAMBIOS RESPECTO A VERSIÓN ANTERIOR (v5 → v6)

| Elemento | Cambio |
|----------|--------|
| `parametros_contables` | `cuenta_contable` → `cuenta_contable_debito` + `cuenta_contable_credito` (nullable). Tipos nuevos: ANTICIPO_CLIENTE, DESCUENTO_ANTICIPO_CLIENTE |
| `documentos_erp` | Pierde 15 campos de cliente → gana `cliente_id FK`. Gana `estado_dian` y `validado_dian_at` |
| `gastos` | Pierde `nit_proveedor`, `nombre_proveedor` → gana `proveedor_id FK → proveedores` |
| `cuadre_retenciones` | Gana `cliente_id FK → clientes` |
| `asientos_contables` | Gana `error_sync`. Tipos nuevos: ANTICIPO_CLIENTE, DESCUENTO_ANTICIPO_CLIENTE |
| `parametros_sistema` | 4 claves nuevas: INGESTA_MANUAL_ACTIVA, INGESTA_AUTOMATICA_ACTIVA, SYNC_ODOO_MANUAL_ACTIVA, SYNC_ODOO_AUTOMATICA_ACTIVA |
| Tabla nueva | `clientes` — maestro de clientes con sync Odoo |
| Tabla nueva | `proveedores` — maestro de proveedores con sync Odoo |
| Tabla nueva | `documentos_dian` — informe DIAN para cruce y validación |
| Históricas | 14 tablas (antes 11): agrega hist_clientes, hist_proveedores, hist_documentos_dian |
| Vista nueva | Vista 05 — Sincronización Odoo |
| Informes nuevos | Plano Documentos ERP, Estado Documentos ERP, Conciliación ERP vs DIAN, Documentos listos para Odoo, Asientos contables |
| Trigger nuevo | Cruce automático DIAN al insertar en documentos_dian |
| Trigger nuevo | Marcado automático requiere_sync_odoo cuando cambian datos de clientes o proveedores |
| Función nueva | `cruzar_documentos_dian()` |
| Función nueva | Tipos 8 y 9 en `generar_asientos()`: ANTICIPO_CLIENTE y DESCUENTO_ANTICIPO_CLIENTE |

---

*Documento interno — Distribuciones Riogrande · Plataforma Tesorería v6 · 2026-04-23*

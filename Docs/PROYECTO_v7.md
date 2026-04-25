# Documento Maestro — Plataforma de Tesorería
## Distribuciones Riogrande · Versión 7
**Fecha:** 2026-04-25
**Stack:** Lovable + Antigravity + Supabase (PostgreSQL)
**Migración futura:** Azure

---

## 1. CONTEXTO DEL NEGOCIO

Distribuciones Riogrande es una empresa de distribución TAT (Tienda a Tienda) con 27 años de experiencia. Opera en 4 sedes, 10 operaciones comerciales y 5 aliados estratégicos.

### 1.1 Sedes

| Código | Nombre | Letra | Cuenta Caja | Diario Caja Odoo |
|--------|--------|-------|-------------|-----------------|
| DMA | Donmatías | D | 130501 | (parametrizar con contador) |
| CAC | Caucasia | C | 130502 | (parametrizar con contador) |
| APA | Apartadó | A | 130503 | (parametrizar con contador) |
| QBO | Quibdó | Q | 130504 | (parametrizar con contador) |

### 1.2 Aliados (tabla nueva v7)

| Aliado | Letra | NIT | Razón Social |
|--------|-------|-----|-------------|
| Alpina | A | (parametrizar) | (parametrizar) |
| Cárnicos (Zenú) | C | (parametrizar) | (parametrizar) |
| Familia | F | (parametrizar) | (parametrizar) |
| Nutresa | N | (parametrizar) | (parametrizar) |
| Meals (Crem Helado) | M | (parametrizar) | (parametrizar) |

### 1.3 Operaciones

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

### 1.4 Tipo de certificación por aliado

| Aliado | Tipo certificación |
|--------|-------------------|
| Alpina | Manual por auxiliar — conciliación mensual |
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
| **analista** | Todas las sedes. Puede hacer cuadres (cubre vacaciones — log registra quién). Revisa y aprueba. Conciliación Alpina. |
| **director** | Todo lo anterior + anular cuadres aprobados (motivo obligatorio) + autorizar hurtos. |
| **admin** | Parametrización completa, gestión usuarios, editar saldo inicial de caja, habilitadores de ingesta y sync. |
| **contabilidad** | Deposita planos en SharePoint, descarga informes Odoo, solo lectura en informes. |

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
        ↓
Vista 05: Sync Odoo
  Paso 1: Sync maestro clientes (automático — todos deben estar antes de enviar facturas)
  Paso 2: Sync documentos_erp (solo estado_dian = APROBADO_CON_NOTIFICACION AND estado_at = APROBADO)
  Paso 3: Sync maestro proveedores (manual o automático)
  Paso 4: Sync transacciones (retenciones, gastos, consignaciones, anticipos) desde históricas
```

**Reglas críticas del flujo:**
- Auxiliar NO puede iniciar nuevo recaudo sin cerrar el anterior
- Máximo `MAX_DIAS_SIN_APROBAR` días en estado CERRADO_AUXILIAR sin aprobar → bloquea la auxiliar
- Días sin movimiento (domingos) igual deben abrirse y cerrarse (`sin_movimiento = true`)
- Consecutivo cuadre: DMA-110426.01 (reinicia cada día por sede)
- Consecutivo recaudo: DMA-RD-110426 (único por sede por día; rehecho: -R1, -R2)
- Estado BORRADOR: permite retomar el recaudo si la consignación del día aún no aparece en el extracto

---

## 6. MODELO DE DATOS — 41 TABLAS

### 6.1 Tablas maestras y parámetros (11)

**`sedes`** — 4 registros fijos. El Admin puede editar `cuenta_caja` y `diario_caja` desde la UI.

| Campo | Descripción |
|-------|-------------|
| `cuenta_caja` | Cuenta contable PUC de efectivo en caja (130501/02/03/04) |
| `diario_caja` | Diario de Odoo que identifica la caja de esta sede — requerido para todos los movimientos que salen de caja |

**`aliados`** — Tabla nueva v7. 5 registros. El Admin puede editar NIT y razón social.

| Campo | Descripción |
|-------|-------------|
| `nombre` | ALPINA / CARNICOS / FAMILIA / NUTRESA / MEALS |
| `letra` | A / C / F / N / M — movido desde `operaciones` |
| `nit` | NIT del aliado — se desnormaliza en `consignaciones_aliados` |
| `razon_social` | Razón social — se desnormaliza en `consignaciones_aliados` |

**`operaciones`** — 10 registros. `aliado_id` reemplaza el campo `aliado` texto. La `letra_aliado` se eliminó — vive en `aliados.letra`. El Admin puede editar.

**`bancos`** — Catálogo con ID numérico (se usa en Excel de ingesta). `tipo`: RIOGRANDE (cuentas propias) / EXTERNO (aliados y clientes). Sin cambios estructurales v7.

**`cuentas_analiticas`** — Distribuciones analíticas en formato JSON para Odoo. Se eliminó `operacion_id` — la distribución ya está implícita en `codigo_odoo`. El Admin/Contabilidad mantiene los registros simples (100% por sede). El sistema calcula combinaciones en partes iguales según operaciones del cuadre.

Ejemplo: cuadre DA+DC → `{"7":50,"8":50}`

**`parametros_contables`** — Rediseñado en v7. Tabla simple con 11 tipos fijos. Ver sección 6.2 para detalle completo.

**`parametros_contables_generales`** — Tabla nueva v7. Cuentas contables transversales al sistema que no pertenecen a un tipo de asiento específico.

| Clave | Descripción |
|-------|-------------|
| `CUENTA_POR_PAGAR` | Cuenta transitoria para gastos — pendiente definir con contador |
| `CUENTA_POR_COBRAR` | Para uso futuro |

**`parametros_sistema`** — Sin cambios estructurales. Se agregan 2 claves nuevas:

| Clave | Valor inicial | Descripción |
|-------|--------------|-------------|
| MARGEN_DIAS_ANTES | 3 | Días antes para buscar consignaciones |
| MARGEN_DIAS_DESPUES | 1 | Días después para buscar consignaciones |
| TIMEOUT_SESION_MINUTOS | 30 | Timeout de bloqueo de consignaciones |
| HORA_SYNC_AUTOMATICA | 06:00 | Hora de sync automática |
| MAX_DIAS_SIN_APROBAR | 2 | Máximo días sin aprobar |
| RUTA_SOPORTES_DMA | C:/RioTesoreria/Soportes/DMA/ | Ruta soportes Donmatías |
| RUTA_SOPORTES_CAC | C:/RioTesoreria/Soportes/CAC/ | Ruta soportes Caucasia |
| RUTA_SOPORTES_APA | C:/RioTesoreria/Soportes/APA/ | Ruta soportes Apartadó |
| RUTA_SOPORTES_QBO | C:/RioTesoreria/Soportes/QBO/ | Ruta soportes Quibdó |
| INGESTA_MANUAL_ACTIVA | true | Habilita ingesta manual |
| INGESTA_AUTOMATICA_ACTIVA | false | Habilita ingesta automática |
| SYNC_ODOO_MANUAL_ACTIVA | true | Habilita sync manual con Odoo |
| SYNC_ODOO_AUTOMATICA_ACTIVA | false | Habilita sync automática con Odoo |
| DIAS_ATRAS_REGISTRO_GASTO | 2 | Días hacia atrás permitidos para fecha de gasto vs fecha cuadre |
| DIAS_ADELANTE_REGISTRO_GASTO | 0 | Días hacia adelante permitidos para fecha de gasto vs fecha cuadre |

**`empleados`** — Sin cambios. Desactivar en lugar de borrar.

**`vehiculos`** — Sin cambios. Desactivar en lugar de borrar.

**`consecutivos_cuadre`** — Sin cambios. Un registro por sede. Reinicia cuando cambia la fecha.

---

### 6.2 Parámetros contables — detalle completo

**`parametros_contables`** — 11 tipos fijos. Los tipos NO se pueden crear ni eliminar desde la UI. Solo se pueden agregar más `detalle_asiento` dentro de cada tipo existente.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | uuid PK | — |
| `sede_id` | uuid FK → sedes | NULL = todas las sedes. UUID = solo esa sede. En UI muestra nombre de sede. |
| `tipo_asiento` | text | 11 tipos fijos — ver tabla abajo |
| `detalle_asiento` | text | Nombre del concepto para dropdown en UI (ej: "Peajes", "Retefuente 2.5%") |
| `cuenta` | text nullable | Cuenta PUC — se mantiene por precaución aunque Odoo lo resuelve por id_externo_odoo |
| `id_externo_odoo` | text nullable | Identificador exacto del impuesto/concepto en Odoo |
| `diario_odoo` | text nullable | Diario de Odoo — requerido para consignaciones RG y traslados entre cajas |
| `banco_id` | integer FK → bancos | Solo consignaciones a Riogrande — vincula parámetro con extracto bancario |
| `requiere_documento_electronico` | boolean nullable | Solo gastos. True = peajes, combustible. False = robos. |
| `tope_maximo` | numeric nullable | Solo gastos. Monto máximo por ocurrencia. |
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
| anticipo recibido clientes | ❌ | ❌ | ❌ | opcional |
| descuento anticipo clientes | ❌ | ❌ | ❌ | opcional |

**Nota de parametrización:** `id_externo_odoo` debe coincidir exactamente con el External ID o nombre del impuesto/concepto configurado en Odoo (ej: `RET_FTE_COM_25`). Coordinar con el implementador de Odoo antes de parametrizar.

**Nota de `sede_id`:** si un parámetro aplica a todas las sedes → dejar NULL. Si aplica solo a una sede (ej: "Caja menor DMA", "TVS QBO") → seleccionar la sede específica. La UI filtra: `WHERE tipo_asiento = :tipo AND (sede_id = :sede_actual OR sede_id IS NULL)`.

---

### 6.3 Tablas maestras de terceros (3)

**`clientes`** — Alimentado desde el plano ERP via upsert. Clave única: `operacion_codigo_cliente` (ej: DA-1). Es el ID externo en Odoo para cartera diferenciada por establecimiento. Sin cambios v7.

**Lógica de upsert clientes:**
```
Llega cliente DA-1 del plano ERP
        ↓
¿Existe en tabla clientes?
SÍ → UPDATE. ¿Cambiaron datos? → requiere_sync_odoo = true, sincronizado_odoo = false
NO → INSERT. sincronizado_odoo = false
```

**`proveedores`** — Pre-cargado por Admin. La auxiliar puede agregar nuevos desde el cuadre (botón "Agregar proveedor"). Los nuevos quedan con `sincronizado_odoo = false`. Sin cambios v7.

**`empleados`** — Alerta en Vista 05 si un empleado que tiene anticipos registrados no está en Odoo. La creación en Odoo es manual (viene de nómina). Sin cambios v7.

**Campos de sincronización en clientes y proveedores:**
- `sincronizado_odoo`: true cuando Odoo confirma recepción
- `sincronizado_at`: cuándo se sincronizó
- `requiere_sync_odoo`: true cuando hay cambios pendientes de re-sincronizar
- `error_sync`: mensaje de error si Odoo rechazó

---

### 6.4 Tablas de ingesta (4)

**`documentos_erp`** — Sin cambios v7. Facturas, notas crédito/débito y anticipos de clientes. Clave de upsert: `operacion_documento`. Condición para enviar a Odoo: `estado_at = APROBADO` AND `estado_dian = APROBADO_CON_NOTIFICACION`.

**`documentos_dian`** — Sin cambios v7. Al insertar, trigger actualiza automáticamente `documentos_erp.estado_dian`.

**`consignaciones_banco`** — Campos nuevos v7:

| Campo nuevo | Fuente | Descripción |
|-------------|--------|-------------|
| `parametro_id` | FK → parametros_contables | Trae `diario_odoo` destino al seleccionar en UI |
| `diario_caja` | desnormalizado desde sedes.diario_caja | Diario origen para Odoo |
| `diario_destino` | desnormalizado desde parametros_contables.diario_odoo | Diario destino para Odoo |

**UI sección 2.3:** el dropdown de consignaciones a Riogrande apunta a `parametros_contables WHERE tipo_asiento = 'consignaciones a riogrande'` — NO a la tabla `bancos`. Al seleccionar el parámetro, el sistema desnormaliza `diario_caja` y `diario_destino` automáticamente.

**Para Odoo:** `fecha`, `diario_caja`, `diario_destino`, `valor`, `referencia`. Notas = concatenación de `cuadre_id + recaudo_id` en el momento del envío.

**`consignaciones_aliados`** — Campos nuevos v7:

| Campo nuevo | Fuente | Descripción |
|-------------|--------|-------------|
| `diario_caja` | desnormalizado desde sedes.diario_caja | Diario origen para Odoo |
| `cuenta_anticipo` | desnormalizado desde parametros_contables.cuenta | Cuenta contable del anticipo al aliado |
| `nit_aliado` | desnormalizado desde aliados.nit | NIT del aliado para Odoo |
| `nombre_aliado` | desnormalizado desde aliados.razon_social | Nombre del aliado para Odoo |

**Para Odoo:** `fecha`, `diario_caja`, `cuenta_anticipo`, `nit_aliado`, `nombre_aliado`, `valor`, `referencia`.

---

### 6.5 Tablas operativas — Cuadre (4)

**`cuadres`** — Sin cambios v7.

**`cuadre_retenciones`** — Campos nuevos v7 (desnormalizados al momento del registro):

| Campo nuevo | Fuente |
|-------------|--------|
| `fecha` | documentos_erp.fecha_emision |
| `numero_factura` | documentos_erp.factura_referencia |
| `operacion_codigo_cliente` | clientes.operacion_codigo_cliente |
| `nit_cliente` | clientes.numero_identificacion |
| `nombre_cliente` | clientes.nombre_establecimiento |
| `detalle_retencion` | parametros_contables.detalle_asiento |
| `cuenta_retencion` | parametros_contables.cuenta |
| `codigo_externo_odoo` | parametros_contables.codigo_externo_odoo |
| `codigo_analitica_odoo` | documentos_erp.cuenta_analitica |
| `cuenta_caja_sede` | sedes.cuenta_caja |

**Para Odoo:** `nit_cliente`, `numero_factura`, `fecha`, `codigo_externo_odoo`, `base_retencion`, `porcentaje`, `valor`. Odoo resuelve el asiento internamente usando `codigo_externo_odoo`.

**`gastos`** — Cambios v7:

Renombres:
- `parametro_iva_id` → `parametro_impuesto_id`
- `tarifa_iva` → `tipo_impuesto`
- `iva` → `valor_impuesto`

Campo nuevo calculado:
- `valor_total` GENERATED: `valor_base + valor_impuesto - valor_retencion`

Campo nuevo de control:
- `fecha` — ingresado por auxiliar. Restringido por `DIAS_ATRAS_REGISTRO_GASTO` y `DIAS_ADELANTE_REGISTRO_GASTO` vs fecha del cuadre.

Campos desnormalizados nuevos:

| Campo | Fuente |
|-------|--------|
| `nit_proveedor` | proveedores.nit |
| `nombre_proveedor` | proveedores.nombre |
| `detalle_gasto` | parametros_contables.detalle_asiento (param gasto) |
| `id_externo_gasto` | parametros_contables.codigo_externo_odoo (param gasto) |
| `detalle_impuesto` | parametros_contables.detalle_asiento (param impuesto, nullable) |
| `id_externo_impuesto` | parametros_contables.codigo_externo_odoo (param impuesto, nullable) |
| `detalle_retencion` | parametros_contables.detalle_asiento (param retención, nullable) |
| `id_externo_retencion` | parametros_contables.codigo_externo_odoo (param retención, nullable) |
| `codigo_analitica_odoo` | cuentas_analiticas.codigo_odoo |
| `diario_caja` | sedes.diario_caja |

**Para Odoo — Causación:**
`fecha`, `nit_proveedor`, `nombre_proveedor`, `valor_base`, `id_externo_gasto`, `valor_impuesto`, `id_externo_impuesto`, `valor_retencion`, `id_externo_retencion`, `codigo_analitica_odoo`

**Para Odoo — Egreso:**
`fecha`, `diario_caja`, `valor_total`, `nit_proveedor`, `nombre_proveedor`

**`cuadre_anticipos_nomina`** — Campos nuevos v7:

| Campo nuevo | Fuente |
|-------------|--------|
| `fecha` | ingresado por auxiliar |
| `nit_empleado` | empleados.nit |
| `nombre_empleado` | empleados.nombre_completo |
| `cuenta_anticipo` | parametros_contables.cuenta |
| `codigo_analitica_odoo` | cuentas_analiticas.codigo_odoo |
| `diario_caja` | sedes.diario_caja |

**Para Odoo:** `fecha`, `diario_caja`, `nit_empleado`, `nombre_empleado`, `cuenta_anticipo`, `codigo_analitica_odoo`, `concepto`, `valor`.

---

### 6.6 Tablas operativas — Recaudo y revisión (5)

**`recaudos_dia`** — Sin cambios v7.

**Estados del recaudo:**
```
BORRADOR → ABIERTO → CERRADO_AUXILIAR → APROBADO → (históricas)
                   ↘ DEVUELTO (analista devuelve con nota)
```

**`traslados_caja`** — Renombrada desde `destinos_efectivo` en v7. SOLO para traslados entre cajas (caja menor, TVS, Istmina, Prosegur). Los demás destinos de la sección 3.2 van a sus propias tablas.

Campos nuevos v7:

| Campo nuevo | Fuente |
|-------------|--------|
| `fecha` | desnormalizado desde recaudos_dia.fecha |
| `detalle` | parametros_contables.detalle_asiento |
| `diario_caja` | sedes.diario_caja |
| `diario_destino` | parametros_contables.diario_odoo |

**Para Odoo:** `fecha`, `diario_caja`, `diario_destino`, `detalle`, `valor`.

**Tabla destino según tipo en sección 3.2:**

| Tipo de destino | Tabla destino | Campo origen |
|-----------------|--------------|--------------|
| Consignación RG | `consignaciones_banco` | `origen = DESTINO_EFECTIVO` |
| Anticipo aliado | `consignaciones_aliados` | `origen = DESTINO_EFECTIVO` |
| Gasto | `gastos` | `origen = DESTINO_EFECTIVO` |
| Anticipo nómina | `cuadre_anticipos_nomina` | `origen = DESTINO_EFECTIVO` |
| Traslado entre cajas | `traslados_caja` | — |

**Flujo cascada sección 3.2:**
```
Nivel 1 — Auxiliar elige tipo (fijo por código):
  [Consignación RG | Anticipo aliado | Gasto | Anticipo nómina | Traslado entre cajas]
        ↓
Nivel 2 — Sistema filtra parametros_contables por tipo y sede:
  WHERE tipo_asiento = :tipo AND (sede_id = :sede_actual OR sede_id IS NULL)
        ↓
Sistema crea registro en la tabla correspondiente
```

**`soportes_dia`** — Sin cambios v7.

**`checklist_revision`** — Sin cambios v7. Al aprobar todos los ítems se ejecuta `promover_a_historico()`.

---

### 6.7 Tablas históricas (15)

Al aprobar un recaudo, `promover_a_historico()` copia los datos a las tablas `hist_`. Son **inmutables** en su contenido operativo — solo INSERT.

**Campos adicionales en todas las históricas:**
```
promovido_at    timestamptz    — cuándo se promovió
```

**Campos adicionales solo en históricas que viajan a Odoo:**
```
estado_odoo     text           — PENDIENTE / ENVIADO / CONFIRMADO / ERROR
referencia_odoo text nullable  — ID del registro en Odoo (lo confirma Odoo)
error_sync      text nullable  — Mensaje de error si Odoo rechazó
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
| `hist_documentos_erp` | documentos_erp | ✅ |
| `hist_consignaciones_banco` | consignaciones_banco | ✅ |
| `hist_consignaciones_aliados` | consignaciones_aliados | ✅ |
| `hist_clientes` | clientes | ✅ |
| `hist_proveedores` | proveedores | ✅ |
| `hist_empleados` | empleados | ✅ (alerta — creación manual en Odoo) |
| `hist_documentos_dian` | documentos_dian | ❌ |

**Excepción:** Alpina con estado SIN_CERTIFICAR NO se copia al histórico hasta completar la conciliación mensual.

---

### 6.8 Audit log (1)

**`audit_log`** — Sin cambios v7. Registra todas las acciones del sistema. Alimentado por triggers de PostgreSQL. Solo INSERT. Inmutable.

---

## 7. FUNCIONES SQL CRÍTICAS

| Función | Descripción |
|---------|-------------|
| `generar_consecutivo_cuadre(sede_id, fecha)` | Genera DMA-110426.01 con lock para evitar duplicados |
| `generar_consecutivo_recaudo(sede_id, fecha, rehecho)` | Genera DMA-RD-110426 con sufijo -R1 si rehecho |
| `get_saldo_anterior(sede_id, fecha)` | Último nuevo_saldo aprobado de la sede |
| `validar_dias_sin_aprobar(sede_id)` | Lee MAX_DIAS_SIN_APROBAR y verifica |
| `liberar_bloqueos_expirados(sede_id?)` | Libera consignaciones BLOQUEADAS con timeout vencido. Parámetro sede_id opcional. |
| `cruzar_documentos_dian()` | Actualiza estado_dian en documentos_erp desde documentos_dian |
| `promover_a_historico(recaudo_id)` | Copia 15 tablas al histórico con columnas explícitas y desnormalización de campos Odoo |

**Nota v7:** la función `generar_asientos()` se elimina. Cada tabla histórica ya tiene todos los campos necesarios para enviar directamente a Odoo via API. No se necesita tabla ni función de generación de asientos intermediaria.

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

| Columna UI | Fuente |
|------------|--------|
| Fecha | Input manual — restringido por `DIAS_ATRAS_REGISTRO_GASTO` y `DIAS_ADELANTE_REGISTRO_GASTO` |
| Tipo de gasto | `parametros_contables` WHERE `tipo_asiento = 'gastos'` AND (sede_id = :sede OR sede_id IS NULL) → muestra `detalle_asiento` |
| Proveedor | Búsqueda en `proveedores`. Botón "+" para crear nuevo. |
| N° Factura | Ingreso manual |
| Cuenta analítica | `cuentas_analiticas` de la sede. Sistema propone según operaciones del cuadre. |
| Tipo impuesto | `parametros_contables` WHERE `tipo_asiento = 'impuestos en gastos'`. Nullable. |
| Valor impuesto | Ingreso manual. Nullable. |
| Retención proveedor | `parametros_contables` WHERE `tipo_asiento = 'retenciones a proveedores'`. Nullable. |
| Valor retención | Ingreso manual. Nullable. |
| Valor base | Ingreso manual |
| Valor total | Calculado: `valor_base + valor_impuesto - valor_retencion` |

Si el `valor_base` supera `tope_maximo` del parámetro → sistema lo marca y exige justificación.

Al confirmar, el sistema desnormaliza automáticamente todos los campos de Odoo desde los parámetros seleccionados.

**Sección 2.3 — Consignaciones a Riogrande**
Dropdown apunta a `parametros_contables WHERE tipo_asiento = 'consignaciones a riogrande'` filtrado por sede. Solo se pueden seleccionar consignaciones que existen en `consignaciones_banco`. Al seleccionar → bloqueo inmediato + desnormalización de diarios.

**Sección 2.4 — Anticipos a aliados**
- Cárnicos/Nutresa/Meals: solo consignaciones que existen en `consignaciones_aliados` con estado CERTIFICADA.
- Alpina: registro libre con dropdown banco tipo EXTERNO. Queda SIN_CERTIFICAR. Al registrar, el sistema desnormaliza `nit_aliado`, `nombre_aliado`, `cuenta_anticipo` y `diario_caja`.

**Sección 2.5 — Anticipos de clientes**
Muestra anticipos de `documentos_erp` con `tipo_documento = ANTICIPO`. Positivos y negativos según corresponda.

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
  Dropdown de detalle_asiento
        ↓
Sistema crea registro en tabla correspondiente con origen = DESTINO_EFECTIVO
```

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
Solo visible para roles: Contabilidad y Admin.

**5 bloques — los primeros 3 deben completarse antes del 4 y 5:**

**Bloque 1 — Clientes pendientes de sync**
`clientes` WHERE `sincronizado_odoo = false` OR `requiere_sync_odoo = true`. Sync automático. Bloque 2 se habilita cuando todos están CONFIRMADO.

**Bloque 2 — Documentos ERP pendientes**
`hist_documentos_erp` WHERE `estado_at = APROBADO` AND `estado_dian = APROBADO_CON_NOTIFICACION` AND `estado_odoo = PENDIENTE`. Solo se habilita cuando bloque 1 completo.

**Bloque 3 — Proveedores pendientes de sync**
`proveedores` WHERE `sincronizado_odoo = false` OR `requiere_sync_odoo = true`. Corre en paralelo con bloque 1. Sync manual o automático.

**Bloque 4 — Empleados sin Odoo (alerta)**
`hist_empleados` WHERE `sincronizado_odoo = false`. Solo alerta — la creación en Odoo es manual desde nómina. El bloque no bloquea el 5 pero muestra advertencia.

**Bloque 5 — Transacciones pendientes**
Solo se habilita cuando bloques 1, 2 y 3 están completos. Envía en este orden:
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

### Vista 06 — Conciliación Alpina
Solo visible para roles: Analista y Admin. Detalle en sección 9.

---

## 9. CONCILIACIÓN ALPINA

- Analista sube reporte Alpina (columna Caja = todas las sedes en 1 archivo)
- Cruce automático: valor EXACTO + fecha EXACTA + sede
- Ambigüedades → revisión manual
- Sin coincidencia → DIFERENCIA para investigar
- Al certificar → `estado_certificacion = CERTIFICADA` + se habilita sync a Odoo
- Timing: ~día 15 del mes siguiente

**Resumen del período:** 4 cards — Total registradas / Certificadas automáticamente / Pendientes revisión / Diferencias.

**Emparejadas automáticamente:** tabla colapsable, fondo verde.

**Revisión manual:** cards con dos columnas (registrada por auxiliar vs candidatas en reporte Alpina). Radio button para seleccionar.

**Diferencias:** tabla con tipos SOLO_EN_AUXILIAR / SOLO_EN_ALPINA. Botón "Agregar nota".

**Botón "Certificar conciliación":** deshabilitado si hay ítems pendientes de revisión manual. Al certificar → `consignaciones_aliados` de Alpina pasan a `hist_consignaciones_aliados` con `estado_odoo = PENDIENTE`.

---

## 10. INFORMES

| Informe | Fuente | Roles |
|---------|--------|-------|
| Cuadres del día | cuadres + recaudos_dia | Todos |
| Consignaciones Banco | consignaciones_banco | Analista, Admin, Contabilidad |
| Consignaciones Aliados | consignaciones_aliados | Analista, Admin, Contabilidad |
| Auditoría Máximo Detalle | todas las tablas hist_ | Analista, Director, Admin |
| Conciliación Alpina | hist_consignaciones_aliados | Analista, Admin |
| Plano Documentos ERP | hist_documentos_erp + clientes | Contabilidad, Admin |
| Estado Documentos ERP | hist_documentos_erp | Contabilidad, Admin |
| Conciliación ERP vs DIAN | hist_documentos_erp + documentos_dian | Contabilidad, Admin |
| Documentos listos para Odoo | hist_documentos_erp | Contabilidad, Admin |
| Transacciones pendientes Odoo | hist_retenciones + hist_gastos + hist_consignaciones_banco + hist_consignaciones_aliados + hist_anticipos_nomina + hist_traslados_caja | Contabilidad, Admin |

### Informe — Transacciones pendientes Odoo
Reemplaza el informe "Asientos contables" de v6. Muestra todas las transacciones históricas con `estado_odoo = PENDIENTE / ERROR` agrupadas por tipo. Filtros: Sede, Rango de fechas, Tipo, Estado Odoo. Badge de estado: PENDIENTE (gris) / ENVIADO (azul) / CONFIRMADO (verde) / ERROR (rojo).

---

## 11. PENDIENTES DE DEFINIR CON IMPLEMENTADOR ODOO

1. **Endpoints API:** URL y estructura JSON exacta para cada tipo de transacción.
2. **`id_externo_odoo` por tipo:** listado exacto de External IDs configurados en Odoo para retenciones clientes, retenciones proveedores, gastos e impuestos.
3. **Diarios por tipo:** qué diario de Odoo corresponde a cada parámetro de consignaciones RG y traslados entre cajas.
4. **Diario de caja por sede:** el código exacto del diario en Odoo para cada una de las 4 sedes.
5. **Confirmación de recepción:** cómo confirma Odoo que procesó un registro — para actualizar `estado_odoo = CONFIRMADO` y guardar `referencia_odoo`.
6. **Empleados:** confirmar si Odoo necesita algún campo adicional en `hist_empleados` para la alerta de sync.
7. **Causación vs egreso gastos:** confirmar si Odoo los recibe como un solo objeto o dos llamadas separadas a la API.

---

## 12. CAMBIOS v6 → v7

| Elemento | Cambio |
|----------|--------|
| **Arquitectura Odoo** | Eliminada tabla `asientos_contables` y función `generar_asientos()`. Cada histórica tiene los campos necesarios para enviar directo a Odoo via API sin intermediarios. |
| **`sedes`** | + `diario_caja` — diario de Odoo que identifica la caja de cada sede |
| **`aliados`** | Tabla nueva — NIT, razón social, letra. Antes el aliado era texto libre en `operaciones`. |
| **`operaciones`** | `aliado` text → `aliado_id` FK → aliados. Eliminado `letra_aliado` (vive en `aliados`). |
| **`cuentas_analiticas`** | Eliminado `operacion_id` — redundante con `codigo_odoo` JSON |
| **`parametros_contables`** | Rediseño completo: eliminados campos de cuentas débito/crédito. Agregados `id_externo_odoo`, `diario_odoo`, `sede_id`, `banco_id`. Simplificado a 4 campos core + campos opcionales por tipo. |
| **`parametros_contables_generales`** | Tabla nueva — cuentas transversales del sistema (CUENTA_POR_PAGAR, CUENTA_POR_COBRAR) |
| **`parametros_sistema`** | + `DIAS_ATRAS_REGISTRO_GASTO`, + `DIAS_ADELANTE_REGISTRO_GASTO` |
| **`consignaciones_banco`** | + `parametro_id`, + `diario_caja`, + `diario_destino` |
| **`consignaciones_aliados`** | + `diario_caja`, + `cuenta_anticipo`, + `nit_aliado`, + `nombre_aliado` |
| **`cuadre_retenciones`** | + `fecha`, `numero_factura`, `operacion_codigo_cliente`, `nit_cliente`, `nombre_cliente`, `detalle_retencion`, `cuenta_retencion`, `codigo_externo_odoo`, `codigo_analitica_odoo`, `cuenta_caja_sede` |
| **`gastos`** | Renombres: `parametro_iva_id`→`parametro_impuesto_id`, `tarifa_iva`→`tipo_impuesto`, `iva`→`valor_impuesto`. + `fecha`, `valor_total` GENERATED, campos desnormalizados para Odoo. |
| **`cuadre_anticipos_nomina`** | + `fecha`, `nit_empleado`, `nombre_empleado`, `cuenta_anticipo`, `codigo_analitica_odoo`, `diario_caja` |
| **`destinos_efectivo`** | Renombrada a `traslados_caja`. + `fecha`, `detalle`, `diario_caja`, `diario_destino` |
| **Históricas** | 15 tablas (antes 14): agrega `hist_traslados_caja`. Las que viajan a Odoo reciben + `estado_odoo`, `referencia_odoo`, `error_sync`. |
| **Vista 05** | Rediseñada: 5 bloques. Bloque 4 = alerta empleados. Bloque 5 = sync de 6 tipos de transacciones desde históricas. Eliminado bloque de asientos contables. |
| **Informe** | "Asientos contables" reemplazado por "Transacciones pendientes Odoo" |

---

## 13. CAMBIOS v6fix → v7 (correcciones técnicas incorporadas)

Todas las correcciones del script `v6_fix.sql` están incorporadas en v7:
- Rutas de soportes con forward slash
- `fn_audit_log` con `NULLIF` en cast uuid
- `promover_a_historico` con columnas explícitas
- Asiento tipo 3c corregido (ahora eliminado — reemplazado por desnormalización en tabla operativa)

---

*Documento interno — Distribuciones Riogrande · Plataforma Tesorería v7 · 2026-04-25*

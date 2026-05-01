# Plan de Implementación — RioTesorería v7.2
**Fecha revisión:** 2026-04-30  
**Basado en:** PROYECTO_v7.2.md · SQL_v7.2 · USUARIOS_v1.md · ERD v7.2  
**Stack:** React + Vite + TypeScript · Zustand · Supabase (PostgreSQL) · Odoo API

---

## Estado actual del prototipo

El frontend tiene **12 vistas** implementadas como prototipos estáticos con datos mock. No hay conexión a base de datos, autenticación real, ni ingesta de datos.

| Vista | Archivo | Estado |
|-------|---------|--------|
| Inicio del Día | `InicioDia.tsx` | ✅ Prototipo mock |
| Estado de Planillas | `EstadoPlanillas.tsx` | ✅ Prototipo mock |
| Cuadre de Planillas | `CuadrePlanillas.tsx` | ✅ Prototipo mock (7 secciones, §2.5 v7.2 ✓) |
| Recaudo Diario | `RecaudoDiario.tsx` | ✅ Prototipo mock |
| Revisión Analista | `Revision.tsx` | ✅ Prototipo mock |
| Sincronización Odoo | `SincronizacionOdoo.tsx` | ✅ Prototipo mock (5 bloques) |
| Informes | `Informes.tsx` | ✅ Prototipo mock |
| Parametrización | `Parametrizacion.tsx` | ✅ Prototipo mock |
| Conciliación Alpina | `ConciliacionAlpina.tsx` | ✅ Prototipo mock |
| Login | `LoginPage.tsx` | ✅ Prototipo (sin auth real) |
| Sidebar | `AppSidebar.tsx` | ✅ Sin filtro por rol |
| Store | `appStore.ts` | ✅ Sin usuario/rol/sede real |

> **Nota:** Todo el trabajo pendiente es de backend e integración. El prototipo de UI cubre bien todas las vistas. La prioridad ahora es conectar Supabase, implementar autenticación real con roles, habilitar la ingesta de datos y reemplazar los mocks progresivamente.

---

## Fase 1 — Base de datos Supabase (Prioridad: CRÍTICA)

> El SQL completo v7.2 ya está en `Docs/SQL_v7.2_Tesoreria_Riogrande.sql`. Son 41 tablas, 7 funciones, triggers y datos iniciales. Solo hay que ejecutarlo en Supabase.

### 1.1 Ejecutar esquema SQL v7.2

- Conectar al proyecto Supabase (crear si no existe)
- Ejecutar `SQL_v7.2_Tesoreria_Riogrande.sql` en el SQL Editor de Supabase
- Verificar las 41 tablas creadas correctamente

**Tablas a verificar (grupos):**
- Maestras y parámetros (11): `sedes`, `aliados`, `operaciones`, `bancos`, `cuentas_analiticas`, `parametros_contables`, `parametros_contables_generales`, `parametros_sistema`, `empleados`, `vehiculos`, `consecutivos_cuadre`
- Terceros (2): `clientes`, `proveedores`
- Ingesta (4): `documentos_erp`, `documentos_dian`, `consignaciones_banco`, `consignaciones_aliados`
- Operativas cuadre (5): `recaudos_dia`, `cuadres`, `cuadre_retenciones`, `gastos`, `cuadre_anticipos_nomina`
- Recaudo y revisión (3): `traslados_caja`, `soportes_dia`, `checklist_revision`
- Históricas (15): todas las `hist_*`
- Audit log (1): `audit_log`
- Perfiles (1): `perfiles` — definida en USUARIOS_v1.md

### 1.2 Crear tabla `perfiles`

```sql
CREATE TABLE perfiles (
    id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    sede_id    uuid REFERENCES sedes(id),
    rol        text NOT NULL, -- auxiliar | analista | director | admin
    nombre     text NOT NULL,
    activo     boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 1.3 Configurar RLS (Row Level Security)

Habilitar RLS en las 10 tablas operativas principales y crear política `acceso_por_sede` (ver USUARIOS_v1.md §5). Las tablas históricas e ingesta se protegen con políticas de solo lectura para auxiliar.

### 1.4 Cargar datos iniciales

- 4 sedes (DMA, CAC, APA, QBO)
- 5 aliados (Alpina, Cárnicos, Familia, Nutresa, Meals)
- 10 operaciones
- Bancos catálogo
- `parametros_sistema` con los 14 valores iniciales
- `consecutivos_cuadre` — 1 fila por sede

---

## Fase 2 — Autenticación y Control de Acceso (Prioridad: ALTA)

### 2.1 Integrar Supabase Auth en el frontend

- Instalar `@supabase/supabase-js`
- Crear `src/lib/supabase.ts` con el cliente
- Reemplazar el login mock de `LoginPage.tsx` con `supabase.auth.signInWithPassword()`
- Manejar sesión con `supabase.auth.onAuthStateChange()`

### 2.2 Ampliar el store (`appStore.ts`)

Agregar al estado:
```typescript
interface AppState {
  // ... existente ...
  user: User | null;          // auth.users
  perfil: Perfil | null;      // tabla perfiles
  rol: 'auxiliar' | 'analista' | 'director' | 'admin' | null;
  sedeId: string | null;
  sedeCodigo: string | null;
}
```

### 2.3 Filtrar sidebar por rol

Implementar en `AppSidebar.tsx` el filtro de menú según USUARIOS_v1.md §7:
```typescript
const menuItems = allMenuItems.filter(item => {
  if (item.id === 'revision')            return ['analista','director','admin'].includes(rol);
  if (item.id === 'conciliacion-alpina') return ['analista','director','admin'].includes(rol);
  if (item.id === 'sincronizacion-odoo') return rol === 'admin';
  if (item.id === 'parametrizacion')     return rol === 'admin';
  return true;
});
```

### 2.4 Guardia de rutas

Crear `src/components/ProtectedRoute.tsx` que verifique sesión activa y rol requerido antes de renderizar cada vista.

### 2.5 Gestión de usuarios en Parametrización

En `Parametrizacion.tsx`, pestaña "Empleados/Usuarios": UI para que el Admin cree usuarios (llama a Supabase Admin API), asigne rol y sede, y realice el INSERT en `perfiles`.

---

## Fase 3 — Ingesta de Datos desde SharePoint (Prioridad: ALTA)

> **Advertencia:** Esta fase depende de que los archivos Excel de SharePoint tengan el formato exacto especificado en el PROYECTO v7.2 §4. Validar con contabilidad antes de programar los parsers.

### 3.1 Servicio de ingesta (Edge Function Supabase o función local)

Crear parsers para cada tipo de archivo:

| Archivo | Tabla destino | Clave upsert |
|---------|--------------|-------------|
| ERP (DA_2026_04.xlsx) | `documentos_erp` + `clientes` | `operacion_documento` / `operacion_codigo_cliente` |
| ANTICIPOS_DA_2026_04.xlsx | `documentos_erp` (tipo ANTICIPO / CRUCE ANTICIPO) | `operacion_documento` |
| Extracto banco | `consignaciones_banco` | `banco_id` + `referencia` |
| Aliados (Cárnicos/Nutresa/Meals) | `consignaciones_aliados` | por definir con contabilidad |
| Alpina (conciliación manual) | `consignaciones_aliados` | columna Caja identifica sede |
| DIAN | `documentos_dian` → trigger → `documentos_erp.estado_dian` | `documento_electronico` |

### 3.2 Antifraude

- Calcular y guardar `hash_archivo` al ingestar
- Para aliados (excepto Alpina): cruzar sede del nombre del archivo vs columna Caja → alerta admin si discrepancia

### 3.3 Habilitadores en UI (Parametrización)

El botón "Sincronizar SharePoint" debe respetar:
- `INGESTA_MANUAL_ACTIVA` — habilita botón manual
- `INGESTA_AUTOMATICA_ACTIVA` — activa cron a `HORA_SYNC_AUTOMATICA`

---

## Fase 4 — Módulo Cuadre de Planillas (Prioridad: ALTA)

Reemplazar todos los mocks de `CuadrePlanillas.tsx` con queries reales a Supabase.

### 4.1 Inicio del Día → Vista Estado Planillas

- `InicioDia.tsx`: query `documentos_erp WHERE estado_planilla_erp = 'CERRADA'` agrupado por `operacion_planilla`
- Al confirmar selección → crear `recaudos_dia` (estado BORRADOR) y `cuadres` (estado BORRADOR)

### 4.2 Sección 2.1 — Liquidación planillas

Query: `documentos_erp WHERE operacion_planilla IN :planillas AND tipo_documento IN ('FACTURA DE VENTA','NOTA CREDITO','NOTA DEBITO','ANTICIPO','CRUCE ANTICIPO')` ordenado por tipo.

### 4.3 Sección 2.2 — Gastos de ruta

- Dropdown "Tipo de gasto": `parametros_contables WHERE tipo_asiento = 'gastos' AND (sede_id = :sede OR sede_id IS NULL)`
- Búsqueda proveedor: query `proveedores`
- Al guardar: INSERT en `gastos` con todos los campos desnormalizados
- Validar fecha contra `DIAS_ATRAS_REGISTRO_GASTO` y `DIAS_ADELANTE_REGISTRO_GASTO`

### 4.4 Sección 2.3 — Consignaciones Riogrande

- Dropdown "Cuenta destino": `parametros_contables WHERE tipo_asiento = 'consignaciones a riogrande' AND sede_id = :sede`
- Lista de disponibles: `consignaciones_banco WHERE estado_cuadre = 'LIBRE' AND sede_id = :sede`
- Al seleccionar: UPDATE `estado_cuadre = 'BLOQUEADA'` + desnormalizar `diario_caja`, `diario_destino`

### 4.5 Sección 2.4 — Anticipos Aliados

- Cárnicos/Nutresa/Meals: `consignaciones_aliados WHERE estado_certificacion = 'CERTIFICADA' AND estado_cuadre = 'LIBRE'`
- Alpina: INSERT libre en `consignaciones_aliados` con `estado_certificacion = 'SIN_CERTIFICAR'`, desnormalizar desde `aliados`

### 4.6 Sección 2.5 — Anticipos de clientes ✅ UI lista (v7.2)

Query: `documentos_erp WHERE tipo_documento IN ('ANTICIPO','CRUCE ANTICIPO') AND operacion_planilla IN :planillas`  
Los dos grupos y la fórmula `total = suma(ANTICIPO) - suma(CRUCE ANTICIPO)` ya están implementados en UI.  
**Pendiente:** reemplazar `mockAnticiposClientes` con query real a Supabase.

### 4.7 Sección 2.6 — Anticipos nómina

- Dropdown empleado: `empleados WHERE sede_id = :sede AND activo = true`
- Dropdown cuenta analítica: `cuentas_analiticas WHERE sede_id = :sede`
- Al guardar: INSERT en `cuadre_anticipos_nomina` con campos desnormalizados
- Si concepto = HURTO_RUTA → `estado_autorizacion = 'PENDIENTE'`

### 4.8 Sección 2.7 — Confirmar cuadre

Al confirmar:
1. Llamar `generar_consecutivo_cuadre(sede_id, fecha)` → genera DMA-110426.01
2. UPDATE `cuadres SET consecutivo, total_*, efectivo_real, efectivo_teorico, estado = 'ENVIADO_REVISION'`
3. UPDATE `documentos_erp SET estado_at = 'EN_CUADRE', numero_cuadre = :consecutivo`
4. UPDATE `consignaciones_banco SET estado_cuadre = 'EN_CUADRE'`
5. UPDATE `consignaciones_aliados SET estado_cuadre = 'EN_CUADRE'`

---

## Fase 5 — Recaudo Diario y Revisión (Prioridad: MEDIA-ALTA)

### 5.1 Sección 3.1 — Resumen del día

Query `cuadres WHERE recaudo_id = :recaudo_id` → sumar totales. Cards con saldo_anterior (de `get_saldo_anterior()`), efectivo_planillas, efectivo_dispersado, nuevo_saldo.

### 5.2 Sección 3.2 — Destinos de efectivo

Flujo cascada según tipo:
- Consignación RG → INSERT `consignaciones_banco` con `origen = 'DESTINO_EFECTIVO'`
- Anticipo aliado → INSERT `consignaciones_aliados` con `origen = 'DESTINO_EFECTIVO'`
- Gasto → INSERT `gastos` con `origen = 'DESTINO_EFECTIVO'`
- Anticipo nómina → INSERT `cuadre_anticipos_nomina` con `origen = 'DESTINO_EFECTIVO'`
- Traslado caja → INSERT `traslados_caja` con campos desnormalizados

### 5.3 Sección 3.4 — Soportes del día

- Upload a ruta local parametrizada en `parametros_sistema.RUTA_SOPORTES_*`
- Nomenclatura estándar: `DMA_20260419_RETENCIONES_DMA-RD-190426.pdf`
- INSERT `soportes_dia`

### 5.4 Cerrar día

UPDATE `recaudos_dia SET estado = 'CERRADO_AUXILIAR', cerrado_at = now()`

### 5.5 Vista 04 — Revisión Analista

- Cargar `checklist_revision` (11 ítems) calculando `aplica` automáticamente
- Al aprobar todos: ejecutar `promover_a_historico(recaudo_id)` vía RPC Supabase
- Al devolver: UPDATE estado = 'DEVUELTO' con nota obligatoria
- Bloqueo director: anular cuadres aprobados con motivo

---

## Fase 6 — Sincronización Odoo (Prioridad: MEDIA — BLOQUEADA)

> **Importante:** Esta fase requiere coordinar con el implementador de Odoo los 7 puntos pendientes listados en PROYECTO_v7.2.md §11.

### 6.1 Bloque 1 — Clientes
`clientes WHERE sincronizado_odoo = false OR requiere_sync_odoo = true` → API Odoo → UPDATE `sincronizado_odoo = true`

### 6.2 Bloque 2 — Documentos ERP
`hist_documentos_erp WHERE estado_at = 'APROBADO' AND estado_dian = 'APROBADO_CON_NOTIFICACION' AND estado_odoo = 'PENDIENTE'` → API Odoo

### 6.3 Bloque 3 — Proveedores
Similar a Bloque 1.

### 6.4 Bloque 4 — Empleados sin Odoo
Solo informativo — sin acción automática.

### 6.5 Bloque 5 — Transacciones
Enviar en orden: `hist_retenciones` → `hist_gastos` (causación + egreso) → `hist_consignaciones_banco` → `hist_consignaciones_aliados` → `hist_anticipos_nomina` → `hist_traslados_caja`

---

## Fase 7 — Informes y Conciliación Alpina (Prioridad: MEDIA)

### 7.1 Informes — reemplazar mocks con queries reales

| Informe | Query principal |
|---------|----------------|
| Cuadres del día | `cuadres JOIN recaudos_dia` |
| Consignaciones Banco | `consignaciones_banco` |
| Consignaciones Aliados | `consignaciones_aliados` |
| Auditoría Máximo Detalle | Todas las `hist_*` |
| Conciliación Alpina | `hist_consignaciones_aliados WHERE aliado = 'ALPINA'` |
| Plano Documentos ERP | `hist_documentos_erp JOIN clientes` |
| Estado Documentos ERP | `hist_documentos_erp` |
| Conciliación ERP vs DIAN | `hist_documentos_erp LEFT JOIN documentos_dian` |
| Documentos listos para Odoo | `hist_documentos_erp WHERE estado_at='APROBADO' AND estado_dian='APROBADO_CON_NOTIFICACION'` |
| Transacciones pendientes Odoo | `hist_* WHERE estado_odoo IN ('PENDIENTE','ERROR')` |

### 7.2 Conciliación Alpina

- Subir reporte Alpina → upsert `consignaciones_aliados`
- Cruce automático: valor EXACTO + fecha EXACTA + sede
- Ambigüedades → revisión manual con radio buttons
- Al certificar → `estado_certificacion = 'CERTIFICADA'` → habilitado para sync Odoo

---

## Dependencias Externas Pendientes (Bloquean Fase 6)

| # | Pendiente | Bloquea |
|---|-----------|---------|
| 1 | Endpoints API Odoo (URL + estructura JSON por tipo) | Fase 6 completa |
| 2 | `id_externo_odoo` exactos configurados en Odoo | Bloques 5 y parametrización |
| 3 | Diarios Odoo por tipo de transacción | Parametrización + Bloque 5 |
| 4 | Código exacto del diario de caja por cada sede | Tabla `sedes.diario_caja` |
| 5 | Cómo confirma Odoo que procesó un registro | UPDATE `estado_odoo = 'CONFIRMADO'` |
| 6 | Campos adicionales en `hist_empleados` para alerta sync | Bloque 4 |
| 7 | Causación vs egreso gastos: ¿1 llamada o 2? | Bloque 5 gastos |

---

## Resumen de Prioridades

```
CRÍTICA    → Fase 1: BD Supabase (ejecutar SQL y cargar datos iniciales)
ALTA       → Fase 2: Auth + Roles (antes de cualquier otra integración)
ALTA       → Fase 3: Ingesta SharePoint (alimentar la BD con datos reales)
ALTA       → Fase 4: Cuadre real (reemplazar mocks, el core del sistema)
MEDIA-ALTA → Fase 5: Recaudo + Revisión + promover_a_historico()
MEDIA      → Fase 7: Informes reales (concurrente con Fase 5 si hay recursos)
BLOQUEADA  → Fase 6: Sync Odoo (requiere coordinar con implementador Odoo)
```

---

*Plan actualizado al 2026-04-30 — basado en PROYECTO_v7.2.md (2026-04-28) · SQL_v7.2 · USUARIOS_v1.md*

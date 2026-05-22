# Plan de Implementación Completo — RioTesorería v7.3

**Fecha:** 2026-05-22
**Basado en:** PROYECTO\_v7.3.md · SQL\_v7.3 · USUARIOS\_v1.md · ERD v7.3
**Stack:** React + Vite + TypeScript · Zustand · Supabase (PostgreSQL) · Google Cloud Platform · Odoo API

\---

## Quién hace qué

|Herramienta|Rol|Cuándo usarla|
|-|-|-|
|**Claude Chat** (este chat)|Arquitecto y guía paso a paso|Siempre — genera prompts para Claude Code, resuelve dudas, interpreta errores|
|**Claude Code** (terminal VS Code)|Desarrollador que ejecuta|Cuando hay que tocar código: crear archivos, instalar librerías, hacer commits|
|**Supabase dashboard** (tú directamente)|Base de datos|Ejecutar SQL, configurar Auth, revisar tablas|
|**GCP dashboard** (tú directamente)|Deploy frontend e ingesta|Cloud Run, Cloud Scheduler, variables de entorno|

**El flujo correcto:**

```
Tú (negocio) → Claude Chat (arquitectura + prompts) → Claude Code en VS Code (ejecución)
                                                     → Tú directamente (Supabase + GCP)
```

\---

## Estado actual del proyecto

El frontend tiene **12 vistas** implementadas como prototipos estáticos con datos mock. Supabase DEV está configurado con las 41 tablas, tabla `perfiles`, RLS y datos iniciales. Login funcionando con sesión persistente.

|Vista|Archivo|Estado|
|-|-|-|
|Inicio del Día|`InicioDia.tsx`|✅ Prototipo mock|
|Estado de Planillas|`EstadoPlanillas.tsx`|✅ Prototipo mock|
|Cuadre de Planillas|`CuadrePlanillas.tsx`|✅ Prototipo mock (7 secciones)|
|Recaudo Diario|`RecaudoDiario.tsx`|✅ Prototipo mock|
|Revisión Analista|`Revision.tsx`|✅ Prototipo mock|
|Sincronización Odoo|`SincronizacionOdoo.tsx`|✅ Prototipo mock (3 bloques activos)|
|Informes|`Informes.tsx`|✅ Prototipo mock|
|Parametrización|`Parametrizacion.tsx`|✅ Prototipo mock|
|Conciliación Alpina|`ConciliacionAlpina.tsx`|⏳ Desactivada en UI (implementación futura)|
|Login|`LoginPage.tsx`|✅ Auth real Supabase + sesión persistente|
|Sidebar|`AppSidebar.tsx`|✅ Sin filtro por rol aún|
|Store|`appStore.ts`|✅ Con usuario/rol/sede real|

\---

## Resumen de fases

```
FASE 0 → Infraestructura (Supabase + GCP)            CRÍTICA    → tú directamente
FASE 1 → Base de datos Supabase                       CRÍTICA    → tú directamente  ✅ COMPLETADA EN DEV
FASE 2 → Autenticación y control de acceso            ALTA       → Claude Code       🔄 EN PROGRESO
FASE 3 → Ingesta de datos desde SharePoint            ALTA       → Claude Code + tú
FASE 4 → Módulo cuadre de planillas (core)            ALTA       → Claude Code
FASE 5 → Recaudo diario y revisión analista           MEDIA-ALTA → Claude Code
FASE 6 → Sincronización Odoo                          BLOQUEADA  → espera partner Odoo
FASE 7 → Informes                                     MEDIA      → Claude Code
FASE 8 → Paso a Producción                            CRÍTICA    → tú directamente
```

\---

## FASE 0 — Infraestructura

> \*\*Quién:\*\* Tú directamente en los dashboards. Claude Chat te guía paso a paso.
> \*\*Objetivo:\*\* Tener los dos ambientes (DEV y PROD) listos y el frontend publicado en GCP.

### 0.1 Crear proyecto Supabase DEV ✅ COMPLETADO

* Proyecto `riotesoreria-dev` creado en São Paulo
* Claves guardadas (Project URL, anon key, service\_role key)

### 0.2 Crear proyecto Supabase PROD ✅ COMPLETADO

* Proyecto `riotesoreria-prod` creado en São Paulo
* Claves guardadas identificadas como PROD
* **No ejecutar el SQL todavía** — primero se prueba todo en DEV

### 0.3 Conectar repo a GCP

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto nuevo: `riotesoreria`
3. Habilita las APIs: **Cloud Run**, **Cloud Build**, **Artifact Registry**
4. Conecta tu repo de GitHub a Cloud Build
5. Crea un trigger de deploy automático en la rama `main`
6. Configura las variables de entorno en Cloud Run:

   * `VITE\_SUPABASE\_URL` → Project URL de `riotesoreria-dev`
   * `VITE\_SUPABASE\_ANON\_KEY` → Anon key de `riotesoreria-dev`

**Separación DEV / PROD en GCP:**

* Servicio Cloud Run `riotesoreria-dev` → variables apuntan a Supabase DEV
* Servicio Cloud Run `riotesoreria-prod` → variables apuntan a Supabase PROD
* Rama `dev` despliega al servicio DEV automáticamente
* Rama `main` despliega al servicio PROD automáticamente

### 0.4 Motor de ingesta — Supabase Edge Functions

El motor de ingesta (lectura de SharePoint + procesamiento Excel + upsert en Supabase) vive en Supabase Edge Functions, no en GCP ni en el frontend.

* **Modo manual:** botón "Sincronizar" en UI → llama a la Edge Function directamente
* **Modo automático:** Edge Function programada con cron a `HORA\_SYNC\_AUTOMATICA` (parámetro de `parametros\_sistema`)
* **Procesamiento:** batches de 1.000 filas para manejar 70K documentos/mes sin timeouts

\---

## FASE 1 — Base de datos Supabase (CRÍTICA) ✅ COMPLETADA EN DEV

> \*\*Quién:\*\* Tú directamente en el dashboard de Supabase DEV.
> \*\*Objetivo:\*\* 41 tablas + tabla perfiles + RLS + datos iniciales listos en DEV.

### 1.1 Ejecutar esquema SQL v7.3 ✅

1. En Supabase DEV → **SQL Editor → New query**
2. Abre `SQL\_v7\_3\_Tesoreria\_Riogrande.sql`, copia todo (Ctrl+A)
3. Pégalo en el editor y clic en **"Run and enable RLS"**
4. Resultado esperado: **"Success. No rows returned"**

**Verificar en Table Editor — 41 tablas:**

* Maestras y parámetros (11): `sedes`, `aliados`, `operaciones`, `bancos`, `cuentas\_analiticas`, `parametros\_contables`, `parametros\_contables\_generales`, `parametros\_sistema`, `empleados`, `vehiculos`, `consecutivos\_cuadre`
* Terceros (2): `clientes`, `proveedores`
* Ingesta (4): `documentos\_erp`, `documentos\_dian`, `consignaciones\_banco`, `consignaciones\_aliados`
* Operativas cuadre (5): `recaudos\_dia`, `cuadres`, `cuadre\_retenciones`, `gastos`, `cuadre\_anticipos\_nomina`
* Recaudo y revisión (3): `traslados\_caja`, `soportes\_dia`, `checklist\_revision`
* Históricas (15): todas las `hist\_\*`
* Audit log (1): `audit\_log`

### 1.2 Crear tabla `perfiles` ✅

```sql
CREATE TABLE perfiles (
    id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    sede\_id    uuid        REFERENCES sedes(id),
    rol        text        NOT NULL,
    -- auxiliar | analista | director | admin
    nombre     text        NOT NULL,
    activo     boolean     NOT NULL DEFAULT true,
    created\_at timestamptz NOT NULL DEFAULT now(),
    updated\_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg\_upd\_perfiles
    BEFORE UPDATE ON perfiles
    FOR EACH ROW EXECUTE FUNCTION fn\_updated\_at();

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfil\_propio" ON perfiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

### 1.3 Configurar RLS (Row Level Security)

```sql
-- Función helper para leer el perfil del usuario actual
CREATE OR REPLACE FUNCTION get\_perfil()
RETURNS perfiles AS $$
  SELECT \* FROM perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Habilitar RLS en tablas operativas
ALTER TABLE recaudos\_dia            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadres                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadre\_retenciones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadre\_anticipos\_nomina ENABLE ROW LEVEL SECURITY;
ALTER TABLE traslados\_caja          ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignaciones\_banco    ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignaciones\_aliados  ENABLE ROW LEVEL SECURITY;
ALTER TABLE soportes\_dia            ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist\_revision      ENABLE ROW LEVEL SECURITY;

-- Política: auxiliar ve solo su sede, los demás ven todo
CREATE POLICY "acceso\_por\_sede\_recaudos" ON recaudos\_dia
  USING (
    (SELECT rol FROM perfiles WHERE id = auth.uid()) != 'auxiliar'
    OR
    sede\_id = (SELECT sede\_id FROM perfiles WHERE id = auth.uid())
  );

CREATE POLICY "acceso\_por\_sede\_cuadres" ON cuadres
  USING (
    (SELECT rol FROM perfiles WHERE id = auth.uid()) != 'auxiliar'
    OR
    sede\_id = (SELECT sede\_id FROM perfiles WHERE id = auth.uid())
  );

CREATE POLICY "acceso\_por\_sede\_gastos" ON gastos
  USING (
    (SELECT rol FROM perfiles WHERE id = auth.uid()) != 'auxiliar'
    OR
    recaudo\_id IN (
      SELECT id FROM recaudos\_dia
      WHERE sede\_id = (SELECT sede\_id FROM perfiles WHERE id = auth.uid())
    )
  );
```

### 1.4 Verificar datos iniciales ✅

* `sedes` → 4 filas (DMA, CAC, APA, QBO)
* `aliados` → 5 filas (ALPINA, CARNICOS, FAMILIA, NUTRESA, MEALS)
* `operaciones` → 10 filas
* `bancos` → 9 filas
* `parametros\_sistema` → 15 filas
* `consecutivos\_cuadre` → 4 filas (una por sede)

### 1.5 Crear primer usuario Admin ✅

```sql
-- Obtener UUID del usuario creado en Authentication:
SELECT id, email FROM auth.users;

-- Crear perfil admin:
INSERT INTO perfiles (id, sede\_id, rol, nombre)
VALUES (
  'TU-UUID-AQUI',
  NULL,
  'admin',
  'Administrador RioTesorería'
);
```

### 1.6 Notas de implementación DEV (lecciones aprendidas)

Al ejecutar el SQL v7.3 en PROD **no** se necesitan pasos adicionales porque:

* El bloque de GRANTs ya está incluido al final del SQL v7.3
* El índice `idx\_hist\_doc\_erp\_sede\_fecha` ya está incluido con `operacion\_id` (no `sede\_id`)
* La condición de bloqueo de Alpina ya fue eliminada de `promover\_a\_historico()`

\---

## FASE 2 — Autenticación y Control de Acceso (ALTA) 🔄 EN PROGRESO

> \*\*Quién:\*\* Claude Code en VS Code.
> \*\*Objetivo:\*\* Login real con Supabase Auth, roles funcionando, sidebar filtrado.

### 2.1 Conectar Supabase al frontend ✅

* `@supabase/supabase-js` instalado
* `src/lib/supabase.ts` creado con cliente configurado
* `.env.local` con `VITE\_SUPABASE\_URL` y `VITE\_SUPABASE\_ANON\_KEY`

### 2.2 Login real y sesión persistente ✅

* `LoginPage.tsx` usa `supabase.auth.signInWithPassword()`
* `supabase.auth.onAuthStateChange()` mantiene la sesión al hacer F5
* Al iniciar la app: `supabase.auth.getSession()` verifica si hay sesión activa antes de redirigir al login

### 2.3 Ampliar el store (`appStore.ts`)

```typescript
interface AppState {
  user: User | null;
  perfil: Perfil | null;
  rol: 'auxiliar' | 'analista' | 'director' | 'admin' | null;
  sedeId: string | null;
  sedeCodigo: string | null;
}
```

Al hacer login: leer `perfiles` donde `id = user.id` y poblar el store.

### 2.4 Filtrar sidebar por rol

Implementar en `AppSidebar.tsx`:

```typescript
const menuItems = allMenuItems.filter(item => {
  if (item.id === 'revision')             return \['analista','director','admin'].includes(rol);
  if (item.id === 'conciliacion-alpina')  return false; // desactivado — implementación futura
  if (item.id === 'sincronizacion-odoo')  return rol === 'admin';
  if (item.id === 'parametrizacion')      return rol === 'admin';
  return true;
});
```

> \*\*Nota:\*\* `conciliacion-alpina` queda oculto para todos los roles — implementación futura. Los bloques de sync de proveedores y empleados en `SincronizacionOdoo.tsx` también se ocultan o muestran con badge "Próximamente".

### 2.5 Guardia de rutas

Crear `src/components/ProtectedRoute.tsx` que verifique sesión activa y rol requerido antes de renderizar cada vista. Redirige a `/login` si no hay sesión.

### 2.6 Gestión de usuarios en Parametrización

En `Parametrizacion.tsx`, pestaña "Usuarios": UI para que el Admin cree usuarios (llama a Supabase Admin API), asigne rol y sede, e inserte en `perfiles`.

\---

## FASE 3 — Ingesta de Datos desde SharePoint (ALTA)

> \*\*Quién:\*\* Claude Code para los parsers. Tú validas los formatos Excel con contabilidad primero.
> \*\*Objetivo:\*\* Motor de ingesta funcionando — manual (botón en UI) y automático (cron).

> ⚠️ \*\*Validar con contabilidad\*\* que los archivos Excel de SharePoint tienen el formato exacto del PROYECTO\_v7.3.md §4 antes de programar los parsers.

### 3.1 Arquitectura de ingesta

El motor vive en **Supabase Edge Functions** (TypeScript). No requiere servidor externo.

* **Ingesta manual:** botón "Sincronizar" en UI → llama a la Edge Function → el script corre en ese momento
* **Ingesta automática:** Edge Function con trigger cron a `HORA\_SYNC\_AUTOMATICA` → controlada por `INGESTA\_AUTOMATICA\_ACTIVA` en `parametros\_sistema`

### 3.2 Parsers por fuente

|Archivo|Tabla destino|Clave upsert|
|-|-|-|
|ERP (`DA\_2026\_04.xlsx`) — incluye facturas, notas, anticipos y cruces|`documentos\_erp` + `clientes`|`operacion\_documento` / `operacion\_codigo\_cliente`|
|Extracto banco|`consignaciones\_banco`|`banco\_id` + `referencia`|
|Aliados Cárnicos/Nutresa/Meals|`consignaciones\_aliados`|por definir con contabilidad|
|DIAN|`documentos\_dian` → trigger → `documentos\_erp.estado\_dian`|`documento\_electronico`|

> \*\*Nota Alpina:\*\* Alpina no tiene parser de ingesta. Sus consignaciones las registra el auxiliar manualmente en la sección 2.4 del cuadre con `estado\_certificacion = 'SIN\_CERTIFICAR'`. Pasan al histórico sin conciliación posterior.

### 3.3 Procesamiento en batches

Con 70K documentos/mes, procesar en lotes de 1.000 filas con barra de progreso visible en UI. Evitar timeouts de la Edge Function.

### 3.4 Antifraude

* Calcular y guardar `hash\_archivo` al ingestar
* Para aliados (Cárnicos/Nutresa/Meals): cruzar sede del nombre del archivo vs columna Caja → alerta Admin si discrepancia

### 3.5 Habilitadores en UI

El botón "Sincronizar" en Inicio del Día respeta:

* `INGESTA\_MANUAL\_ACTIVA = true` → botón activo
* `INGESTA\_AUTOMATICA\_ACTIVA = true` → cron activo a `HORA\_SYNC\_AUTOMATICA`

\---

## FASE 4 — Módulo Cuadre de Planillas (ALTA — Core del sistema)

> \*\*Quién:\*\* Claude Code. Esta es la fase más extensa — se hace sección por sección.
> \*\*Objetivo:\*\* Reemplazar todos los mocks de `CuadrePlanillas.tsx` con queries reales.
> \*\*Piloto:\*\* Sede Donmatías (DMA) primero.

### 4.1 Estado de Planillas → selección para cuadre

* Query `documentos\_erp WHERE estado\_planilla\_erp = 'CERRADA'` agrupado por `operacion\_planilla`
* Al confirmar selección → crear `recaudos\_dia` (estado BORRADOR) y `cuadres` (estado BORRADOR)

### 4.2 Sección 2.1 — Liquidación planillas

```sql
SELECT \* FROM documentos\_erp
WHERE operacion\_planilla = ANY(:planillas)
  AND tipo\_documento IN (
    'FACTURA DE VENTA','NOTA CREDITO','NOTA DEBITO',
    'ANTICIPO','CRUCE ANTICIPO'
  )
ORDER BY tipo\_documento, fecha\_emision;
```

### 4.3 Sección 2.2 — Gastos de ruta

* Dropdown "Tipo de gasto": `parametros\_contables WHERE tipo\_asiento = 'gastos' AND (sede\_id = :sede OR sede\_id IS NULL)`
* Búsqueda proveedor: `proveedores WHERE activo = true`
* Al guardar: INSERT en `gastos` con todos los campos desnormalizados
* Validar fecha contra `DIAS\_ATRAS\_REGISTRO\_GASTO` y `DIAS\_ADELANTE\_REGISTRO\_GASTO`

### 4.4 Sección 2.3 — Consignaciones Riogrande

* Dropdown "Cuenta destino": `parametros\_contables WHERE tipo\_asiento = 'consignaciones a riogrande' AND (sede\_id = :sede OR sede\_id IS NULL)`
* Lista disponibles: `consignaciones\_banco WHERE estado\_cuadre = 'LIBRE' AND banco\_id = :banco\_id\_del\_parametro AND fecha BETWEEN :desde AND :hasta`
* Al seleccionar: UPDATE `estado\_cuadre = 'BLOQUEADA'` + desnormalizar `diario\_caja` y `diario\_destino`

### 4.5 Sección 2.4 — Anticipos Aliados

* Cárnicos/Nutresa/Meals: `consignaciones\_aliados WHERE estado\_certificacion = 'CERTIFICADA' AND estado\_cuadre = 'LIBRE' AND sede\_id = :sede`
* Alpina: INSERT libre en `consignaciones\_aliados` con `estado\_certificacion = 'SIN\_CERTIFICAR'` + desnormalizar `nit\_aliado`, `nombre\_aliado`, `cuenta\_anticipo`, `diario\_caja`

### 4.6 Sección 2.5 — Anticipos de clientes

```sql
SELECT \* FROM documentos\_erp
WHERE tipo\_documento IN ('ANTICIPO','CRUCE ANTICIPO')
  AND operacion\_planilla = ANY(:planillas);
```

Los dos grupos (ANTICIPO positivo, CRUCE ANTICIPO que resta) y la fórmula ya están en la UI.

### 4.7 Sección 2.6 — Anticipos nómina

* Dropdown empleado: `empleados WHERE sede\_id = :sede AND activo = true`
* Dropdown cuenta analítica: `cuentas\_analiticas WHERE sede\_id = :sede AND activo = true`
* Al guardar: INSERT en `cuadre\_anticipos\_nomina` con campos desnormalizados
* Si `concepto = 'HURTO\_RUTA'` → `estado\_autorizacion = 'PENDIENTE'`

### 4.8 Sección 2.7 — Confirmar cuadre

Al confirmar, en este orden:

1. Llamar `generar\_consecutivo\_cuadre(sede\_id, fecha)` vía RPC → genera `DMA-110426.01`
2. UPDATE `cuadres SET consecutivo, total\_\*, efectivo\_real, efectivo\_teorico, estado = 'ENVIADO\_REVISION', confirmado\_at = now()`
3. UPDATE `documentos\_erp SET estado\_at = 'EN\_CUADRE', numero\_cuadre = :consecutivo`
4. UPDATE `consignaciones\_banco SET estado\_cuadre = 'EN\_CUADRE'` donde aplique
5. UPDATE `consignaciones\_aliados SET estado\_cuadre = 'EN\_CUADRE'` donde aplique

\---

## FASE 5 — Recaudo Diario y Revisión (MEDIA-ALTA)

> \*\*Quién:\*\* Claude Code.
> \*\*Objetivo:\*\* Reemplazar mocks de `RecaudoDiario.tsx` y `Revision.tsx`. Activar `promover\_a\_historico()`.

### 5.1 Sección 3.1 — Resumen del día

```sql
SELECT \* FROM cuadres WHERE recaudo\_id = :recaudo\_id;
```

Cards con:

* `saldo\_anterior` → llamar `get\_saldo\_anterior(sede\_id, fecha)` vía RPC
* `efectivo\_planillas` → suma de `efectivo\_real` de cuadres del día
* `efectivo\_dispersado` → suma de todos los destinos del día
* `nuevo\_saldo` → campo GENERATED en `recaudos\_dia`

### 5.2 Sección 3.2 — Destinos de efectivo

Flujo cascada según tipo seleccionado:

* Consignación RG → INSERT `consignaciones\_banco` con `origen = 'DESTINO\_EFECTIVO'`
* Anticipo aliado → INSERT `consignaciones\_aliados` con `origen = 'DESTINO\_EFECTIVO'`
* Gasto → INSERT `gastos` con `origen = 'DESTINO\_EFECTIVO'` + desnormalización completa
* Anticipo nómina → INSERT `cuadre\_anticipos\_nomina` con `origen = 'DESTINO\_EFECTIVO'`
* Traslado caja → INSERT `traslados\_caja` con `fecha`, `detalle`, `diario\_caja`, `diario\_destino` desnormalizados

### 5.3 Sección 3.4 — Soportes del día

* Upload de archivo → renombrar con nomenclatura estándar: `DMA\_20260419\_RETENCIONES\_DMA-RD-190426.pdf`
* Guardar en ruta de `parametros\_sistema.RUTA\_SOPORTES\_DMA`
* INSERT en `soportes\_dia`

### 5.4 Cerrar día

```sql
UPDATE recaudos\_dia
SET estado = 'CERRADO\_AUXILIAR', cerrado\_at = now()
WHERE id = :recaudo\_id;
```

### 5.5 Vista Revisión Analista

* Cargar `checklist\_revision` (11 ítems) calculando `aplica` automáticamente según registros del día
* Al aprobar todos los ítems: llamar `promover\_a\_historico(:recaudo\_id)` vía RPC
* Al devolver: UPDATE `recaudos\_dia SET estado = 'DEVUELTO', nota\_devolucion = :nota`
* Director puede anular cuadres aprobados con motivo obligatorio

\---

## FASE 6 — Sincronización Odoo (BLOQUEADA)

> ⛔ Esta fase requiere coordinar con el implementador de Odoo los puntos del PROYECTO\_v7.3.md §10 antes de comenzar.

### Dependencias externas que bloquean esta fase

|#|Pendiente|Bloquea|
|-|-|-|
|1|Endpoints API Odoo (URL + estructura JSON por tipo)|Fase 6 completa|
|2|`id\_externo\_odoo` exactos configurados en Odoo|Bloque 3 y parametrización|
|3|Diarios Odoo por tipo de transacción|Parametrización + Bloque 3|
|4|Código exacto del diario de caja por cada sede|Tabla `sedes.diario\_caja`|
|5|Cómo confirma Odoo que procesó un registro|UPDATE `estado\_odoo = 'CONFIRMADO'`|
|6|Causación vs egreso gastos: ¿1 llamada o 2 a la API?|Bloque 3 gastos|

### Diseño de los 3 bloques activos (cuando se desbloquee)

**Bloque 1 — Clientes**
`clientes WHERE sincronizado\_odoo = false OR requiere\_sync\_odoo = true` → API Odoo → UPDATE `sincronizado\_odoo = true, sincronizado\_at = now()`

**Bloque 2 — Documentos ERP**
`hist\_documentos\_erp WHERE estado\_at = 'APROBADO' AND estado\_dian = 'APROBADO\_CON\_NOTIFICACION' AND estado\_odoo = 'PENDIENTE'` → API Odoo.
Se habilita solo cuando Bloque 1 está completo.

**Bloque 3 — Transacciones pendientes**
Solo se habilita cuando Bloques 1 y 2 están completos. Enviar en orden:

1. `hist\_retenciones WHERE estado\_odoo = 'PENDIENTE'`
2. `hist\_gastos WHERE estado\_odoo = 'PENDIENTE'` (causación + egreso)
3. `hist\_consignaciones\_banco WHERE estado\_odoo = 'PENDIENTE'`
4. `hist\_consignaciones\_aliados WHERE estado\_odoo = 'PENDIENTE'`
5. `hist\_anticipos\_nomina WHERE estado\_odoo = 'PENDIENTE'`
6. `hist\_traslados\_caja WHERE estado\_odoo = 'PENDIENTE'`

> \*\*Bloques de proveedores y empleados:\*\* desactivados en esta versión. Los campos `sincronizado\_odoo` y `requiere\_sync\_odoo` se conservan para activación futura.

\---

## FASE 7 — Informes (MEDIA)

> \*\*Quién:\*\* Claude Code. Puede hacerse en paralelo con Fase 5.
> \*\*Objetivo:\*\* Reemplazar mocks de `Informes.tsx` con queries reales.

### 7.1 Queries por informe

|Informe|Query principal|
|-|-|
|Estado de planillas|`cuadres JOIN recaudos\_dia WHERE fecha = :fecha AND sede\_id = :sede`|
|Estado del día|`recaudos\_dia WHERE sede\_id = :sede AND fecha = :fecha`|
|Detalle del día|`cuadres detalle WHERE recaudo\_id = :recaudo\_id`|
|Planillas pendientes|`documentos\_erp WHERE estado\_planilla\_erp = 'CERRADA' AND estado\_at = 'PENDIENTE'`|
|Saldos de efectivo|`recaudos\_dia WHERE sede\_id = :sede ORDER BY fecha DESC`|
|Consignaciones Banco|`consignaciones\_banco WHERE sede\_id = :sede AND fecha BETWEEN :desde AND :hasta`|
|Consignaciones Aliados|`consignaciones\_aliados WHERE sede\_id = :sede AND fecha BETWEEN :desde AND :hasta`|
|Auditoría Máximo Detalle|Todas las `hist\_\*` con filtros de fecha y sede|
|Plano Documentos ERP|`hist\_documentos\_erp JOIN clientes WHERE sede\_id = :sede`|
|Estado Documentos ERP|`hist\_documentos\_erp WHERE sede\_id = :sede AND estado\_at = :estado`|
|Conciliación ERP vs DIAN|`hist\_documentos\_erp LEFT JOIN documentos\_dian ON documento\_electronico`|
|Documentos listos Odoo|`hist\_documentos\_erp WHERE estado\_at='APROBADO' AND estado\_dian='APROBADO\_CON\_NOTIFICACION'`|
|Transacciones pendientes Odoo|`hist\_\* WHERE estado\_odoo IN ('PENDIENTE','ERROR')`|

### 7.2 Descarga Excel

Todos los informes deben descargarse en Excel. Usar librería `xlsx` (SheetJS) ya disponible en el proyecto.

\---

## FASE 8 — Paso a Producción (CRÍTICA)

> \*\*Quién:\*\* Tú directamente en Supabase PROD y GCP. Claude Chat te guía paso a paso.
> \*\*Prerequisito obligatorio:\*\* Las Fases 0 a 7 completadas y validadas en DEV.
> \*\*Objetivo:\*\* Desplegar RioTesorería en el ambiente real con usuarios reales de Donmatías.

### 8.0 Checklist de salida de DEV — NO pasar a PROD sin esto

|#|Criterio|Validado|
|-|-|-|
|1|Login y roles funcionando (auxiliar, analista, director, admin)|☐|
|2|Ingesta de archivos Excel desde SharePoint sin errores|☐|
|3|Cuadre de planillas completo (7 secciones) funcionando en DMA|☐|
|4|Recaudo diario cerrado y aprobado al menos 1 vez real en DEV|☐|
|5|Revisión analista y aprobación funcionando|☐|
|6|`promover\_a\_historico()` ejecutado sin errores|☐|
|7|Informes mostrando datos reales con descarga Excel|☐|
|8|Sincronización Odoo validada (cuando esté desbloqueada)|☐|
|9|Al menos 2 semanas de piloto real en DMA en DEV sin errores críticos|☐|
|10|Todos los usuarios reales capacitados|☐|

### 8.1 Entender qué se pasa de DEV a PROD

**Lo que NO se pasa a PROD:**

* Los datos de prueba (cuadres ficticios, usuarios de prueba, consignaciones inventadas)
* Nada de lo que se ingresó en DEV durante las pruebas

**Lo que SÍ se replica en PROD — automáticamente al ejecutar el SQL v7.3:**

* La estructura completa de las 41 tablas
* Los datos maestros reales: sedes, aliados, bancos, operaciones, parámetros del sistema
* Los permisos y políticas de seguridad (RLS)
* Los GRANTs para el rol `authenticated`

**El frontend es el mismo para DEV y PROD.** Solo cambian las variables de entorno en GCP.

```
DEV  → sirvió para probar y corregir todo
PROD → arranca limpio, con el SQL v7.3 ya perfecto, listo para datos reales
```

### 8.2 Ejecutar SQL v7.3 en Supabase PROD

> Este es exactamente el mismo proceso que en DEV. El SQL v7.3 ya incluye todas las correcciones — corre limpio a la primera.

1. Abre `riotesoreria-prod` en [supabase.com](https://supabase.com)
2. **SQL Editor → New query**
3. Abre `SQL\_v7\_3\_Tesoreria\_Riogrande.sql` → Ctrl+A → Ctrl+C
4. Pega en el editor → clic en **"Run and enable RLS"**
5. Resultado esperado: `Success. No rows returned`

**Verificar en Table Editor:**

* 41 tablas presentes
* `sedes` → 4 filas, `aliados` → 5 filas, `operaciones` → 10 filas
* `bancos` → 9 filas, `parametros\_sistema` → 15 filas, `consecutivos\_cuadre` → 4 filas

### 8.3 Crear tabla `perfiles` en PROD

Ejecutar en SQL Editor (mismo SQL del paso 1.2):

```sql
CREATE TABLE perfiles (
    id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    sede\_id    uuid        REFERENCES sedes(id),
    rol        text        NOT NULL,
    nombre     text        NOT NULL,
    activo     boolean     NOT NULL DEFAULT true,
    created\_at timestamptz NOT NULL DEFAULT now(),
    updated\_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg\_upd\_perfiles
    BEFORE UPDATE ON perfiles
    FOR EACH ROW EXECUTE FUNCTION fn\_updated\_at();

ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfil\_propio" ON perfiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

### 8.4 Crear usuarios reales en Supabase PROD

Para cada usuario real del piloto DMA:

1. Supabase PROD → **Authentication → Users → Add user**
2. Email y contraseña del usuario
3. Obtener UUID: `SELECT id, email FROM auth.users ORDER BY created\_at DESC LIMIT 5;`
4. Crear perfil:

```sql
INSERT INTO perfiles (id, sede\_id, rol, nombre)
VALUES (
  'UUID-DEL-USUARIO',
  (SELECT id FROM sedes WHERE codigo = 'DMA'),
  'auxiliar',  -- auxiliar | analista | director | admin
  'Nombre Completo del Usuario'
);
```

**Usuarios mínimos para el piloto DMA:**

|Rol|Cantidad mínima|
|-|-|
|admin|1|
|director|1|
|analista|1|
|auxiliar|1 por ruta activa|

### 8.5 Configurar GCP para PROD

1. Crea un servicio Cloud Run nuevo: `riotesoreria-prod`
2. Variables de entorno del servicio PROD:

   * `VITE\_SUPABASE\_URL` → Project URL de `riotesoreria-prod`
   * `VITE\_SUPABASE\_ANON\_KEY` → Anon key de `riotesoreria-prod`
3. Conectar rama `main` del repo a este servicio
4. Verificar que la URL pública del servicio apunta a Supabase PROD

### 8.6 Smoke test en PROD

|Prueba|Resultado esperado|
|-|-|
|Login admin|Entra correctamente, ve todo el menú|
|Login auxiliar|Ve solo su sede, menú filtrado, Conciliación Alpina oculta|
|Login analista|Ve todas las sedes, ve revisión|
|Ingesta archivo Excel de prueba|Datos llegan a las tablas correctas|
|Crear cuadre de prueba DMA|Flujo completo sin errores|
|Cerrar y aprobar recaudo de prueba|`promover\_a\_historico()` ejecuta sin errores|
|Verificar `audit\_log`|Registra todas las acciones|

### 8.7 Monitoreo primera semana

```sql
-- Revisar actividad de las últimas 24 horas
SELECT tabla, accion, usuario\_email, created\_at
FROM audit\_log
WHERE created\_at >= now() - interval '24 hours'
ORDER BY created\_at DESC;

-- Verificar recaudos del día
SELECT consecutivo, sede\_id, estado, created\_at
FROM recaudos\_dia
WHERE fecha = current\_date
ORDER BY created\_at DESC;

-- Verificar errores de sync Odoo
SELECT tabla, registro\_id, error\_sync, created\_at
FROM hist\_retenciones WHERE error\_sync IS NOT NULL
UNION ALL
SELECT 'hist\_gastos', id::text, error\_sync, promovido\_at FROM hist\_gastos WHERE error\_sync IS NOT NULL
ORDER BY created\_at DESC;
```

**Criterio de estabilidad:** 2 semanas sin errores críticos en PROD → sistema estable.

\---

## Prompt inicial para Claude Code

Al abrir Claude Code en VS Code (`claude` en la terminal), dale este prompt exacto:

```
Lee estos archivos de la carpeta /Docs de este repositorio antes de hacer cualquier cosa:
- PROYECTO\_v7.3.md
- SQL\_v7\_3\_Tesoreria\_Riogrande.sql
- USUARIOS\_v1.md
- Plan\_Implementacion\_v7\_3.md

Somos una empresa de distribución colombiana (Distribuciones Riogrande)
implementando una plataforma de tesorería llamada RioTesorería.

Contexto actual:
- El modelo de datos está completo en Supabase DEV (41 tablas + perfiles)
- El frontend React tiene todas las vistas como mocks estáticos
- El login real con Supabase Auth ya funciona con sesión persistente
- Vamos a conectar el resto progresivamente
- El piloto es la sede Donmatías (DMA)
- Stack: React + Vite + TypeScript + Zustand + Supabase
- Deploy: Google Cloud Platform (Cloud Run)

Confirma que leíste los 4 archivos respondiendo:
1. ¿Cuántas tablas tiene el modelo?
2. ¿Cuáles son las fases del plan y cuál es el estado actual?
3. ¿Qué vistas ya tienen auth real y cuáles siguen con mock?

No hagas ningún cambio todavía. Solo confirma que entendiste el contexto.
```

\---

## Notas de escalabilidad y producción

**Supabase es suficiente** para el volumen actual y proyectado:

* 70K documentos/mes × 12 = 840K registros/año en `documentos\_erp`
* Peso estimado \~4.5 GB/año incluyendo históricas e índices
* Supabase Pro ($25/mes) incluye 8 GB — cubre \~2 años sin cambios
* Escalado adicional: $0.125/GB/mes sin cambiar código

**GCP Cloud Run** para el frontend:

* Cobra solo por requests — costo mínimo para una app interna
* Deploy automático con cada push a `main`
* Escalado automático según carga

**RPA ECOM (implementación futura):**

* Python + pandas en GCP Cloud Run
* Cloud Scheduler lo ejecuta a las 5am antes de la sync de Supabase
* Descarga de ECOM → cruza 5 archivos → genera plano Excel → sube a SharePoint
* Cotizar e implementar por separado cuando se estabilice DEV

**Cuando migrar a Azure:** cuando superes 20GB de almacenamiento o necesites procesamiento analítico pesado. Con el crecimiento actual, aproximadamente en 4-5 años.

\---

*Plan de implementación v7.3 — Distribuciones Riogrande · RioTesorería · 2026-05-22*


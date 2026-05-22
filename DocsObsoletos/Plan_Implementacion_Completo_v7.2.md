# Plan de Implementación Completo — RioTesorería v7.2
**Fecha:** 2026-04-30
**Basado en:** PROYECTO_v7.2.md · SQL_v7.2 · USUARIOS_v1.md · ERD v7.2
**Stack:** React + Vite + TypeScript · Zustand · Supabase (PostgreSQL) · Vercel · Odoo API

---

## Quién hace qué

| Herramienta | Rol | Cuándo usarla |
|-------------|-----|---------------|
| **Claude Chat** (este chat) | Arquitecto y guía paso a paso | Siempre — genera prompts para Claude Code, resuelve dudas, interpreta errores |
| **Claude Code** (conectado a GitHub) | Desarrollador que ejecuta | Cuando hay que tocar código: crear archivos, instalar librerías, hacer commits |
| **Supabase dashboard** (tú directamente) | Base de datos | Ejecutar SQL, configurar Auth, revisar tablas |
| **Vercel dashboard** (tú directamente) | Deploy frontend | Conectar GitHub, configurar variables de entorno, publicar |
| **Antigravity** | Ajustes rápidos de UI | Solo para cambios visuales menores cuando ya esté conectado |

**El flujo correcto:**
```
Tú (negocio) → Claude Chat (arquitectura + prompts) → Claude Code (ejecución en código)
                                                    → Tú directamente (Supabase + Vercel)
```

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

---

## Resumen de fases y prioridades

```
FASE 0 → Infraestructura (Supabase + Vercel)         CRÍTICA    → tú directamente
FASE 1 → Base de datos Supabase                       CRÍTICA    → tú directamente
FASE 2 → Autenticación y control de acceso            ALTA       → Claude Code
FASE 3 → Ingesta de datos desde SharePoint            ALTA       → Claude Code + tú
FASE 4 → Módulo cuadre de planillas (core)            ALTA       → Claude Code
FASE 5 → Recaudo diario y revisión analista           MEDIA-ALTA → Claude Code
FASE 6 → Sincronización Odoo                          BLOQUEADA  → espera partner Odoo
FASE 7 → Informes y conciliación Alpina               MEDIA      → Claude Code
```

---

## FASE 0 — Infraestructura (ANTES de tocar código)
> **Quién:** Tú directamente en los dashboards. Claude Chat te guía paso a paso.
> **Objetivo:** Tener los dos ambientes (DEV y PROD) listos y el frontend publicado en Vercel.

### 0.1 Crear proyecto Supabase DEV
1. Ve a [supabase.com](https://supabase.com) → inicia sesión
2. Clic en **"New Project"**
3. Configuración:
   - **Name:** `riotesoreria-dev`
   - **Database Password:** crea una contraseña segura y guárdala
   - **Region:** `South America (São Paulo)`
   - **Plan:** Free
4. Espera 2 minutos a que aprovisione
5. Ve a **Settings → API** y guarda en un documento de texto:
   - `Project URL` → `https://xxxxxxxx.supabase.co`
   - `anon public key` → empieza con `eyJ...`
   - `service_role key` → empieza con `eyJ...` ⚠️ nunca al frontend

### 0.2 Crear proyecto Supabase PROD
- Repite el paso 0.1 con nombre `riotesoreria-prod`
- Guarda sus claves identificadas como PROD
- **No ejecutes el SQL todavía** — primero se prueba todo en DEV

### 0.3 Conectar repo a Vercel
1. Ve a [vercel.com](https://vercel.com) → inicia sesión con GitHub
2. Clic en **"Add New Project"**
3. Selecciona tu repo `AplicacionTesoreriaRiogrande`
4. Framework: Vite (lo detecta automáticamente)
5. Variables de entorno — agrega las del proyecto DEV por ahora:
   - `VITE_SUPABASE_URL` → tu Project URL DEV
   - `VITE_SUPABASE_ANON_KEY` → tu anon key DEV
6. Clic en **Deploy**
7. Vercel crea automáticamente:
   - `main` branch → URL de producción
   - cualquier otra branch → URL de preview/dev

### 0.4 Agregar índice de rendimiento recomendado
> Se ejecuta después del SQL v7.2 en el paso 1.1. Cubre el 90% de las consultas de informes con 70K documentos/mes.

```sql
CREATE INDEX idx_hist_doc_erp_sede_fecha
ON hist_documentos_erp(sede_id, fecha_recaudo, estado_odoo);
```

---

## FASE 1 — Base de datos Supabase (CRÍTICA)
> **Quién:** Tú directamente en el dashboard de Supabase DEV. Claude Chat te guía.
> **Objetivo:** 41 tablas + tabla perfiles + RLS + datos iniciales listos en DEV.

### 1.1 Ejecutar esquema SQL v7.2
1. En Supabase DEV → **SQL Editor → New query**
2. Abre `Docs/SQL_v7.2_Tesoreria_Riogrande.sql`, copia todo (Ctrl+A)
3. Pégalo en el editor y clic en **"Run"** (Ctrl+Enter)
4. Espera 30-60 segundos → deberías ver **"Success. No rows returned"**

**Verificar en Table Editor que existen los 41 grupos de tablas:**
- Maestras y parámetros (11): `sedes`, `aliados`, `operaciones`, `bancos`, `cuentas_analiticas`, `parametros_contables`, `parametros_contables_generales`, `parametros_sistema`, `empleados`, `vehiculos`, `consecutivos_cuadre`
- Terceros (2): `clientes`, `proveedores`
- Ingesta (4): `documentos_erp`, `documentos_dian`, `consignaciones_banco`, `consignaciones_aliados`
- Operativas cuadre (5): `recaudos_dia`, `cuadres`, `cuadre_retenciones`, `gastos`, `cuadre_anticipos_nomina`
- Recaudo y revisión (3): `traslados_caja`, `soportes_dia`, `checklist_revision`
- Históricas (15): todas las `hist_*`
- Audit log (1): `audit_log`

### 1.2 Crear tabla `perfiles`
En **SQL Editor → New query**, ejecutar:

```sql
CREATE TABLE perfiles (
    id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    sede_id    uuid        REFERENCES sedes(id),
    rol        text        NOT NULL,
    -- auxiliar | analista | director | admin
    nombre     text        NOT NULL,
    activo     boolean     NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE TRIGGER trg_upd_perfiles
    BEFORE UPDATE ON perfiles
    FOR EACH ROW EXECUTE FUNCTION fn_updated_at();

-- Audit log
CREATE TRIGGER trg_audit_perfiles
    AFTER INSERT OR UPDATE OR DELETE ON perfiles
    FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
```

### 1.3 Configurar RLS (Row Level Security)
En **SQL Editor → New query**, ejecutar:

```sql
-- Función helper para leer el perfil del usuario actual
CREATE OR REPLACE FUNCTION get_perfil()
RETURNS perfiles AS $$
  SELECT * FROM perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Habilitar RLS en tablas operativas
ALTER TABLE recaudos_dia            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadres                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadre_retenciones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadre_anticipos_nomina ENABLE ROW LEVEL SECURITY;
ALTER TABLE traslados_caja          ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignaciones_banco    ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignaciones_aliados  ENABLE ROW LEVEL SECURITY;
ALTER TABLE soportes_dia            ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_revision      ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles                ENABLE ROW LEVEL SECURITY;

-- Política: auxiliar ve solo su sede, los demás ven todo
CREATE POLICY "acceso_por_sede_recaudos" ON recaudos_dia
  USING (
    (SELECT rol FROM perfiles WHERE id = auth.uid()) != 'auxiliar'
    OR
    sede_id = (SELECT sede_id FROM perfiles WHERE id = auth.uid())
  );

CREATE POLICY "acceso_por_sede_cuadres" ON cuadres
  USING (
    (SELECT rol FROM perfiles WHERE id = auth.uid()) != 'auxiliar'
    OR
    sede_id = (SELECT sede_id FROM perfiles WHERE id = auth.uid())
  );

CREATE POLICY "acceso_por_sede_gastos" ON gastos
  USING (
    (SELECT rol FROM perfiles WHERE id = auth.uid()) != 'auxiliar'
    OR
    recaudo_id IN (
      SELECT id FROM recaudos_dia
      WHERE sede_id = (SELECT sede_id FROM perfiles WHERE id = auth.uid())
    )
  );

-- Política perfiles: cada usuario ve solo su propio perfil (excepto admin)
CREATE POLICY "perfil_propio" ON perfiles
  USING (
    id = auth.uid()
    OR
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'admin'
  );
```

### 1.4 Verificar datos iniciales
En **Table Editor**, verificar que existen:
- `sedes` → 4 filas (DMA, CAC, APA, QBO)
- `aliados` → 5 filas (ALPINA, CARNICOS, FAMILIA, NUTRESA, MEALS)
- `operaciones` → 10 filas
- `bancos` → 9 filas
- `parametros_sistema` → 15 filas
- `consecutivos_cuadre` → 4 filas (una por sede)

### 1.5 Ejecutar índice de rendimiento adicional
```sql
CREATE INDEX idx_hist_doc_erp_sede_fecha
ON hist_documentos_erp(sede_id, fecha_recaudo, estado_odoo);
```

### 1.6 Crear primer usuario Admin
1. En Supabase DEV → **Authentication → Users → Invite user**
2. Ingresa tu email → clic **Send invite**
3. Revisa tu email, acepta la invitación y crea tu contraseña
4. Una vez creado, en **SQL Editor** ejecuta (reemplaza el UUID con el tuyo):

```sql
-- Primero obtén tu UUID:
SELECT id, email FROM auth.users;

-- Luego crea tu perfil admin:
INSERT INTO perfiles (id, sede_id, rol, nombre)
VALUES (
  'TU-UUID-AQUI',
  NULL,       -- admin ve todas las sedes
  'admin',
  'Administrador RioTesorería'
);
```

---

## FASE 2 — Autenticación y Control de Acceso (ALTA)
> **Quién:** Claude Code ejecuta. Claude Chat genera los prompts exactos.
> **Objetivo:** Login real con Supabase Auth, roles funcionando, sidebar filtrado.

### 2.1 Conectar Supabase al frontend
Claude Code instala `@supabase/supabase-js` y crea `src/lib/supabase.ts` con el cliente configurado con las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

### 2.2 Reemplazar login mock
`LoginPage.tsx` pasa a usar `supabase.auth.signInWithPassword()`. Se maneja sesión con `supabase.auth.onAuthStateChange()`.

### 2.3 Ampliar el store (`appStore.ts`)
Agregar al estado global:
```typescript
interface AppState {
  // ... existente ...
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
  if (item.id === 'revision')            return ['analista','director','admin'].includes(rol);
  if (item.id === 'conciliacion-alpina') return ['analista','director','admin'].includes(rol);
  if (item.id === 'sincronizacion-odoo') return rol === 'admin';
  if (item.id === 'parametrizacion')     return rol === 'admin';
  return true;
});
```

### 2.5 Guardia de rutas
Crear `src/components/ProtectedRoute.tsx` que verifique sesión activa y rol requerido antes de renderizar cada vista. Redirige a `/login` si no hay sesión.

### 2.6 Gestión de usuarios en Parametrización
En `Parametrizacion.tsx`, pestaña "Usuarios": UI para que el Admin cree usuarios (llama a Supabase Admin API), asigne rol y sede, e inserte en `perfiles`.

---

## FASE 3 — Ingesta de Datos desde SharePoint (ALTA)
> **Quién:** Claude Code para los parsers. Tú validas los formatos Excel con contabilidad primero.
> **Objetivo:** Poder subir archivos Excel desde la UI y que los datos lleguen a Supabase.

> ⚠️ **Validar con contabilidad** que los archivos Excel de SharePoint tienen el formato exacto del PROYECTO_v7.2.md §4 antes de programar los parsers.

### 3.1 Servicio de ingesta
Crear parsers para cada tipo de archivo. Estrategia: ingesta manual primero (botón en UI), automatización con Power Automate después.

| Archivo | Tabla destino | Clave upsert |
|---------|--------------|-------------|
| ERP (DA_2026_04.xlsx) | `documentos_erp` + `clientes` | `operacion_documento` / `operacion_codigo_cliente` |
| ANTICIPOS_DA_2026_04.xlsx | `documentos_erp` (tipo ANTICIPO / CRUCE ANTICIPO) | `operacion_documento` |
| Extracto banco | `consignaciones_banco` | `banco_id` + `referencia` |
| Aliados (Cárnicos/Nutresa/Meals) | `consignaciones_aliados` | por definir con contabilidad |
| Alpina | `consignaciones_aliados` | columna Caja identifica sede |
| DIAN | `documentos_dian` → trigger → `documentos_erp.estado_dian` | `documento_electronico` |

### 3.2 Procesamiento en batches
Con 70K documentos/mes, procesar en lotes de 1.000 filas con barra de progreso visible en UI. Evitar timeouts.

### 3.3 Antifraude
- Calcular y guardar `hash_archivo` al ingestar
- Para aliados (excepto Alpina): cruzar sede del nombre del archivo vs columna Caja → alerta Admin si discrepancia

### 3.4 Habilitadores en UI
El botón "Sincronizar SharePoint" en Parametrización respeta:
- `INGESTA_MANUAL_ACTIVA` → habilita botón manual
- `INGESTA_AUTOMATICA_ACTIVA` → activa cron a `HORA_SYNC_AUTOMATICA`

---

## FASE 4 — Módulo Cuadre de Planillas (ALTA — Core del sistema)
> **Quién:** Claude Code. Esta es la fase más extensa — se hace sección por sección.
> **Objetivo:** Reemplazar todos los mocks de `CuadrePlanillas.tsx` con queries reales.
> **Piloto:** Sede Donmatías (DMA) primero.

### 4.1 Inicio del Día → Vista Estado Planillas
- `InicioDia.tsx`: query `documentos_erp WHERE estado_planilla_erp = 'CERRADA'` agrupado por `operacion_planilla`
- Al confirmar selección → crear `recaudos_dia` (estado BORRADOR) y `cuadres` (estado BORRADOR)

### 4.2 Sección 2.1 — Liquidación planillas
```sql
SELECT * FROM documentos_erp
WHERE operacion_planilla = ANY(:planillas)
  AND tipo_documento IN (
    'FACTURA DE VENTA','NOTA CREDITO','NOTA DEBITO',
    'ANTICIPO','CRUCE ANTICIPO'
  )
ORDER BY tipo_documento, fecha_emision;
```

### 4.3 Sección 2.2 — Gastos de ruta
- Dropdown "Tipo de gasto": `parametros_contables WHERE tipo_asiento = 'gastos' AND (sede_id = :sede OR sede_id IS NULL)`
- Búsqueda proveedor: query `proveedores WHERE activo = true`
- Al guardar: INSERT en `gastos` con todos los campos desnormalizados desde los parámetros seleccionados
- Validar fecha contra `DIAS_ATRAS_REGISTRO_GASTO` y `DIAS_ADELANTE_REGISTRO_GASTO` de `parametros_sistema`

### 4.4 Sección 2.3 — Consignaciones Riogrande
- Dropdown "Cuenta destino": `parametros_contables WHERE tipo_asiento = 'consignaciones a riogrande' AND (sede_id = :sede OR sede_id IS NULL)`
- Lista disponibles: `consignaciones_banco WHERE estado_cuadre = 'LIBRE' AND sede_id = :sede`
- Al seleccionar: UPDATE `estado_cuadre = 'BLOQUEADA'` + desnormalizar `diario_caja` y `diario_destino`

### 4.5 Sección 2.4 — Anticipos Aliados
- Cárnicos/Nutresa/Meals: `consignaciones_aliados WHERE estado_certificacion = 'CERTIFICADA' AND estado_cuadre = 'LIBRE' AND sede_id = :sede`
- Alpina: INSERT libre en `consignaciones_aliados` con `estado_certificacion = 'SIN_CERTIFICAR'`, desnormalizar `nit_aliado`, `nombre_aliado`, `cuenta_anticipo`, `diario_caja` desde `aliados` y `sedes`

### 4.6 Sección 2.5 — Anticipos de clientes (UI lista en v7.2)
```sql
SELECT * FROM documentos_erp
WHERE tipo_documento IN ('ANTICIPO','CRUCE ANTICIPO')
  AND operacion_planilla = ANY(:planillas);
```
Reemplazar `mockAnticiposClientes` con este query. Los dos grupos y la fórmula `total = suma(ANTICIPO) - suma(CRUCE ANTICIPO)` ya están en la UI.

### 4.7 Sección 2.6 — Anticipos nómina
- Dropdown empleado: `empleados WHERE sede_id = :sede AND activo = true`
- Dropdown cuenta analítica: `cuentas_analiticas WHERE sede_id = :sede AND activo = true`
- Al guardar: INSERT en `cuadre_anticipos_nomina` con campos desnormalizados
- Si `concepto = 'HURTO_RUTA'` → `estado_autorizacion = 'PENDIENTE'`

### 4.8 Sección 2.7 — Confirmar cuadre
Al confirmar, en este orden:
1. Llamar función `generar_consecutivo_cuadre(sede_id, fecha)` vía RPC → genera `DMA-110426.01`
2. UPDATE `cuadres SET consecutivo, total_*, efectivo_real, efectivo_teorico, estado = 'ENVIADO_REVISION', confirmado_at = now()`
3. UPDATE `documentos_erp SET estado_at = 'EN_CUADRE', numero_cuadre = :consecutivo`
4. UPDATE `consignaciones_banco SET estado_cuadre = 'EN_CUADRE'` donde aplique
5. UPDATE `consignaciones_aliados SET estado_cuadre = 'EN_CUADRE'` donde aplique

---

## FASE 5 — Recaudo Diario y Revisión (MEDIA-ALTA)
> **Quién:** Claude Code.
> **Objetivo:** Reemplazar mocks de `RecaudoDiario.tsx` y `Revision.tsx`. Activar `promover_a_historico()`.

### 5.1 Sección 3.1 — Resumen del día
```sql
SELECT * FROM cuadres WHERE recaudo_id = :recaudo_id;
```
Cards con:
- `saldo_anterior` → llamar `get_saldo_anterior(sede_id, fecha)` vía RPC
- `efectivo_planillas` → suma de `efectivo_real` de cuadres del día
- `efectivo_dispersado` → suma de todos los destinos del día
- `nuevo_saldo` → campo GENERATED en `recaudos_dia`

### 5.2 Sección 3.2 — Destinos de efectivo
Flujo cascada según tipo seleccionado:
- Consignación RG → INSERT `consignaciones_banco` con `origen = 'DESTINO_EFECTIVO'`
- Anticipo aliado → INSERT `consignaciones_aliados` con `origen = 'DESTINO_EFECTIVO'`
- Gasto → INSERT `gastos` con `origen = 'DESTINO_EFECTIVO'` + desnormalización completa
- Anticipo nómina → INSERT `cuadre_anticipos_nomina` con `origen = 'DESTINO_EFECTIVO'`
- Traslado caja → INSERT `traslados_caja` con `fecha`, `detalle`, `diario_caja`, `diario_destino` desnormalizados

### 5.3 Sección 3.4 — Soportes del día
- Upload de archivo → renombrar con nomenclatura estándar: `DMA_20260419_RETENCIONES_DMA-RD-190426.pdf`
- Guardar en ruta de `parametros_sistema.RUTA_SOPORTES_DMA`
- INSERT `soportes_dia`

### 5.4 Cerrar día
```sql
UPDATE recaudos_dia
SET estado = 'CERRADO_AUXILIAR', cerrado_at = now()
WHERE id = :recaudo_id;
```

### 5.5 Vista 04 — Revisión Analista
- Cargar `checklist_revision` (11 ítems) calculando `aplica` automáticamente según registros del día
- Al aprobar todos los ítems: llamar `promover_a_historico(:recaudo_id)` vía RPC de Supabase
- Al devolver: UPDATE `recaudos_dia SET estado = 'DEVUELTO', nota_devolucion = :nota`
- Director puede anular cuadres aprobados con motivo obligatorio

---

## FASE 6 — Sincronización Odoo (BLOQUEADA)
> ⛔ Esta fase requiere coordinar con el implementador de Odoo los 7 puntos del PROYECTO_v7.2.md §11 antes de comenzar.

### Dependencias externas que bloquean esta fase

| # | Pendiente | Bloquea |
|---|-----------|---------|
| 1 | Endpoints API Odoo (URL + estructura JSON por tipo) | Fase 6 completa |
| 2 | `id_externo_odoo` exactos configurados en Odoo | Bloques 5 y parametrización |
| 3 | Diarios Odoo por tipo de transacción | Parametrización + Bloque 5 |
| 4 | Código exacto del diario de caja por cada sede | Tabla `sedes.diario_caja` |
| 5 | Cómo confirma Odoo que procesó un registro | UPDATE `estado_odoo = 'CONFIRMADO'` |
| 6 | Campos adicionales en `hist_empleados` para alerta sync | Bloque 4 |
| 7 | Causación vs egreso gastos: ¿1 llamada o 2 a la API? | Bloque 5 gastos |

### Diseño de los 5 bloques (cuando se desbloquee)

**Bloque 1 — Clientes**
`clientes WHERE sincronizado_odoo = false OR requiere_sync_odoo = true` → API Odoo → UPDATE `sincronizado_odoo = true, sincronizado_at = now()`

**Bloque 2 — Documentos ERP**
`hist_documentos_erp WHERE estado_at = 'APROBADO' AND estado_dian = 'APROBADO_CON_NOTIFICACION' AND estado_odoo = 'PENDIENTE'` → API Odoo
Se habilita solo cuando Bloque 1 está completo.

**Bloque 3 — Proveedores**
Similar a Bloque 1. Corre en paralelo con Bloque 1.

**Bloque 4 — Empleados sin Odoo (solo alerta)**
`hist_empleados WHERE sincronizado_odoo = false` — solo informativo, sin acción automática. No bloquea el Bloque 5.

**Bloque 5 — Transacciones pendientes**
Solo se habilita cuando Bloques 1, 2 y 3 están completos. Enviar en orden:
1. `hist_retenciones WHERE estado_odoo = 'PENDIENTE'`
2. `hist_gastos WHERE estado_odoo = 'PENDIENTE'` (causación + egreso)
3. `hist_consignaciones_banco WHERE estado_odoo = 'PENDIENTE'`
4. `hist_consignaciones_aliados WHERE estado_odoo = 'PENDIENTE'`
5. `hist_anticipos_nomina WHERE estado_odoo = 'PENDIENTE'`
6. `hist_traslados_caja WHERE estado_odoo = 'PENDIENTE'`

---

## FASE 7 — Informes y Conciliación Alpina (MEDIA)
> **Quién:** Claude Code. Puede hacerse en paralelo con Fase 5.
> **Objetivo:** Reemplazar mocks de `Informes.tsx` y `ConciliacionAlpina.tsx`.

### 7.1 Informes — queries reales

| Informe | Query principal |
|---------|----------------|
| Cuadres del día | `cuadres JOIN recaudos_dia WHERE fecha = :fecha AND sede_id = :sede` |
| Consignaciones Banco | `consignaciones_banco WHERE sede_id = :sede AND fecha BETWEEN :desde AND :hasta` |
| Consignaciones Aliados | `consignaciones_aliados WHERE sede_id = :sede AND fecha BETWEEN :desde AND :hasta` |
| Auditoría Máximo Detalle | Todas las `hist_*` con filtros de fecha y sede |
| Conciliación Alpina | `hist_consignaciones_aliados WHERE aliado = 'ALPINA' AND sede_id = :sede` |
| Plano Documentos ERP | `hist_documentos_erp JOIN clientes WHERE sede_id = :sede` |
| Estado Documentos ERP | `hist_documentos_erp WHERE sede_id = :sede AND estado_at = :estado` |
| Conciliación ERP vs DIAN | `hist_documentos_erp LEFT JOIN documentos_dian ON documento_electronico` |
| Documentos listos para Odoo | `hist_documentos_erp WHERE estado_at='APROBADO' AND estado_dian='APROBADO_CON_NOTIFICACION'` |
| Transacciones pendientes Odoo | `hist_* WHERE estado_odoo IN ('PENDIENTE','ERROR')` |

### 7.2 Conciliación Alpina
- Subir reporte Alpina → upsert `consignaciones_aliados` (columna Caja identifica sede)
- Cruce automático: valor EXACTO + fecha EXACTA + sede
- Ambigüedades → revisión manual con radio buttons
- Al certificar → UPDATE `estado_certificacion = 'CERTIFICADA'` → habilitado para sync Odoo en Fase 6

---

## Prompt inicial para Claude Code

Al abrir Claude Code y conectarlo a tu repo GitHub, dale este prompt exacto:

```
Lee estos archivos de la carpeta /Docs de este repositorio antes de hacer cualquier cosa:
- PROYECTO_v7.2.md
- SQL_v7.2_Tesoreria_Riogrande.sql
- USUARIOS_v1.md
- Plan_Implementacion Completo _7_2-.md

Somos una empresa de distribución colombiana (Distribuciones Riogrande)
implementando una plataforma de tesorería llamada RioTesorería.

Contexto:
- El modelo de datos está completo y aprobado (41 tablas en Supabase)
- El frontend React tiene todas las vistas como mocks estáticos
- Vamos a conectar todo a Supabase progresivamente
- El piloto es la sede Donmatías (DMA)
- Arquitectura: React + Vite + TypeScript + Zustand + Supabase

Confirma que leíste los 4 archivos respondiendo:
1. ¿Cuántas tablas tiene el modelo?
2. ¿Cuáles son las 7 fases del plan?
3. ¿Cuál es el piloto de implementación?

No hagas ningún cambio todavía. Solo confirma que entendiste el contexto.
```

---

## Notas de escalabilidad y producción

**Supabase es suficiente** para el volumen actual y proyectado:
- 70K documentos/mes × 12 = 840K registros/año en `documentos_erp`
- Peso estimado ~4.5 GB/año incluyendo históricas e índices
- Supabase Pro (25$/mes) incluye 8 GB — cubre ~2 años sin cambios
- Escalado adicional: 0.125$/GB/mes sin cambiar código

**Cuando migrar a Azure:** cuando superes 20GB de almacenamiento o necesites procesamiento analítico pesado sobre las históricas. Con el crecimiento actual, eso es en 4-5 años.

---

*Plan de implementación v7.2 — Distribuciones Riogrande · RioTesorería · 2026-04-30*
*Combinación del plan de Antigravity + recomendaciones de arquitectura Claude Chat*


---

## FASE 8 — Paso a Producción (CRÍTICA)
> **Quién:** Tú directamente en Supabase PROD y Vercel. Claude Chat te guía paso a paso.
> **Prerequisito obligatorio:** Las Fases 0 a 7 completadas y validadas en DEV.
> **Objetivo:** Desplegar RioTesorería en el ambiente real con usuarios reales de Donmatías.

---

### 8.0 Checklist de salida de DEV — NO pasar a PROD sin esto

| # | Criterio | Validado |
|---|----------|----------|
| 1 | Login y roles funcionando (auxiliar, analista, director, admin) | ☐ |
| 2 | Ingesta de archivos Excel desde SharePoint sin errores | ☐ |
| 3 | Cuadre de planillas completo (7 secciones) funcionando en DMA | ☐ |
| 4 | Recaudo diario cerrado y aprobado al menos 1 vez real en DEV | ☐ |
| 5 | Revisión analista y aprobación funcionando | ☐ |
| 6 | `promover_a_historico()` ejecutado sin errores | ☐ |
| 7 | Informes mostrando datos reales | ☐ |
| 8 | Conciliación Alpina funcionando | ☐ |
| 9 | Al menos 2 semanas de piloto real en DMA en DEV sin errores críticos | ☐ |
| 10 | Todos los usuarios reales capacitados | ☐ |

---

### 8.1 Entender qué se pasa de DEV a PROD

Antes de ejecutar cualquier cosa, es importante entender qué viaja 
de DEV a PROD y qué no:

**Lo que NO se pasa a PROD:**
- Los datos de prueba (cuadres ficticios, usuarios de prueba, 
  consignaciones inventadas)
- Nada de lo que ingresaste en DEV durante las pruebas

**Lo que SÍ se replica en PROD — automáticamente al ejecutar el SQL v7.3:**
- La estructura completa de las 41 tablas
- Los datos maestros reales: sedes, aliados, bancos, operaciones, 
  parámetros del sistema
- Los permisos y políticas de seguridad (RLS)

**El frontend (la aplicación React) es el mismo para DEV y PROD.**
Solo cambia a dónde apunta — eso se controla en Vercel con las 
variables de entorno. No hay que tocar código.

**Resumen visual:**



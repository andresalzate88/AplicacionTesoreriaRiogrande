# Plan de Implementación — Plataforma de Tesorería Riogrande
> Basado en `DocumentoMaestroAplicacionTesoreriaV3.1.md` · Versión 3.1 · Abril 2026

---

## Qué cambió respecto al plan V3.0

| Área | Cambio en V3.1 |
|------|----------------|
| Archivos de aliados (§4) | Ahora son **1 archivo por sede por mes** (antes: 1 por operación). Las carpetas de Cárnicos, Nutresa y Meals contienen un archivo `.xlsx` por sede (`DC_2026_04.xlsx`, `CC_2026_04.xlsx`, etc.). |
| Doble validación antifraude (§4 nuevo) | Al importar Cárnicos, Nutresa y Meals: el sistema cruza la sede del **nombre del archivo** vs la columna **Caja** de cada fila. Si no coinciden → alerta al admin/analista y el archivo no se procesa hasta autorización. |
| Alpina sin validación cruzada (§4) | Para Alpina el archivo mezcla las 3 sedes; la columna Caja es la única fuente de sede — no hay validación cruzada nombre-vs-columna. |
| Familia no aplica (§4) | Familia no maneja consignaciones a aliados. No hay carpeta ni proceso de importación para Familia. |

Todo lo demás del plan V3.0 permanece vigente y aplica sin cambios.

---

## Estado actual del proyecto

El proyecto tiene base estructural en React + Vite + TypeScript + Tailwind + shadcn/ui. Las páginas existen como **mocks/prototipos** sin lógica real ni conexión a base de datos.

**Ya implementado (UI, sin datos reales):**

| Archivo | Vista | Estado |
|---------|-------|--------|
| `LoginPage.tsx` | Auth | 🟡 UI básica sin Supabase Auth |
| `InicioDia.tsx` | Inicio del Día | 🟡 UI completa con datos mock |
| `EstadoPlanillas.tsx` | Vista 01 | 🟡 Prototipo UI con datos mock |
| `CuadrePlanillas.tsx` | Vista 02 | 🟡 Prototipo parcial con datos mock |
| `RecaudoDiario.tsx` | Vista 03 | 🟡 Prototipo UI con datos mock |
| `Revision.tsx` | Vista 04 | 🟡 Prototipo UI con datos mock |
| `Informes.tsx` | Vista 05 | 🟡 Prototipo UI con datos mock |
| `Parametrizacion.tsx` | Admin | 🟡 Prototipo con pestañas: Sedes, Bancos, Gastos, Retenciones, Empleados, Vehículos, Aliados, Cuentas, Parámetros Sistema |

**Lo que falta:** Supabase, Auth real, modelo de datos, servicios, RLS, funciones PostgreSQL, integración SharePoint (con doble validación antifraude V3.1), lógica de negocio, consecutivos, conciliación Alpina.

---

## Stack tecnológico confirmado

```
Frontend:    React + Vite + TypeScript + Tailwind + shadcn/ui
Backend/DB:  Supabase (PostgreSQL + Auth + Storage + Edge Functions)
Fuentes:     SharePoint de Riogrande (Microsoft Graph API)
Deploy:      Vercel / Lovable
Futuro:      Posible migración a Azure
```

**Principio de desacoplamiento:**
- Lógica de negocio solo en `src/services/` y `src/lib/validaciones.ts`
- Auth detrás de `useAuth()` propio → preparado para Azure AD B2C
- Queries solo en `src/services/` → único punto de cambio si se migra

---

## Fases del plan

---

## 🔵 FASE 1 — Infraestructura y Base de Datos (Semanas 1–2)

### Objetivo: Supabase configurado, modelo de datos completo, funciones SQL y autenticación funcionando.

### 1.1 Configurar Supabase
- Crear proyecto en [supabase.com](https://supabase.com)
- Obtener `SUPABASE_URL` y `SUPABASE_ANON_KEY`
- Agregar al `.env.local`:
  ```
  VITE_SUPABASE_URL=...
  VITE_SUPABASE_ANON_KEY=...
  ```
- Instalar `@supabase/supabase-js`
- **[NUEVO]** `src/lib/supabase.ts` — Cliente Supabase singleton, preparado para migrar a Azure
- **[NUEVO]** `src/types/index.ts` — Tipos TypeScript de todas las entidades del modelo

### 1.2 Ejecutar el SQL del modelo de datos completo
Ejecutar en SQL Editor de Supabase en este orden:

```
1. Extensión: uuid-ossp
2. Maestros: sedes, operaciones, parametros_contables, parametros_sistema,
   empleados, vehiculos, consecutivos_cuadre
3. Ingesta ERP: documentos_erp (con 5 índices)
4. Consignaciones: consignaciones_banco, consignaciones_aliados (con índices)
5. Operativa temporal: recaudos_dia, cuadres, cuadre_tripulacion,
   cuadre_retenciones, cuadre_desc_condicionados, cuadre_gastos_ruta,
   cuadre_anticipos_nomina, destinos_efectivo, soportes_dia, checklist_revision
6. Capa histórica (inmutable): hist_recaudos_dia, hist_cuadres, hist_tripulacion,
   hist_retenciones, hist_gastos_ruta, hist_anticipos_nomina,
   hist_desc_condicionados, hist_destinos
7. audit_log (solo INSERT vía trigger — nadie puede UPDATE ni DELETE)
```

### 1.3 Insertar parámetros del sistema por defecto
```sql
INSERT INTO parametros_sistema(clave, valor, descripcion) VALUES
  ('MARGEN_DIAS_ANTES',      '0',     'Días antes de la planilla para buscar consignaciones'),
  ('MARGEN_DIAS_DESPUES',    '3',     'Días después de la planilla para buscar consignaciones'),
  ('TIMEOUT_SESION_MINUTOS', '30',    'Minutos de inactividad para cerrar sesión y liberar bloqueos'),
  ('HORA_SYNC_AUTOMATICA',   '07:00', 'Hora de sincronización automática de fuentes SharePoint'),
  ('MAX_DIAS_SIN_APROBAR',   '2',     'Máximo de días cerrados sin aprobación de la analista');
```

### 1.4 Crear funciones PostgreSQL críticas
```
- generar_consecutivo_cuadre(p_sede_id, p_fecha)  → DMA-110426.01
- generar_consecutivo_recaudo(p_sede_id, p_fecha) → DMA-RD-110426 / DMA-RD-110426-R1
- get_saldo_anterior(p_sede_id, p_fecha)           → saldo del último día aprobado
- validar_dias_sin_aprobar(p_sede_id)              → booleano, bloquea si >= MAX
- liberar_bloqueos_expirados()                     → libera consignaciones por timeout
- promover_a_historico(p_recaudo_id)               → copia a hist_* e inmoviliza datos
```

### 1.5 Configurar RLS (Row Level Security)
- Activar RLS en **todas** las tablas
- Política `auxiliar`: solo filas donde `sede_id = user_metadata.sede_id`
- Política `analista`: todas las sedes; puede leer y escribir cuadres
- Política `director`: todo lo anterior + puede anular cuadres aprobados
- Política `admin`: acceso total incluyendo `saldo_anterior`
- Política `contabilidad`: solo lectura; puede depositar en Storage
- `audit_log`: solo INSERT desde triggers — prohibido UPDATE/DELETE para cualquier rol

### 1.6 Cargar datos maestros iniciales
- 4 sedes: DMA (Donmatías), CAC (Caucasia), APA (Apartadó), QBO (Quibdó)
- 10 operaciones: DA, DC, DF, CA, CC, CN, AA, QC, QN, QM con sus sede_id y aliados
- Parámetros contables base (a confirmar cuentas con contabilidad)

**✅ Entregable:** BD completa, funciones SQL activas, RLS configurado, datos maestros cargados.

---

## 🔵 FASE 2 — Autenticación y Roles (Semana 2)

### Objetivo: Login real con control de acceso por rol y sede desde Supabase Auth.

### 2.1 Implementar `useAuth`
- **[NUEVO]** `src/hooks/useAuth.ts`
  - `signIn(email, password)` — `supabase.auth.signInWithPassword()`
  - `signOut()`
  - `user` con `rol` y `sede_id` desde `user_metadata`
  - Preparado para reemplazar por Azure AD B2C sin modificar el resto del código

### 2.2 Implementar `useSede`
- **[NUEVO]** `src/hooks/useSede.ts`
  - Devuelve sede activa del usuario
  - Para analista/director/admin: permite cambiar sede activa en contexto

### 2.3 Mejorar `LoginPage.tsx`
- **[MODIFY]** `src/pages/LoginPage.tsx`
  - Conectar con Supabase Auth real
  - Manejo de errores de credenciales
  - Redirección post-login según rol:
    - `auxiliar` → Vista 01
    - `analista` / `director` / `admin` → Inicio del Día
    - `contabilidad` → Informes

### 2.4 Proteger rutas por rol
- **[NUEVO]** `src/components/RequireRole.tsx` — guarda de rutas por rol
- **[MODIFY]** `src/App.tsx` — rutas con `<RequireRole roles={[...]}/>`
- **[MODIFY]** `src/components/AppSidebar.tsx` — menú dinámico según rol

**✅ Entregable:** Login funcional, rutas protegidas por rol y sede, usuarios reales en Supabase.

---

## 🔵 FASE 3 — Capa de Servicios (Semana 3)

### Objetivo: Layer de servicios que abstrae todas las queries. Ninguna lógica de negocio en componentes.

> **REGLA ARQUITECTÓNICA:** Toda la lógica de negocio va en `src/services/` y `src/lib/validaciones.ts`.

### Archivos a crear:
- **[NUEVO]** `src/services/documentos.ts` — Upsert plano ERP, queries de planillas por estado
- **[NUEVO]** `src/services/cuadres.ts` — Crear, confirmar, anular cuadres; controles antifraude
- **[NUEVO]** `src/services/recaudos.ts` — Recaudo diario, saldo anterior, soportes, cierre
- **[NUEVO]** `src/services/consignaciones.ts` — Banco + aliados + bloqueos + liberación
- **[NUEVO]** `src/services/sharepoint.ts` — Sync de fuentes, estado de sincronización
- **[NUEVO]** `src/services/conciliacion-alpina.ts` — Cruce reporte Alpina, generar asientos
- **[NUEVO]** `src/services/parametros.ts` — CRUD sedes, operaciones, empleados, vehículos, cuentas
- **[NUEVO]** `src/services/informes.ts` — Todos los informes; exportación Excel/CSV para Odoo
- **[NUEVO]** `src/lib/validaciones.ts` — Ecuaciones de cuadre, diferencia=0, topes de gastos
- **[NUEVO]** `src/lib/hash.ts` — SHA-256 de archivos para antifraude
- **[NUEVO]** `src/lib/sharepoint.ts` — Funciones client-side de SharePoint (listar, status)
- **[NUEVO]** `src/hooks/useCuadre.ts` — Estado del cuadre en progreso (persistente)

**✅ Entregable:** Layer de servicios con tipos TypeScript correctos, sin lógica en componentes.

---

## 🔵 FASE 4 — Parametrización Admin (Semana 4)

### Objetivo: El `admin` puede configurar el sistema completo antes de operar.

### `Parametrizacion.tsx` ya tiene las pestañas en UI — conectar con Supabase:
- **[MODIFY]** `src/pages/Parametrizacion.tsx` — CRUD real para cada pestaña:

| Pestaña | Tabla en BD | CRUD |
|---------|-------------|------|
| Sedes y operaciones | `sedes`, `operaciones` | Ver, activar/desactivar |
| Bancos | `parametros_contables` tipo `BANCO_RG` / `BANCO_ALIADO` | Completo |
| Tipos de gasto | `parametros_contables` tipo `TIPO_GASTO` | Completo + tope máximo |
| Tipos de retención | `parametros_contables` tipo `TIPO_RETENCION` | Completo |
| Empleados | `empleados` | Completo |
| Vehículos | `vehiculos` | Completo (placa, tipo, sede) |
| Aliados | `parametros_contables` tipo `BANCO_ALIADO` | Completo |
| Cuentas contables | `parametros_contables` (general) | Completo |
| Parámetros del Sistema | `parametros_sistema` | Edit con modal — solo Admin |

**✅ Entregable:** Admin puede configurar el sistema completo desde la UI.

---

## 🔵 FASE 5 — Integración SharePoint con doble validación V3.1 (Semanas 5–6)

### Objetivo: La app lee automáticamente los archivos de SharePoint con antifraude mejorado.

> ⚠️ El `client_secret` de Microsoft Graph **NUNCA** va en el frontend. Toda la autenticación Graph va en una Supabase Edge Function.

### 5.1 Configurar Microsoft Graph API
```env
GRAPH_TENANT_ID=...
GRAPH_CLIENT_ID=...
GRAPH_CLIENT_SECRET=...     # solo en Edge Function / backend
GRAPH_SHAREPOINT_SITE_ID=...
GRAPH_DRIVE_ID=...
```

### 5.2 Estructura de archivos en SharePoint (V3.1)

```
RioTesorería/Planos/
├── ERP/
│   ├── DA_2026_04.xlsx      ← 1 por operación por mes
│   ├── DC_2026_04.xlsx
│   └── ANTICIPOS_DA_2026_04.xlsx
├── Bancos/
│   ├── BANCOLOMBIA_CTA1_2026.xlsx  ← por cuenta por año, 12 pestañas
│   └── CFA_CTA1_2026.xlsx
└── Aliados/
    ├── Carnicos/
    │   ├── DC_2026_04.xlsx   ← Cárnicos Donmatías
    │   ├── CC_2026_04.xlsx   ← Cárnicos Caucasia
    │   └── QC_2026_04.xlsx   ← Cárnicos Quibdó
    ├── Nutresa/
    │   ├── CN_2026_04.xlsx   ← Nutresa Caucasia
    │   └── QN_2026_04.xlsx   ← Nutresa Quibdó
    ├── Meals/
    │   └── QM_2026_04.xlsx   ← Meals Quibdó (único)
    └── Alpina/
        └── ALPINA_2026_03.xlsx  ← mes vencido, 3 sedes mezcladas
```

> **Familia no tiene carpeta ni proceso de importación.** No maneja consignaciones a aliados.

### 5.3 Edge Function `sync-sharepoint` — Lógica V3.1

Por cada archivo de aliado (Cárnicos, Nutresa, Meals):

```
1. Calcular hash SHA-256 del archivo
2. Si hash ya existe en BD → omitir
3. Si es nuevo o hash diferente:
   a. Inferir sede del nombre del archivo:
      DC_2026_04 → Donmatías  |  CC_2026_04 → Caucasia
      QC_2026_04 → Quibdó     |  CN_2026_04 → Caucasia
      QN_2026_04 → Quibdó     |  QM_2026_04 → Quibdó
   b. Leer cada fila → obtener columna "Caja" → mapear a sede_id
   c. *** VALIDACIÓN ANTIFRAUDE V3.1 ***
      Para cada fila: comparar sede_nombre_archivo vs sede_columna_caja
      Si alguna fila NO coincide:
        - NO procesar el archivo
        - Insertar alerta en audit_log:
          "El archivo DC_2026_04.xlsx contiene registros de sede Caucasia. Verificar antes de importar."
        - Notificar al admin y analista
        - Marcar archivo como PENDIENTE_AUTORIZACION
        - Solo cuando un admin autoriza explícitamente → procesar
   d. Si todas las filas coinciden → upsert en consignaciones_aliados (CERTIFICADA)
   e. Guardar hash_archivo y leido_sharepoint_at
```

Para Alpina (archivo único con 3 sedes mezcladas):
```
1. Calcular hash
2. Si nuevo o diferente → leer columna "Caja" por fila → asignar sede_id directamente
3. NO validación cruzada (nombre del archivo no tiene información de sede)
4. Upsert en consignaciones_aliados con estado_certificacion = SIN_CERTIFICAR
5. El asiento contable de Alpina no se genera aquí — solo tras conciliación mensual
```

Para ERP:
```
1. Hash → procesar si nuevo o diferente
2. upsert en documentos_erp por clave única operacion_documento
3. If existe, CERRADA y tiene numero_cuadre → NO TOCAR (inmutable)
4. Guardar hash y timestamp
```

Para Bancos:
```
1. Hash por pestaña mensual
2. upsert en consignaciones_banco por (banco + fecha + valor + referencia)
3. Si APROBADA → NO TOCAR
```

Si hash de cualquier archivo cambia DESPUÉS de estar en cuadre aprobado → alerta en `audit_log` + notificación director/admin.

Agendar con pg_cron a `HORA_SYNC_AUTOMATICA`.

### 5.4 Página Inicio del Día — conectar con datos reales
- **[MODIFY]** `src/pages/InicioDia.tsx` — reemplazar mock por datos de BD y Edge Function
  - Estado de sincronización por fuente (última sync, archivos pendientes de autorizar)
  - Alertas activas con datos reales
  - Estado del día por sede con datos reales
  - Botón "Sincronizar fuentes" → llama Edge Function

**✅ Entregable:** Sync automático y manual desde SharePoint; doble validación antifraude activa; alertas de archivos con inconsistencias de sede mostradas en Inicio del Día.

---

## 🔵 FASE 6 — Vista 01: Estado de Planillas (Semana 6)

### Objetivo: La auxiliar ve qué planillas están disponibles para cuadrar.

- **[MODIFY]** `src/pages/EstadoPlanillas.tsx`
- Filtros: fecha, operación (sede auto-filtrada por RLS para auxiliar)
- Tabla desde `documentos_erp` agrupada por planilla
  - Solo `estado_planilla_erp = 'CERRADA'` son cuadrables
  - Badge por `estado_at`: PENDIENTE / EN_CUADRE / ENVIADO_REVISION / APROBADO
- Botón "Iniciar cuadre" → navega a Vista 02 con la planilla seleccionada
- Informe planillas pendientes: CERRADAS sin cuadrar hace más de X días

**✅ Entregable:** Vista 01 con planillas reales; botón de iniciar cuadre funcional.

---

## 🔵 FASE 7 — Vista 02: Cuadre de Planillas (Semanas 7–8)

### Objetivo: El proceso central — cuadrar planillas en 7 secciones con lógica real.

### Sección 0 — Tripulación
- **[NUEVO]** `src/components/cuadre/SeccionTripulacion.tsx`
  - Selector de conductor y auxiliares de `empleados` de la sede
  - Selector de placa de `vehiculos` de la sede
  - Guardar en `cuadre_tripulacion`

### Sección 2.1 — Facturas, notas, anticipos, retenciones
- **[NUEVO]** `src/components/cuadre/SeccionFacturas.tsx`
  - Tabla de documentos ERP de la planilla (facturas, notas, anticipos)
  - Ingreso manual de retenciones por factura (tipo de `parametros_contables`, NIT = cliente)
  - Arrastrar descuentos condicionados sin factura a planilla del cliente
  - Cálculo en tiempo real: `total_cuadrar_CO = Σ CO − notas − desc_condicionados − retenciones + anticipos_clientes`

### Sección 2.2 — Gastos de ruta
- **[NUEVO]** `src/components/cuadre/SeccionGastos.tsx`
  - Formulario: NIT proveedor, nombre, tipo de gasto, valor base, IVA, retención
  - Upload de soporte obligatorio → Supabase Storage
  - ⚠️ Si supera `tope_maximo` del tipo → marca roja + justificación obligatoria

### Sección 2.3 — Consignaciones a Riogrande
- **[NUEVO]** `src/components/cuadre/SeccionConsignacionesRG.tsx`
  - Tabla de `consignaciones_banco`: filtro `sede_id` activa, rango de fechas, `LIBRE`
  - Al seleccionar: `BLOQUEADA` con `bloqueada_por` y `bloqueada_at`
  - Al deseleccionar: liberar bloqueo
  - Si fuera del rango: "Solicitar a la analista que haga el cuadre"

### Sección 2.4 — Consignaciones a Aliados
- **[NUEVO]** `src/components/cuadre/SeccionConsignacionesAliados.tsx`
  - **Cárnicos, Nutresa, Meals:** selección de `consignaciones_aliados` con `estado_certificacion = 'CERTIFICADA'` y `LIBRE`; mismo bloqueo
  - **Alpina:** formulario libre (fecha, valor, banco, referencia, comprobante físico)
    - Guardar en `consignaciones_aliados` con `estado_certificacion = 'SIN_CERTIFICAR'`
    - El asiento contable de Alpina **NO se genera aquí** — solo tras conciliación mensual

### Sección 2.5 — Conteo de efectivo
- **[NUEVO]** `src/components/cuadre/SeccionEfectivo.tsx`
  - `efectivo_teorico = total_CO – gastos – consig_RG – consig_aliados`
  - Campo `efectivo_real` (conteo físico)
  - `diferencia = efectivo_real − efectivo_teorico`
  - ⚠️ Si `diferencia < 0` → **BLOQUEA sección 2.7** → debe registrar anticipo nómina en 2.6
  - Si `diferencia > 0` → registrar como Aprovechamiento

### Sección 2.6 — Anticipos nómina / Hurtos en ruta
- **[NUEVO]** `src/components/cuadre/SeccionAnticipos.tsx`
  - Concepto: `ANT_NOMINA` / `PASAJE` / `HURTO_RUTA`
  - `HURTO_RUTA` → `num_denuncia` obligatorio → estado `PENDIENTE_AUTORIZACION`
  - Guardar en `cuadre_anticipos_nomina`

### Sección 2.7 — Resumen y confirmación
- **[NUEVO]** `src/components/cuadre/SeccionResumen.tsx`
  - Ecuación final:
    ```
    Total CO + anticipos_clientes − gastos − consig_RG − consig_aliados
    − anticipos_nómina − hurtos − efectivo_real + aprovechamientos = 0
    ```
  - 🟢 si = 0 | 🔴 si ≠ 0
  - "Confirmar cuadre" habilitado SOLO si ecuación = 0
  - Al confirmar:
    - `generar_consecutivo_cuadre()` → `DMA-110426.01`
    - INSERT en `cuadres` y `cuadre_tripulacion`
    - UPDATE `documentos_erp.numero_cuadre`, `estado_at = 'EN_CUADRE'`
    - UPDATE `consignaciones_banco/aliados.cuadre_id`, `estado_cuadre = 'EN_CUADRE'`

- **[MODIFY]** `src/pages/CuadrePlanillas.tsx` — orquesta los 8 sub-componentes con stepper

**✅ Entregable:** La auxiliar puede completar las 7 secciones y confirmar el cuadre con consecutivo real.

---

## 🔵 FASE 8 — Vista 03: Recaudo Diario (Semanas 9–10)

### Objetivo: Consolidar el día y cerrarlo para revisión del analista.

- **[MODIFY]** `src/pages/RecaudoDiario.tsx`

### Sección 3.1 — Resumen de cuadres del día
Tabla automática (no editable), una fila por cuadre: N° cuadre, planillas, conductor/placa, ventas CR/CO, anticipos, gastos, consignaciones, anticipos nómina, hurtos, efectivo, dif. efectivo.

### Sección 3.2 — Destinos de efectivo
- Tipos: `TRASLADO` / `ANTICIPO_ALIADO` / `DINERO_CLIENTE` / `HURTO_BODEGA`
- `HURTO_BODEGA` → `num_denuncia` obligatorio → estado `PENDIENTE` hasta autorización director
- Guardar en `destinos_efectivo`

### Sección 3.3 — Saldo de efectivo
- `saldo_anterior` = `get_saldo_anterior()` (solo `admin` puede editar el primer día)
- `efectivo_planillas` = Σ `efectivo_real` de todos los cuadres
- `efectivo_dispersado` = Σ sección 3.2
- `nuevo_saldo` = columna calculada en BD

### Sección 3.4 — Soportes dinámicos (11 tipos)
| # | Soporte | Cuando |
|---|---------|--------|
| 01 | Liquidación planillas | Siempre |
| 02 | Créditos firmados | Si hay CR |
| 03 | Notas desc. condicionado | Si hay descuentos |
| 04 | Retenciones | Si hay retenciones |
| 05 | Gastos de ruta | Si hay gastos |
| 06 | Consign. Riogrande | Si hay consig. banco |
| 07 | Consign. aliados | Si hay consig. aliados |
| 08 | Anticipos nómina | Si hay anticipos |
| 09 | Destinos de efectivo | Si hay destinos |
| 10 | Arqueo de efectivo | Siempre |
| 11 | Denuncia(s) hurto | Si hay hurtos |

Upload a Supabase Storage → URL en `soportes_dia`.

### Botón "Cerrar día y enviar a revisión"
- Validar soportes obligatorios completos
- Validar que no haya hurtos sin denuncia
- `validar_dias_sin_aprobar()` → si bloquea: "La analista debe aprobar primero el día más antiguo"
- `generar_consecutivo_recaudo()` → `DMA-RD-110426`
- `recaudos_dia.estado = 'CERRADO_AUXILIAR'`
- Día en solo lectura para auxiliar

**✅ Entregable:** La auxiliar puede cerrar el día y enviarlo a revisión.

---

## 🔵 FASE 9 — Vista 04: Revisión y Aprobación (Semana 11)

### Objetivo: El analista revisa, aprueba o devuelve. El director autoriza hurtos y anulaciones.

- **[MODIFY]** `src/pages/Revision.tsx`

### Funcionalidades:
- Vista del recaudo completo en solo lectura
- Checklist dinámico 11 ítems: `OK` / `CON_OBSERVACION` / `FALTANTE` / `NO_APLICA`
- **"Devolver con nota"** → obligatoria → `DEVUELTO`; vuelve al auxiliar
- **"Corregir sección 3.2"** → editar destinos sin anular el día
- **"Solicitar anulación"** → notifica al director
- **"Aprobar"** (bloqueado si hurtos sin denuncia o HURTO_BODEGA sin autorización):
  - `recaudos_dia.estado = 'APROBADO'`
  - `promover_a_historico(recaudo_id)`:
    - Copia a todas las `hist_*`
    - UPDATE `documentos_erp.estado_at = 'APROBADO'`
    - UPDATE `consignaciones_banco/aliados.estado_cuadre = 'APROBADO'`
  - Asientos disponibles para Odoo (excepto Alpina `SIN_CERTIFICAR`)
  - Registro en `audit_log`

### Solo director:
- Anular cuadre aprobado → motivo obligatorio → `ANULADO`, `motivo_anulacion`, `anulado_por` en `audit_log`
- Autorizar hurtos PENDIENTE en ruta o bodega

**✅ Entregable:** Analista aprueba el día y promove al histórico inmutable.

---

## 🔵 FASE 10 — Informes y Exportación (Semana 12)

### Objetivo: Contabilidad y dirección extraen información para Odoo, auditoría y gestión.

- **[MODIFY]** `src/pages/Informes.tsx`
- **[NUEVO]** `src/services/informes.ts`

### Informes operativos:
- Estado de planillas (todos)
- Estado del día por sede/fecha (todos)
- Detalle del día — BD temporal e histórica (todos)
- Planillas pendientes CERRADAS sin cuadrar hace X días (analista/director)
- Días sin aprobar — alerta si ≥ 2 por sede (director/admin)

### Informes de control:
- Saldos de efectivo — histórico día a día por sede
- Consignaciones banco — estado por consignación
- Consignaciones aliados — estado + columna certificación Alpina (SIN_CERTIFICAR / CERTIFICADA / DIFERENCIA)
- Cuadres anulados — historial con motivo, usuario, fecha
- Audit log — solo director y admin

### Informes contables (exportables Excel/CSV):
- **Auditoría máximo detalle** — una fila por transacción atómica:
  ```
  consecutivo_recaudo | fecha | sede | consecutivo_cuadre | planilla |
  tipo_movimiento | sub_tipo | documento | cliente_proveedor_empleado |
  nit | valor | cuenta_contable | cuenta_analitica | diario_odoo |
  estado_cuadre | estado_recaudo | conductor | placa | ejecutado_por
  ```
- **Plano asientos Odoo** — mismo filtrado por `APROBADO`, con débito/crédito/cuenta/tercero/analítica
- Resumen recaudo por período (CO/CR, descuentos, retenciones, gastos, consig.)
- Detalle de retenciones por período
- Detalle anticipos nómina por período
- Conciliación Alpina por período: certificadas, pendientes, diferencias

**✅ Entregable:** Contabilidad descarga plano para Odoo sin reproceso manual.

---

## 🔵 FASE 11 — Conciliación Alpina (Post-MVP)

### Objetivo: Certificar consignaciones Alpina registradas libremente por las auxiliares.

- **[NUEVO]** `src/pages/ConciliacionAlpina.tsx` (solo analista)
- **[NUEVO]** `src/services/conciliacion-alpina.ts`

### Flujo:
1. Analista sincroniza reporte mensual Alpina desde SharePoint (`Aliados/Alpina/`)
2. Cruce automático: valor exacto + fecha exacta + sede (columna Caja del reporte)
3. Cruzan perfectamente → `CERTIFICADA` → genera asiento contable
4. Ambiguas (mismo valor, misma sede, múltiples candidatas) → revisión manual: analista elige
5. Sin coincidencia → `DIFERENCIA` para investigar
6. "Generar asientos certificados" → produce asientos de todas las emparejadas del período

**✅ Entregable:** Conciliación mensual Alpina con asientos certificados para Odoo.

---

## 🔵 FASE 12 — Piloto y Rollout (Post-MVP)

### 12.1 Piloto sede Donmatías
- Cargar datos reales de una semana
- Que la auxiliar real use la aplicación
- Recoger feedback; verificar audit log con acciones reales

### 12.2 Rollout a las 4 sedes
- Usuarios reales: auxiliares, analistas, director por sede
- Capacitación por sede
- Monitoreo primeras 2 semanas

### 12.3 Fase 2 (2026)
- Integración API directa con Odoo (en lugar de exportar archivo)
- Migración opcional a Azure (Azure SQL + AD B2C + Azure Functions)

---

## 📋 Archivos a crear / modificar

### Nuevos archivos
| Archivo | Propósito |
|---------|-----------|
| `src/lib/supabase.ts` | Cliente Supabase singleton |
| `src/lib/sharepoint.ts` | Funciones client-side SharePoint |
| `src/lib/validaciones.ts` | Ecuaciones y reglas de negocio |
| `src/lib/hash.ts` | SHA-256 antifraude |
| `src/types/index.ts` | Tipos TypeScript de todas las entidades |
| `src/hooks/useAuth.ts` | Auth abstracta (preparada para Azure AD) |
| `src/hooks/useSede.ts` | Sede activa del usuario |
| `src/hooks/useCuadre.ts` | Estado del cuadre en progreso |
| `src/services/documentos.ts` | Queries y upsert plano ERP |
| `src/services/cuadres.ts` | CRUD cuadres + antifraude |
| `src/services/recaudos.ts` | Recaudo diario + saldo |
| `src/services/consignaciones.ts` | Banco + aliados + bloqueos |
| `src/services/sharepoint.ts` | Sync fuentes SharePoint + doble validación V3.1 |
| `src/services/conciliacion-alpina.ts` | Conciliación mensual Alpina |
| `src/services/parametros.ts` | CRUD parametrización |
| `src/services/informes.ts` | Informes + exportación Odoo |
| `src/components/RequireRole.tsx` | Protección de rutas por rol |
| `src/components/cuadre/SeccionTripulacion.tsx` | Sección 0 |
| `src/components/cuadre/SeccionFacturas.tsx` | Sección 2.1 |
| `src/components/cuadre/SeccionGastos.tsx` | Sección 2.2 |
| `src/components/cuadre/SeccionConsignacionesRG.tsx` | Sección 2.3 |
| `src/components/cuadre/SeccionConsignacionesAliados.tsx` | Sección 2.4 |
| `src/components/cuadre/SeccionEfectivo.tsx` | Sección 2.5 |
| `src/components/cuadre/SeccionAnticipos.tsx` | Sección 2.6 |
| `src/components/cuadre/SeccionResumen.tsx` | Sección 2.7 |
| `src/pages/ConciliacionAlpina.tsx` | Conciliación Alpina |

### Archivos a modificar
| Archivo | Cambio principal |
|---------|-----------------|
| `src/App.tsx` | Rutas con `<RequireRole>` |
| `src/pages/LoginPage.tsx` | Auth real + redirección por rol |
| `src/pages/InicioDia.tsx` | Datos reales + alertas de archivos inconsistentes V3.1 |
| `src/pages/EstadoPlanillas.tsx` | Datos reales + filtros |
| `src/pages/CuadrePlanillas.tsx` | Orquestar 8 sub-componentes con stepper |
| `src/pages/RecaudoDiario.tsx` | Datos reales + soportes dinámicos + cierre |
| `src/pages/Revision.tsx` | Checklist + aprobación + promover a histórico |
| `src/pages/Informes.tsx` | Todos los informes reales + exportación |
| `src/pages/Parametrizacion.tsx` | CRUD real de todos los maestros |
| `src/components/AppSidebar.tsx` | Menú dinámico por rol |

---

## ⚠️ Controles antifraude — No negociables

> [!CAUTION]
> Estas funcionalidades son CRÍTICAS y no pueden omitirse ni simplificarse:

| Riesgo | Control |
|--------|---------|
| Plano ERP manipulado | SharePoint protegido + hash SHA-256; alerta si hash cambia post-procesamiento |
| **[V3.1] Archivo aliado con sede incorrecta** | **Doble validación nombre-archivo vs columna Caja; si no coincide → NO procesar, alerta admin, requiere autorización explícita** |
| Consignación falsa | Auxiliar solo selecciona de lista validada; Alpina: libre con comprobante + conciliación mensual |
| Duplicar consignación | Bloqueo inmediato + timeout parametrizable + `liberar_bloqueos_expirados()` |
| Efectivo manipulado | Diferencia negativa bloquea sección 2.7; valor esperado viene del ERP |
| Duplicar planilla | `UNIQUE(operacion_documento)`; planilla con cuadre no puede cuadrarse de nuevo |
| Gastos inflados | `tope_maximo` en `parametros_contables`; ⚠️ + justificación obligatoria |
| Datos aprobados editados | Tablas `hist_*` inmutables; solo INSERT en `audit_log` desde triggers |
| Hurtos sin soporte | Estado `PENDIENTE_AUTORIZACION` bloquea aprobación |
| Ocultar quién cuadró | `ejecutado_por = auth.uid()` siempre; analista que cubre queda registrado con su usuario |
| Archivo fuente alterado | Hash guardado al leer; si cambia post-aprobación → alerta inmediata director/admin |

---

## 🗓️ Calendario

| Semana | Fase | Entregable |
|--------|------|-----------|
| 1 | Fase 1 — Supabase + SQL + Funciones + RLS | BD completa y funciones críticas |
| 2 | Fase 2 — Auth + Roles | Login funcional, rutas protegidas |
| 3 | Fase 3 — Servicios + Hooks | Layer de servicios listo |
| 4 | Fase 4 — Parametrización | Admin configura el sistema |
| 5 | Fase 5 — SharePoint + Edge Function + doble validación V3.1 | Sync automático con antifraude |
| 6 | Fase 5 — Inicio del Día + alertas reales | Alertas de archivos inconsistentes |
| 7 | Fase 6+7 — Vista 01 + Vista 02 secciones 0, 2.1, 2.2 | Planillas reales + inicio de cuadre |
| 8 | Fase 7 — Vista 02 secciones 2.3 a 2.7 | Cuadre completo con consecutivo real |
| 9 | Fase 8 — Vista 03 secciones 3.1, 3.2, 3.3 | Recaudo + destinos + saldo |
| 10 | Fase 8 — Vista 03 sección 3.4 + cierre | Soportes dinámicos + cierre real |
| 11 | Fase 9 — Vista 04 | Revisión + aprobación + histórico |
| 12 | Fase 10 — Informes | Todos los informes + plano Odoo |
| Post-12 | Fase 11 — Conciliación Alpina | Certificación mensual |
| Post-12 | Fase 12 — Piloto + Rollout | Donmatías → 4 sedes |

---

## Variables de entorno requeridas

```env
# Supabase (frontend)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Microsoft Graph / SharePoint (solo Edge Function — NUNCA en frontend)
GRAPH_TENANT_ID=...
GRAPH_CLIENT_ID=...
GRAPH_CLIENT_SECRET=...
GRAPH_SHAREPOINT_SITE_ID=...
GRAPH_DRIVE_ID=...
```

---

*Plan de implementación v3.1 — Plataforma Tesorería Riogrande · Abril 2026*
*Basado en DocumentoMaestroAplicacionTesoreriaV3.1.md*

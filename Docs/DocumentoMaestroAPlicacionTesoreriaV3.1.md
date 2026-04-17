# Plataforma de Tesorería — Distribuciones Riogrande
> Documento maestro para vibecoding · Versión 3.1 · Abril 2026
> Pegar completo como contexto al inicio de cada sesión en Lovable / Antigravity.

---

## 0. Resumen del proyecto

Distribuciones Riogrande es una empresa de distribución TAT (tienda a tienda) con 4 sedes y 10 operaciones en Antioquia, Córdoba y Chocó. Trabaja con aliados Alpina, Cárnicos (Zenú), Nutresa, Meals (Crem Helado) y Familia.

**Problemas que resuelve:**
- El cuadre diario de caja se hace en Excel → lento, sin trazabilidad, propenso a errores
- Los asientos contables se construyen al final del mes → retrasos, doble trabajo e inconsistencias entre el recaudo real y lo que entra a contabilidad
- La auxiliar manejaba el plano del ERP → riesgo de manipulación de valores antes del cuadre
- Las consignaciones se registraban libremente → imposible detectar duplicados o consignaciones falsas

**La solución:**
- Web app que reemplaza el Excel de cuadre de caja
- Todas las fuentes de datos (ERP, bancos, aliados) llegan a carpetas protegidas de SharePoint — la app las lee desde ahí, nadie puede manipularlas
- La auxiliar cuadra planillas seleccionando consignaciones reales ya validadas
- La analista revisa y aprueba — los asientos contables quedan listos para Odoo sin reproceso
- Todo trazado con audit log inmutable y consecutivos en cada nivel

**Lo que NO hace el MVP:**
- No integración directa con ERPs (el plano llega como Excel procesado)
- No conciliación automática de extractos bancarios
- No envío por API a Odoo (exporta archivo importable; API va en 2026)
- Efectivo flotante (transportadora, DineroIstmina) solo se registra como salida — seguimiento en Odoo

---

## 1. Stack tecnológico

```
Frontend:     Lovable (React + Tailwind)
Backend/DB:   Supabase (PostgreSQL + Auth + Storage + Edge Functions)
Fuentes:      SharePoint de Riogrande (Microsoft 365 activo)
Deploy:       Lovable / Vercel
Vibe tools:   Lovable, Antigravity
Futuro:       Posible migración a Azure
```

**Decisiones para no acoplar a Supabase:**
- Lógica de negocio solo en `/src/services/` y `/src/lib/validaciones.ts`
- Storage con rutas estándar → preparado para Azure Blob
- Auth detrás de `useAuth()` propio → preparado para Azure AD B2C
- Queries solo en `/src/services/` → único punto de cambio para migrar

---

## 2. Sedes, operaciones y códigos

Primera letra = sede, segunda = aliado.

| Código | Sede | Aliado | Prefijo recaudo |
|--------|------|--------|----------------|
| DA | Donmatías | Alpina | DMA |
| DC | Donmatías | Cárnicos | DMA |
| DF | Donmatías | Familia | DMA |
| CA | Caucasia | Alpina | CAC |
| CC | Caucasia | Cárnicos | CAC |
| CN | Caucasia | Nutresa | CAC |
| AA | Apartadó | Alpina | APA |
| QC | Quibdó | Cárnicos | QBO |
| QN | Quibdó | Nutresa | QBO |
| QM | Quibdó | Meals | QBO |

**Formato consecutivo de cuadre:** `DMA-110426.01`
- Sede + fecha ddmmaa + número del cuadre en ese día
- Reinicia cada día: .01, .02, .03...

**Formato consecutivo de recaudo diario:** `DMA-RD-110426`
- Sede + RD + fecha ddmmaa
- Un solo recaudo por sede por día
- Si se anula y rehace: `DMA-RD-110426-R1`, `DMA-RD-110426-R2`

---

## 3. Roles y permisos

| Rol | Sede | Puede hacer | No puede |
|-----|------|-------------|----------|
| `auxiliar` | Solo la suya | Cuadrar planillas, gestionar recaudo diario, adjuntar soportes, cerrar día, descargar informes de su sede | Tocar planos de SharePoint, ver otras sedes, aprobar, anular, editar saldo |
| `analista` | Todas | **También puede hacer cuadres** (cubre vacaciones — el log registra quién cuadró), revisar, aprobar/devolver, corregir destinos de efectivo, conciliación Alpina, descargar todos los informes, ejecutar sincronización de fuentes | Anular cuadres aprobados, editar saldo |
| `director` | Todas | Todo lo anterior + anular cuadres aprobados (motivo obligatorio), autorizar hurtos, ejecutar sincronización | Editar saldo inicial |
| `admin` | Todas | Parametrización completa, gestión de usuarios, **editar saldo inicial**, ejecutar sincronización | — |
| `contabilidad` | Todas (solo lectura) | Depositar planos en SharePoint, descargar plano contable para Odoo, ver todos los informes | Cuadrar, aprobar, editar nada en la plataforma |

**REGLA — Plano ERP y fuentes externas:**
Ningún archivo fuente es tocado por la auxiliar. Contabilidad (o en el futuro un robot) deposita los archivos en carpetas protegidas de SharePoint con permisos de solo escritura para contabilidad y solo lectura para la app.

**REGLA — Audit log de cuadres:**
Cada cuadre registra el `usuario_id` de quien lo ejecutó. Si la analista cubre a la auxiliar queda registrado con su propio usuario.

---

## 4. Arquitectura de fuentes de datos (SharePoint)

```
📁 RioTesorería/  ← SharePoint Riogrande
├── 📁 Planos/
│   ├── 📁 ERP/
│   │   ├── DA_2026_04.xlsx   ← 1 archivo por operación por mes
│   │   ├── DC_2026_04.xlsx
│   │   └── ANTICIPOS_DA_2026_04.xlsx  ← plano de anticipos de clientes
│   ├── 📁 Bancos/
│   │   ├── BANCOLOMBIA_CTA1_2026.xlsx  ← 1 archivo por cuenta por año, 12 pestañas
│   │   └── CFA_CTA1_2026.xlsx
│   └── 📁 Aliados/
│       ├── 📁 Carnicos/           ← 1 archivo por sede por mes
│       │   ├── DC_2026_04.xlsx    ← Cárnicos Donmatías
│       │   ├── CC_2026_04.xlsx    ← Cárnicos Caucasia
│       │   └── QC_2026_04.xlsx    ← Cárnicos Quibdó
│       ├── 📁 Nutresa/            ← 1 archivo por sede por mes
│       │   ├── CN_2026_04.xlsx    ← Nutresa Caucasia
│       │   └── QN_2026_04.xlsx    ← Nutresa Quibdó
│       ├── 📁 Meals/              ← 1 archivo (solo Quibdó)
│       │   └── QM_2026_04.xlsx    ← Meals Quibdó
│       └── 📁 Alpina/             ← 1 archivo con las 3 sedes
│           └── ALPINA_2026_03.xlsx ← mes vencido, columna Caja obligatoria
```

**Control de acceso en SharePoint:**

| Carpeta | Escribe | Lee |
|---------|---------|-----|
| ERP/ | Solo contabilidad | Solo la app |
| Bancos/ | Solo contabilidad | Solo la app |
| Aliados/Cárnicos, Nutresa, Meals/ | Solo contabilidad | Solo la app |
| Aliados/Alpina/ | Solo analista de tesorería | Solo la app |

**Formato estándar de archivos:**
El formato de cada tipo de archivo lo define contabilidad antes del desarrollo. La app lee un formato fijo por tipo — no tiene mapeo dinámico de columnas.

**Columna Caja en archivos de aliados — todos sin excepción:**
Todos los archivos de Cárnicos, Nutresa, Meals y Alpina incluyen columna **Caja** (Donmatías, Caucasia, Apartadó, Quibdó). Familia no maneja anticipos a aliados — no aplica.

**Lógica de importación con doble validación (antifraude):**
- **Cárnicos, Nutresa, Meals:** La sede se infiere del nombre del archivo (ej: DC_2026_04.xlsx → Donmatías) Y viene en la columna Caja de cada fila. El sistema cruza ambas fuentes. Si no coinciden → alerta inmediata al admin/analista: *"El archivo DC_2026_04.xlsx contiene registros de sede Caucasia. Verificar antes de importar."* El archivo no se procesa hasta que un admin lo autorice.
- **Alpina:** La columna Caja es la única fuente de sede (el archivo contiene las 3 sedes mezcladas). No hay validación cruzada con el nombre del archivo.
- En todos los casos la columna `sede_id` en `consignaciones_aliados` queda siempre poblada — limpia, confiable y auditable.

**Control antifraude de archivos:**
Cada vez que la app lee un archivo calcula su hash (huella digital). Si el archivo cambia después de haber sido procesado, el sistema lanza alerta al director y admin. Datos ya relacionados a cuadres aprobados son inmutables en la BD aunque el archivo fuente cambie.

**Sincronización:**
- Automática a hora parametrizable (no en madrugada — contabilidad genera los archivos en la mañana)
- Manual con botón "Sincronizar fuentes" en pantalla "Inicio del Día"
- Accesible para analista, director y admin
- Ambas conviven — la automática como respaldo, la manual para casos urgentes

---

## 5. Flujo general del proceso

```
Contabilidad deposita archivos en SharePoint
         ↓
App sincroniza (automático o manual)
         ↓
[INICIO DEL DÍA] — Pantalla de sincronización y estado de fuentes
         ↓
[VISTA 01] Auxiliar/Analista ve planillas CERRADAS y ABIERTAS
           Solo puede cuadrar las CERRADAS
         ↓
[VISTA 02] Cuadre de planillas — 7 secciones
           Genera consecutivo DMA-110426.01
         ↓
[VISTA 03] Recaudo diario — consolida cuadres
           Destinos de efectivo — saldo de caja
           Adjuntar soportes — cerrar día
           Genera consecutivo DMA-RD-110426
         ↓
    Día bloqueado para auxiliar
         ↓
[VISTA 04] Analista revisa checklist + soportes
         ↓                    ↓
      Devuelve            Aprueba
      con nota                ↓
         ↓         BD Temporal → BD Histórica
    Corrige            Asientos disponibles para Odoo
                       (excepto consignaciones Alpina sin certificar)
         ↓
[CONCILIACIÓN ALPINA] ~día 15 mes siguiente
    Analista cruza registros auxiliar vs reporte Alpina
    Genera asientos pendientes certificados
```

**REGLA — Secuencia obligatoria:**
- La auxiliar no puede iniciar nuevo recaudo hasta cerrar el anterior
- Máximo 2 días cerrados sin aprobar por la analista. Al tercer día la auxiliar no puede cerrar hasta que la analista apruebe al menos el más antiguo

**REGLA — Días sin movimiento:**
Un día sin operación igual debe abrirse y cerrarse. Sin cuadres. Saldo inicial = saldo final. Queda registrado formalmente.

---

## 6. Cuadre de planillas — Vista 02 (7 secciones)

### 6.0 Tripulación (antes de sección 2.1)

La auxiliar registra antes de empezar el cuadre:
- Conductor (del maestro de empleados)
- Auxiliar 1 (nullable)
- Auxiliar 2 (nullable)
- Placa (del maestro de vehículos)

Esto habilita informes futuros: recaudo por conductor, faltantes por auxiliar, rendimiento por placa.

### 6.1 Sección 2.1 — Detalle de facturas, notas, anticipos y retenciones

Del plano ERP llegan (cuentas contables, analíticas y diario ya incluidos — la plataforma los lee, no los calcula):

| Tipo | Sub-tipo | CR/CO | Observación |
|------|----------|-------|-------------|
| FACTURA DE VENTA | FACTURA DE VENTA | CO o CR | — |
| NOTA CREDITO | NOTA AVERIA-CAMBIO | CO o CR | — |
| NOTA CREDITO | NOTA BUEN ESTADO | CO o CR | — |
| NOTA CREDITO | NOTA DESCUENTO CONDICIONADO | CO o CR | Puede no venir ligada a factura |
| NOTA DEBITO | NOTA BUEN ESTADO | CO o CR | — |
| ANTICIPO | ANTICIPO | Siempre CO | Positivo=cobrar, negativo=cliente cruza |

**Anticipos de clientes:**
- Llegan de un plano separado ("Anticipos") pero se insertan en la misma tabla `documentos_erp`
- Asociados a planilla, nunca a una factura específica
- Valor positivo = anticipo recibido (mayor valor a cuadrar)
- Valor negativo = cliente lo está descontando (menor valor a cuadrar)
- Sin control de saldo en la plataforma — eso va en Odoo

**Total a cuadrar por planilla:**
```
Si CO: valor_neto (facturas - notas_credito) 
       - descuento_condicionado 
       - retenciones 
       + anticipos_clientes (puede ser negativo)
Si CR: 0
```

**Retenciones:** Se ingresan manualmente por factura. El tercero es el mismo cliente. Cuenta contable de parametrización. Elimina el doble trabajo actual.

**Notas descuento condicionado sin factura:** La auxiliar las arrastra manualmente a la planilla donde está el cliente.

### 6.2 Sección 2.2 — Gastos de ruta

Campos: NIT proveedor, nombre, tipo de gasto (parametrizado con cuenta contable), valor base, IVA, retención, total. Soporte adjunto obligatorio.

**REGLA ANTIFRAUDE:** Si supera el tope máximo parametrizado → marca ⚠️ + justificación obligatoria.

### 6.3 Sección 2.3 — Consignaciones a Riogrande

La auxiliar **selecciona** de las consignaciones disponibles en `consignaciones_banco` — no digita libre.

Filtro automático: consignaciones de la sede activa, en el rango de fechas parametrizable (días antes y días después de la fecha de la planilla — parametrizable, nadie consigna adelantado).

Si necesita una consignación fuera del rango → debe pedirle a la analista que haga el cuadre.

**REGLA ANTIFRAUDE:** Al seleccionar una consignación queda bloqueada inmediatamente para otras cajas. El bloqueo dura lo mismo que el timeout de inactividad de sesión (parametrizable). Si el cuadre se anula, la consignación se libera.

### 6.4 Sección 2.4 — Consignaciones a Aliados

- **Cárnicos, Nutresa, Meals:** La auxiliar selecciona de `consignaciones_aliados` certificadas — no digita libre. Mismo sistema de bloqueo temporal.
- **Alpina:** La auxiliar registra libre con comprobante físico (fecha, valor, banco, referencia). Se guarda en `consignaciones_aliados` con estado `SIN_CERTIFICAR`. El asiento contable de Alpina NO se genera al aprobar el día — se genera después de la conciliación.

### 6.5 Sección 2.5 — Conteo de efectivo

```
efectivo_teorico = total_cuadrar_CO - gastos - consig_riogrande - consig_aliados
efectivo_real    = conteo físico de lo que trajo la ruta
diferencia       = efectivo_real - efectivo_teorico
```

- `diferencia > 0` → sobrante → Aprovechamientos en Odoo
- `diferencia = 0` → perfecto
- `diferencia < 0` → **BLOQUEA** → debe registrar anticipo de nómina

### 6.6 Sección 2.6 — Anticipos de nómina / Hurtos en ruta

Conceptos: `ANT_NOMINA` / `PASAJE` / `HURTO_RUTA`

`HURTO_RUTA` requiere número de denuncia → estado `PENDIENTE_AUTORIZACION` hasta que la analista confirme.

### 6.7 Sección 2.7 — Resumen y ecuación final

```
Total a cuadrar (CO)
+ Anticipos clientes (neto — puede ser negativo)
− Gastos de ruta
− Consignaciones Riogrande
− Consignaciones Aliados
− Anticipos nómina
− Hurtos en ruta
− Efectivo real
+ Aprovechamientos (si diferencia_efectivo > 0)
─────────────────────────────────────────────
= 0  ← exactamente cero para confirmar
```

Al confirmar:
- Genera consecutivo `DMA-110426.01`
- Actualiza `documentos_erp`: `numero_cuadre` y `estado_at = ENVIADO_REVISION`
- Actualiza `consignaciones_banco` y `consignaciones_aliados`: `cuadre_id`, `recaudo_id`, `estado_cuadre`
- El cuadre pasa al Recaudo Diario

---

## 7. Recaudo diario — Vista 03

### 7.1 Sección 3.1 — Resumen de cuadres del día

Tabla automática no editable. Una fila por cuadre. Columnas:

| Campo | Descripción |
|-------|-------------|
| N° Cuadre | DMA-110426.01 |
| Planillas | DA-32641 // DC-32926 |
| Conductor / Placa | Del registro de tripulación |
| Ventas netas CR | Facturas crédito neto |
| Desc. condicionados CR | — |
| Retenciones CR | — |
| Ventas netas CO | Facturas contado neto |
| Anticipos clientes | Neto (positivo o negativo) |
| Desc. condicionados CO | — |
| Retenciones CO | — |
| Gastos de ruta | — |
| Consig. Riogrande | — |
| Consig. Aliados | — |
| Anticipos nómina | — |
| **Hurtos en ruta** | Del concepto HURTO_RUTA en 2.6 |
| Efectivo | Efectivo real contado |
| Dif. efectivo | Aprovechamientos si > 0 |

### 7.2 Sección 3.2 — Destinos de efectivo

| Tipo | Opciones | Nota |
|------|----------|------|
| `TRASLADO` | Caja menor, bancos Riogrande, transporte de valores | Transportadora = efectivo flotante, solo se registra salida. Seguimiento en Odoo. |
| `ANTICIPO_ALIADO` | Alpina, Cárnicos, Nutresa, Meals, Familia | Anticipo a proveedores |
| `DINERO_CLIENTE` | Solo Quibdó: DineroIstmina y similares | Efectivo flotante, solo salida. Seguimiento en Odoo. |
| `HURTO_BODEGA` | Descripción libre + denuncia obligatoria | Estado PENDIENTE hasta autorización director |

### 7.3 Sección 3.3 — Saldo de efectivo

```
saldo_anterior         (automático del último día aprobado — solo admin edita)
+ efectivo_planillas   (suma efectivo_real de todos los cuadres del día)
− efectivo_dispersado  (suma sección 3.2)
═══════════════════════════════════════
= nuevo_saldo          (debe estar físicamente en caja)
```

### 7.4 Sección 3.4 — Soportes dinámicos

El sistema detecta qué se registró y solo pide lo que aplica:

| # | Soporte | Obligatorio cuando |
|---|---------|-------------------|
| 01 | Liquidación planillas distribución | Siempre |
| 02 | Créditos firmados por cliente | Si hay facturas CR |
| 03 | Notas descuento condicionado firmadas | Si hay descuentos condicionados |
| 04 | Retenciones escaneadas y firmadas | Si hay retenciones |
| 05 | Soporte gastos de ruta | Si hay gastos |
| 06 | Soportes consignaciones Riogrande | Si hay consignaciones Riogrande |
| 07 | Soportes consignaciones aliados | Si hay consignaciones aliados |
| 08 | Anticipos de nómina firmados | Si hay anticipos nómina |
| 09 | Soportes destinos de efectivo | Si hay destinos en 3.2 |
| 10 | Arqueo de efectivo | Siempre |
| 11 | Denuncia(s) por hurto | Si hay hurtos (ruta o bodega) |

Botón **"Cerrar día y enviar a revisión"** → genera consecutivo `DMA-RD-110426` → día bloqueado para auxiliar.

---

## 8. Revisión — Vista 04

Acceso a Vista 03 en solo lectura + checklist dinámico (mismos ítems de 3.4, solo los que aplican).

Estados: `OK` / `CON_OBSERVACION` / `FALTANTE` / `NO_APLICA`

**Acciones:**
- **Aprobar** → datos pasan a BD Histórica → asientos disponibles para Odoo (excepto Alpina sin certificar)
- **Devolver con nota** → nota obligatoria → vuelve a auxiliar/analista
- **Corregir sección 3.2** → sin anular el día
- **Solicitar anulación de cuadre** → pide al director

**REGLA:** Día aprobado = inmutable. Solo director puede anular cuadre con motivo en audit log.
**REGLA:** No se puede aprobar si hay hurtos sin denuncia confirmada o hurtos bodega sin autorización director.

---

## 9. Conciliación Alpina — Vista independiente

Accesible para analista. Aparece cuando hay consignaciones Alpina `SIN_CERTIFICAR`.

**Flujo:**
1. Analista sube/sincroniza el reporte mensual de Alpina desde SharePoint
2. La plataforma cruza automáticamente por: valor exacto + fecha exacta + sede
3. Las que cruzan perfectamente → estado `CERTIFICADA` → genera asiento contable
4. Las ambiguas (mismo valor, misma sede, múltiples candidatas) → revisión manual: analista elige cuál es cuál
5. Las sin coincidencia → marcadas como diferencia para investigar
6. Botón **"Generar asientos certificados"** → produce asientos de todas las emparejadas del período

**El reporte de Alpina trae columna Caja** → facilita el cruce automático y elimina ambigüedades entre sedes.

---

## 10. Inicio del Día — Vista adicional

Pantalla de control para analista, director y admin:

- Estado de sincronización de cada fuente (última sincronización, archivos nuevos detectados, errores)
- Botón **"Sincronizar fuentes"** — ejecuta lectura de todas las carpetas de SharePoint
- Alertas activas: días sin aprobar, hurtos pendientes de autorización, consignaciones bloqueadas sin cuadre confirmado
- Estado de cada sede: si el día está abierto, cerrado o aprobado

---

## 11. Informes — Vista 05

Filtros globales: sede / rango de fechas / estado del recaudo / tipo de movimiento.

### Informes operativos

| Informe | Usuarios | Descripción |
|---------|----------|-------------|
| Estado de planillas | Todos | Planillas por sede/fecha: estado ERP + estado plataforma + cuadre asignado + recaudo |
| Estado del día | Todos | Por sede y fecha: estado, saldo inicial, movimientos, saldo final, consecutivo recaudo |
| Detalle del día | Todos | Desglose completo de un día. Disponible de BD Temporal (en proceso) e Histórica (aprobados). La auxiliar lo usa para autorevisar, la analista para comparar contra soportes |
| Planillas pendientes | Analista, Director | CERRADAS en ERP sin cuadrar hace más de X días |
| Días sin aprobar | Director, Admin | Días cerrados por auxiliar sin revisión. Alerta si hay 2+ |

### Informes de control

| Informe | Descripción |
|---------|-------------|
| Saldos de efectivo | Histórico día a día por sede: saldo inicial, movimientos, saldo final |
| Consignaciones banco | Todas las consignaciones bancarias: libre / bloqueada / en cuadre / aprobada. Con cuadre asociado y estado |
| Consignaciones aliados | Igual pero para aliados. Separado de banco. Con columna estado certificación (Alpina: SIN_CERTIFICAR / CERTIFICADA / DIFERENCIA) |
| Cuadres anulados | Historial con motivo, quién anuló, cuándo |
| Audit log | Todas las acciones del sistema. Solo Director y Admin |

### Informes contables

| Informe | Descripción |
|---------|-------------|
| **Auditoría máximo detalle** | Una fila por transacción atómica. Filtrable por recaudo, sede, fechas, tipo de movimiento. Exportable a Excel. Para auditoría completa del negocio. Ver estructura abajo. |
| Plano asientos Odoo | Mismo informe filtrado por estado=APROBADO, formateado con débito/crédito/cuenta/tercero/analítica. Exportable a Excel/CSV |
| Resumen recaudo por período | Ventas CO/CR, descuentos, retenciones, gastos, consignaciones — por sede y por operación/aliado |
| Detalle de retenciones | Por período. Para cruzar con certificados de retención |
| Detalle anticipos nómina | Por período. Para cruzar con nómina mensual |
| Conciliación Alpina | Estado de consignaciones Alpina por período: certificadas, pendientes, diferencias |

**Estructura del informe de auditoría máximo detalle:**
```
consecutivo_recaudo | fecha | sede | consecutivo_cuadre | planilla |
tipo_movimiento | sub_tipo | documento | cliente_proveedor_empleado |
nit | valor | cuenta_contable | cuenta_analitica | diario_odoo |
estado_cuadre | estado_recaudo | conductor | placa | ejecutado_por
```

Tipos de movimiento en una sola tabla de salida:
`FACTURA_VENTA / NOTA_CREDITO / NOTA_DEBITO / ANTICIPO_CLIENTE /
RETENCION / DESC_CONDICIONADO / GASTO_RUTA / CONSIGNACION_BANCO /
CONSIGNACION_ALIADO / ANTICIPO_NOMINA / HURTO_RUTA /
DESTINO_EFECTIVO / HURTO_BODEGA`

---

## 12. Modelo de datos — SQL para Supabase

```sql
-- ═══════════════════════════════════════════════════════
-- EXTENSIONES
-- ═══════════════════════════════════════════════════════
create extension if not exists "uuid-ossp";

-- ═══════════════════════════════════════════════════════
-- MAESTROS Y PARÁMETROS
-- ═══════════════════════════════════════════════════════

create table sedes (
  id          uuid primary key default uuid_generate_v4(),
  codigo      text unique not null,   -- DMA, CAC, APA, QBO
  nombre      text not null,          -- Donmatías, Caucasia, Apartadó, Quibdó
  letra       text unique not null,   -- D, C, A, Q
  activa      boolean default true,
  created_at  timestamptz default now()
);

create table operaciones (
  id           uuid primary key default uuid_generate_v4(),
  codigo       text unique not null,  -- DA, DC, DF, CA, CC, CN, AA, QC, QN, QM
  sede_id      uuid references sedes(id) not null,
  aliado       text not null,         -- ALPINA, CARNICOS, FAMILIA, NUTRESA, MEALS
  letra_aliado text not null,         -- A, C, F, N, M
  tipo_erp     text not null,         -- SIDIS / ECOM
  activa       boolean default true,
  created_at   timestamptz default now()
);

create table parametros_contables (
  id                uuid primary key default uuid_generate_v4(),
  sede_id           uuid references sedes(id),
  -- null = aplica a todas las sedes
  tipo              text not null,
  -- EFECTIVO_CAJA / BANCO_RG / BANCO_ALIADO / TIPO_GASTO /
  -- TIPO_RETENCION / ANTICIPO_NOMINA / HURTO / APROVECHAMIENTO /
  -- ANTICIPO_ALIADO / DESTINO_EFECTIVO / DINERO_CLIENTE / CAJA_MENOR
  codigo            text not null,
  nombre            text not null,
  cuenta_contable   text,
  cuenta_analitica  text,
  nit_tercero       text,
  nombre_tercero    text,
  diario_odoo       text,
  tope_maximo       numeric,
  activo            boolean default true,
  created_at        timestamptz default now(),
  unique(sede_id, tipo, codigo)
);

create table parametros_sistema (
  id              uuid primary key default uuid_generate_v4(),
  clave           text unique not null,
  -- MARGEN_DIAS_ANTES / MARGEN_DIAS_DESPUES / TIMEOUT_SESION_MINUTOS /
  -- HORA_SYNC_AUTOMATICA / MAX_DIAS_SIN_APROBAR
  valor           text not null,
  descripcion     text,
  updated_at      timestamptz default now()
);

-- Datos iniciales sugeridos
insert into parametros_sistema(clave, valor, descripcion) values
  ('MARGEN_DIAS_ANTES', '0', 'Días antes de la planilla para buscar consignaciones'),
  ('MARGEN_DIAS_DESPUES', '3', 'Días después de la planilla para buscar consignaciones'),
  ('TIMEOUT_SESION_MINUTOS', '30', 'Minutos de inactividad para cerrar sesión y liberar bloqueos'),
  ('HORA_SYNC_AUTOMATICA', '07:00', 'Hora de sincronización automática de fuentes SharePoint'),
  ('MAX_DIAS_SIN_APROBAR', '2', 'Máximo de días cerrados sin aprobación de la analista');

create table empleados (
  id              uuid primary key default uuid_generate_v4(),
  nit             text unique not null,
  nombre_completo text not null,
  sede_id         uuid references sedes(id) not null,
  cargo           text,
  activo          boolean default true,
  created_at      timestamptz default now()
);

create table vehiculos (
  id          uuid primary key default uuid_generate_v4(),
  placa       text unique not null,
  tipo        text,           -- CAMION, FURGON, MOTO, etc.
  sede_id     uuid references sedes(id),
  activo      boolean default true,
  created_at  timestamptz default now()
);

create table consecutivos_cuadre (
  sede_id        uuid primary key references sedes(id),
  fecha          date not null,
  ultimo_numero  integer default 0
  -- Reinicia cada día: cuando fecha cambia, ultimo_numero vuelve a 0
);

-- ═══════════════════════════════════════════════════════
-- INGESTA ERP — documentos_erp
-- Alimentada por lectura del plano en SharePoint.
-- Incluye facturas, notas Y anticipos de clientes.
-- NUNCA modificada manualmente.
-- Clave natural: operacion_documento
-- ═══════════════════════════════════════════════════════

create table documentos_erp (
  id                    uuid primary key default uuid_generate_v4(),
  operacion_id          uuid references operaciones(id) not null,
  planilla              text not null,
  operacion_planilla    text not null,         -- DA-32825
  estado_planilla_erp   text not null,         -- CERRADA / ABIERTA
  tipo_documento        text not null,
  -- FACTURA DE VENTA / NOTA CREDITO / NOTA DEBITO / ANTICIPO
  sub_tipo              text,
  -- FACTURA DE VENTA / NOTA AVERIA-CAMBIO / NOTA BUEN ESTADO /
  -- NOTA DESCUENTO CONDICIONADO / ANTICIPO
  documento_electronico text not null,
  operacion_documento   text unique not null,  -- clave de upsert
  factura_referencia    text,                  -- nullable para notas y anticipos
  cr_co                 text not null,         -- CONTADO / CREDITO
  -- Anticipos siempre CONTADO
  -- Valor positivo = anticipo a cobrar, negativo = cliente lo cruza
  fecha_emision         date,
  fecha_vencimiento     date,
  nit_cliente           text,
  nombre_cliente        text,
  municipio_cliente     text,
  direccion_cliente     text,
  valor_base            numeric default 0,
  valor_iva             numeric default 0,
  valor_total           numeric generated always as (valor_base + valor_iva) stored,
  -- Campos contables del plano — la plataforma no los calcula
  cuenta_contable       text,
  cuenta_analitica      text,
  diario_odoo           text,
  cuenta_por_cobrar     text,
  -- Estado en la plataforma
  estado_at             text not null default 'PENDIENTE',
  -- PENDIENTE / EN_CUADRE / ENVIADO_REVISION / APROBADO
  numero_cuadre         text,
  recaudo_id            uuid,                  -- se llena al confirmar el recaudo
  leido_sharepoint_at   timestamptz,
  hash_archivo          text,                  -- antifraude
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index idx_doc_erp_planilla   on documentos_erp(operacion_planilla);
create index idx_doc_erp_estado_erp on documentos_erp(estado_planilla_erp);
create index idx_doc_erp_estado_at  on documentos_erp(estado_at);
create index idx_doc_erp_operacion  on documentos_erp(operacion_id);
create index idx_doc_erp_tipo       on documentos_erp(tipo_documento);

-- ═══════════════════════════════════════════════════════
-- CONSIGNACIONES BANCO
-- Alimentada desde extractos bancarios en SharePoint.
-- Sin tabla histórica separada — es su propio histórico.
-- ═══════════════════════════════════════════════════════

create table consignaciones_banco (
  id                uuid primary key default uuid_generate_v4(),
  sede_id           uuid references sedes(id),
  -- null si no se pudo identificar la sede desde la referencia
  banco_id          uuid references parametros_contables(id) not null,
  cuenta_bancaria   text not null,         -- código de la cuenta
  fecha             date not null,
  valor             numeric not null,
  referencia        text,                  -- del extracto bancario
  consignante       text,                  -- identificado desde tabla de relación
  comprobante       text,                  -- número de comprobante
  -- Control de cuadre
  cuadre_id         uuid,                  -- se llena al seleccionar en cuadre
  recaudo_id        uuid,                  -- se llena al confirmar recaudo
  estado_cuadre     text default 'LIBRE',
  -- LIBRE / BLOQUEADA / EN_CUADRE / ENVIADO_REVISION / APROBADO
  -- Control de bloqueo temporal (antifraude concurrencia)
  bloqueada_por     uuid references auth.users(id),
  bloqueada_at      timestamptz,
  -- Antifraude
  hash_archivo      text,
  leido_sharepoint_at timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index idx_consig_banco_sede   on consignaciones_banco(sede_id);
create index idx_consig_banco_fecha  on consignaciones_banco(fecha);
create index idx_consig_banco_estado on consignaciones_banco(estado_cuadre);
create index idx_consig_banco_cuadre on consignaciones_banco(cuadre_id);

-- ═══════════════════════════════════════════════════════
-- CONSIGNACIONES ALIADOS
-- Cárnicos, Nutresa, Meals: certificadas por archivo del aliado.
-- Alpina: registradas por auxiliar con comprobante físico.
-- Sin tabla histórica separada — es su propio histórico.
-- ═══════════════════════════════════════════════════════

create table consignaciones_aliados (
  id                    uuid primary key default uuid_generate_v4(),
  sede_id               uuid references sedes(id) not null,
  -- Viene del archivo del aliado (columna Caja) o de la selección de la auxiliar
  aliado                text not null,
  -- ALPINA / CARNICOS / NUTRESA / MEALS
  banco_id              uuid references parametros_contables(id),
  fecha                 date not null,
  valor                 numeric not null,
  referencia            text,
  comprobante           text,
  -- Estado de certificación
  estado_certificacion  text not null default 'SIN_CERTIFICAR',
  -- SIN_CERTIFICAR (Alpina pendiente) / CERTIFICADA / DIFERENCIA
  -- Para Cárnicos, Nutresa, Meals: llegan ya CERTIFICADAS del archivo
  certificada_at        timestamptz,
  -- Control de cuadre
  cuadre_id             uuid,
  recaudo_id            uuid,
  estado_cuadre         text default 'LIBRE',
  -- LIBRE / BLOQUEADA / EN_CUADRE / ENVIADO_REVISION / APROBADO
  -- Control de bloqueo temporal
  bloqueada_por         uuid references auth.users(id),
  bloqueada_at          timestamptz,
  -- Solo para Alpina: registro manual por auxiliar
  registrada_por        uuid references auth.users(id),
  -- Antifraude
  hash_archivo          text,
  leido_sharepoint_at   timestamptz,
  -- null si fue registrada manualmente (Alpina)
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create index idx_consig_aliados_sede    on consignaciones_aliados(sede_id);
create index idx_consig_aliados_aliado  on consignaciones_aliados(aliado);
create index idx_consig_aliados_estado  on consignaciones_aliados(estado_cuadre);
create index idx_consig_aliados_certif  on consignaciones_aliados(estado_certificacion);

-- ═══════════════════════════════════════════════════════
-- OPERATIVA TEMPORAL
-- ═══════════════════════════════════════════════════════

create table recaudos_dia (
  id                    uuid primary key default uuid_generate_v4(),
  consecutivo           text unique not null,
  -- DMA-RD-110426, si se rehace: DMA-RD-110426-R1
  sede_id               uuid references sedes(id) not null,
  fecha                 date not null,
  estado                text not null default 'ABIERTO',
  -- ABIERTO / CERRADO_AUXILIAR / APROBADO / DEVUELTO
  saldo_anterior        numeric not null,
  efectivo_planillas    numeric default 0,
  efectivo_dispersado   numeric default 0,
  nuevo_saldo           numeric generated always as
                        (saldo_anterior + efectivo_planillas - efectivo_dispersado) stored,
  sin_movimiento        boolean default false,
  auxiliar_id           uuid references auth.users(id) not null,
  cerrado_at            timestamptz,
  analista_id           uuid references auth.users(id),
  aprobado_at           timestamptz,
  nota_devolucion       text,
  created_at            timestamptz default now(),
  unique(sede_id, fecha)
);

create table cuadres (
  id                      uuid primary key default uuid_generate_v4(),
  consecutivo             text unique not null,  -- DMA-110426.01
  sede_id                 uuid references sedes(id) not null,
  recaudo_id              uuid references recaudos_dia(id),
  fecha_cuadre            date not null,
  planillas               text[] not null,
  operaciones             text[] not null,
  estado                  text not null default 'BORRADOR',
  -- BORRADOR / ENVIADO_REVISION / APROBADO / ANULADO
  total_cuadrar_contado   numeric default 0,
  total_anticipos_clientes numeric default 0,  -- puede ser negativo
  total_gastos_ruta       numeric default 0,
  total_consig_riogrande  numeric default 0,
  total_consig_aliados    numeric default 0,
  total_anticipos_nomina  numeric default 0,
  total_hurtos_ruta       numeric default 0,
  efectivo_real           numeric default 0,
  efectivo_teorico        numeric default 0,
  diferencia_efectivo     numeric generated always as
                          (efectivo_real - efectivo_teorico) stored,
  ejecutado_por           uuid references auth.users(id) not null,
  -- Puede ser auxiliar o analista (cubre vacaciones)
  confirmado_at           timestamptz,
  motivo_anulacion        text,
  anulado_por             uuid references auth.users(id),
  created_at              timestamptz default now()
);

create table cuadre_tripulacion (
  id              uuid primary key default uuid_generate_v4(),
  cuadre_id       uuid references cuadres(id) not null,
  conductor_id    uuid references empleados(id) not null,
  auxiliar_1_id   uuid references empleados(id),
  auxiliar_2_id   uuid references empleados(id),
  vehiculo_id     uuid references vehiculos(id) not null,
  created_at      timestamptz default now()
);

create table cuadre_retenciones (
  id                  uuid primary key default uuid_generate_v4(),
  cuadre_id           uuid references cuadres(id) not null,
  recaudo_id          uuid references recaudos_dia(id),
  documento_id        uuid references documentos_erp(id) not null,
  tipo_retencion_id   uuid references parametros_contables(id) not null,
  valor               numeric not null,
  nit_retenedor       text not null,
  soporte_url         text,
  created_at          timestamptz default now()
);

create table cuadre_desc_condicionados (
  id            uuid primary key default uuid_generate_v4(),
  cuadre_id     uuid references cuadres(id) not null,
  recaudo_id    uuid references recaudos_dia(id),
  documento_id  uuid references documentos_erp(id),
  -- nullable si no viene ligado a una factura
  planilla      text not null,
  valor         numeric not null,
  nota          text,
  created_at    timestamptz default now()
);

create table cuadre_gastos_ruta (
  id                  uuid primary key default uuid_generate_v4(),
  cuadre_id           uuid references cuadres(id) not null,
  recaudo_id          uuid references recaudos_dia(id),
  nit_proveedor       text not null,
  nombre_proveedor    text not null,
  tipo_gasto_id       uuid references parametros_contables(id) not null,
  valor_base          numeric not null,
  valor_iva           numeric default 0,
  valor_retencion     numeric default 0,
  valor_total         numeric generated always as
                      (valor_base + valor_iva - valor_retencion) stored,
  soporte_url         text not null,
  supera_tope         boolean default false,
  justificacion_tope  text,
  created_at          timestamptz default now()
);

create table cuadre_anticipos_nomina (
  id                    uuid primary key default uuid_generate_v4(),
  cuadre_id             uuid references cuadres(id) not null,
  recaudo_id            uuid references recaudos_dia(id),
  empleado_id           uuid references empleados(id) not null,
  fecha                 date not null,
  concepto              text not null,   -- ANT_NOMINA / PASAJE / HURTO_RUTA
  valor                 numeric not null,
  num_denuncia          text,
  soporte_url           text,
  estado_autorizacion   text not null default 'APROBADO',
  -- PENDIENTE si HURTO_RUTA
  created_at            timestamptz default now()
);

create table destinos_efectivo (
  id                    uuid primary key default uuid_generate_v4(),
  recaudo_id            uuid references recaudos_dia(id) not null,
  tipo                  text not null,
  -- TRASLADO / ANTICIPO_ALIADO / DINERO_CLIENTE / HURTO_BODEGA
  destino_id            uuid references parametros_contables(id) not null,
  valor                 numeric not null,
  descripcion           text,
  num_denuncia          text,
  soporte_url           text,
  estado_autorizacion   text not null default 'APROBADO',
  autorizado_por        uuid references auth.users(id),
  created_at            timestamptz default now()
);

create table soportes_dia (
  id              uuid primary key default uuid_generate_v4(),
  recaudo_id      uuid references recaudos_dia(id) not null,
  tipo_soporte    text not null,
  url             text not null,
  nombre_archivo  text not null,
  subido_por      uuid references auth.users(id) not null,
  created_at      timestamptz default now()
);

create table checklist_revision (
  id              uuid primary key default uuid_generate_v4(),
  recaudo_id      uuid references recaudos_dia(id) not null,
  item            integer not null,
  descripcion     text not null,
  aplica          boolean default true,
  estado          text not null default 'PENDIENTE',
  nota            text,
  revisado_por    uuid references auth.users(id),
  revisado_at     timestamptz,
  unique(recaudo_id, item)
);

-- ═══════════════════════════════════════════════════════
-- CAPA HISTÓRICA — inmutable, aprobada, fuente para Odoo
-- ═══════════════════════════════════════════════════════

create table hist_recaudos_dia      (like recaudos_dia          including all, promovido_at timestamptz default now());
create table hist_cuadres           (like cuadres               including all, promovido_at timestamptz default now());
create table hist_tripulacion       (like cuadre_tripulacion     including all, promovido_at timestamptz default now());
create table hist_retenciones       (like cuadre_retenciones     including all, promovido_at timestamptz default now());
create table hist_gastos_ruta       (like cuadre_gastos_ruta     including all, promovido_at timestamptz default now());
create table hist_anticipos_nomina  (like cuadre_anticipos_nomina including all, promovido_at timestamptz default now());
create table hist_desc_condicionados (like cuadre_desc_condicionados including all, promovido_at timestamptz default now());
create table hist_destinos          (like destinos_efectivo      including all, promovido_at timestamptz default now());

-- ═══════════════════════════════════════════════════════
-- AUDIT LOG — inmutable, alimentado por triggers de BD
-- ═══════════════════════════════════════════════════════

create table audit_log (
  id              uuid primary key default uuid_generate_v4(),
  tabla           text not null,
  registro_id     uuid not null,
  accion          text not null,
  usuario_id      uuid,
  usuario_email   text,
  ip_address      text,
  valor_anterior  jsonb,
  valor_nuevo     jsonb,
  created_at      timestamptz default now()
);
-- Solo INSERT permitido vía trigger — nadie puede UPDATE ni DELETE
```

---

## 13. Funciones críticas de PostgreSQL

### 13.1 Generar consecutivo de cuadre
```sql
create or replace function generar_consecutivo_cuadre(p_sede_id uuid, p_fecha date)
returns text language plpgsql as $$
declare
  v_prefijo text;
  v_fecha_str text;
  v_numero integer;
begin
  select codigo into v_prefijo from sedes where id = p_sede_id;
  v_fecha_str := to_char(p_fecha, 'DDMMYY');
  insert into consecutivos_cuadre(sede_id, fecha, ultimo_numero)
  values (p_sede_id, p_fecha, 1)
  on conflict (sede_id) do update
    set ultimo_numero = case
          when consecutivos_cuadre.fecha = p_fecha
          then consecutivos_cuadre.ultimo_numero + 1
          else 1
        end,
        fecha = p_fecha
  returning ultimo_numero into v_numero;
  return v_prefijo || '-' || v_fecha_str || '.' || lpad(v_numero::text, 2, '0');
end; $$;
-- Resultado: DMA-110426.01, DMA-110426.02
```

### 13.2 Generar consecutivo de recaudo
```sql
create or replace function generar_consecutivo_recaudo(p_sede_id uuid, p_fecha date)
returns text language plpgsql as $$
declare
  v_prefijo text;
  v_fecha_str text;
  v_sufijo text := '';
  v_existe integer;
begin
  select codigo into v_prefijo from sedes where id = p_sede_id;
  v_fecha_str := to_char(p_fecha, 'DDMMYY');
  -- Verificar si ya existe un recaudo para ese día (fue anulado y se rehace)
  select count(*) into v_existe from recaudos_dia
  where sede_id = p_sede_id and fecha = p_fecha;
  if v_existe > 0 then
    v_sufijo := '-R' || v_existe::text;
  end if;
  return v_prefijo || '-RD-' || v_fecha_str || v_sufijo;
end; $$;
-- Resultado: DMA-RD-110426, DMA-RD-110426-R1
```

### 13.3 Obtener saldo anterior
```sql
create or replace function get_saldo_anterior(p_sede_id uuid, p_fecha date)
returns numeric language plpgsql as $$
declare v_saldo numeric;
begin
  select nuevo_saldo into v_saldo
  from recaudos_dia
  where sede_id = p_sede_id and fecha < p_fecha and estado = 'APROBADO'
  order by fecha desc limit 1;
  return coalesce(v_saldo, 0);
end; $$;
```

### 13.4 Validar límite de días sin aprobar
```sql
create or replace function validar_dias_sin_aprobar(p_sede_id uuid)
returns boolean language plpgsql as $$
declare
  v_max integer;
  v_pendientes integer;
begin
  select valor::integer into v_max from parametros_sistema
  where clave = 'MAX_DIAS_SIN_APROBAR';
  select count(*) into v_pendientes from recaudos_dia
  where sede_id = p_sede_id and estado = 'CERRADO_AUXILIAR';
  return v_pendientes < v_max;
end; $$;
```

### 13.5 Liberar bloqueos expirados de consignaciones
```sql
create or replace function liberar_bloqueos_expirados()
returns void language plpgsql as $$
declare v_timeout integer;
begin
  select valor::integer into v_timeout from parametros_sistema
  where clave = 'TIMEOUT_SESION_MINUTOS';
  -- Liberar consignaciones banco
  update consignaciones_banco
  set bloqueada_por = null, bloqueada_at = null, estado_cuadre = 'LIBRE'
  where estado_cuadre = 'BLOQUEADA'
    and bloqueada_at < now() - (v_timeout || ' minutes')::interval;
  -- Liberar consignaciones aliados
  update consignaciones_aliados
  set bloqueada_por = null, bloqueada_at = null, estado_cuadre = 'LIBRE'
  where estado_cuadre = 'BLOQUEADA'
    and bloqueada_at < now() - (v_timeout || ' minutes')::interval;
end; $$;
-- Ejecutar vía pg_cron o desde la app periódicamente
```

### 13.6 Promover día aprobado a histórico
```sql
create or replace function promover_a_historico(p_recaudo_id uuid)
returns void language plpgsql as $$
begin
  insert into hist_recaudos_dia      select *, now() from recaudos_dia          where id = p_recaudo_id;
  insert into hist_cuadres           select *, now() from cuadres               where recaudo_id = p_recaudo_id;
  insert into hist_tripulacion       select *, now() from cuadre_tripulacion    where cuadre_id in (select id from cuadres where recaudo_id = p_recaudo_id);
  insert into hist_retenciones       select *, now() from cuadre_retenciones    where recaudo_id = p_recaudo_id;
  insert into hist_gastos_ruta       select *, now() from cuadre_gastos_ruta    where recaudo_id = p_recaudo_id;
  insert into hist_anticipos_nomina  select *, now() from cuadre_anticipos_nomina where recaudo_id = p_recaudo_id;
  insert into hist_desc_condicionados select *, now() from cuadre_desc_condicionados where recaudo_id = p_recaudo_id;
  insert into hist_destinos          select *, now() from destinos_efectivo     where recaudo_id = p_recaudo_id;
  -- Actualizar documentos_erp
  update documentos_erp set estado_at = 'APROBADO', updated_at = now()
  where numero_cuadre in (select consecutivo from cuadres where recaudo_id = p_recaudo_id);
  -- Actualizar consignaciones (estado final)
  update consignaciones_banco set estado_cuadre = 'APROBADO', updated_at = now()
  where recaudo_id = p_recaudo_id;
  update consignaciones_aliados set estado_cuadre = 'APROBADO', updated_at = now()
  where recaudo_id = p_recaudo_id;
end; $$;
```

---

## 14. Lógica de upsert de fuentes SharePoint

```
Para cada tipo de archivo leído:
1. Calcular hash del archivo
2. Si el hash ya existe en BD → archivo no cambió → ignorar
3. Si es archivo nuevo o hash diferente → procesar
4. Para documentos_erp:
   - Buscar por operacion_documento (clave única)
   - Si no existe → INSERT
   - Si existe y estado cambió ABIERTA→CERRADA → UPDATE
   - Si existe, CERRADA y tiene numero_cuadre → NO TOCAR (inmutable)
5. Para consignaciones_banco y consignaciones_aliados:
   - Buscar por (banco/aliado + fecha + valor + referencia)
   - Si no existe → INSERT con estado LIBRE
   - Si existe y está APROBADA → NO TOCAR
6. Guardar hash y timestamp de lectura en cada registro
```

---

## 15. Controles antifraude

| Riesgo | Control |
|--------|---------|
| Manipular plano ERP | Contabilidad deposita en SharePoint protegido. Auxiliar no accede. Hash antifraude detecta cambios post-procesamiento. |
| Consignación falsa | Auxiliar solo selecciona de consignaciones ya validadas (banco o aliado). Alpina: libre pero con comprobante físico y conciliación mensual. |
| Duplicar consignación entre cajas | Bloqueo inmediato al seleccionar. Timeout parametrizable. UNIQUE por referencia en banco. |
| Efectivo manipulado | Diferencia negativa bloquea el cuadre. Valor esperado viene del ERP. |
| Duplicar planilla | UNIQUE en operacion_documento. Planilla con cuadre asignado no puede volver a cuadrarse. |
| Gastos inflados | Tope máximo parametrizable. Supera tope → marca + justificación obligatoria. |
| Modificar datos aprobados | Tablas históricas inmutables. Solo director puede anular con motivo en audit log. |
| Hurtos sin soporte | Estado PENDIENTE hasta confirmación de denuncia física. |
| Ocultar quién cuadró | Campo ejecutado_por en cuadres — siempre el usuario real. |
| Archivo fuente manipulado | Hash del archivo guardado al leer. Alerta si cambia después de procesado. |

---

## 16. Estructura de carpetas del proyecto

```
src/
├── app/
│   ├── (auth)/login/
│   └── (app)/
│       ├── layout.tsx
│       ├── inicio-del-dia/         ← Sincronización + alertas + estado sedes
│       ├── vista-01/               ← Estado de planillas
│       ├── vista-02/               ← Cuadre de planillas
│       │   ├── tripulacion/
│       │   ├── seccion-21/         ← Facturas, notas, anticipos, retenciones
│       │   ├── seccion-22/         ← Gastos de ruta
│       │   ├── seccion-23/         ← Consignaciones Riogrande
│       │   ├── seccion-24/         ← Consignaciones aliados
│       │   ├── seccion-25/         ← Conteo de efectivo
│       │   ├── seccion-26/         ← Anticipos nómina / hurtos ruta
│       │   └── seccion-27/         ← Resumen y confirmar
│       ├── vista-03/               ← Recaudo diario
│       ├── vista-04/               ← Revisión analista
│       ├── vista-05/               ← Informes
│       ├── conciliacion-alpina/    ← Conciliación mensual Alpina
│       └── parametrizacion/        ← Admin
│           ├── sedes-operaciones/
│           ├── bancos/
│           ├── tipos-gasto/
│           ├── tipos-retencion/
│           ├── empleados/
│           ├── vehiculos/          ← Maestro de placas
│           ├── aliados/
│           ├── cuentas-contables/
│           └── parametros-sistema/ ← Timeouts, márgenes, hora sync
├── services/
│   ├── documentos.ts
│   ├── cuadres.ts
│   ├── recaudos.ts
│   ├── consignaciones.ts           ← Banco + aliados + bloqueos
│   ├── sharepoint.ts               ← Lectura y sync de fuentes
│   ├── conciliacion-alpina.ts
│   ├── parametros.ts
│   └── informes.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useSede.ts
│   └── useCuadre.ts
├── lib/
│   ├── supabase.ts
│   ├── sharepoint.ts
│   ├── validaciones.ts
│   └── hash.ts                     ← Utilidad de hash para antifraude
└── types/
    └── index.ts
```

---

## 17. Hoja de ruta MVP — 3 meses

| Semana | Entregable |
|--------|-----------|
| 1-2 | Setup: Lovable + Supabase + Auth + RLS + SQL completo |
| 3-4 | Parametrización completa: sedes, operaciones, empleados, vehículos, cuentas, parámetros sistema |
| 5-6 | Lectura SharePoint → upsert documentos_erp + consignaciones banco + consignaciones aliados |
| 7-8 | Vista 01 + Vista 02 completa (tripulación + secciones 2.1 a 2.7) |
| 9-10 | Vista 03: recaudo diario + destinos + saldo + soportes dinámicos + Inicio del Día |
| 11 | Vista 04: revisión + aprobación + promoción a histórico |
| 12 | Vista 05: todos los informes + plano contable Odoo + auditoría máximo detalle |
| Post-MVP | Conciliación Alpina + rollout 4 sedes + Fase 2 |

---

## 18. Migración futura a Azure

| Componente | Supabase MVP | Azure futuro |
|-----------|-------------|-------------|
| Base de datos | Supabase PostgreSQL | Azure SQL / PostgreSQL Flexible |
| Auth | Supabase Auth | Azure AD B2C / Entra External ID |
| Storage | Supabase Storage | Azure Blob Storage |
| Edge Functions | Supabase Edge Functions | Azure Functions |
| RLS | Supabase RLS policies | Filtros en API layer |
| Scheduler | pg_cron | Azure Logic Apps |
| SharePoint | Microsoft Graph API | Microsoft Graph API (igual) |

Todo el código de negocio en `/src/services/` y `/src/lib/` — no acoplado al cliente de BD.

---

*Documento maestro v3.0 — Distribuciones Riogrande · Plataforma Tesorería*
*Pegar completo como contexto al inicio de cada sesión en Lovable / Antigravity.*
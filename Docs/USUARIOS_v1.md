# Usuarios, Roles y Permisos — RioTesorería
## Distribuciones Riogrande · Complemento al MD v7
**Fecha:** 2026-04-25

---

## 1. ARQUITECTURA DE USUARIOS

Supabase maneja la autenticación nativa via `auth.users` (email + password).
Para los perfiles, roles y sede asignada se crea una tabla `perfiles` que extiende `auth.users` con una relación 1:1.

---

## 2. TABLA `perfiles`

```sql
CREATE TABLE perfiles (
    id           uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    sede_id      uuid        REFERENCES sedes(id),   -- NULL si el rol ve todas las sedes
    rol          text        NOT NULL,
    -- auxiliar | analista | director | admin
    nombre       text        NOT NULL,
    activo       boolean     NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);
```

**Regla clave:** `sede_id = NULL` significa que el usuario ve todas las sedes (analista, director, admin). `sede_id = UUID` significa que el usuario solo ve su sede (auxiliar).

---

## 3. ROLES Y PERMISOS

### 3.1 Auxiliar
- **sede_id:** obligatorio (solo su sede)
- **Acceso a vistas:** Estado Planillas, Cuadre de Planillas, Recaudo Diario
- **Puede:** crear cuadres, registrar gastos, consignaciones, anticipos, adjuntar soportes, cerrar el día
- **No puede:** aprobar, devolver, ver otras sedes, acceder a Revisión, Sincronización Odoo, Parametrización
- **Restricción de datos:** solo ve registros donde `sede_id = su sede`

### 3.2 Analista
- **sede_id:** NULL (ve todas las sedes)
- **Acceso a vistas:** Todo lo del auxiliar + Revisión + Conciliación Alpina
- **Puede:** hacer cuadres (cubre vacaciones — el log registra quién lo hizo), revisar checklist, aprobar o devolver recaudos, gestionar conciliación Alpina
- **No puede:** anular cuadres ya aprobados, acceder a Sincronización Odoo, Parametrización
- **Nota:** cuando un analista hace un cuadre en lugar del auxiliar, `ejecutado_por` en `cuadres` queda con su `auth.users.id`

### 3.3 Director
- **sede_id:** NULL (ve todas las sedes)
- **Acceso a vistas:** Todo lo del analista + permisos adicionales de anulación
- **Puede:** todo lo del analista + anular cuadres aprobados (motivo obligatorio) + autorizar hurtos en ruta (cambiar estado PENDIENTE a APROBADO en `cuadre_anticipos_nomina`)
- **No puede:** acceder a Parametrización, Sincronización Odoo

### 3.4 Admin
- **sede_id:** NULL (ve todas las sedes)
- **Acceso a vistas:** Todo + Parametrización + Sincronización Odoo
- **Puede:** todo lo anterior + gestión completa de parámetros (sedes, aliados, bancos, parametros_contables, parametros_sistema, etc.) + gestión de usuarios (crear, desactivar, cambiar rol/sede) + editar saldo inicial de caja + habilitar/deshabilitar ingesta y sync
- **Es el único rol que puede:** acceder a Parametrización y modificar parámetros del sistema

---

## 4. CONTROL DE ACCESO POR VISTA

| Vista | Auxiliar | Analista | Director | Admin |
|-------|----------|----------|----------|-------|
| Inicio del Día | ✅ | ✅ | ✅ | ✅ |
| Estado de Planillas | ✅ | ✅ | ✅ | ✅ |
| Cuadre de Planillas | ✅ | ✅ | ✅ | ✅ |
| Recaudo Diario | ✅ | ✅ | ✅ | ✅ |
| Revisión | ❌ | ✅ | ✅ | ✅ |
| Conciliación Alpina | ❌ | ✅ | ✅ | ✅ |
| Sincronización Odoo | ❌ | ❌ | ❌ | ✅ |
| Informes | ✅ (solo su sede) | ✅ | ✅ | ✅ |
| Parametrización | ❌ | ❌ | ❌ | ✅ |

---

## 5. ROW LEVEL SECURITY (RLS) EN SUPABASE

Habilitar RLS en las tablas principales y crear políticas por rol:

```sql
-- Habilitar RLS
ALTER TABLE recaudos_dia          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadres               ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadre_retenciones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuadre_anticipos_nomina ENABLE ROW LEVEL SECURITY;
ALTER TABLE traslados_caja        ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignaciones_banco  ENABLE ROW LEVEL SECURITY;
ALTER TABLE consignaciones_aliados ENABLE ROW LEVEL SECURITY;
ALTER TABLE soportes_dia          ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_revision    ENABLE ROW LEVEL SECURITY;

-- Función helper para leer el perfil del usuario actual
CREATE OR REPLACE FUNCTION get_perfil()
RETURNS perfiles AS $$
  SELECT * FROM perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Política genérica para tablas con sede_id:
-- Auxiliar ve solo su sede, el resto ve todo
CREATE POLICY "acceso_por_sede" ON recaudos_dia
  USING (
    (SELECT rol FROM perfiles WHERE id = auth.uid()) != 'auxiliar'
    OR
    sede_id = (SELECT sede_id FROM perfiles WHERE id = auth.uid())
  );

-- Misma política aplicar a: cuadres, gastos, cuadre_retenciones,
-- cuadre_anticipos_nomina, traslados_caja, consignaciones_banco,
-- consignaciones_aliados, soportes_dia, checklist_revision
```

---

## 6. FLUJO DE CREACIÓN DE USUARIO

1. Admin crea el usuario en Supabase Auth (email + password temporal)
2. Supabase genera el `auth.users.id` automáticamente
3. Admin inserta en `perfiles`:
   ```sql
   INSERT INTO perfiles (id, sede_id, rol, nombre) VALUES
     (auth.uid_del_nuevo_usuario, uuid_sede_o_null, 'auxiliar', 'Nombre Completo');
   ```
4. El usuario recibe email de bienvenida y cambia su contraseña
5. Al iniciar sesión, la app lee `perfiles` para saber el rol y la sede — filtra el menú y los datos en consecuencia

**En el UI de Parametrización (pestaña Empleados):**
El Admin puede asignar o cambiar el rol de un usuario desde la misma interfaz — sin necesidad de ir al dashboard de Supabase.

---

## 7. IMPACTO EN EL SIDEBAR

El menú se filtra dinámicamente según el rol del usuario logueado:

```typescript
// En AppSidebar.tsx, filtrar menuItems según rol:
const menuItems = allMenuItems.filter(item => {
  if (item.id === 'revision')              return ['analista','director','admin'].includes(rol);
  if (item.id === 'conciliacion-alpina')   return ['analista','director','admin'].includes(rol);
  if (item.id === 'sincronizacion-odoo')   return rol === 'admin';
  if (item.id === 'parametrizacion')       return rol === 'admin';
  return true; // el resto lo ven todos
});
```

---

## 8. DATOS INICIALES — Usuario Admin por defecto

```sql
-- Después de crear el primer usuario admin en Supabase Auth:
INSERT INTO perfiles (id, sede_id, rol, nombre)
VALUES (
  'UUID_DEL_ADMIN',  -- reemplazar con el UUID real de auth.users
  NULL,              -- admin ve todas las sedes
  'admin',
  'Administrador RioTesorería'
);
```

---

*Documento de usuarios v1 — Distribuciones Riogrande · RioTesorería · 2026-04-25*
*Complemento al PROYECTO_v7.md — no modifica el modelo de datos v7*

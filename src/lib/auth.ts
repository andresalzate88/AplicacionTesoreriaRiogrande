import { supabase } from './supabase';
import type { Perfil } from '@/store/appStore';

export async function loadPerfil(userId: string): Promise<Perfil | null> {
  const { data: row, error } = await supabase
    .from('perfiles')
    .select('id, nombre, rol, sede_id, sedes(nombre)')
    .eq('id', userId)
    .single();

  if (error || !row) return null;

  return {
    id: row.id,
    nombre: row.nombre,
    rol: row.rol,
    sede_id: row.sede_id,
    sede_nombre: (row.sedes as { nombre: string } | null)?.nombre ?? row.sede_id,
  };
}

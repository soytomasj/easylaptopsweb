import { supabase } from './supabase';

export async function getProductoById(id: string) {
  const { data, error } = await supabase.from('productos').select('*').eq('id', id).single();
  if (error) return null;
  return data;
}

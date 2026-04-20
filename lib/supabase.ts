import { createClient } from '@supabase/supabase-js';

// Usamos variables de entorno si están, si no, usamos los valores por defecto para que no falle el build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bgzhflftfpfkjwdhviur.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_dIOUqg7KE8xqIIASJonaVQ_dtetawZd";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

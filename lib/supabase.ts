import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bgzhflftfpfkjwdhviur.supabase.co";
const supabaseAnonKey = "sb_publishable_dIOUqg7KE8xqIIASJonaVQ_dtetawZd";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
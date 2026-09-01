import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** true si les variables d'environnement de session sont configurées (voir .env.example). */
export const sessionDisponible = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = sessionDisponible
  ? createClient(url!, anonKey!)
  : null

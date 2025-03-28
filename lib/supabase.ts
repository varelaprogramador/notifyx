import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se as variáveis de ambiente estão definidas e não são strings vazias
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Erro: NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem ser definidos nas variáveis de ambiente",
  )
}

// Criar cliente do Supabase apenas se as variáveis estiverem disponíveis
export const supabase = supabaseUrl && supabaseAnonKey ? createClient<Database>(supabaseUrl, supabaseAnonKey) : null

// Função auxiliar para verificar se o cliente Supabase está disponível
export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      "Cliente Supabase não está disponível. Verifique se as variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão configuradas corretamente.",
    )
  }
  return supabase
}


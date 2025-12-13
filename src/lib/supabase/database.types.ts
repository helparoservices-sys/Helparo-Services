// Temporary stub types until you regenerate from Supabase CLI
// To regenerate: npx supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export type Database = Record<string, unknown>

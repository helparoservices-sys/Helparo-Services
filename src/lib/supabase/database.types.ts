// Temporary permissive types until you regenerate from Supabase CLI.
// This is intentionally broad to avoid `never` inference across the codebase.
// To regenerate (recommended for production):
//   npx supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/database.types.ts

export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[]

export type Database = {
	public: {
		Tables: {
			[tableName: string]: {
				Row: Record<string, any>
				Insert: Record<string, any>
				Update: Record<string, any>
				Relationships: any[]
			}
		}
		Views: {
			[viewName: string]: any
		}
		Functions: {
			[fnName: string]: any
		}
		Enums: {
			[enumName: string]: any
		}
		CompositeTypes: {
			[typeName: string]: any
		}
	}
}

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

// Generic table type for permissive operations
type GenericTable = {
	Row: Record<string, any>
	Insert: Record<string, any>
	Update: Record<string, any>
	Relationships: any[]
}

export type Database = {
	public: {
		Tables: {
			service_requests: GenericTable
			broadcast_notifications: GenericTable
			notifications: GenericTable
			profiles: GenericTable
			helper_profiles: GenericTable
			service_categories: GenericTable
			reviews: GenericTable
			helper_earnings: GenericTable
			helper_rating_summary: GenericTable
			[tableName: string]: GenericTable
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

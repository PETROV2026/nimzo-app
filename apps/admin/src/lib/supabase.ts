import type { Database } from '@nimzo/shared';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Run `pnpm env:setup`.');
}

// Uses the public anon key only. Access control is enforced by RLS in Postgres.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

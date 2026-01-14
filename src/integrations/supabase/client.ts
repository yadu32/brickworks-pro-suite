// Supabase client configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://vgkjqhcxovbngcenreml.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZna2pxaGN4b3ZibmdjZW5yZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MzgxMTIsImV4cCI6MjA3NDAxNDExMn0.gLRutgG0trrvFMXz9DK7DxESmOvRmJOI0FJLBhgkpQw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

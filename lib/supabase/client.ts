import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // In some micro-environments like v0 or during early build steps, 
    // these might be missing. We don't want to crash the whole JS bundle.
    console.error("Supabase credentials missing! Site will not function correctly.");
    return createBrowserClient("http://localhost:54321", "missing-key");
  }

  return createBrowserClient(url, key);
}

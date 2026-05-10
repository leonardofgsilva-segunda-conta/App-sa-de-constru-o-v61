import { createClient } from '@supabase/supabase-js';

// Helper to validate if a string is a valid URL
const isValidUrl = (url: any): boolean => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Ensure we have a valid URL, otherwise fallback to a safe placeholder format
export const isDemoMode = !isValidUrl(rawUrl) || !rawKey;
const supabaseUrl = !isDemoMode ? (rawUrl as string) : 'https://placeholder.supabase.co';
const supabaseAnonKey = !isDemoMode ? (rawKey as string) : 'placeholder-key';

if (isDemoMode) {
  console.warn('Supabase credentials missing or invalid. Using placeholder credentials. App will be in demo/mock mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: !isDemoMode,
    autoRefreshToken: !isDemoMode,
    detectSessionInUrl: !isDemoMode,
    storageKey: 'nexo-auth-v1'
  }
});

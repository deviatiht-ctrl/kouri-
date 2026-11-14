/**
 * ======================================================================
 * KOURI — Supabase Client Initialization (supabase.js)
 * Initialized ONLY here and exposed as window.db.
 * Supports configurable credentials with resilient demo/local fallback.
 * ======================================================================
 */

// Live Supabase Project Credentials (project: oykuhhogcdbmoybskexd)
const DEFAULT_SUPABASE_URL = 'https://oykuhhogcdbmoybskexd.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95a3VoaG9nY2RibW95YnNrZXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTk1OTksImV4cCI6MjA5NjQ5NTU5OX0.xbIdgA6-DCILYkDQcl_VzWgz7HmIlHYhmRp0u_a87F4';

const savedUrl = localStorage.getItem('kouri_supabase_url') || DEFAULT_SUPABASE_URL;
const savedKey = localStorage.getItem('kouri_supabase_anon_key') || DEFAULT_SUPABASE_ANON_KEY;

let supabaseClient = null;

if (window.supabase && typeof window.supabase.createClient === 'function') {
  try {
    supabaseClient = window.supabase.createClient(savedUrl, savedKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  } catch (err) {
    console.warn('[KOURI] Supabase initialization notice:', err.message);
  }
} else {
  console.warn('[KOURI] Supabase CDN library not detected yet; loading fallback interface.');
}

// Global exposure
window.db = supabaseClient;
window.KOURI_CONFIG = {
  supabaseUrl: savedUrl,
  supabaseKey: savedKey,
  isDemoMode: savedUrl.includes('demo-kouri-project')
};

/**
 * Update Supabase credentials from settings without manual code edits
 */
window.updateSupabaseCredentials = function(url, anonKey) {
  if (!url || !anonKey) return false;
  localStorage.setItem('kouri_supabase_url', url.trim());
  localStorage.setItem('kouri_supabase_anon_key', anonKey.trim());
  window.location.reload();
  return true;
};

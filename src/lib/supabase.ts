import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let cached: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(URL && ANON);
}

export function supabaseBrowser(): SupabaseClient {
  if (cached) return cached;
  if (!URL || !ANON) {
    throw new Error(
      'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    );
  }
  cached = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

const BUCKET = 'screenshots';

export type UploadResult = { url: string; path: string };

export async function uploadScreenshot(file: File): Promise<UploadResult> {
  const supabase = supabaseBrowser();
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const safeBase = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 40) || 'screenshot';
  const path = `${crypto.randomUUID()}-${safeBase}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

'use client';

import { createClient } from '@/lib/supabase/client';

export async function signOut(): Promise<{ errorMessage: string | null }> {
  const { error } = await createClient().auth.signOut();
  return { errorMessage: error?.message ?? null };
}

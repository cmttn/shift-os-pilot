import type { SupabaseClient } from '@supabase/supabase-js';
import { acceptFamilyInvite } from '@/lib/auth/acceptFamilyInvite';

export async function completeFamilyInvite(supabase: SupabaseClient, userId: string, token: string | null): Promise<string | null> {
  void supabase;
  return acceptFamilyInvite(userId, token, 'family');
}

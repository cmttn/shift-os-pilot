import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export interface SettingsProfile {
  full_name: string;
  dob: string | null;
  gender: string | null;
  country: string | null;
  timezone: string | null;
  phone: string | null;
  secondary_email: string | null;
  calendar_settings: Record<string, unknown>;
  notification_settings: Record<string, unknown>;
}

interface RawProfile {
  full_name?: string | null;
  dob?: string | null;
  gender?: string | null;
  country?: string | null;
  timezone?: string | null;
  phone?: string | null;
  secondary_email?: string | null;
  calendar_settings?: Record<string, unknown> | null;
  notification_settings?: Record<string, unknown> | null;
}

export interface SettingsProfileData {
  user: { id: string; email: string };
  profile: SettingsProfile;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizeProfile(profile: RawProfile | null, user: User): SettingsProfile {
  const metadataName = readString(user.user_metadata.full_name);
  const emailPrefix = user.email?.split('@')[0] ?? '';

  return {
    full_name: readString(profile?.full_name) ?? metadataName ?? emailPrefix,
    dob: readString(profile?.dob),
    gender: readString(profile?.gender),
    country: readString(profile?.country),
    timezone: readString(profile?.timezone) ?? 'Europe/London',
    phone: readString(profile?.phone),
    secondary_email: readString(profile?.secondary_email),
    calendar_settings: readObject(profile?.calendar_settings),
    notification_settings: readObject(profile?.notification_settings)
  };
}

export async function getSettingsProfile(): Promise<SettingsProfileData | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', user.id)
    .maybeSingle<RawProfile>();

  return {
    user: {
      id: user.id,
      email: user.email ?? ''
    },
    profile: normalizeProfile(data ?? null, user)
  };
}

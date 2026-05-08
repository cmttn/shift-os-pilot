import { createClient } from '@/lib/supabase/client';

const MAX_BADGE_SIZE_BYTES = 5 * 1024 * 1024;

export async function uploadClubBadge(file: File, slug: string): Promise<string> {
  if (!slug.trim()) {
    throw new Error('Club slug is required for badge upload.');
  }

  if (file.size > MAX_BADGE_SIZE_BYTES) {
    throw new Error('Badge file size must be 5MB or less.');
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  if (!fileExtension) {
    throw new Error('Badge file extension is invalid.');
  }

  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const filePath = `clubs/${safeSlug}/badge.${fileExtension}`;

  const supabase = createClient();
  const { error: uploadError } = await supabase.storage.from('club-assets').upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type
  });

  if (uploadError) {
    throw new Error(`Badge upload failed: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from('club-assets').getPublicUrl(filePath);

  if (!publicUrlData.publicUrl) {
    throw new Error('Could not retrieve uploaded badge URL.');
  }

  return publicUrlData.publicUrl;
}

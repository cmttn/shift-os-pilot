-- Ensure club-assets bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('club-assets', 'club-assets', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- clubs table policies
DROP POLICY IF EXISTS "club_admin can insert club" ON public.clubs;
CREATE POLICY "club_admin can insert club"
ON public.clubs FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "club members can read their club" ON public.clubs;
CREATE POLICY "club members can read their club"
ON public.clubs FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT club_id FROM public.club_members
    WHERE user_id = auth.uid() AND is_active = true
  )
);

DROP POLICY IF EXISTS "club_admin can update their club" ON public.clubs;
CREATE POLICY "club_admin can update their club"
ON public.clubs FOR UPDATE
TO authenticated
USING (
  id IN (
    SELECT club_id FROM public.club_members
    WHERE user_id = auth.uid()
      AND club_role = 'admin'
      AND is_active = true
  )
)
WITH CHECK (
  id IN (
    SELECT club_id FROM public.club_members
    WHERE user_id = auth.uid()
      AND club_role = 'admin'
      AND is_active = true
  )
);

-- club_members table policies
DROP POLICY IF EXISTS "users can insert own club_member row" ON public.club_members;
CREATE POLICY "users can insert own club_member row"
ON public.club_members FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users can read own club_member row" ON public.club_members;
CREATE POLICY "users can read own club_member row"
ON public.club_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "club_admin can read all club members" ON public.club_members;
CREATE POLICY "club_admin can read all club members"
ON public.club_members FOR SELECT
TO authenticated
USING (
  club_id IN (
    SELECT club_id FROM public.club_members
    WHERE user_id = auth.uid()
      AND club_role = 'admin'
      AND is_active = true
  )
);

-- storage.objects policies for club-assets bucket
DROP POLICY IF EXISTS "authenticated users can upload club assets" ON storage.objects;
CREATE POLICY "authenticated users can upload club assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'club-assets');

DROP POLICY IF EXISTS "authenticated users can update club assets" ON storage.objects;
CREATE POLICY "authenticated users can update club assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'club-assets' AND auth.uid()::text = owner)
WITH CHECK (bucket_id = 'club-assets' AND auth.uid()::text = owner);

DROP POLICY IF EXISTS "public can read club assets" ON storage.objects;
CREATE POLICY "public can read club assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'club-assets');

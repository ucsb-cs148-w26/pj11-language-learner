-- ============================================================================
-- RLS for messages, conversations, conversation_participants, profiles
-- ============================================================================
-- Run this in Supabase SQL Editor to fix data exposure: users should only see
-- their own profile (and non-sensitive public data for others), and only
-- messages in conversations they participate in.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES: only own row for direct access; use get_public_profiles() for others
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role / trigger may need to insert (e.g. handle_new_user)
DROP POLICY IF EXISTS "Allow service role to create profiles" ON public.profiles;
CREATE POLICY "Allow service role to create profiles"
  ON public.profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Public profile data (no email) via function so clients can show other users
CREATE OR REPLACE FUNCTION public.get_public_profiles(uid uuid[])
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  bio text,
  profile_picture_url text,
  native_language text,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.user_id, p.first_name, p.last_name, p.bio, p.profile_picture_url, p.native_language, p.updated_at
  FROM public.profiles p
  WHERE p.user_id = ANY(uid);
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. CONVERSATIONS: only participants can read
-- ----------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_participant" ON public.conversations;
CREATE POLICY "conversations_select_participant"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "conversations_insert_authenticated" ON public.conversations;
CREATE POLICY "conversations_insert_authenticated"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 3. CONVERSATION_PARTICIPANTS: read only your participations or co-participants in your convos
-- ----------------------------------------------------------------------------
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversation_participants_select_mine_or_convos" ON public.conversation_participants;
CREATE POLICY "conversation_participants_select_mine_or_convos"
  ON public.conversation_participants FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "conversation_participants_insert_authenticated" ON public.conversation_participants;
CREATE POLICY "conversation_participants_insert_authenticated"
  ON public.conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 4. MESSAGES: only participants of the conversation can read/insert
-- ----------------------------------------------------------------------------
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
CREATE POLICY "messages_select_participant"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "messages_insert_sender_participant" ON public.messages;
CREATE POLICY "messages_insert_sender_participant"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 5. PROFILE_TARGET_LANGUAGES: read all for discovery; write only own
-- ----------------------------------------------------------------------------
ALTER TABLE public.profile_target_languages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_target_languages_select_authenticated" ON public.profile_target_languages;
CREATE POLICY "profile_target_languages_select_authenticated"
  ON public.profile_target_languages FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profile_target_languages_insert_own" ON public.profile_target_languages;
CREATE POLICY "profile_target_languages_insert_own"
  ON public.profile_target_languages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "profile_target_languages_update_own" ON public.profile_target_languages;
CREATE POLICY "profile_target_languages_update_own"
  ON public.profile_target_languages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "profile_target_languages_delete_own" ON public.profile_target_languages;
CREATE POLICY "profile_target_languages_delete_own"
  ON public.profile_target_languages FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

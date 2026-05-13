# Shift OS Project Map

Generated: 2026-05-13T15:57:27.472Z

Project root: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os`

Repository: `cmttn/shift-os-pilot`

Branch: `main`

## Current Architecture

- Next.js 14 App Router application with TypeScript and Tailwind CSS.
- Supabase access is via `@supabase/ssr` server/browser clients plus a service client for server-only privileged API work.
- Core role areas: club admin, coach, parent, player, and Football Family read-only access.
- Parent access supports primary parent and co-parent via `players.parent_user_id` and `players.co_parent_user_id`.
- Football Family is read-only via `football_family` and invite links via `football_family_invites`.
- Sessions are training or recurring activities; fixtures/matches remain separate in domain language, with imported matches stored as `sessions.type = 'match'`.
- Goals UI uses legacy DB table names `player_stars`, `player_star_goals`, and `player_star_totals`.

## Canonical Data Model Notes

This map includes an inferred table section near the bottom. The high-confidence domain columns currently used by the app are:

- `clubs`: `id`, `name`, `badge_url`, `primary_colour`, `secondary_colour`, `plan_tier`, `ethos`, `allow_team_colours`, `allow_team_badges`, `coach_join_code`.
- `teams`: `id`, `club_id`, `name`, `age_group`, `season`, `gender`, `league`, `is_active`, `join_code`, `primary_colour`, `secondary_colour`, `badge_url`, `club_import_token`, `club_import_status`.
- `team_coaches`: `id`, `team_id`, `user_id`, `is_lead`.
- `players`: `id`, `team_id`, `parent_user_id`, `co_parent_user_id`, `first_name`, `last_name`, `dob`, `is_active`, `invite_token`, `invite_sent_at`, `invite_accepted_at`, `invite_status`, `fa_fan_number`, `fa_fan_verified`, `fa_fan_added_by`.
- `sessions`: `id`, `team_id`, `type`, `opponent`, `title`, `session_date`, `location`, `full_address`, `postcode`, `is_home`, `coach_notes`, `opposition_contact_name`, `opposition_contact_phone`, `poll_sent`, `poll_sent_at`, `session_token`, `tournify_link`, `imported_from`, `is_active`.
- `poll_responses`: `id`, `session_id`, `player_id`, `player_token`, `status`, `note`, `responded_at`.
- `users_profile`: `id`, `user_id`, `full_name`, `email`, `system_role`, `intended_role`, `phone`, `secondary_email`, `dob`, `gender`, `country`, `timezone`, `calendar_settings`, `notification_settings`, `calendar_token`, `calendar_sync_enabled`, `calendar_include_pending`, `calendar_include_training`, `calendar_include_tournaments`.
- `football_family`: `id`, `player_id`, `family_user_id`, `invited_by`, `relationship`, `invite_token`, `status`, `invited_at`, `accepted_at`.
- `football_family_invites`: `id`, `player_id`, `invited_by`, `invite_token`, `invitee_email`, `invitee_name`, `relationship`, `status`, `created_at`, `expires_at`.
- `player_stars`, `player_star_goals`, `player_star_totals`, `player_milestone_achievements`: legacy-named goals tables used by the parent/player goals system.
- `tickets`, `ticket_events`, `coach_recognition_settings`, `coach_recognition_totals`: parent/coach/club ticket and recognition system tables.

## File Inventory

### .eslintrc.json
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\.eslintrc.json`
- What it does: project file.
- Key exports/functions/components: None detected
- Notable dependencies: None detected

### .gitignore
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\.gitignore`
- What it does: project file.
- Key exports/functions/components: None detected
- Notable dependencies: None detected

### PROJECT_MAP.md
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\PROJECT_MAP.md`
- What it does: project file.
- Key exports/functions/components: None detected
- Notable dependencies: None detected

### app/api/calendar/[token]/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\calendar\[token]\route.ts`
- What it does: Handles /api/calendar/[token] requests.
- Key exports/functions/components: GET
- Notable dependencies: `next/server`, `@/lib/supabase/service`

### app/api/clubs/import-team/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\clubs\import-team\route.ts`
- What it does: Handles /api/clubs/import-team requests.
- Key exports/functions/components: GET, POST
- Notable dependencies: `next/server`, `@/lib/supabase/service`, `@/lib/supabase/server`

### app/api/clubs/join-request/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\clubs\join-request\route.ts`
- What it does: Handles /api/clubs/join-request requests.
- Key exports/functions/components: GET, POST
- Notable dependencies: `next/server`, `@/lib/supabase/service`, `@/lib/supabase/server`

### app/api/compliance-reminders/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\compliance-reminders\route.ts`
- What it does: Handles /api/compliance-reminders requests.
- Key exports/functions/components: GET, dynamic
- Notable dependencies: `next/server`, `web-push`, `@/lib/supabase/service`

### app/api/fixtures/extract-from-image/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\fixtures\extract-from-image\route.ts`
- What it does: Handles /api/fixtures/extract-from-image requests.
- Key exports/functions/components: POST
- Notable dependencies: `@anthropic-ai/sdk`, `next/server`

### app/api/fixtures/fetch-from-fulltime/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\fixtures\fetch-from-fulltime\route.ts`
- What it does: Handles /api/fixtures/fetch-from-fulltime requests.
- Key exports/functions/components: POST
- Notable dependencies: `cheerio`, `next/server`

### app/api/icons/[size]/route.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\icons\[size]\route.tsx`
- What it does: Handles /api/icons/[size] requests.
- Key exports/functions/components: GET
- Notable dependencies: `next/og`, `next/server`

### app/api/invites/family/accept/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\invites\family\accept\route.ts`
- What it does: Handles /api/invites/family/accept requests.
- Key exports/functions/components: POST
- Notable dependencies: `next/server`, `@/lib/auth/acceptFamilyInvite`, `@/lib/supabase/server`

### app/api/notify/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\notify\route.ts`
- What it does: Handles /api/notify requests.
- Key exports/functions/components: POST
- Notable dependencies: `next/server`, `web-push`, `@/lib/supabase/service`

### app/api/players/invite/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\players\invite\route.ts`
- What it does: Handles /api/players/invite requests.
- Key exports/functions/components: POST
- Notable dependencies: `next/server`, `@/lib/supabase/server`

### app/api/potm-card/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\potm-card\route.ts`
- What it does: Handles /api/potm-card requests.
- Key exports/functions/components: POST
- Notable dependencies: `react`, `next/og`, `next/server`, `@/lib/supabase/service`

### app/api/potm-close/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\potm-close\route.ts`
- What it does: Handles /api/potm-close requests.
- Key exports/functions/components: POST
- Notable dependencies: `next/server`, `@/lib/supabase/service`, `@/lib/tools/potmCalculator`, `@/lib/tools/starAwarder`

### app/api/potm-cron/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\potm-cron\route.ts`
- What it does: Handles /api/potm-cron requests.
- Key exports/functions/components: GET
- Notable dependencies: `next/server`

### app/api/push-subscription/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\push-subscription\route.ts`
- What it does: Handles /api/push-subscription requests.
- Key exports/functions/components: POST
- Notable dependencies: `next/server`, `@/lib/supabase/server`

### app/api/stars-season-reset/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\stars-season-reset\route.ts`
- What it does: Handles /api/stars-season-reset requests.
- Key exports/functions/components: GET
- Notable dependencies: `next/server`

### app/api/stars-season-start/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\stars-season-start\route.ts`
- What it does: Handles /api/stars-season-start requests.
- Key exports/functions/components: GET
- Notable dependencies: `next/server`

### app/api/update-availability/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\update-availability\route.ts`
- What it does: Handles /api/update-availability requests.
- Key exports/functions/components: POST
- Notable dependencies: `next/server`, `@/lib/supabase/server`

### app/auth/callback/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\auth\callback\route.ts`
- What it does: Handles /auth/callback requests.
- Key exports/functions/components: GET
- Notable dependencies: `next/server`, `@/lib/auth/completeCoParentInvite`, `@/lib/auth/completeFamilyInvite`, `@/lib/auth/completeInvite`, `@/lib/auth/completePlayerInvite`, `@/lib/supabase/server`

### app/auth/login/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\auth\login\page.tsx`
- What it does: Renders /auth/login page.
- Key exports/functions/components: LoginPage
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/auth/completePlayerInvite`, `@/lib/supabase/client`

### app/auth/signup/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\auth\signup\page.tsx`
- What it does: Renders /auth/signup page.
- Key exports/functions/components: SignupPage
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/auth/completeInvite`, `@/lib/auth/completePlayerInvite`, `@/lib/supabase/client`

### app/dashboard/club/coaches/[coachId]/compliance/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\coaches\[coachId]\compliance\page.tsx`
- What it does: Renders /dashboard/club/coaches/[coachId]/compliance page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/compliance/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\compliance\page.tsx`
- What it does: Renders /dashboard/club/compliance page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/fixtures/import/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\fixtures\import\page.tsx`
- What it does: Renders /dashboard/club/fixtures/import page.
- Key exports/functions/components: None detected
- Notable dependencies: `@/components/fixtures/CSVImporter`, `@/lib/dashboard/getClubData`

### app/dashboard/club/fixtures/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\fixtures\page.tsx`
- What it does: Renders /dashboard/club/fixtures page.
- Key exports/functions/components: None detected
- Notable dependencies: `@/lib/dashboard/getClubData`

### app/dashboard/club/layout.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\layout.tsx`
- What it does: Provides layout wrapper for /dashboard/club routes.
- Key exports/functions/components: None detected
- Notable dependencies: `react`, `next/navigation`, `@/components/dashboard/Sidebar`, `@/components/dashboard/ClubHeader`, `@/components/navigation/mobile-bottom-nav`, `@/components/navigation/mobile-role-header`, `@/lib/dashboard/getClubData`

### app/dashboard/club/notifications/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\notifications\page.tsx`
- What it does: Renders /dashboard/club/notifications page.
- Key exports/functions/components: ClubNotificationsPage
- Notable dependencies: None detected

### app/dashboard/club/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\page.tsx`
- What it does: Renders /dashboard/club page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `@/components/dashboard/ClubFixturesPanel`, `@/components/dashboard/ClubTeamScroller`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/players/subscriptions/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\players\subscriptions\page.tsx`
- What it does: Renders /dashboard/club/players/subscriptions page.
- Key exports/functions/components: None detected
- Notable dependencies: `@/components/dashboard/PlayerSubscriptionsClient`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/settings/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\settings\page.tsx`
- What it does: Renders /dashboard/club/settings page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/ClubBrandingSettings`, `@/components/dashboard/ClubJoinCodeSettings`, `@/components/dashboard/SettingsPage`, `@/lib/dashboard/getClubData`, `@/lib/dashboard/getSettingsProfile`, `@/lib/utils/contrastText`

### app/dashboard/club/settings/potm/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\settings\potm\page.tsx`
- What it does: Renders /dashboard/club/settings/potm page.
- Key exports/functions/components: ClubPotmSettingsPage
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`

### app/dashboard/club/settings/recognition/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\settings\recognition\page.tsx`
- What it does: Renders /dashboard/club/settings/recognition page.
- Key exports/functions/components: RecognitionSettingsPage
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`

### app/dashboard/club/teams/[teamId]/coach-view/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\teams\[teamId]\coach-view\page.tsx`
- What it does: Renders /dashboard/club/teams/[teamId]/coach-view page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/CopyInviteButton`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/teams/[teamId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\teams\[teamId]\page.tsx`
- What it does: Renders /dashboard/club/teams/[teamId] page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/CopyInviteButton`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/teams/[teamId]/players/new/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\teams\[teamId]\players\new\page.tsx`
- What it does: Renders /dashboard/club/teams/[teamId]/players/new page.
- Key exports/functions/components: NewTeamPlayerPlaceholder
- Notable dependencies: `next/link`

### app/dashboard/club/teams/[teamId]/success/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\teams\[teamId]\success\page.tsx`
- What it does: Renders /dashboard/club/teams/[teamId]/success page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/CopyInviteButton`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/teams/import/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\teams\import\page.tsx`
- What it does: Renders /dashboard/club/teams/import page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/navigation`, `@/components/dashboard/ImportTeamForm`, `@/lib/dashboard/getClubData`

### app/dashboard/club/teams/new/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\teams\new\page.tsx`
- What it does: Renders /dashboard/club/teams/new page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/AddTeamForm`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/teams/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\teams\page.tsx`
- What it does: Renders /dashboard/club/teams page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/CoachInviteDrawer`, `@/components/dashboard/CopyInviteButton`, `@/components/dashboard/PendingCoachJoinRequests`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/tickets/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\tickets\page.tsx`
- What it does: Renders /dashboard/club/tickets page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/TicketStatusActions`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`, `@/lib/tools/ticketTypes`

### app/dashboard/club/tools/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\tools\page.tsx`
- What it does: Renders /dashboard/club/tools page.
- Key exports/functions/components: None detected
- Notable dependencies: `@/lib/dashboard/getClubData`

### app/dashboard/coach/fixtures/import/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\fixtures\import\page.tsx`
- What it does: Renders /dashboard/coach/fixtures/import page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/navigation`, `@/components/fixtures/FixtureImportWizard`, `@/lib/dashboard/getCoachData`

### app/dashboard/coach/layout.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\layout.tsx`
- What it does: Provides layout wrapper for /dashboard/coach routes.
- Key exports/functions/components: None detected
- Notable dependencies: `react`, `@/components/dashboard/CoachSidebar`, `@/components/NotificationPermission`, `@/components/navigation/mobile-bottom-nav`, `@/components/navigation/mobile-role-header`, `@/lib/dashboard/getCoachData`

### app/dashboard/coach/messages/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\messages\page.tsx`
- What it does: Renders /dashboard/coach/messages page.
- Key exports/functions/components: CoachMessagesPage
- Notable dependencies: None detected

### app/dashboard/coach/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\page.tsx`
- What it does: Renders /dashboard/coach page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/navigation`, `@/components/dashboard/CoachDashboardClient`, `@/lib/dashboard/getCoachData`

### app/dashboard/coach/past-fixtures/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\past-fixtures\page.tsx`
- What it does: Renders /dashboard/coach/past-fixtures page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/server`

### app/dashboard/coach/players/[playerId]/success/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\players\[playerId]\success\page.tsx`
- What it does: Renders /dashboard/coach/players/[playerId]/success page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/CopyInviteButton`, `@/lib/dashboard/getCoachDashboardData`, `@/lib/supabase/server`

### app/dashboard/coach/players/new/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\players\new\page.tsx`
- What it does: Renders /dashboard/coach/players/new page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/AddPlayerForm`, `@/lib/dashboard/getCoachDashboardData`, `@/lib/supabase/server`

### app/dashboard/coach/players/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\players\page.tsx`
- What it does: Renders /dashboard/coach/players page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/PlayerInviteButton`, `@/lib/dashboard/getCoachData`, `@/lib/utils/contrastText`

### app/dashboard/coach/profile/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\profile\page.tsx`
- What it does: Renders /dashboard/coach/profile page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/navigation`, `@/components/dashboard/CoachComplianceForm`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/server`

### app/dashboard/coach/schedule/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\schedule\page.tsx`
- What it does: Renders /dashboard/coach/schedule page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/navigation`, `@/components/dashboard/CoachScheduleClient`, `@/lib/dashboard/getCoachData`

### app/dashboard/coach/sessions/[sessionId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\sessions\[sessionId]\page.tsx`
- What it does: Renders /dashboard/coach/sessions/[sessionId] page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/navigation`, `@/components/dashboard/SessionDetailClient`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/server`

### app/dashboard/coach/sessions/[sessionId]/past/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\sessions\[sessionId]\past\page.tsx`
- What it does: Renders /dashboard/coach/sessions/[sessionId]/past page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/server`, `@/lib/tools/playtimeCalculator`

### app/dashboard/coach/sessions/[sessionId]/playtime/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\sessions\[sessionId]\playtime\page.tsx`
- What it does: Renders /dashboard/coach/sessions/[sessionId]/playtime page.
- Key exports/functions/components: PlaytimeCalculatorPage
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/tools/playtimeCalculator`

### app/dashboard/coach/sessions/[sessionId]/playtime/result/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\sessions\[sessionId]\playtime\result\page.tsx`
- What it does: Renders /dashboard/coach/sessions/[sessionId]/playtime/result page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/server`, `@/lib/tools/playtimeCalculator`

### app/dashboard/coach/sessions/[sessionId]/potm/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\sessions\[sessionId]\potm\page.tsx`
- What it does: Renders /dashboard/coach/sessions/[sessionId]/potm page.
- Key exports/functions/components: SessionPotmPage
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`

### app/dashboard/coach/sessions/new/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\sessions\new\page.tsx`
- What it does: Renders /dashboard/coach/sessions/new page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/navigation`, `@/components/dashboard/CreateSessionForm`, `@/lib/dashboard/getCoachData`

### app/dashboard/coach/settings/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\settings\page.tsx`
- What it does: Renders /dashboard/coach/settings page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/navigation`, `@/components/dashboard/CoachPotmSettingsForm`, `@/components/dashboard/CoachTeamBrandingSettings`, `@/components/dashboard/SettingsPage`, `@/lib/dashboard/getCoachData`, `@/lib/dashboard/getSettingsProfile`

### app/dashboard/coach/stats/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\stats\page.tsx`
- What it does: Renders /dashboard/coach/stats page.
- Key exports/functions/components: CoachStatsPage
- Notable dependencies: None detected

### app/dashboard/coach/teams/new/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\teams\new\page.tsx`
- What it does: Renders /dashboard/coach/teams/new page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/CoachCreateTeamForm`, `@/lib/supabase/server`

### app/dashboard/coach/tickets/new/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\tickets\new\page.tsx`
- What it does: Renders /dashboard/coach/tickets/new page.
- Key exports/functions/components: NewCoachTicketPage
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/tools/ticketTypes`

### app/dashboard/coach/tickets/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\tickets\page.tsx`
- What it does: Renders /dashboard/coach/tickets page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/TicketStatusActions`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/server`, `@/lib/tools/ticketTypes`

### app/dashboard/coach/tools/potm/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\tools\potm\page.tsx`
- What it does: Renders /dashboard/coach/tools/potm page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/server`

### app/dashboard/coach/tools/potm/setup/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\tools\potm\setup\page.tsx`
- What it does: Renders /dashboard/coach/tools/potm/setup page.
- Key exports/functions/components: PotmSetupPage
- Notable dependencies: `react`, `next/navigation`, `@/lib/supabase/client`

### app/dashboard/coach/welcome/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\welcome\page.tsx`
- What it does: Renders /dashboard/coach/welcome page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/CoachJoinTeamForm`, `@/lib/supabase/server`

### app/dashboard/family/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\family\page.tsx`
- What it does: Renders /dashboard/family page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getFamilyDashboardData`

### app/dashboard/family/player/[playerId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\family\player\[playerId]\page.tsx`
- What it does: Renders /dashboard/family/player/[playerId] page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/PlayerAccessTree`, `@/lib/dashboard/getFamilyDashboardData`, `@/lib/tools/starCategories`

### app/dashboard/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\page.tsx`
- What it does: Renders /dashboard page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/navigation`, `@/lib/supabase/server`

### app/dashboard/parent/goals/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\goals\page.tsx`
- What it does: Renders /dashboard/parent/goals page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getParentDashboardData`

### app/dashboard/parent/layout.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\layout.tsx`
- What it does: Provides layout wrapper for /dashboard/parent routes.
- Key exports/functions/components: None detected
- Notable dependencies: `react`, `@/components/navigation/mobile-bottom-nav`, `@/lib/dashboard/getParentDashboardData`

### app/dashboard/parent/notifications/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\notifications\page.tsx`
- What it does: Renders /dashboard/parent/notifications page.
- Key exports/functions/components: ParentNotificationsPage
- Notable dependencies: None detected

### app/dashboard/parent/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\page.tsx`
- What it does: Renders /dashboard/parent page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/PlayerAccessTree`, `@/lib/dashboard/getParentDashboardData`

### app/dashboard/parent/player/[playerId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\player\[playerId]\page.tsx`
- What it does: Renders /dashboard/parent/player/[playerId] page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getParentDashboardData`

### app/dashboard/parent/player/[playerId]/team/[teamId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\player\[playerId]\team\[teamId]\page.tsx`
- What it does: Renders /dashboard/parent/player/[playerId]/team/[teamId] page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/ParentFixturesClient`, `@/components/dashboard/GoalAwardSheet`, `@/components/dashboard/ParentQuickSwitcher`, `@/components/dashboard/PlayerAccessTree`, `@/lib/dashboard/getParentDashboardData`, `@/lib/supabase/server`, `@/lib/tools/starCategories`

### app/dashboard/parent/player/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\player\page.tsx`
- What it does: Renders /dashboard/parent/player page.
- Key exports/functions/components: LegacyParentPlayerPage
- Notable dependencies: `next/navigation`

### app/dashboard/parent/potm/[pollId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\potm\[pollId]\page.tsx`
- What it does: Renders /dashboard/parent/potm/[pollId] page.
- Key exports/functions/components: ParentPotmVotePage
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`

### app/dashboard/parent/schedule/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\schedule\page.tsx`
- What it does: Renders /dashboard/parent/schedule page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getParentDashboardData`

### app/dashboard/parent/settings/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\settings\page.tsx`
- What it does: Renders /dashboard/parent/settings page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/navigation`, `@/components/dashboard/FootballFamilySettings`, `@/components/dashboard/SettingsPage`, `@/lib/dashboard/getParentDashboardData`, `@/lib/dashboard/getSettingsProfile`, `@/lib/supabase/server`

### app/dashboard/parent/stars/[playerId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\stars\[playerId]\page.tsx`
- What it does: Renders /dashboard/parent/stars/[playerId] page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/supabase/server`, `@/lib/tools/starCategories`

### app/dashboard/parent/stars/award/[sessionId]/[playerId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\stars\award\[sessionId]\[playerId]\page.tsx`
- What it does: Renders /dashboard/parent/stars/award/[sessionId]/[playerId] page.
- Key exports/functions/components: AwardGoalsFallbackPage
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/components/dashboard/GoalAwardSheet`, `@/lib/supabase/client`, `@/lib/tools/starCategories`

### app/dashboard/parent/stars/goal/[sessionId]/[playerId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\stars\goal\[sessionId]\[playerId]\page.tsx`
- What it does: Renders /dashboard/parent/stars/goal/[sessionId]/[playerId] page.
- Key exports/functions/components: SetGoalPage
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/tools/starCategories`

### app/dashboard/parent/tickets/new/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\tickets\new\page.tsx`
- What it does: Renders /dashboard/parent/tickets/new page.
- Key exports/functions/components: NewParentTicketPage
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/tools/ticketTypes`

### app/dashboard/parent/tickets/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\tickets\page.tsx`
- What it does: Renders /dashboard/parent/tickets page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getParentDashboardData`, `@/lib/supabase/server`, `@/lib/tools/ticketTypes`

### app/dashboard/player/goals/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\player\goals\page.tsx`
- What it does: Renders /dashboard/player/goals page.
- Key exports/functions/components: PlayerGoalsPage
- Notable dependencies: None detected

### app/dashboard/player/layout.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\player\layout.tsx`
- What it does: Provides layout wrapper for /dashboard/player routes.
- Key exports/functions/components: None detected
- Notable dependencies: `react`, `@/components/navigation/mobile-bottom-nav`, `@/components/navigation/mobile-role-header`, `@/lib/supabase/server`

### app/dashboard/player/notifications/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\player\notifications\page.tsx`
- What it does: Renders /dashboard/player/notifications page.
- Key exports/functions/components: PlayerNotificationsPage
- Notable dependencies: None detected

### app/dashboard/player/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\player\page.tsx`
- What it does: Renders /dashboard/player page.
- Key exports/functions/components: PlayerDashboardHoldingPage
- Notable dependencies: `next/link`

### app/dashboard/player/schedule/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\player\schedule\page.tsx`
- What it does: Renders /dashboard/player/schedule page.
- Key exports/functions/components: PlayerSchedulePage
- Notable dependencies: None detected

### app/dashboard/player/settings/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\player\settings\page.tsx`
- What it does: Renders /dashboard/player/settings page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/navigation`, `@/components/dashboard/SettingsPage`, `@/lib/dashboard/getSettingsProfile`

### app/dashboard/player/tickets/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\player\tickets\page.tsx`
- What it does: Renders /dashboard/player/tickets page.
- Key exports/functions/components: PlayerTicketsPage
- Notable dependencies: None detected

### app/dashboard/player/welcome/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\player\welcome\page.tsx`
- What it does: Renders /dashboard/player/welcome page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/navigation`, `@/components/dashboard/PlayerJoinTeamForm`, `@/lib/supabase/server`

### app/globals.css
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\globals.css`
- What it does: Global styling and Tailwind layers.
- Key exports/functions/components: None detected
- Notable dependencies: None detected

### app/invite/coparent/[token]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\invite\coparent\[token]\page.tsx`
- What it does: Renders /invite/coparent/[token] page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `@/lib/supabase/service`

### app/invite/family/[token]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\invite\family\[token]\page.tsx`
- What it does: Renders /invite/family/[token] page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `@/lib/supabase/service`

### app/invite/player/[token]/complete/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\invite\player\[token]\complete\page.tsx`
- What it does: Renders /invite/player/[token]/complete page.
- Key exports/functions/components: PlayerInviteCompletePage
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`

### app/invite/player/[token]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\invite\player\[token]\page.tsx`
- What it does: Renders /invite/player/[token] page.
- Key exports/functions/components: None detected
- Notable dependencies: `next/link`, `@/lib/supabase/server`

### app/layout.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\layout.tsx`
- What it does: Provides layout wrapper for / routes.
- Key exports/functions/components: RootLayout, metadata, viewport
- Notable dependencies: `next`

### app/onboarding/layout.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\onboarding\layout.tsx`
- What it does: Provides layout wrapper for /onboarding routes.
- Key exports/functions/components: OnboardingLayout
- Notable dependencies: None detected

### app/onboarding/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\onboarding\page.tsx`
- What it does: Renders /onboarding page.
- Key exports/functions/components: OnboardingPage
- Notable dependencies: `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/utils/contrastText`

### app/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\page.tsx`
- What it does: Renders / page.
- Key exports/functions/components: HomePage
- Notable dependencies: `next/link`

### app/poll/[sessionToken]/GroupPollClient.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\poll\[sessionToken]\GroupPollClient.tsx`
- What it does: App Router page/layout.
- Key exports/functions/components: GroupPollClient, GroupPollPlayer, GroupPollResponse, GroupPollSession
- Notable dependencies: `next/link`, `react`, `@/lib/supabase/client`

### app/poll/[sessionToken]/[playerToken]/[response]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\poll\[sessionToken]\[playerToken]\[response]\page.tsx`
- What it does: Renders /poll/[sessionToken]/[playerToken]/[response] page.
- Key exports/functions/components: generateMetadata
- Notable dependencies: `next`, `next/navigation`, `@/lib/supabase/service`

### app/poll/[sessionToken]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\poll\[sessionToken]\page.tsx`
- What it does: Renders /poll/[sessionToken] page.
- Key exports/functions/components: generateMetadata
- Notable dependencies: `next`, `@/app/poll/[sessionToken]/GroupPollClient`, `@/lib/supabase/server`

### components/NotificationPermission.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\NotificationPermission.tsx`
- What it does: Reusable NotificationPermission UI component.
- Key exports/functions/components: NotificationPermission
- Notable dependencies: `react`

### components/auth/SignOutButton.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\auth\SignOutButton.tsx`
- What it does: Reusable SignOutButton UI component.
- Key exports/functions/components: SignOutButton
- Notable dependencies: `next/navigation`, `react`, `@/lib/auth/signOut`

### components/dashboard/AddPlayerForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\AddPlayerForm.tsx`
- What it does: Reusable AddPlayerForm UI component.
- Key exports/functions/components: AddPlayerForm
- Notable dependencies: `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/utils/contrastText`

### components/dashboard/AddTeamForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\AddTeamForm.tsx`
- What it does: Reusable AddTeamForm UI component.
- Key exports/functions/components: AddTeamForm
- Notable dependencies: `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/utils/generateJoinCode`

### components/dashboard/ClubBrandingSettings.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ClubBrandingSettings.tsx`
- What it does: Reusable ClubBrandingSettings UI component.
- Key exports/functions/components: ClubBrandingSettings
- Notable dependencies: `react`, `@/lib/supabase/client`, `@/lib/utils/contrastText`

### components/dashboard/ClubFixturesPanel.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ClubFixturesPanel.tsx`
- What it does: Reusable ClubFixturesPanel UI component.
- Key exports/functions/components: ClubFixturesPanel
- Notable dependencies: `next/link`, `react`, `@/lib/dashboard/getClubData`

### components/dashboard/ClubHeader.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ClubHeader.tsx`
- What it does: Reusable ClubHeader UI component.
- Key exports/functions/components: ClubHeader
- Notable dependencies: `@/lib/dashboard/getClubData`

### components/dashboard/ClubJoinCodeSettings.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ClubJoinCodeSettings.tsx`
- What it does: Reusable ClubJoinCodeSettings UI component.
- Key exports/functions/components: ClubJoinCodeSettings
- Notable dependencies: `react`, `@/lib/supabase/client`

### components/dashboard/ClubTeamScroller.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ClubTeamScroller.tsx`
- What it does: Reusable ClubTeamScroller UI component.
- Key exports/functions/components: ClubTeamScroller
- Notable dependencies: `next/link`, `react`, `@/components/dashboard/CopyInviteButton`, `@/lib/dashboard/getClubData`

### components/dashboard/CoachComplianceForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachComplianceForm.tsx`
- What it does: Reusable CoachComplianceForm UI component.
- Key exports/functions/components: CoachComplianceForm
- Notable dependencies: `react`, `@/lib/supabase/client`

### components/dashboard/CoachCreateTeamForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachCreateTeamForm.tsx`
- What it does: Reusable CoachCreateTeamForm UI component.
- Key exports/functions/components: CoachCreateTeamForm
- Notable dependencies: `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/utils/generateJoinCode`, `@/lib/utils/contrastText`

### components/dashboard/CoachDashboardClient.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachDashboardClient.tsx`
- What it does: Reusable CoachDashboardClient UI component.
- Key exports/functions/components: CoachDashboardClient
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/dashboard/getCoachData`, `@/lib/utils/contrastText`

### components/dashboard/CoachInviteDrawer.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachInviteDrawer.tsx`
- What it does: Reusable CoachInviteDrawer UI component.
- Key exports/functions/components: CoachInviteDrawer
- Notable dependencies: `react`, `@/lib/supabase/client`, `@/lib/dashboard/getClubData`

### components/dashboard/CoachJoinTeamForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachJoinTeamForm.tsx`
- What it does: Reusable CoachJoinTeamForm UI component.
- Key exports/functions/components: CoachJoinTeamForm
- Notable dependencies: `react`, `@/lib/supabase/client`

### components/dashboard/CoachPotmSettingsForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachPotmSettingsForm.tsx`
- What it does: Reusable CoachPotmSettingsForm UI component.
- Key exports/functions/components: CoachPotmSettingsForm
- Notable dependencies: `react`, `@/lib/supabase/client`

### components/dashboard/CoachScheduleClient.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachScheduleClient.tsx`
- What it does: Reusable CoachScheduleClient UI component.
- Key exports/functions/components: CoachScheduleClient
- Notable dependencies: `next/link`, `react`, `@/lib/supabase/client`, `@/lib/dashboard/getCoachData`, `@/lib/utils/contrastText`

### components/dashboard/CoachSidebar.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachSidebar.tsx`
- What it does: Reusable CoachSidebar UI component.
- Key exports/functions/components: CoachSidebar
- Notable dependencies: `next/link`, `next/navigation`, `react`, `@/lib/auth/signOut`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/client`

### components/dashboard/CoachTeamBrandingSettings.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachTeamBrandingSettings.tsx`
- What it does: Reusable CoachTeamBrandingSettings UI component.
- Key exports/functions/components: CoachTeamBrandingSettings
- Notable dependencies: `react`, `@/lib/supabase/client`, `@/lib/utils/contrastText`

### components/dashboard/CopyInviteButton.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CopyInviteButton.tsx`
- What it does: Reusable CopyInviteButton UI component.
- Key exports/functions/components: CopyInviteButton
- Notable dependencies: `react`

### components/dashboard/CreateSessionForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CreateSessionForm.tsx`
- What it does: Reusable CreateSessionForm UI component.
- Key exports/functions/components: CreateSessionForm
- Notable dependencies: `react`, `next/navigation`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/client`, `@/lib/utils/contrastText`

### components/dashboard/FootballFamilySettings.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\FootballFamilySettings.tsx`
- What it does: Reusable FootballFamilySettings UI component.
- Key exports/functions/components: FootballFamilySettings, FamilySettingsPlayer
- Notable dependencies: `react`, `@/lib/supabase/client`, `@/lib/utils/contrastText`

### components/dashboard/GoalAwardSheet.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\GoalAwardSheet.tsx`
- What it does: Reusable GoalAwardSheet UI component.
- Key exports/functions/components: GoalAwardSheet, GoalAwardTrigger, GoalAwardSession
- Notable dependencies: `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/tools/starAwarder`, `@/lib/tools/starCategories`

### components/dashboard/ImportTeamForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ImportTeamForm.tsx`
- What it does: Reusable ImportTeamForm UI component.
- Key exports/functions/components: ImportTeamForm
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/utils/contrastText`

### components/dashboard/ParentAvailabilityButton.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ParentAvailabilityButton.tsx`
- What it does: Reusable ParentAvailabilityButton UI component.
- Key exports/functions/components: ParentAvailabilityButton
- Notable dependencies: `next/navigation`, `react`

### components/dashboard/ParentAvailabilityToggle.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ParentAvailabilityToggle.tsx`
- What it does: Reusable ParentAvailabilityToggle UI component.
- Key exports/functions/components: ParentAvailabilityToggle
- Notable dependencies: `react`

### components/dashboard/ParentFixturesClient.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ParentFixturesClient.tsx`
- What it does: Reusable ParentFixturesClient UI component.
- Key exports/functions/components: ParentFixturesClient
- Notable dependencies: `@/components/dashboard/ParentAvailabilityButton`, `react`, `@/lib/dashboard/getParentDashboardData`

### components/dashboard/ParentQuickSwitcher.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ParentQuickSwitcher.tsx`
- What it does: Reusable ParentQuickSwitcher UI component.
- Key exports/functions/components: ParentQuickSwitcher, ParentQuickSwitchOption
- Notable dependencies: `next/link`, `react`

### components/dashboard/PendingCoachJoinRequests.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\PendingCoachJoinRequests.tsx`
- What it does: Reusable PendingCoachJoinRequests UI component.
- Key exports/functions/components: PendingCoachJoinRequests, PendingCoachJoinRequest
- Notable dependencies: `react`, `next/navigation`, `@/lib/utils/contrastText`

### components/dashboard/PendingJoinRequests.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\PendingJoinRequests.tsx`
- What it does: Reusable PendingJoinRequests UI component.
- Key exports/functions/components: PendingJoinRequests
- Notable dependencies: `react`, `@/lib/supabase/client`, `@/lib/dashboard/getCoachDashboardData`

### components/dashboard/PlayerAccessTree.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\PlayerAccessTree.tsx`
- What it does: Reusable PlayerAccessTree UI component.
- Key exports/functions/components: PlayerAccessTree, PlayerAccessTreeProps
- Notable dependencies: None detected

### components/dashboard/PlayerInviteButton.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\PlayerInviteButton.tsx`
- What it does: Reusable PlayerInviteButton UI component.
- Key exports/functions/components: PlayerInviteButton
- Notable dependencies: `react`

### components/dashboard/PlayerJoinTeamForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\PlayerJoinTeamForm.tsx`
- What it does: Reusable PlayerJoinTeamForm UI component.
- Key exports/functions/components: PlayerJoinTeamForm
- Notable dependencies: `react`, `next/navigation`, `@/lib/supabase/client`

### components/dashboard/PlayerSubscriptionsClient.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\PlayerSubscriptionsClient.tsx`
- What it does: Reusable PlayerSubscriptionsClient UI component.
- Key exports/functions/components: PlayerSubscriptionsClient, SubscriptionPlayerRow
- Notable dependencies: `react`, `@/lib/supabase/client`

### components/dashboard/SessionDetailClient.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\SessionDetailClient.tsx`
- What it does: Reusable SessionDetailClient UI component.
- Key exports/functions/components: SessionDetailClient, SessionDetailPlayer, SessionDetailResponse, SessionDetailData
- Notable dependencies: `react`, `next/link`, `@/lib/supabase/client`

### components/dashboard/SettingsPage.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\SettingsPage.tsx`
- What it does: Reusable SettingsPage UI component.
- Key exports/functions/components: SettingsPage
- Notable dependencies: `next/link`, `react`, `@/components/auth/SignOutButton`, `@/lib/supabase/client`, `@/lib/utils/contrastText`

### components/dashboard/SettingsShell.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\SettingsShell.tsx`
- What it does: Reusable SettingsShell UI component.
- Key exports/functions/components: SettingsShell
- Notable dependencies: `@/components/auth/SignOutButton`

### components/dashboard/Sidebar.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\Sidebar.tsx`
- What it does: Reusable Sidebar UI component.
- Key exports/functions/components: Sidebar
- Notable dependencies: `next/link`, `next/navigation`, `react`, `@/lib/auth/signOut`, `@/lib/dashboard/getClubData`, `@/lib/supabase/client`

### components/dashboard/TicketStatusActions.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\TicketStatusActions.tsx`
- What it does: Reusable TicketStatusActions UI component.
- Key exports/functions/components: TicketStatusActions
- Notable dependencies: `react`, `@/lib/supabase/client`, `@/lib/tools/ticketTypes`

### components/fixtures/CSVImporter.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\fixtures\CSVImporter.tsx`
- What it does: Reusable CSVImporter UI component.
- Key exports/functions/components: CSVImporter, ImportTeamOption
- Notable dependencies: `react`, `@/lib/supabase/client`

### components/fixtures/FixtureImportWizard.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\fixtures\FixtureImportWizard.tsx`
- What it does: Reusable FixtureImportWizard UI component.
- Key exports/functions/components: FixtureImportWizard
- Notable dependencies: `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/utils/contrastText`

### components/mobile/BottomNav.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\mobile\BottomNav.tsx`
- What it does: Reusable BottomNav UI component.
- Key exports/functions/components: BottomNav
- Notable dependencies: `next/link`, `next/navigation`

### components/navigation/mobile-bottom-nav.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\navigation\mobile-bottom-nav.tsx`
- What it does: Reusable mobile-bottom-nav UI component.
- Key exports/functions/components: MobileBottomNav
- Notable dependencies: `next/link`, `next/navigation`

### components/navigation/mobile-role-header.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\navigation\mobile-role-header.tsx`
- What it does: Reusable mobile-role-header UI component.
- Key exports/functions/components: MobileRoleHeader
- Notable dependencies: `next/link`, `next/navigation`, `react`, `@/lib/auth/signOut`

### lib/auth/acceptFamilyInvite.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\auth\acceptFamilyInvite.ts`
- What it does: Completes auth, invite, or sign-out workflow logic.
- Key exports/functions/components: acceptFamilyInvite, FamilyInviteMode
- Notable dependencies: `@/lib/supabase/service`

### lib/auth/completeCoParentInvite.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\auth\completeCoParentInvite.ts`
- What it does: Completes auth, invite, or sign-out workflow logic.
- Key exports/functions/components: completeCoParentInvite
- Notable dependencies: `@supabase/supabase-js`, `@/lib/auth/acceptFamilyInvite`

### lib/auth/completeFamilyInvite.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\auth\completeFamilyInvite.ts`
- What it does: Completes auth, invite, or sign-out workflow logic.
- Key exports/functions/components: completeFamilyInvite
- Notable dependencies: `@supabase/supabase-js`, `@/lib/auth/acceptFamilyInvite`

### lib/auth/completeInvite.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\auth\completeInvite.ts`
- What it does: Completes auth, invite, or sign-out workflow logic.
- Key exports/functions/components: completePendingInvite, readInviteMetadata
- Notable dependencies: `@supabase/supabase-js`

### lib/auth/completePlayerInvite.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\auth\completePlayerInvite.ts`
- What it does: Completes auth, invite, or sign-out workflow logic.
- Key exports/functions/components: completePlayerInvite
- Notable dependencies: `@supabase/supabase-js`

### lib/auth/signOut.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\auth\signOut.ts`
- What it does: Completes auth, invite, or sign-out workflow logic.
- Key exports/functions/components: signOut
- Notable dependencies: `@/lib/supabase/client`

### lib/dashboard/getClubData.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\dashboard\getClubData.ts`
- What it does: Fetches and shapes dashboard data from Supabase.
- Key exports/functions/components: getClubData, ClubRecord, TeamRecord, TeamPlayerSummary, PendingCoachInvite, FixtureRecord, ClubDashboardData
- Notable dependencies: `@/lib/supabase/server`, `@/lib/utils/teamBranding`

### lib/dashboard/getCoachDashboardData.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\dashboard\getCoachDashboardData.ts`
- What it does: Fetches and shapes dashboard data from Supabase.
- Key exports/functions/components: getCoachDashboardData, CoachTeamRecord, CoachPlayerRecord, CoachDashboardData, PendingJoinRequestRecord
- Notable dependencies: `@/lib/supabase/server`, `@/lib/dashboard/getClubData`

### lib/dashboard/getCoachData.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\dashboard\getCoachData.ts`
- What it does: Fetches and shapes dashboard data from Supabase.
- Key exports/functions/components: getCoachData, CoachDashboardData
- Notable dependencies: `@/lib/supabase/server`, `@/lib/utils/teamBranding`

### lib/dashboard/getFamilyDashboardData.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\dashboard\getFamilyDashboardData.ts`
- What it does: Fetches and shapes dashboard data from Supabase.
- Key exports/functions/components: getFamilyDashboardData, FamilySession, FamilyMilestone, FamilyPlayer, FamilyDashboardData
- Notable dependencies: `@/lib/supabase/server`, `@/lib/utils/teamBranding`

### lib/dashboard/getParentDashboardData.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\dashboard\getParentDashboardData.ts`
- What it does: Fetches and shapes dashboard data from Supabase.
- Key exports/functions/components: getParentDashboardData, ParentAvailabilityStatus, ParentSession, ParentPlayerTeam, ParentPlayer, ParentDashboardData
- Notable dependencies: `@/lib/supabase/server`, `@/lib/utils/teamBranding`

### lib/dashboard/getSettingsProfile.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\dashboard\getSettingsProfile.ts`
- What it does: Fetches and shapes dashboard data from Supabase.
- Key exports/functions/components: getSettingsProfile, SettingsProfile, SettingsProfileData
- Notable dependencies: `@supabase/supabase-js`, `@/lib/supabase/server`

### lib/supabase/client.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\supabase\client.ts`
- What it does: Creates or supports Supabase clients/storage access.
- Key exports/functions/components: createClient
- Notable dependencies: `@supabase/ssr`

### lib/supabase/server.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\supabase\server.ts`
- What it does: Creates or supports Supabase clients/storage access.
- Key exports/functions/components: createClient
- Notable dependencies: `@supabase/ssr`, `next/headers`

### lib/supabase/service.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\supabase\service.ts`
- What it does: Creates or supports Supabase clients/storage access.
- Key exports/functions/components: createServiceClient
- Notable dependencies: `@supabase/supabase-js`

### lib/supabase/storage.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\supabase\storage.ts`
- What it does: Creates or supports Supabase clients/storage access.
- Key exports/functions/components: uploadClubBadge
- Notable dependencies: `@/lib/supabase/client`

### lib/tools/playtimeCalculator.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\tools\playtimeCalculator.ts`
- What it does: Domain logic for SHIFT OS tools.
- Key exports/functions/components: roundToTwo, formatMinutes, getPitchPlaces, getOutfieldPlaces, calculatePlaytime, GameFormat, GamePeriods, GoalkeeperRule, CalculationMode, Player, PlaytimeInput, SubstitutionEvent, PlayerTimeAllocation, PlaytimeResult
- Notable dependencies: None detected

### lib/tools/potmCalculator.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\tools\potmCalculator.ts`
- What it does: Domain logic for SHIFT OS tools.
- Key exports/functions/components: calculatePotmWinner, resolvePotmMessage, PotmVote, PotmWinnerResult, ClubPotmSettings, CoachPotmSettings
- Notable dependencies: None detected

### lib/tools/starAwarder.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\tools\starAwarder.ts`
- What it does: Domain logic for SHIFT OS tools.
- Key exports/functions/components: awardStars
- Notable dependencies: `@supabase/supabase-js`, `@/lib/tools/starCategories`

### lib/tools/starCategories.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\tools\starCategories.ts`
- What it does: Domain logic for SHIFT OS tools.
- Key exports/functions/components: getCurrentSeason, isPreSeason, isOffSeason, getCategoryMeta, nextMilestone, STAR_CATEGORIES, MILESTONES, StarCategory, ParentStarCategory, MilestoneId
- Notable dependencies: None detected

### lib/tools/ticketTypes.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\tools\ticketTypes.ts`
- What it does: Domain logic for SHIFT OS tools.
- Key exports/functions/components: findParentTicketType, findCoachTicketType, getTicketSeason, PARENT_TICKET_TYPES, COACH_TICKET_TYPES, ParentTicketTypeId, CoachTicketTypeId, TicketAudience, TicketOutcome, TicketPriority, TicketStatus, TicketTypeDefinition
- Notable dependencies: None detected

### lib/utils/contrastText.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\utils\contrastText.ts`
- What it does: Shared utility logic.
- Key exports/functions/components: contrastText
- Notable dependencies: None detected

### lib/utils/generateJoinCode.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\utils\generateJoinCode.ts`
- What it does: Shared utility logic.
- Key exports/functions/components: generateJoinCode
- Notable dependencies: None detected

### lib/utils/teamBranding.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\utils\teamBranding.ts`
- What it does: Shared utility logic.
- Key exports/functions/components: resolveTeamBranding, TeamBrandingInput, TeamBranding
- Notable dependencies: None detected

### middleware.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\middleware.ts`
- What it does: Routes authenticated users to the correct dashboard and leaves public/API routes open.
- Key exports/functions/components: middleware, config
- Notable dependencies: `@supabase/ssr`, `next/server`

### next-env.d.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\next-env.d.ts`
- What it does: project file.
- Key exports/functions/components: None detected
- Notable dependencies: None detected

### next.config.mjs
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\next.config.mjs`
- What it does: project config.
- Key exports/functions/components: None detected
- Notable dependencies: None detected

### package-lock.json
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\package-lock.json`
- What it does: project file.
- Key exports/functions/components: None detected
- Notable dependencies: None detected

### package.json
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\package.json`
- What it does: NPM package metadata and scripts.
- Key exports/functions/components: None detected
- Notable dependencies: None detected

### postcss.config.js
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\postcss.config.js`
- What it does: project config.
- Key exports/functions/components: None detected
- Notable dependencies: None detected

### public/manifest.json
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\public\manifest.json`
- What it does: PWA manifest.
- Key exports/functions/components: None detected
- Notable dependencies: None detected

### public/sw.js
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\public\sw.js`
- What it does: Service worker for push notifications.
- Key exports/functions/components: None detected
- Notable dependencies: None detected

### tailwind.config.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\tailwind.config.ts`
- What it does: project config.
- Key exports/functions/components: None detected
- Notable dependencies: `tailwindcss`

### tsconfig.json
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\tsconfig.json`
- What it does: project config.
- Key exports/functions/components: None detected
- Notable dependencies: None detected

### vercel.json
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\vercel.json`
- What it does: Vercel deployment configuration.
- Key exports/functions/components: None detected
- Notable dependencies: None detected

## Existing Migration Files

These are present in the repo and were not touched by this map refresh.

- `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\supabase\migrations\202605080001_create_admin_user.sql`
- `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\supabase\migrations\202605080002_users_profile_rls.sql`
- `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\supabase\migrations\202605080003_clubs_badge_positioning.sql`
- `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\supabase\migrations\202605080004_fix_rls_policies.sql`
- `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\supabase\migrations\202605080005_force_fix_storage_rls.sql`

## API Routes

- `/api/calendar/[token]` (GET) — Handles /api/calendar/[token] requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\calendar\[token]\route.ts`
- `/api/clubs/import-team` (GET, POST) — Handles /api/clubs/import-team requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\clubs\import-team\route.ts`
- `/api/clubs/join-request` (GET, POST) — Handles /api/clubs/join-request requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\clubs\join-request\route.ts`
- `/api/compliance-reminders` (GET) — Handles /api/compliance-reminders requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\compliance-reminders\route.ts`
- `/api/fixtures/extract-from-image` (POST) — Handles /api/fixtures/extract-from-image requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\fixtures\extract-from-image\route.ts`
- `/api/fixtures/fetch-from-fulltime` (POST) — Handles /api/fixtures/fetch-from-fulltime requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\fixtures\fetch-from-fulltime\route.ts`
- `/api/icons/[size]` (GET) — Handles /api/icons/[size] requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\icons\[size]\route.tsx`
- `/api/invites/family/accept` (POST) — Handles /api/invites/family/accept requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\invites\family\accept\route.ts`
- `/api/notify` (POST) — Handles /api/notify requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\notify\route.ts`
- `/api/players/invite` (POST) — Handles /api/players/invite requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\players\invite\route.ts`
- `/api/potm-card` (POST) — Handles /api/potm-card requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\potm-card\route.ts`
- `/api/potm-close` (POST) — Handles /api/potm-close requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\potm-close\route.ts`
- `/api/potm-cron` (GET) — Handles /api/potm-cron requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\potm-cron\route.ts`
- `/api/push-subscription` (POST) — Handles /api/push-subscription requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\push-subscription\route.ts`
- `/api/stars-season-reset` (GET) — Handles /api/stars-season-reset requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\stars-season-reset\route.ts`
- `/api/stars-season-start` (GET) — Handles /api/stars-season-start requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\stars-season-start\route.ts`
- `/api/update-availability` (POST) — Handles /api/update-availability requests. File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\update-availability\route.ts`

## Database Tables And Observed Columns

Columns are generated from SQL/migration definitions and application queries/inserts/updates. Supabase auth tables are noted where referenced.

### club_join_requests
- Observed columns: `club_id`, `coach_user_id`, `id`, `status`, `team_id`

### club_members
- Observed columns: `allow_team_badges`, `allow_team_colours`, `badge_url`, `club_id`, `club_role`, `clubs`, `coach_join_code`, `ethos`, `id`, `name`, `primary_colour`, `secondary_colour`, `user_id`

### club-assets
- Observed columns: Referenced, but no columns inferred from current source.

### clubs
- Observed columns: `allow_team_badges`, `allow_team_colours`, `badge_scale`, `badge_url`, `club_message`, `coach_join_code`, `coach_vote_enabled`, `ethos`, `id`, `message_mode`, `name`, `p2p_vote_age_group`, `plan_tier`, `primary_colour`, `secondary_colour`

### coach_dbs
- Observed columns: `certificate_number`, `certificate_url`, `dbs_type`, `expiry_date`, `issue_date`, `user_id`

### coach_qualifications
- Observed columns: `achieved_date`, `certificate_url`, `expiry_date`, `id`, `issuing_body`, `qualification_name`, `user_id`

### coach_recognition_settings
- Observed columns: `bronze_reward`, `bronze_threshold`, `gold_reward`, `gold_threshold`, `silver_reward`, `silver_threshold`

### coach_recognition_totals
- Observed columns: `coach_user_id`, `current_tier`, `id`, `positive_ticket_count`

### coach-documents
- Observed columns: Referenced, but no columns inferred from current source.

### compliance_notifications
- Observed columns: `id`

### feature_toggles
- Observed columns: `feature_key`, `is_enabled`

### fixtures
- Observed columns: `fixture_date`, `home_away`, `id`, `opponent`, `team_name`

### football_family
- Observed columns: `family_user_id`, `id`, `player_id`, `relationship`, `status`

### football_family_invites
- Observed columns: `expires_at`, `id`, `invite_token`, `invited_by`, `invitee_name`, `player_id`, `relationship`, `status`

### match_stats
- Observed columns: `attendance_count`, `notes`, `potm_player_id`, `score_against`, `score_for`, `session_id`

### pending_invites
- Observed columns: `club_id`, `expires_at`, `id`, `invite_token`, `invitee_email`, `is_lead`, `player_id`, `role`, `status`, `team_id`

### pending_join_requests
- Observed columns: `created_at`, `dob`, `full_name`, `id`, `parent_contact`, `parent_name`, `team_id`

### player_milestone_achievements
- Observed columns: `achieved_at`, `milestone_id`, `opponent`, `session_date`

### player_star_goals
- Observed columns: `category`

### player_star_totals
- Observed columns: `achieved_at`, `attitude_stars`, `bravery_stars`, `effort_stars`, `enjoyment_stars`, `id`, `milestone_celebration_pending`, `milestone_id`, `milestones_reached`, `opponent`, `parent_stars`, `player_id`, `potm_stars`, `season`, `session_date`, `special_stars`, `teamwork_stars`, `title`, `total_stars`, `type`

### player_stars
- Observed columns: `awarded_at`, `category`, `id`, `session_id`, `stars_awarded`

### player_subscriptions
- Observed columns: `contacted_at`, `player_id`

### player_suspensions
- Observed columns: `player_id`

### players
- Observed columns: `age_group`, `badge_url`, `clubs`, `co_parent_user_id`, `date_of_birth`, `dob`, `fa_fan_added_by`, `fa_fan_number`, `fa_fan_verified`, `first_name`, `full_name`, `id`, `invite_status`, `invite_token`, `is_active`, `last_name`, `location`, `opponent`, `parent_user_id`, `session_date`, `team_id`, `teams`, `title`, `type`

### playtime_calculations
- Observed columns: `created_at`, `fair_share_minutes`, `format`, `id`, `periods`, `result_json`, `session_id`, `total_minutes`

### poll_responses
- Observed columns: `badge_url`, `club_id`, `clubs`, `id`, `location`, `note`, `opponent`, `player_id`, `player_token`, `players`, `responded_at`, `session_date`, `session_id`, `sessions`, `status`, `teams`, `title`, `type`, `voted_for_player_id`

### potm_coach_settings
- Observed columns: `coach_message`, `first_access_complete`

### potm_polls
- Observed columns: `coach_message_used`, `created_by`, `id`, `session_id`, `social_card_url`, `status`, `team_id`, `total_votes`, `winner_player_id`

### potm_settings
- Observed columns: `club_message`, `coach_vote_enabled`, `message_mode`

### potm_stats
- Observed columns: `id`, `last_session_id`, `last_won_at`, `player_id`, `potm_count`

### potm_votes
- Observed columns: `vote_weight`, `voted_for_player_id`

### potm-cards
- Observed columns: Referenced, but no columns inferred from current source.

### push_subscriptions
- Observed columns: `auth`, `endpoint`, `p256dh`

### sessions
- Observed columns: `club_id`, `coach_notes`, `first_name`, `full_address`, `id`, `is_home`, `last_name`, `location`, `name`, `opponent`, `opposition_contact_name`, `opposition_contact_phone`, `poll_sent`, `poll_sent_at`, `postcode`, `session_date`, `session_token`, `team_id`, `title`, `tournify_link`, `type`

### subscription_contact_log
- Observed columns: Referenced, but no columns inferred from current source.

### team_coaches
- Observed columns: `expires_at`, `id`, `invite_token`, `invitee_email`, `invitee_name`, `team_id`, `user_id`, `users_profile`

### teams
- Observed columns: `age_group`, `allow_team_badges`, `allow_team_colours`, `amount_due`, `badge_url`, `club_id`, `club_import_status`, `club_import_token`, `clubs`, `due_date`, `first_name`, `gender`, `id`, `is_active`, `join_code`, `last_name`, `league`, `name`, `player_id`, `poll_closes_at`, `poll_opens_at`, `primary_colour`, `season`, `secondary_colour`, `session_id`, `social_card_url`, `status`, `team_id`, `total_votes`, `winner_player_id`

### ticket_events
- Observed columns: Referenced, but no columns inferred from current source.

### tickets
- Observed columns: `created_at`, `id`, `is_positive`, `is_safeguarding`, `message`, `outcome_type`, `priority`, `raised_by`, `raiser_role`, `status`, `team_id`, `teams`, `ticket_ref`, `ticket_type`, `was_duplicate`

### tool_usage
- Observed columns: `created_at`

### users_profile
- Observed columns: `achieved_date`, `calendar_include_pending`, `calendar_include_tournaments`, `calendar_include_training`, `certificate_url`, `co_parent_user_id`, `dob`, `email`, `expiry_date`, `fa_fan_number`, `fa_fan_verified`, `first_name`, `full_name`, `id`, `intended_role`, `invite_token`, `is_active`, `is_lead`, `issuing_body`, `last_name`, `parent_user_id`, `qualification_name`, `system_role`, `team_id`, `user_id`

### auth.users
- Observed columns: Supabase managed auth user table; referenced by application tables through user id foreign keys and auth session APIs.

## Supabase Storage Buckets

- `club-assets`
- `coach-documents`
- `potm-cards`

## Environment Variables Used

- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

## Cron Endpoints And Schedules

- No active Vercel cron schedules in `vercel.json` (current file is `{"version":2}`).
- Cron-capable endpoints still exist: `/api/compliance-reminders`, `/api/potm-cron`, `/api/stars-season-reset`, `/api/stars-season-start`.

## NPM Packages

### Dependencies
- `@anthropic-ai/sdk`: `^0.95.2`
- `@supabase/ssr`: `^0.5.2`
- `@supabase/supabase-js`: `^2.49.8`
- `cheerio`: `^1.2.0`
- `next`: `14.2.33`
- `react`: `18.3.1`
- `react-dom`: `18.3.1`
- `web-push`: `^3.6.7`

### Dev Dependencies
- `@types/node`: `^20`
- `@types/react`: `^18`
- `@types/react-dom`: `^18`
- `@types/web-push`: `^3.6.4`
- `autoprefixer`: `^10.4.20`
- `eslint`: `^8`
- `eslint-config-next`: `14.2.33`
- `postcss`: `^8.4.47`
- `tailwindcss`: `^3.4.14`
- `typescript`: `^5`

## Scripts

- `dev`: `next dev`
- `build`: `node --max-old-space-size=8192 ./node_modules/next/dist/bin/next build`
- `start`: `next start`
- `lint`: `next lint`

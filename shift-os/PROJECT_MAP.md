# Shift OS Project Map

Generated: 2026-05-11T10:43:24.935Z

Project root: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os`

## File Inventory

### .eslintrc.json
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\.eslintrc.json`
- Does: ESLint configuration using Next.js rules.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### .gitignore
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\.gitignore`
- Does: Git ignore patterns for generated files and secrets.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### app/api/compliance-reminders/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\compliance-reminders\route.ts`
- Does: API route handler for /api/compliance-reminders.
- Key exports/functions/components: `GET`, `dynamic`
- Notable dependencies: `next/server`, `web-push`, `@/lib/supabase/service`

### app/api/icons/[size]/route.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\icons\[size]\route.tsx`
- Does: API route handler for /api/icons/[size].
- Key exports/functions/components: `GET`
- Notable dependencies: `next/og`, `next/server`

### app/api/notify/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\notify\route.ts`
- Does: API route handler for /api/notify.
- Key exports/functions/components: `POST`
- Notable dependencies: `next/server`, `web-push`, `@/lib/supabase/service`

### app/api/potm-card/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\potm-card\route.ts`
- Does: API route handler for /api/potm-card.
- Key exports/functions/components: `POST`
- Notable dependencies: `react`, `next/og`, `next/server`, `@/lib/supabase/service`

### app/api/potm-close/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\potm-close\route.ts`
- Does: API route handler for /api/potm-close.
- Key exports/functions/components: `POST`
- Notable dependencies: `next/server`, `@/lib/supabase/service`, `@/lib/tools/potmCalculator`, `@/lib/tools/starAwarder`

### app/api/potm-cron/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\potm-cron\route.ts`
- Does: API route handler for /api/potm-cron.
- Key exports/functions/components: `GET`
- Notable dependencies: `next/server`

### app/api/push-subscription/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\push-subscription\route.ts`
- Does: API route handler for /api/push-subscription.
- Key exports/functions/components: `POST`
- Notable dependencies: `next/server`, `@/lib/supabase/server`

### app/api/stars-season-reset/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\stars-season-reset\route.ts`
- Does: API route handler for /api/stars-season-reset.
- Key exports/functions/components: `GET`
- Notable dependencies: `next/server`

### app/api/stars-season-start/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\stars-season-start\route.ts`
- Does: API route handler for /api/stars-season-start.
- Key exports/functions/components: `GET`
- Notable dependencies: `next/server`

### app/auth/callback/route.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\auth\callback\route.ts`
- Does: API route handler for /app/auth/callback.
- Key exports/functions/components: `GET`
- Notable dependencies: `next/server`, `@/lib/auth/completeInvite`, `@/lib/supabase/server`

### app/auth/login/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\auth\login\page.tsx`
- Does: App Router page for auth / login.
- Key exports/functions/components: `LoginPage`, `LoginForm`
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`

### app/auth/signup/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\auth\signup\page.tsx`
- Does: App Router page for auth / signup.
- Key exports/functions/components: `SignupPage`, `SignupForm`
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/auth/completeInvite`, `@/lib/supabase/client`

### app/dashboard/club/coaches/[coachId]/compliance/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\coaches\[coachId]\compliance\page.tsx`
- Does: App Router page for dashboard / club / coaches / [coachId] / compliance.
- Key exports/functions/components: `CoachComplianceReadOnlyPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/compliance/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\compliance\page.tsx`
- Does: App Router page for dashboard / club / compliance.
- Key exports/functions/components: `ClubCompliancePage`
- Notable dependencies: `next/link`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/fixtures/import/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\fixtures\import\page.tsx`
- Does: App Router page for dashboard / club / fixtures / import.
- Key exports/functions/components: `ClubFixtureImportPage`
- Notable dependencies: `@/components/fixtures/CSVImporter`, `@/lib/dashboard/getClubData`

### app/dashboard/club/fixtures/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\fixtures\page.tsx`
- Does: App Router page for dashboard / club / fixtures.
- Key exports/functions/components: `ClubFixturesPage`
- Notable dependencies: `@/lib/dashboard/getClubData`

### app/dashboard/club/layout.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\layout.tsx`
- Does: Route layout for dashboard / club / layout.tsx.
- Key exports/functions/components: `ClubDashboardLayout`
- Notable dependencies: `react`, `next/navigation`, `@/components/dashboard/Sidebar`, `@/components/dashboard/ClubHeader`, `@/lib/dashboard/getClubData`

### app/dashboard/club/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\page.tsx`
- Does: App Router page for dashboard / club.
- Key exports/functions/components: `ClubDashboardHomePage`
- Notable dependencies: `next/link`, `@/components/dashboard/ClubFixturesPanel`, `@/components/dashboard/ClubTeamScroller`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/players/subscriptions/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\players\subscriptions\page.tsx`
- Does: App Router page for dashboard / club / players / subscriptions.
- Key exports/functions/components: `PlayerSubscriptionsPage`
- Notable dependencies: `@/components/dashboard/PlayerSubscriptionsClient`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/settings/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\settings\page.tsx`
- Does: App Router page for dashboard / club / settings.
- Key exports/functions/components: `ClubSettingsPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/components/auth/SignOutButton`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/settings/potm/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\settings\potm\page.tsx`
- Does: App Router page for dashboard / club / settings / potm.
- Key exports/functions/components: `ClubPotmSettingsPage`
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`

### app/dashboard/club/settings/recognition/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\settings\recognition\page.tsx`
- Does: App Router page for dashboard / club / settings / recognition.
- Key exports/functions/components: `RecognitionSettingsPage`
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`

### app/dashboard/club/teams/[teamId]/coach-view/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\teams\[teamId]\coach-view\page.tsx`
- Does: App Router page for dashboard / club / teams / [teamId] / coach-view.
- Key exports/functions/components: `TeamCoachViewPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/CopyInviteButton`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/teams/[teamId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\teams\[teamId]\page.tsx`
- Does: App Router page for dashboard / club / teams / [teamId].
- Key exports/functions/components: `TicketPlaceholder`, `TeamInfoPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/CopyInviteButton`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/teams/[teamId]/players/new/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\teams\[teamId]\players\new\page.tsx`
- Does: App Router page for dashboard / club / teams / [teamId] / players / new.
- Key exports/functions/components: `NewTeamPlayerPlaceholder`
- Notable dependencies: `next/link`

### app/dashboard/club/teams/[teamId]/success/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\teams\[teamId]\success\page.tsx`
- Does: App Router page for dashboard / club / teams / [teamId] / success.
- Key exports/functions/components: `TeamCreatedSuccessPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/CopyInviteButton`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/teams/new/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\teams\new\page.tsx`
- Does: App Router page for dashboard / club / teams / new.
- Key exports/functions/components: `NewTeamPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/AddTeamForm`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`

### app/dashboard/club/teams/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\teams\page.tsx`
- Does: App Router page for dashboard / club / teams.
- Key exports/functions/components: `ClubTeamsPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/CoachInviteDrawer`, `@/components/dashboard/CopyInviteButton`, `@/lib/dashboard/getClubData`

### app/dashboard/club/tickets/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\tickets\page.tsx`
- Does: App Router page for dashboard / club / tickets.
- Key exports/functions/components: `TicketCard`, `ClubTicketsPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/TicketStatusActions`, `@/lib/dashboard/getClubData`, `@/lib/supabase/server`, `@/lib/tools/ticketTypes`

### app/dashboard/club/tools/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\club\tools\page.tsx`
- Does: App Router page for dashboard / club / tools.
- Key exports/functions/components: `ClubToolsPage`
- Notable dependencies: `@/lib/dashboard/getClubData`

### app/dashboard/coach/fixtures/import/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\fixtures\import\page.tsx`
- Does: App Router page for dashboard / coach / fixtures / import.
- Key exports/functions/components: `CoachFixtureImportPage`
- Notable dependencies: `next/navigation`, `@/components/fixtures/CSVImporter`, `@/components/mobile/BottomNav`, `@/lib/dashboard/getCoachData`

### app/dashboard/coach/layout.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\layout.tsx`
- Does: Route layout for dashboard / coach / layout.tsx.
- Key exports/functions/components: `CoachLayout`
- Notable dependencies: `react`, `next/navigation`, `@/components/dashboard/CoachSidebar`, `@/components/NotificationPermission`, `@/lib/dashboard/getCoachData`

### app/dashboard/coach/messages/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\messages\page.tsx`
- Does: App Router page for dashboard / coach / messages.
- Key exports/functions/components: `CoachMessagesPage`
- Notable dependencies: None detected.

### app/dashboard/coach/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\page.tsx`
- Does: App Router page for dashboard / coach.
- Key exports/functions/components: `CoachDashboardPage`
- Notable dependencies: `next/navigation`, `@/components/dashboard/CoachDashboardClient`, `@/lib/dashboard/getCoachData`

### app/dashboard/coach/past-fixtures/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\past-fixtures\page.tsx`
- Does: App Router page for dashboard / coach / past-fixtures.
- Key exports/functions/components: `CoachPastFixturesPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/server`

### app/dashboard/coach/players/[playerId]/success/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\players\[playerId]\success\page.tsx`
- Does: App Router page for dashboard / coach / players / [playerId] / success.
- Key exports/functions/components: `PlayerSuccessPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/CopyInviteButton`, `@/lib/dashboard/getCoachDashboardData`, `@/lib/supabase/server`

### app/dashboard/coach/players/new/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\players\new\page.tsx`
- Does: App Router page for dashboard / coach / players / new.
- Key exports/functions/components: `NewPlayerPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/AddPlayerForm`, `@/lib/dashboard/getCoachDashboardData`, `@/lib/supabase/server`

### app/dashboard/coach/profile/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\profile\page.tsx`
- Does: App Router page for dashboard / coach / profile.
- Key exports/functions/components: `CoachProfilePage`
- Notable dependencies: `next/navigation`, `@/components/dashboard/CoachComplianceForm`, `@/components/mobile/BottomNav`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/server`

### app/dashboard/coach/schedule/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\schedule\page.tsx`
- Does: App Router page for dashboard / coach / schedule.
- Key exports/functions/components: `CoachSchedulePage`
- Notable dependencies: `next/navigation`, `@/components/dashboard/CoachScheduleClient`, `@/lib/dashboard/getCoachData`

### app/dashboard/coach/sessions/[sessionId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\sessions\[sessionId]\page.tsx`
- Does: App Router page for dashboard / coach / sessions / [sessionId].
- Key exports/functions/components: `CoachSessionPage`
- Notable dependencies: `next/navigation`, `@/components/dashboard/SessionDetailClient`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/server`

### app/dashboard/coach/sessions/[sessionId]/past/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\sessions\[sessionId]\past\page.tsx`
- Does: App Router page for dashboard / coach / sessions / [sessionId] / past.
- Key exports/functions/components: `CoachPastSessionPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/server`, `@/lib/tools/playtimeCalculator`

### app/dashboard/coach/sessions/[sessionId]/playtime/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\sessions\[sessionId]\playtime\page.tsx`
- Does: App Router page for dashboard / coach / sessions / [sessionId] / playtime.
- Key exports/functions/components: `PlaytimeCalculatorPage`
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/tools/playtimeCalculator`

### app/dashboard/coach/sessions/[sessionId]/playtime/result/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\sessions\[sessionId]\playtime\result\page.tsx`
- Does: App Router page for dashboard / coach / sessions / [sessionId] / playtime / result.
- Key exports/functions/components: `PlaytimeResultPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/server`, `@/lib/tools/playtimeCalculator`

### app/dashboard/coach/sessions/[sessionId]/potm/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\sessions\[sessionId]\potm\page.tsx`
- Does: App Router page for dashboard / coach / sessions / [sessionId] / potm.
- Key exports/functions/components: `SessionPotmPage`
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`

### app/dashboard/coach/sessions/new/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\sessions\new\page.tsx`
- Does: App Router page for dashboard / coach / sessions / new.
- Key exports/functions/components: `NewSessionPage`
- Notable dependencies: `next/navigation`, `@/components/dashboard/CreateSessionForm`, `@/lib/dashboard/getCoachData`

### app/dashboard/coach/settings/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\settings\page.tsx`
- Does: App Router page for dashboard / coach / settings.
- Key exports/functions/components: `CoachSettingsPage`
- Notable dependencies: `next/navigation`, `@/components/auth/SignOutButton`, `@/components/dashboard/CoachPotmSettingsForm`, `@/lib/dashboard/getCoachData`

### app/dashboard/coach/stats/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\stats\page.tsx`
- Does: App Router page for dashboard / coach / stats.
- Key exports/functions/components: `CoachStatsPage`
- Notable dependencies: None detected.

### app/dashboard/coach/teams/new/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\teams\new\page.tsx`
- Does: App Router page for dashboard / coach / teams / new.
- Key exports/functions/components: `CoachNewTeamPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/CoachCreateTeamForm`, `@/lib/supabase/server`

### app/dashboard/coach/tickets/new/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\tickets\new\page.tsx`
- Does: App Router page for dashboard / coach / tickets / new.
- Key exports/functions/components: `NewCoachTicketPage`
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/tools/ticketTypes`

### app/dashboard/coach/tickets/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\tickets\page.tsx`
- Does: App Router page for dashboard / coach / tickets.
- Key exports/functions/components: `TicketCard`, `CoachTicketsPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/TicketStatusActions`, `@/components/mobile/BottomNav`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/server`, `@/lib/tools/ticketTypes`

### app/dashboard/coach/tools/potm/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\tools\potm\page.tsx`
- Does: App Router page for dashboard / coach / tools / potm.
- Key exports/functions/components: `CoachPotmHomePage`
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/server`

### app/dashboard/coach/tools/potm/setup/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\tools\potm\setup\page.tsx`
- Does: App Router page for dashboard / coach / tools / potm / setup.
- Key exports/functions/components: `PotmSetupPage`
- Notable dependencies: `react`, `next/navigation`, `@/lib/supabase/client`

### app/dashboard/coach/welcome/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\coach\welcome\page.tsx`
- Does: App Router page for dashboard / coach / welcome.
- Key exports/functions/components: `CoachWelcomePage`
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/CoachJoinTeamForm`, `@/lib/supabase/server`

### app/dashboard/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\page.tsx`
- Does: App Router page for dashboard.
- Key exports/functions/components: `DashboardPage`
- Notable dependencies: `next/navigation`, `@/lib/supabase/server`

### app/dashboard/parent/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\page.tsx`
- Does: App Router page for dashboard / parent.
- Key exports/functions/components: `PlayerCard`, `ParentDashboardPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getParentDashboardData`

### app/dashboard/parent/player/[playerId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\player\[playerId]\page.tsx`
- Does: App Router page for dashboard / parent / player / [playerId].
- Key exports/functions/components: `ParentPlayerTeamSelectionPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/dashboard/getParentDashboardData`

### app/dashboard/parent/player/[playerId]/team/[teamId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\player\[playerId]\team\[teamId]\page.tsx`
- Does: App Router page for dashboard / parent / player / [playerId] / team / [teamId].
- Key exports/functions/components: `ParentPlayerTeamDashboardPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/components/dashboard/ParentFixturesClient`, `@/components/mobile/BottomNav`, `@/lib/dashboard/getParentDashboardData`, `@/lib/supabase/server`, `@/lib/tools/starCategories`

### app/dashboard/parent/player/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\player\page.tsx`
- Does: App Router page for dashboard / parent / player.
- Key exports/functions/components: `LegacyParentPlayerPage`
- Notable dependencies: `next/navigation`

### app/dashboard/parent/potm/[pollId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\potm\[pollId]\page.tsx`
- Does: App Router page for dashboard / parent / potm / [pollId].
- Key exports/functions/components: `ParentPotmVotePage`
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`

### app/dashboard/parent/settings/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\settings\page.tsx`
- Does: App Router page for dashboard / parent / settings.
- Key exports/functions/components: `ParentSettingsPage`
- Notable dependencies: `next/navigation`, `@/components/mobile/BottomNav`, `@/components/dashboard/SettingsShell`, `@/lib/dashboard/getParentDashboardData`, `@/lib/supabase/server`

### app/dashboard/parent/stars/[playerId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\stars\[playerId]\page.tsx`
- Does: App Router page for dashboard / parent / stars / [playerId].
- Key exports/functions/components: `ChildStarsPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/lib/supabase/server`, `@/lib/tools/starCategories`

### app/dashboard/parent/stars/award/[sessionId]/[playerId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\stars\award\[sessionId]\[playerId]\page.tsx`
- Does: App Router page for dashboard / parent / stars / award / [sessionId] / [playerId].
- Key exports/functions/components: `AwardStarsPage`
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/tools/starAwarder`, `@/lib/tools/starCategories`

### app/dashboard/parent/stars/goal/[sessionId]/[playerId]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\stars\goal\[sessionId]\[playerId]\page.tsx`
- Does: App Router page for dashboard / parent / stars / goal / [sessionId] / [playerId].
- Key exports/functions/components: `StarGoalPage`
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/tools/starCategories`

### app/dashboard/parent/tickets/new/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\tickets\new\page.tsx`
- Does: App Router page for dashboard / parent / tickets / new.
- Key exports/functions/components: `NewParentTicketPage`
- Notable dependencies: `next/link`, `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/tools/ticketTypes`

### app/dashboard/parent/tickets/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\parent\tickets\page.tsx`
- Does: App Router page for dashboard / parent / tickets.
- Key exports/functions/components: `TicketCard`, `ParentTicketsPage`
- Notable dependencies: `next/link`, `next/navigation`, `@/components/mobile/BottomNav`, `@/lib/dashboard/getParentDashboardData`, `@/lib/supabase/server`, `@/lib/tools/ticketTypes`

### app/dashboard/player/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\player\page.tsx`
- Does: App Router page for dashboard / player.
- Key exports/functions/components: `PlayerDashboardHoldingPage`
- Notable dependencies: `next/link`, `@/components/mobile/BottomNav`

### app/dashboard/player/settings/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\player\settings\page.tsx`
- Does: App Router page for dashboard / player / settings.
- Key exports/functions/components: `PlayerSettingsPage`
- Notable dependencies: `@/components/dashboard/SettingsShell`, `@/lib/supabase/server`

### app/dashboard/player/welcome/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\dashboard\player\welcome\page.tsx`
- Does: App Router page for dashboard / player / welcome.
- Key exports/functions/components: `PlayerWelcomePage`
- Notable dependencies: `next/navigation`, `@/components/dashboard/PlayerJoinTeamForm`, `@/lib/supabase/server`

### app/globals.css
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\globals.css`
- Does: Global Tailwind layers and app-wide CSS utility animations/classes.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### app/layout.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\layout.tsx`
- Does: Root App Router layout with global metadata and PWA meta tags.
- Key exports/functions/components: `RootLayout`, `metadata`, `viewport`
- Notable dependencies: `next`

### app/onboarding/layout.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\onboarding\layout.tsx`
- Does: Route layout for onboarding / layout.tsx.
- Key exports/functions/components: `OnboardingLayout`
- Notable dependencies: None detected.

### app/onboarding/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\onboarding\page.tsx`
- Does: App Router page for onboarding.
- Key exports/functions/components: `OnboardingPage`
- Notable dependencies: `react`, `next/navigation`, `@/lib/supabase/client`

### app/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\page.tsx`
- Does: Public landing page.
- Key exports/functions/components: `HomePage`
- Notable dependencies: `next/link`

### app/poll/[sessionToken]/[playerToken]/[response]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\poll\[sessionToken]\[playerToken]\[response]\page.tsx`
- Does: App Router page for poll / [sessionToken] / [playerToken] / [response].
- Key exports/functions/components: `generateMetadata`, `PollResponsePage`
- Notable dependencies: `next`, `next/navigation`, `@/lib/supabase/service`

### app/poll/[sessionToken]/GroupPollClient.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\poll\[sessionToken]\GroupPollClient.tsx`
- Does: Project source/configuration file.
- Key exports/functions/components: `GroupPollClient`, `GroupPollPlayer`, `GroupPollResponse`, `GroupPollSession`
- Notable dependencies: `next/link`, `react`, `@/lib/supabase/client`

### app/poll/[sessionToken]/page.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\poll\[sessionToken]\page.tsx`
- Does: App Router page for poll / [sessionToken].
- Key exports/functions/components: `generateMetadata`, `GroupPollPage`
- Notable dependencies: `next`, `@/app/poll/[sessionToken]/GroupPollClient`, `@/lib/supabase/server`

### components/auth/SignOutButton.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\auth\SignOutButton.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `SignOutButton`
- Notable dependencies: `next/navigation`, `react`, `@/lib/auth/signOut`

### components/dashboard/AddPlayerForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\AddPlayerForm.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `AddPlayerForm`
- Notable dependencies: `react`, `next/navigation`, `@/lib/supabase/client`

### components/dashboard/AddTeamForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\AddTeamForm.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `AddTeamForm`
- Notable dependencies: `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/utils/generateJoinCode`

### components/dashboard/ClubFixturesPanel.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ClubFixturesPanel.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `ClubFixturesPanel`
- Notable dependencies: `next/link`, `react`, `@/lib/dashboard/getClubData`

### components/dashboard/ClubHeader.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ClubHeader.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `ClubHeader`
- Notable dependencies: `@/lib/dashboard/getClubData`

### components/dashboard/ClubTeamScroller.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ClubTeamScroller.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `ClubTeamScroller`
- Notable dependencies: `next/link`, `react`, `@/components/dashboard/CopyInviteButton`, `@/lib/dashboard/getClubData`

### components/dashboard/CoachComplianceForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachComplianceForm.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `CoachComplianceForm`
- Notable dependencies: `react`, `@/lib/supabase/client`

### components/dashboard/CoachCreateTeamForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachCreateTeamForm.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `CoachCreateTeamForm`
- Notable dependencies: `react`, `next/navigation`, `@/lib/supabase/client`, `@/lib/utils/generateJoinCode`

### components/dashboard/CoachDashboardClient.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachDashboardClient.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `CoachDashboardClient`
- Notable dependencies: `next/link`, `react`, `@/components/mobile/BottomNav`, `@/lib/supabase/client`, `@/lib/dashboard/getCoachData`

### components/dashboard/CoachInviteDrawer.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachInviteDrawer.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `CoachInviteDrawer`
- Notable dependencies: `react`, `@/lib/supabase/client`, `@/lib/dashboard/getClubData`

### components/dashboard/CoachJoinTeamForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachJoinTeamForm.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `CoachJoinTeamForm`
- Notable dependencies: `react`, `@/lib/supabase/client`

### components/dashboard/CoachPotmSettingsForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachPotmSettingsForm.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `CoachPotmSettingsForm`
- Notable dependencies: `react`, `@/lib/supabase/client`

### components/dashboard/CoachScheduleClient.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachScheduleClient.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `CoachScheduleClient`
- Notable dependencies: `next/link`, `react`, `@/lib/supabase/client`, `@/lib/dashboard/getCoachData`

### components/dashboard/CoachSidebar.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CoachSidebar.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `CoachSidebar`, `NavIcon`
- Notable dependencies: `next/link`, `next/navigation`, `react`, `@/lib/auth/signOut`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/client`

### components/dashboard/CopyInviteButton.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CopyInviteButton.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `CopyInviteButton`
- Notable dependencies: `react`

### components/dashboard/CreateSessionForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\CreateSessionForm.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `CreateSessionForm`
- Notable dependencies: `react`, `next/navigation`, `@/lib/dashboard/getCoachData`, `@/lib/supabase/client`

### components/dashboard/ParentAvailabilityToggle.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ParentAvailabilityToggle.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `ParentAvailabilityToggle`
- Notable dependencies: `react`

### components/dashboard/ParentFixturesClient.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\ParentFixturesClient.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `ParentFixturesClient`
- Notable dependencies: `react`, `@/lib/supabase/client`, `@/lib/dashboard/getParentDashboardData`

### components/dashboard/PendingJoinRequests.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\PendingJoinRequests.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `PendingJoinRequests`
- Notable dependencies: `react`, `@/lib/supabase/client`, `@/lib/dashboard/getCoachDashboardData`

### components/dashboard/PlayerJoinTeamForm.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\PlayerJoinTeamForm.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `PlayerJoinTeamForm`
- Notable dependencies: `react`, `next/navigation`, `@/lib/supabase/client`

### components/dashboard/PlayerSubscriptionsClient.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\PlayerSubscriptionsClient.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `PlayerSubscriptionsClient`, `SubscriptionPlayerRow`
- Notable dependencies: `react`, `@/lib/supabase/client`

### components/dashboard/SessionDetailClient.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\SessionDetailClient.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `SessionDetailClient`, `SessionDetailPlayer`, `SessionDetailResponse`, `SessionDetailData`
- Notable dependencies: `react`, `next/link`, `@/lib/supabase/client`

### components/dashboard/SettingsShell.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\SettingsShell.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `SettingsShell`
- Notable dependencies: `@/components/auth/SignOutButton`

### components/dashboard/Sidebar.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\Sidebar.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `Sidebar`
- Notable dependencies: `next/link`, `next/navigation`, `react`, `@/lib/auth/signOut`, `@/lib/dashboard/getClubData`, `@/lib/supabase/client`

### components/dashboard/TicketStatusActions.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\dashboard\TicketStatusActions.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `TicketStatusActions`
- Notable dependencies: `react`, `@/lib/supabase/client`, `@/lib/tools/ticketTypes`

### components/fixtures/CSVImporter.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\fixtures\CSVImporter.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `CSVImporter`, `ImportTeamOption`
- Notable dependencies: `react`, `@/lib/supabase/client`

### components/mobile/BottomNav.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\mobile\BottomNav.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `BottomNav`, `NavIcon`
- Notable dependencies: `next/link`, `next/navigation`

### components/NotificationPermission.tsx
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\components\NotificationPermission.tsx`
- Does: Reusable React component used by dashboard, auth, mobile, or feature pages.
- Key exports/functions/components: `NotificationPermission`
- Notable dependencies: `react`

### lib/auth/completeInvite.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\auth\completeInvite.ts`
- Does: Authentication action/helper module.
- Key exports/functions/components: `completePendingInvite`, `readInviteMetadata`
- Notable dependencies: `@supabase/supabase-js`

### lib/auth/signOut.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\auth\signOut.ts`
- Does: Authentication action/helper module.
- Key exports/functions/components: `signOut`
- Notable dependencies: `@/lib/supabase/client`

### lib/dashboard/getClubData.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\dashboard\getClubData.ts`
- Does: Server-side dashboard data aggregation helper.
- Key exports/functions/components: `getClubData`, `ClubRecord`, `TeamRecord`, `TeamPlayerSummary`, `PendingCoachInvite`, `FixtureRecord`, `ClubDashboardData`
- Notable dependencies: `@/lib/supabase/server`

### lib/dashboard/getCoachDashboardData.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\dashboard\getCoachDashboardData.ts`
- Does: Server-side dashboard data aggregation helper.
- Key exports/functions/components: `getCoachDashboardData`, `CoachTeamRecord`, `CoachPlayerRecord`, `CoachDashboardData`, `PendingJoinRequestRecord`
- Notable dependencies: `@/lib/supabase/server`, `@/lib/dashboard/getClubData`

### lib/dashboard/getCoachData.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\dashboard\getCoachData.ts`
- Does: Server-side dashboard data aggregation helper.
- Key exports/functions/components: `getCoachData`, `CoachDashboardData`
- Notable dependencies: `@/lib/supabase/server`

### lib/dashboard/getParentDashboardData.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\dashboard\getParentDashboardData.ts`
- Does: Server-side dashboard data aggregation helper.
- Key exports/functions/components: `getParentDashboardData`, `ParentAvailabilityStatus`, `ParentSession`, `ParentPlayerTeam`, `ParentPlayer`, `ParentDashboardData`
- Notable dependencies: `@/lib/supabase/server`

### lib/supabase/client.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\supabase\client.ts`
- Does: Supabase client/helper module.
- Key exports/functions/components: `createClient`
- Notable dependencies: `@supabase/ssr`

### lib/supabase/server.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\supabase\server.ts`
- Does: Supabase client/helper module.
- Key exports/functions/components: `createClient`
- Notable dependencies: `@supabase/ssr`, `next/headers`

### lib/supabase/service.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\supabase\service.ts`
- Does: Supabase client/helper module.
- Key exports/functions/components: `createServiceClient`
- Notable dependencies: `@supabase/supabase-js`

### lib/supabase/storage.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\supabase\storage.ts`
- Does: Supabase client/helper module.
- Key exports/functions/components: `uploadClubBadge`
- Notable dependencies: `@/lib/supabase/client`

### lib/tools/playtimeCalculator.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\tools\playtimeCalculator.ts`
- Does: Pure tool/domain logic and typed constants.
- Key exports/functions/components: `roundToTwo`, `formatMinutes`, `getPitchPlaces`, `getOutfieldPlaces`, `calculatePlaytime`, `GameFormat`, `GamePeriods`, `GoalkeeperRule`, `CalculationMode`, `Player`, `PlaytimeInput`, `SubstitutionEvent`, `PlayerTimeAllocation`, `PlaytimeResult`
- Notable dependencies: None detected.

### lib/tools/potmCalculator.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\tools\potmCalculator.ts`
- Does: Pure tool/domain logic and typed constants.
- Key exports/functions/components: `calculatePotmWinner`, `resolvePotmMessage`, `PotmVote`, `PotmWinnerResult`, `ClubPotmSettings`, `CoachPotmSettings`
- Notable dependencies: None detected.

### lib/tools/starAwarder.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\tools\starAwarder.ts`
- Does: Pure tool/domain logic and typed constants.
- Key exports/functions/components: `awardStars`
- Notable dependencies: `@supabase/supabase-js`, `@/lib/tools/starCategories`

### lib/tools/starCategories.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\tools\starCategories.ts`
- Does: Pure tool/domain logic and typed constants.
- Key exports/functions/components: `getCurrentSeason`, `isPreSeason`, `isOffSeason`, `getCategoryMeta`, `nextMilestone`, `STAR_CATEGORIES`, `MILESTONES`, `StarCategory`, `ParentStarCategory`
- Notable dependencies: None detected.

### lib/tools/ticketTypes.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\tools\ticketTypes.ts`
- Does: Pure tool/domain logic and typed constants.
- Key exports/functions/components: `findParentTicketType`, `findCoachTicketType`, `getTicketSeason`, `PARENT_TICKET_TYPES`, `COACH_TICKET_TYPES`, `ParentTicketTypeId`, `CoachTicketTypeId`, `TicketAudience`, `TicketOutcome`, `TicketPriority`, `TicketStatus`, `TicketTypeDefinition`
- Notable dependencies: None detected.

### lib/utils/generateJoinCode.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\lib\utils\generateJoinCode.ts`
- Does: General utility helper.
- Key exports/functions/components: `generateJoinCode`
- Notable dependencies: None detected.

### middleware.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\middleware.ts`
- Does: Next.js middleware that protects dashboard routes and routes users by club role.
- Key exports/functions/components: `middleware`, `config`
- Notable dependencies: `@supabase/ssr`, `next/server`

### next-env.d.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\next-env.d.ts`
- Does: Generated Next.js TypeScript ambient declarations.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### next.config.mjs
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\next.config.mjs`
- Does: Next.js configuration file.
- Key exports/functions/components: `default export`
- Notable dependencies: None detected.

### package-lock.json
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\package-lock.json`
- Does: Locked dependency graph for reproducible npm installs.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### package.json
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\package.json`
- Does: NPM manifest defining scripts and runtime/development dependencies.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### postcss.config.js
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\postcss.config.js`
- Does: PostCSS configuration for Tailwind and autoprefixer.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### public/manifest.json
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\public\manifest.json`
- Does: PWA manifest defining app name, display mode, theme, and generated icons.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### public/sw.js
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\public\sw.js`
- Does: Service worker handling push notification display and notification clicks.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### supabase/migrations/202605080001_create_admin_user.sql
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\supabase\migrations\202605080001_create_admin_user.sql`
- Does: Supabase SQL migration/history file for database/storage policies or seed setup.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### supabase/migrations/202605080002_users_profile_rls.sql
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\supabase\migrations\202605080002_users_profile_rls.sql`
- Does: Supabase SQL migration/history file for database/storage policies or seed setup.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### supabase/migrations/202605080003_clubs_badge_positioning.sql
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\supabase\migrations\202605080003_clubs_badge_positioning.sql`
- Does: Supabase SQL migration/history file for database/storage policies or seed setup.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### supabase/migrations/202605080004_fix_rls_policies.sql
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\supabase\migrations\202605080004_fix_rls_policies.sql`
- Does: Supabase SQL migration/history file for database/storage policies or seed setup.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### supabase/migrations/202605080005_force_fix_storage_rls.sql
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\supabase\migrations\202605080005_force_fix_storage_rls.sql`
- Does: Supabase SQL migration/history file for database/storage policies or seed setup.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### tailwind.config.ts
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\tailwind.config.ts`
- Does: Tailwind CSS theme/content configuration.
- Key exports/functions/components: `default export`
- Notable dependencies: `tailwindcss`

### tsconfig.json
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\tsconfig.json`
- Does: TypeScript compiler configuration for the Next.js project.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### vercel.json
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\vercel.json`
- Does: Vercel deployment configuration including scheduled cron routes.
- Key exports/functions/components: None detected or configuration/static asset.
- Notable dependencies: None detected.

### PROJECT_MAP.md
- Full path: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\PROJECT_MAP.md`
- Does: Generated structured reference map of the Shift OS project.
- Key exports/functions/components: None; documentation artifact.
- Notable dependencies: Generated from repository source files, package metadata, Vercel config, and known Supabase schema surface.

## Database Tables And Columns

### auth.users
- Columns: `id`, `instance_id`, `aud`, `role`, `email`, `encrypted_password`, `email_confirmed_at`, `raw_app_meta_data`, `raw_user_meta_data`, `created_at`, `updated_at`

### public.users_profile
- Columns: `id`, `user_id`, `full_name`, `email`, `system_role`, `intended_role`, `created_at`, `updated_at`

### public.clubs
- Columns: `id`, `name`, `slug`, `ethos`, `badge_url`, `badge_scale`, `badge_offset_x`, `badge_offset_y`, `primary_colour`, `secondary_colour`, `plan_tier`, `created_by`, `created_at`, `updated_at`

### public.club_members
- Columns: `id`, `club_id`, `user_id`, `club_role`, `is_active`, `joined_at`, `created_at`, `updated_at`

### public.teams
- Columns: `id`, `club_id`, `name`, `age_group`, `season`, `gender`, `league`, `is_active`, `created_at`, `join_code`

### public.team_coaches
- Columns: `id`, `team_id`, `user_id`, `is_lead`, `created_at`

### public.players
- Columns: `id`, `team_id`, `parent_user_id`, `first_name`, `last_name`, `full_name`, `dob`, `date_of_birth`, `age_group`, `position`, `is_active`, `guardian_1_name`, `guardian_1_phone`, `guardian_1_email`, `guardian_2_name`, `guardian_2_phone`, `guardian_2_email`, `created_at`

### public.fixtures
- Columns: `id`, `club_id`, `team_id`, `fixture_date`, `opponent`, `home_away`, `team_name`, `created_at`

### public.availability
- Columns: `id`, `fixture_id`, `session_id`, `player_id`, `status`, `created_at`, `updated_at`

### public.game_time
- Columns: `id`, `fixture_id`, `session_id`, `player_id`, `minutes_played`, `created_at`, `updated_at`

### public.announcements
- Columns: `id`, `club_id`, `team_id`, `created_by`, `title`, `body`, `created_at`

### public.feature_toggles
- Columns: `id`, `club_id`, `feature_key`, `is_enabled`, `created_at`, `updated_at`

### public.pending_invites
- Columns: `id`, `club_id`, `team_id`, `invited_by`, `invite_token`, `role`, `invitee_name`, `invitee_email`, `invitee_phone`, `is_lead`, `status`, `expires_at`, `created_at`, `accepted_at`

### public.pending_join_requests
- Columns: `id`, `team_id`, `full_name`, `dob`, `parent_name`, `parent_contact`, `status`, `reviewed_at`, `created_at`

### public.sessions
- Columns: `id`, `team_id`, `created_by`, `type`, `title`, `opponent`, `session_date`, `location`, `is_home`, `notes`, `poll_sent`, `poll_sent_at`, `session_token`, `is_active`, `created_at`, `opposition_contact_name`, `opposition_contact_phone`, `full_address`, `postcode`, `coach_notes`, `tournify_link`, `imported_from`

### public.poll_responses
- Columns: `id`, `session_id`, `player_id`, `player_token`, `status`, `responded_at`, `note`

### public.push_subscriptions
- Columns: `id`, `user_id`, `endpoint`, `p256dh`, `auth`, `created_at`

### public.coach_qualifications
- Columns: `id`, `user_id`, `qualification_name`, `issuing_body`, `achieved_date`, `expiry_date`, `certificate_url`, `created_at`, `updated_at`

### public.coach_dbs
- Columns: `id`, `user_id`, `certificate_number`, `issue_date`, `expiry_date`, `dbs_type`, `certificate_url`, `created_at`, `updated_at`

### public.compliance_notifications
- Columns: `id`, `user_id`, `type`, `reference_id`, `days_until_expiry`, `sent_at`, `notification_type`

### public.player_subscriptions
- Columns: `id`, `player_id`, `club_id`, `status`, `amount_due`, `due_date`, `last_payment_date`, `notes`, `created_at`, `updated_at`

### public.player_suspensions
- Columns: `id`, `player_id`, `club_id`, `reason`, `internal_notes`, `start_date`, `end_date`, `is_active`, `suspended_by`, `reinstated_at`, `reinstated_by`, `created_at`

### public.subscription_contact_log
- Columns: `id`, `player_id`, `contacted_by`, `contact_method`, `message_sent`, `contacted_at`

### public.playtime_calculations
- Columns: `id`, `session_id`, `team_id`, `created_by`, `total_minutes`, `format`, `periods`, `goalkeeper_rule`, `calculation_mode`, `fair_share_minutes`, `result_json`, `created_at`, `updated_at`

### public.match_stats
- Columns: `id`, `session_id`, `team_id`, `created_by`, `score_for`, `score_against`, `potm_player_id`, `attendance_count`, `notes`, `created_at`, `updated_at`

### public.match_goalscorers
- Columns: `id`, `session_id`, `player_id`, `minute`, `created_at`

### public.tool_usage
- Columns: `id`, `club_id`, `team_id`, `user_id`, `tool_name`, `session_id`, `created_at`

### public.potm_settings
- Columns: `id`, `club_id`, `message_mode`, `club_message`, `coach_vote_enabled`, `p2p_vote_age_group`, `created_at`, `updated_at`

### public.potm_coach_settings
- Columns: `id`, `user_id`, `coach_message`, `first_access_complete`, `created_at`, `updated_at`

### public.potm_polls
- Columns: `id`, `session_id`, `team_id`, `created_by`, `status`, `poll_opens_at`, `poll_closes_at`, `winner_player_id`, `total_votes`, `coach_message_used`, `social_card_url`, `created_at`

### public.potm_votes
- Columns: `id`, `poll_id`, `voter_user_id`, `voted_for_player_id`, `voter_type`, `vote_weight`, `is_random`, `voted_at`

### public.potm_stats
- Columns: `id`, `player_id`, `team_id`, `club_id`, `potm_count`, `last_won_at`, `last_session_id`, `created_at`, `updated_at`

### public.player_stars
- Columns: `id`, `player_id`, `parent_user_id`, `session_id`, `stars_awarded`, `category`, `parent_message`, `season`, `is_pre_season`, `awarded_at`

### public.player_star_goals
- Columns: `id`, `player_id`, `parent_user_id`, `session_id`, `category`, `custom_text`, `parent_message`, `created_at`

### public.player_star_totals
- Columns: `id`, `player_id`, `season`, `total_stars`, `potm_stars`, `parent_stars`, `enjoyment_stars`, `effort_stars`, `teamwork_stars`, `bravery_stars`, `attitude_stars`, `special_stars`, `top_category`, `milestones_reached`, `milestone_celebration_pending`, `season_card_url`, `updated_at`

### public.tickets
- Columns: `id`, `ticket_ref`, `raised_by`, `raiser_role`, `team_id`, `club_id`, `ticket_type`, `is_safeguarding`, `is_positive`, `priority`, `outcome_type`, `was_duplicate`, `routes_to`, `coach_recipient_id`, `message`, `status`, `resolution_note`, `resolved_by`, `resolved_at`, `created_at`, `updated_at`

### public.ticket_events
- Columns: `id`, `ticket_id`, `event_type`, `actor_id`, `actor_role`, `note`, `created_at`

### public.coach_recognition_settings
- Columns: `id`, `club_id`, `bronze_threshold`, `silver_threshold`, `gold_threshold`, `bronze_reward`, `silver_reward`, `gold_reward`, `created_at`, `updated_at`

### public.coach_recognition_totals
- Columns: `id`, `coach_user_id`, `team_id`, `club_id`, `season`, `positive_ticket_count`, `concern_ticket_count`, `safeguarding_ticket_count`, `current_tier`, `updated_at`

### public.team_ticket_summary view
- Columns: `team_id`, `club_id`, `open_concern_count`, `open_safeguarding_count`, `positive_last_30_days`, `duplicate_open_count`, `traffic_light`

### storage.buckets
- Columns: `id`, `name`, `public`, `file_size_limit`, `allowed_mime_types`

### storage.objects
- Columns: `id`, `bucket_id`, `name`, `owner`, `created_at`, `updated_at`, `last_accessed_at`, `metadata`, `path_tokens`, `version`

## API Routes

### /api/compliance-reminders
- File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\compliance-reminders\route.ts`
- Methods: `GET`
- Purpose: API route handler for /api/compliance-reminders.

### /api/icons/:size
- File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\icons\[size]\route.tsx`
- Methods: No exported HTTP method detected.
- Purpose: API route handler for /api/icons/[size].

### /api/notify
- File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\notify\route.ts`
- Methods: `POST`
- Purpose: API route handler for /api/notify.

### /api/potm-card
- File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\potm-card\route.ts`
- Methods: `POST`
- Purpose: API route handler for /api/potm-card.

### /api/potm-close
- File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\potm-close\route.ts`
- Methods: `POST`
- Purpose: API route handler for /api/potm-close.

### /api/potm-cron
- File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\potm-cron\route.ts`
- Methods: `GET`
- Purpose: API route handler for /api/potm-cron.

### /api/push-subscription
- File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\push-subscription\route.ts`
- Methods: `POST`
- Purpose: API route handler for /api/push-subscription.

### /api/stars-season-reset
- File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\stars-season-reset\route.ts`
- Methods: `GET`
- Purpose: API route handler for /api/stars-season-reset.

### /api/stars-season-start
- File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\api\stars-season-start\route.ts`
- Methods: `GET`
- Purpose: API route handler for /api/stars-season-start.

### /auth/callback
- File: `C:\Users\theta\Documents\Codex\2026-05-08\project-operating-rules-shift-os-you\shift-os\shift-os\app\auth\callback\route.ts`
- Methods: `GET`
- Purpose: Supabase auth callback route exchanging auth code and redirecting by role/onboarding state.

## Supabase Storage Buckets

- `club-assets`: Public image bucket for club badge/logo assets.
- `coach-documents`: Coach qualification and DBS certificate uploads.
- `potm-cards`: Public generated Player of the Match social card images.
- `star-cards`: Public generated child star/end-of-season card images.

## Environment Variables Used

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL for browser/server clients.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key used by SSR/browser clients.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Alternate publishable Supabase key fallback.
- `SUPABASE_SERVICE_ROLE_KEY`: Service-role key for privileged server-side API handlers.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: Public VAPID key used by browser push subscription.
- `VAPID_PRIVATE_KEY`: Private VAPID key used by notification sending API.
- `VAPID_SUBJECT`: VAPID subject/contact identifier for web-push.

## Cron Endpoints And Schedules

- `/api/compliance-reminders`: `0 9 * * *`
- `/api/potm-cron`: `*/5 * * * *`
- `/api/stars-season-reset`: `0 0 1 7 *`
- `/api/stars-season-start`: `0 0 1 9 *`

## NPM Packages

### Scripts
- `dev`: `next dev`
- `build`: `next build`
- `start`: `next start`
- `lint`: `next lint`

### Dependencies
- `@supabase/ssr`: `^0.5.2`
- `@supabase/supabase-js`: `^2.49.8`
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


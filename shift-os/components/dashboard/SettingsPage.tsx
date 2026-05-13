'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import SignOutButton from '@/components/auth/SignOutButton';
import { createClient } from '@/lib/supabase/client';
import { contrastText } from '@/lib/utils/contrastText';

type Role = 'coach' | 'parent' | 'club' | 'player' | 'family';
type SettingsTab = 'contact' | 'profile' | 'security' | 'calendar';
type CalendarView = 'week' | 'month';
type WeekStart = 'monday' | 'sunday';

interface SettingsUser {
  id: string;
  email: string;
}

interface SettingsProfile {
  full_name: string;
  dob: string | null;
  gender: string | null;
  country: string | null;
  timezone: string | null;
  phone: string | null;
  secondary_email: string | null;
  calendar_settings?: Record<string, unknown>;
  notification_settings?: Record<string, unknown>;
  calendar_token: string | null;
  calendar_sync_enabled: boolean;
  calendar_include_pending: boolean;
  calendar_include_training: boolean;
  calendar_include_tournaments: boolean;
}

interface LinkedPlayer {
  id: string;
  name: string;
  teamName: string;
}

interface SettingsPageProps {
  role: Role;
  user: SettingsUser;
  profile: SettingsProfile;
  primaryColour?: string;
  linkedPlayers?: LinkedPlayer[];
  extraContent?: ReactNode;
}

interface CalendarSettings {
  defaultView: CalendarView;
  weekStartsOn: WeekStart;
  sessionReminders: boolean;
  reminderOffset: string;
  matchDayNotifications: boolean;
}

interface NotificationSettings {
  availabilityResponses: boolean;
  newTicketReceived: boolean;
  potmPollResults: boolean;
}

const tabs: Array<{ id: SettingsTab; label: string }> = [
  { id: 'contact', label: 'Contact' },
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'calendar', label: 'Calendar' }
];

const countries = [
  'England',
  'Scotland',
  'Wales',
  'Northern Ireland',
  'Ireland',
  'Australia',
  'Canada',
  'France',
  'Germany',
  'New Zealand',
  'Spain',
  'United States'
];

const timezones = [
  ['Europe/London', 'Europe/London (GMT/BST)'],
  ['Europe/Dublin', 'Europe/Dublin'],
  ['Europe/Paris', 'Europe/Paris'],
  ['America/New_York', 'America/New_York'],
  ['America/Los_Angeles', 'America/Los_Angeles'],
  ['Australia/Sydney', 'Australia/Sydney']
] as const;

function readBoolean(settings: Record<string, unknown> | undefined, key: string, fallback: boolean): boolean {
  return typeof settings?.[key] === 'boolean' ? settings[key] : fallback;
}

function readString(settings: Record<string, unknown> | undefined, key: string, fallback: string): string {
  return typeof settings?.[key] === 'string' ? settings[key] : fallback;
}

function readCalendarSettings(settings: Record<string, unknown> | undefined): CalendarSettings {
  const defaultView = readString(settings, 'defaultView', 'week');
  const weekStartsOn = readString(settings, 'weekStartsOn', 'monday');
  return {
    defaultView: defaultView === 'month' ? 'month' : 'week',
    weekStartsOn: weekStartsOn === 'sunday' ? 'sunday' : 'monday',
    sessionReminders: readBoolean(settings, 'sessionReminders', true),
    reminderOffset: readString(settings, 'reminderOffset', '60'),
    matchDayNotifications: readBoolean(settings, 'matchDayNotifications', true)
  };
}

function readNotificationSettings(settings: Record<string, unknown> | undefined): NotificationSettings {
  return {
    availabilityResponses: readBoolean(settings, 'availabilityResponses', true),
    newTicketReceived: readBoolean(settings, 'newTicketReceived', true),
    potmPollResults: readBoolean(settings, 'potmPollResults', true)
  };
}

function FieldLabel({ label, helper }: { label: string; helper?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-white/40">{label}</span>
      {helper ? <span className="mb-2 block text-xs text-white/30">{helper}</span> : null}
    </label>
  );
}

function Toggle({ checked, onChange, label, helper }: { checked: boolean; onChange: (checked: boolean) => void; label: string; helper: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left">
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="mt-1 block text-xs text-white/40">{helper}</span>
      </span>
      <span className={`relative h-7 w-12 rounded-full transition-all duration-300 ease-out ${checked ? 'bg-emerald-500' : 'bg-white/[0.12]'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all duration-300 ease-out ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );
}

function CompactToggle({ checked, onChange, label, helper, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; label: string; helper?: string; disabled?: boolean }) {
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-left disabled:cursor-not-allowed disabled:opacity-60">
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        {helper ? <span className="mt-1 block text-xs text-white/30">{helper}</span> : null}
      </span>
      <span className={`relative h-6 w-11 rounded-full transition-all duration-300 ease-out ${checked ? 'bg-emerald-500' : 'bg-white/[0.12]'}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-300 ease-out ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );
}

function calendarHost(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://shiftos.co.uk';
  return siteUrl.replace(/^https?:\/\//, '');
}

export default function SettingsPage({ role, user, profile, primaryColour = '#00C851', linkedPlayers = [], extraContent }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('contact');
  const [secondaryEmail, setSecondaryEmail] = useState(profile.secondary_email ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [fullName, setFullName] = useState(profile.full_name);
  const [dob, setDob] = useState(profile.dob ?? '');
  const [gender, setGender] = useState(profile.gender ?? 'prefer_not_to_say');
  const [country, setCountry] = useState(profile.country ?? 'England');
  const [timezone, setTimezone] = useState(profile.timezone ?? 'Europe/London');
  const [calendarSettings, setCalendarSettings] = useState<CalendarSettings>(() => readCalendarSettings(profile.calendar_settings));
  const [calendarToken, setCalendarToken] = useState(profile.calendar_token);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(profile.calendar_sync_enabled);
  const [includePending, setIncludePending] = useState(profile.calendar_include_pending);
  const [includeTraining, setIncludeTraining] = useState(profile.calendar_include_training);
  const [includeTournaments, setIncludeTournaments] = useState(profile.calendar_include_tournaments);
  const [calendarCopied, setCalendarCopied] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => readNotificationSettings(profile.notification_settings));
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [children, setChildren] = useState(linkedPlayers);
  const textColour = contrastText(primaryColour);
  const feedUrl = calendarToken ? `webcal://${calendarHost()}/api/calendar/${calendarToken}` : '';
  const googleCalendarUrl = feedUrl ? `https://www.google.com/calendar/render?cid=${encodeURIComponent(feedUrl)}` : '#';

  const passwordMatches = newPassword.length > 0 && newPassword === confirmPassword;
  const canUpdatePassword = currentPassword.length > 0 && newPassword.length >= 8 && passwordMatches;
  const visibleTabs = useMemo(() => tabs.filter((tab) => role !== 'club' || tab.id !== 'calendar'), [role]);

  const inputClass = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition-all duration-300 ease-out placeholder:text-white/20 focus:border-white/20';
  const readOnlyClass = 'w-full cursor-not-allowed rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white opacity-50 outline-none';
  const cardClass = 'rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5';

  function showSaved(text = 'Saved ✓') {
    setError('');
    setMessage(text);
    window.setTimeout(() => setMessage(''), 3000);
  }

  async function updateProfile(values: Record<string, unknown>, successMessage?: string) {
    const { data, error: updateError } = await createClient()
      .from('users_profile')
      .update(values)
      .or(`id.eq.${user.id},user_id.eq.${user.id}`)
      .select('id')
      .maybeSingle<{ id: string }>();

    if (updateError) {
      setMessage('');
      setError(updateError.message);
      return;
    }

    if (!data) {
      setMessage('');
      setError('Your profile record could not be found. Please sign out and back in, then try again.');
      return;
    }

    showSaved(successMessage);
  }

  async function saveContact() {
    await updateProfile({
      secondary_email: secondaryEmail.trim() || null,
      phone: phone.trim() || null
    });
  }

  async function saveProfile() {
    await updateProfile({
      full_name: fullName.trim() || null,
      dob: dob || null,
      gender,
      country,
      timezone
    });
  }

  async function saveCalendar() {
    await updateProfile({
      calendar_settings: calendarSettings,
      notification_settings: notificationSettings
    });
  }

  async function toggleCalendarSync(enabled: boolean) {
    const nextToken = calendarToken ?? crypto.randomUUID();
    setCalendarSyncEnabled(enabled);
    setCalendarToken(nextToken);
    await updateProfile({
      calendar_sync_enabled: enabled,
      calendar_token: nextToken
    }, enabled ? 'Calendar sync enabled' : 'Calendar sync disabled');
  }

  async function updateCalendarOption(key: 'calendar_include_training' | 'calendar_include_tournaments' | 'calendar_include_pending', value: boolean) {
    if (key === 'calendar_include_training') setIncludeTraining(value);
    if (key === 'calendar_include_tournaments') setIncludeTournaments(value);
    if (key === 'calendar_include_pending') setIncludePending(value);
    await updateProfile({ [key]: value }, 'Calendar options saved');
  }

  async function copyCalendarFeed() {
    if (!feedUrl) return;
    await navigator.clipboard.writeText(feedUrl);
    setCalendarCopied(true);
    window.setTimeout(() => setCalendarCopied(false), 2000);
  }

  async function regenerateCalendarToken() {
    const nextToken = crypto.randomUUID();
    setCalendarToken(nextToken);
    await updateProfile({ calendar_token: nextToken }, 'Calendar feed URL regenerated');
  }

  async function updatePassword() {
    if (!canUpdatePassword) return;
    const supabase = createClient();
    const { error: currentPasswordError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (currentPasswordError) {
      setMessage('');
      setError('Current password is incorrect.');
      return;
    }

    const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
    if (passwordError) {
      setMessage('');
      setError(passwordError.message);
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showSaved('Password updated successfully');
  }

  async function removeChild(playerId: string, name: string) {
    if (!window.confirm(`Remove ${name} from your account? This won't delete their profile from the team.`)) return;
    const { error: removeError } = await createClient()
      .from('players')
      .update({ parent_user_id: null })
      .eq('id', playerId)
      .eq('parent_user_id', user.id);
    if (removeError) {
      setError(removeError.message);
      return;
    }
    setChildren((current) => current.filter((player) => player.id !== playerId));
    showSaved(`${name} removed from your account`);
  }

  const title = useMemo(() => {
    if (role === 'club') return 'Club Admin Settings';
    return `${role[0].toUpperCase()}${role.slice(1)} Settings`;
  }, [role]);

  return (
    <main className="min-h-screen px-5 pb-32 pt-10 text-white md:px-8" style={{ backgroundColor: '#080a0f' }}>
      <div className="mx-auto max-w-[640px]">
        <p className="text-xs uppercase tracking-[0.3em] text-white/30">{title}</p>
        <h1 className="mt-3 text-3xl font-black">Settings</h1>

        <div className="mt-6 overflow-x-auto border-b border-white/[0.06]">
          <nav className="flex min-w-max gap-6">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="border-b-2 px-1 pb-3 text-sm font-semibold transition-all duration-300 ease-out"
                style={activeTab === tab.id ? { borderColor: primaryColour, color: '#ffffff' } : { borderColor: 'transparent', color: 'rgba(255,255,255,0.4)' }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6 space-y-4">
          {activeTab === 'contact' ? (
            <section className={cardClass}>
              <h2 className="text-xl font-bold">Contact Information</h2>
              <div className="mt-5 space-y-4">
                <div>
                  <FieldLabel label="Primary Email" helper="To change your email address, use the Security tab" />
                  <input value={user.email} disabled className={readOnlyClass} />
                </div>
                <div>
                  <FieldLabel label="Additional Email" />
                  <input type="email" value={secondaryEmail} onChange={(event) => setSecondaryEmail(event.target.value)} className={inputClass} />
                </div>
                <div>
                  <FieldLabel label="Phone Number" />
                  <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={inputClass} placeholder="+44 7700 900000" />
                </div>
                <button type="button" onClick={saveContact} className="w-full rounded-full px-6 py-2.5 text-sm font-bold md:w-auto" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${primaryColour}cc)`, color: textColour }}>Save Contact</button>
              </div>
            </section>
          ) : null}

          {activeTab === 'profile' ? (
            <>
              <section className={cardClass}>
                <h2 className="text-xl font-bold">Profile Details</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <FieldLabel label="Full Name" />
                    <input value={fullName} onChange={(event) => setFullName(event.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <FieldLabel label="Date of Birth" />
                    <input type="date" value={dob} onChange={(event) => setDob(event.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <FieldLabel label="Gender" />
                    <select value={gender} onChange={(event) => setGender(event.target.value)} className={inputClass}>
                      <option value="male" className="bg-[#0d1117]">Male</option>
                      <option value="female" className="bg-[#0d1117]">Female</option>
                      <option value="non_binary" className="bg-[#0d1117]">Non-binary</option>
                      <option value="prefer_not_to_say" className="bg-[#0d1117]">Prefer not to say</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="Country" />
                    <select value={country} onChange={(event) => setCountry(event.target.value)} className={inputClass}>
                      {countries.map((item) => <option key={item} value={item} className="bg-[#0d1117]">{item}</option>)}
                    </select>
                  </div>
                  <div>
                    <FieldLabel label="Timezone" />
                    <select value={timezone} onChange={(event) => setTimezone(event.target.value)} className={inputClass}>
                      {timezones.map(([value, label]) => <option key={value} value={value} className="bg-[#0d1117]">{label}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={saveProfile} className="w-full rounded-full px-6 py-2.5 text-sm font-bold md:w-auto" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${primaryColour}cc)`, color: textColour }}>Save Profile</button>
                </div>
              </section>

              {role === 'parent' ? (
                <section className={cardClass}>
                  <h2 className="text-xl font-bold">My Children</h2>
                  <div className="mt-5 space-y-3">
                    {children.length === 0 ? <p className="text-sm text-white/35">No linked players.</p> : children.map((player) => (
                      <div key={player.id} className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{player.name}</p>
                          <p className="mt-1 text-xs text-white/35">{player.teamName}</p>
                        </div>
                        <button type="button" onClick={() => void removeChild(player.id, player.name)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55">Remove</button>
                      </div>
                    ))}
                    <p className="text-xs text-white/30">The team coach controls adding new players. Contact your coach to link additional children.</p>
                  </div>
                </section>
              ) : null}

              {role === 'club' ? (
                <section className={cardClass}>
                  <h2 className="text-xl font-bold">Club Admin</h2>
                  <Link href="/dashboard/club/settings" className="mt-4 inline-flex text-sm font-semibold" style={{ color: primaryColour }}>Club Settings →</Link>
                </section>
              ) : null}
            </>
          ) : null}

          {activeTab === 'security' ? (
            <>
              <section className={cardClass}>
                <h2 className="text-xl font-bold">Change Password</h2>
                <div className="mt-5 space-y-4">
                  <div>
                    <FieldLabel label="Current Password" />
                    <input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <FieldLabel label="New Password" helper="Minimum 8 characters" />
                    <div className="flex gap-2">
                      <input type={showNewPassword ? 'text' : 'password'} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={inputClass} />
                      <button type="button" onClick={() => setShowNewPassword((current) => !current)} className="rounded-xl border border-white/[0.08] px-4 text-sm text-white/55">{showNewPassword ? 'Hide' : 'Show'}</button>
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="Confirm New Password" />
                    <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className={inputClass} />
                    {confirmPassword ? <p className={`mt-2 text-xs ${passwordMatches ? 'text-emerald-400' : 'text-red-300'}`}>{passwordMatches ? 'Passwords match ✓' : "Passwords don't match"}</p> : null}
                  </div>
                  <button type="button" disabled={!canUpdatePassword} onClick={updatePassword} className="w-full rounded-full px-6 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 md:w-auto" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${primaryColour}cc)`, color: textColour }}>Update Password</button>
                </div>
              </section>
              <section className={cardClass}>
                <h2 className="text-xl font-bold">Email Address</h2>
                <p className="mt-3 text-sm text-white/55">Current email: {user.email}</p>
                <p className="mt-2 text-xs text-white/30">To change your email address, contact support or update via your FA account if linked.</p>
              </section>
            </>
          ) : null}

          {activeTab === 'calendar' && role !== 'club' ? (
            <>
              <section className={cardClass}>
                <h2 className="text-xl font-bold">Calendar Sync</h2>
                <div className="mt-5">
                  <Toggle
                    checked={calendarSyncEnabled}
                    onChange={(checked) => void toggleCalendarSync(checked)}
                    label="Sync to your calendar"
                    helper="Fixtures appear automatically in Apple Calendar, Google Calendar or any calendar app"
                  />
                </div>

                {calendarSyncEnabled && feedUrl ? (
                  <div className="mt-5">
                    <p className="mb-2 text-xs uppercase tracking-wider text-white/40">Your calendar feed</p>
                    <div className="break-all rounded-xl bg-white/[0.06] px-4 py-3 font-mono text-xs text-white/60">{feedUrl}</div>
                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                      <button type="button" onClick={copyCalendarFeed} className="rounded-xl border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-sm font-medium text-white">
                        {calendarCopied ? 'Copied' : 'Copy Link'}
                      </button>
                      <a href={feedUrl} target="_self" className="rounded-xl border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-center text-sm font-medium text-white">
                        Apple Calendar
                      </a>
                      <a href={googleCalendarUrl} target="_blank" rel="noreferrer" className="rounded-xl border border-white/[0.08] bg-white/[0.06] px-4 py-3 text-center text-sm font-medium text-white">
                        Google Calendar
                      </a>
                    </div>

                    <p className="mb-2 mt-5 text-xs uppercase tracking-wider text-white/40">What gets synced</p>
                    <div className="space-y-2">
                      <CompactToggle checked onChange={() => undefined} disabled label="Confirmed matches" />
                      <CompactToggle checked={includeTraining} onChange={(checked) => void updateCalendarOption('calendar_include_training', checked)} label="Training sessions" />
                      <CompactToggle checked={includeTournaments} onChange={(checked) => void updateCalendarOption('calendar_include_tournaments', checked)} label="Tournaments" />
                      <CompactToggle checked={includePending} onChange={(checked) => void updateCalendarOption('calendar_include_pending', checked)} label="Unconfirmed matches" helper="Add matches to calendar even before you confirm availability" />
                    </div>

                    <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <p className="text-xs text-white/30">Regenerate feed URL</p>
                      <p className="mt-1 text-xs text-white/20">This will break any existing calendar subscriptions.</p>
                      <button type="button" onClick={regenerateCalendarToken} className="mt-3 text-xs font-semibold text-white/45 transition hover:text-white">Regenerate</button>
                    </div>

                    {role === 'parent' ? (
                      <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <h3 className="text-sm font-semibold text-white">Football Family Calendar Access</h3>
                        <p className="mt-2 text-xs leading-relaxed text-white/40">Family members can subscribe to a read-only calendar feed showing confirmed fixtures and sessions from their own Football Family settings.</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>

              <section className={cardClass}>
                <h2 className="text-xl font-bold">Calendar Preferences</h2>
                <div className="mt-5 space-y-5">
                  <div>
                    <FieldLabel label="Default Calendar View" />
                    <div className="flex gap-2">
                      {(['week', 'month'] as CalendarView[]).map((view) => (
                        <button key={view} type="button" onClick={() => setCalendarSettings((current) => ({ ...current, defaultView: view }))} className="rounded-full px-4 py-2 text-sm font-semibold capitalize" style={calendarSettings.defaultView === view ? { backgroundColor: primaryColour, color: textColour } : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>{view}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <FieldLabel label="Week Starts On" />
                    <div className="flex gap-2">
                      {(['monday', 'sunday'] as WeekStart[]).map((day) => (
                        <button key={day} type="button" onClick={() => setCalendarSettings((current) => ({ ...current, weekStartsOn: day }))} className="rounded-full px-4 py-2 text-sm font-semibold capitalize" style={calendarSettings.weekStartsOn === day ? { backgroundColor: primaryColour, color: textColour } : { backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>{day}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className={cardClass}>
                <h2 className="text-xl font-bold">Notifications</h2>
                <div className="mt-5 space-y-3">
                  <Toggle checked={calendarSettings.sessionReminders} onChange={(checked) => setCalendarSettings((current) => ({ ...current, sessionReminders: checked }))} label="Session reminders" helper="Get notified before sessions" />
                  {calendarSettings.sessionReminders ? (
                    <div>
                      <FieldLabel label="Remind me" />
                      <select value={calendarSettings.reminderOffset} onChange={(event) => setCalendarSettings((current) => ({ ...current, reminderOffset: event.target.value }))} className={inputClass}>
                        <option value="120" className="bg-[#0d1117]">2 hours before</option>
                        <option value="60" className="bg-[#0d1117]">1 hour before</option>
                        <option value="30" className="bg-[#0d1117]">30 minutes before</option>
                        <option value="1440" className="bg-[#0d1117]">24 hours before</option>
                      </select>
                    </div>
                  ) : null}
                  <Toggle checked={calendarSettings.matchDayNotifications} onChange={(checked) => setCalendarSettings((current) => ({ ...current, matchDayNotifications: checked }))} label="Match day notifications" helper="Extra reminder on match day morning" />
                </div>
              </section>

              {role === 'coach' ? (
                <section className={cardClass}>
                  <h2 className="text-xl font-bold">Notification Preferences</h2>
                  <div className="mt-5 space-y-3">
                    <Toggle checked={notificationSettings.availabilityResponses} onChange={(checked) => setNotificationSettings((current) => ({ ...current, availabilityResponses: checked }))} label="Availability poll responses" helper="Notify when parents respond" />
                    <Toggle checked={notificationSettings.newTicketReceived} onChange={(checked) => setNotificationSettings((current) => ({ ...current, newTicketReceived: checked }))} label="New ticket received" helper="Notify when a parent raises a ticket" />
                    <Toggle checked={notificationSettings.potmPollResults} onChange={(checked) => setNotificationSettings((current) => ({ ...current, potmPollResults: checked }))} label="POTM poll results" helper="Notify when a poll closes" />
                  </div>
                </section>
              ) : null}

              <button type="button" onClick={saveCalendar} className="w-full rounded-full px-6 py-2.5 text-sm font-bold md:w-auto" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${primaryColour}cc)`, color: textColour }}>Save Calendar</button>
            </>
          ) : null}
        </div>

        {extraContent ? <div className="mt-6">{extraContent}</div> : null}

        {message ? <p className="mt-4 text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}

        <div className="mb-6 mt-8 h-px bg-white/[0.06]" />
        <p className="mb-4 text-center text-sm text-white/30">Signed in as {user.email}</p>
        <div className="mx-auto max-w-xs">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}

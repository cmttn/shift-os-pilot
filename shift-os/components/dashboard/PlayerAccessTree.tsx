interface AccessPerson {
  id: string;
  name: string;
  detail?: string | null;
  status?: string | null;
}

export interface PlayerAccessTreeProps {
  playerName: string;
  primaryParents: AccessPerson[];
  familyMembers: AccessPerson[];
  pendingFamilyInvites?: AccessPerson[];
  compact?: boolean;
}

function StatusPill({ label }: { label: string }) {
  const isPending = label.toLowerCase().includes('pending');
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isPending ? 'bg-amber-400/10 text-amber-300' : 'bg-emerald-400/10 text-emerald-300'}`}>
      {label}
    </span>
  );
}

function PersonRow({ person, fallbackDetail, status }: { person: AccessPerson; fallbackDetail: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{person.name}</p>
        <p className="mt-0.5 truncate text-xs text-white/35">{person.detail || fallbackDetail}</p>
      </div>
      <StatusPill label={person.status ?? status} />
    </div>
  );
}

export default function PlayerAccessTree({ playerName, primaryParents, familyMembers, pendingFamilyInvites = [], compact = false }: PlayerAccessTreeProps) {
  const hasFamily = familyMembers.length > 0 || pendingFamilyInvites.length > 0;

  return (
    <section className={`rounded-2xl border border-white/[0.06] bg-white/[0.03] ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={`${compact ? 'text-sm' : 'text-base'} font-bold text-white`}>{playerName}&apos;s access</h2>
          <p className="mt-1 text-xs text-white/35">Who can see or manage this player.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-white/25">Parents</p>
          <div className="space-y-2">
            {primaryParents.length === 0 ? (
              <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-white/30">No connected parent accounts found.</p>
            ) : primaryParents.map((person) => (
              <PersonRow key={person.id} person={person} fallbackDetail="Full access" status="Full access" />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-white/25">Football Family</p>
          <div className="space-y-2">
            {!hasFamily ? (
              <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-white/30">No view-only family members yet.</p>
            ) : null}
            {familyMembers.map((person) => (
              <PersonRow key={person.id} person={person} fallbackDetail="View only" status="View only" />
            ))}
            {pendingFamilyInvites.map((person) => (
              <PersonRow key={person.id} person={person} fallbackDetail="Pending invite" status="Pending" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

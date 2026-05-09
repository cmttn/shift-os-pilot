'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type QualificationDraft = {
  id?: string;
  qualification_name: string;
  issuing_body: string;
  achieved_date: string;
  expiry_date: string;
  certificate_url: string | null;
};

type DbsDraft = {
  certificate_number: string;
  issue_date: string;
  expiry_date: string;
  dbs_type: 'basic' | 'standard' | 'enhanced' | 'enhanced_barred';
  certificate_url: string | null;
};

interface CoachComplianceFormProps {
  userId: string;
  primaryColour: string;
  initialQualifications: QualificationDraft[];
  initialDbs: DbsDraft | null;
}

const qualificationOptions = ['FA Level 1', 'FA Level 2', 'FA Level 3', 'UEFA B', 'UEFA A', 'First Aid', 'Emergency First Aid', 'Safeguarding Children', 'Custom'];

function statusFor(expiryDate: string): { label: string; colour: string } {
  if (!expiryDate) return { label: 'No expiry', colour: 'rgba(255,255,255,0.25)' };
  const days = Math.ceil((new Date(expiryDate).valueOf() - Date.now()) / 86400000);
  if (days <= 0) return { label: 'Expired', colour: '#7f1d1d' };
  if (days <= 30) return { label: 'Urgent', colour: '#ef4444' };
  if (days <= 90) return { label: 'Expiring Soon', colour: '#f59e0b' };
  return { label: 'Valid', colour: '#10b981' };
}

function addYears(value: string, years: number): string {
  if (!value) return '';
  const date = new Date(value);
  date.setFullYear(date.getFullYear() + years);
  return date.toISOString().slice(0, 10);
}

export default function CoachComplianceForm({ userId, primaryColour, initialQualifications, initialDbs }: CoachComplianceFormProps) {
  const [qualifications, setQualifications] = useState<QualificationDraft[]>(initialQualifications.length > 0 ? initialQualifications : []);
  const [dbs, setDbs] = useState<DbsDraft>(initialDbs ?? { certificate_number: '', issue_date: '', expiry_date: '', dbs_type: 'enhanced', certificate_url: null });
  const [message, setMessage] = useState('');
  const supabase = useMemo(() => createClient(), []);
  const inputClass = 'w-full rounded-[10px] border border-white/[0.08] bg-white/[0.04] p-3 text-sm text-white outline-none transition-all duration-300 ease-out placeholder:text-white/25 focus:border-white/25';

  function updateQualification(index: number, patch: Partial<QualificationDraft>) {
    setQualifications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  async function uploadCertificate(event: ChangeEvent<HTMLInputElement>, kind: 'qualification' | 'dbs', index?: number) {
    const file = event.target.files?.[0];
    if (!file) return;
    const path = `${userId}/${kind}-${crypto.randomUUID()}-${file.name}`;
    const { data, error } = await supabase.storage.from('coach-documents').upload(path, file, { upsert: false });
    if (error) {
      setMessage(error.message);
      return;
    }
    const { data: publicUrl } = supabase.storage.from('coach-documents').getPublicUrl(data.path);
    if (kind === 'dbs') setDbs((current) => ({ ...current, certificate_url: publicUrl.publicUrl }));
    if (kind === 'qualification' && typeof index === 'number') updateQualification(index, { certificate_url: publicUrl.publicUrl });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    const cleanedQualifications = qualifications.filter((item) => item.qualification_name.trim());
    if (cleanedQualifications.length > 0) {
      const { error } = await supabase.from('coach_qualifications').upsert(cleanedQualifications.map((item) => ({ ...item, user_id: userId })));
      if (error) {
        setMessage(error.message);
        return;
      }
    }
    const { error: dbsError } = await supabase.from('coach_dbs').upsert({ ...dbs, user_id: userId }, { onConflict: 'user_id' });
    setMessage(dbsError ? dbsError.message : 'Compliance profile saved.');
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Qualifications</h2>
            <p className="mt-1 text-sm text-white/35">Track coaching, first aid and safeguarding certificates.</p>
          </div>
          <button type="button" onClick={() => setQualifications((current) => [...current, { qualification_name: 'FA Level 1', issuing_body: '', achieved_date: '', expiry_date: '', certificate_url: null }])} className="rounded-full border px-4 py-2 text-sm font-semibold" style={{ borderColor: primaryColour, color: primaryColour }}>Add +</button>
        </div>
        <div className="mt-5 space-y-4">
          {qualifications.map((qualification, index) => {
            const status = statusFor(qualification.expiry_date);
            return (
              <article key={qualification.id ?? index} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: status.colour }}>{status.label}</span>
                  <button type="button" onClick={() => setQualifications((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-sm text-white/35">Delete</button>
                </div>
                <div className="grid gap-3">
                  <select value={qualification.qualification_name} onChange={(event) => updateQualification(index, { qualification_name: event.target.value })} className={inputClass}>
                    {qualificationOptions.map((option) => <option key={option} className="bg-[#0d1117]">{option}</option>)}
                  </select>
                  <input value={qualification.issuing_body} onChange={(event) => updateQualification(index, { issuing_body: event.target.value })} className={inputClass} placeholder="Issuing body" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="date" value={qualification.achieved_date} onChange={(event) => updateQualification(index, { achieved_date: event.target.value })} className={inputClass} />
                    <input type="date" value={qualification.expiry_date} onChange={(event) => updateQualification(index, { expiry_date: event.target.value })} className={inputClass} />
                  </div>
                  <input type="file" onChange={(event) => uploadCertificate(event, 'qualification', index)} className="text-sm text-white/40" />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-xl font-bold">DBS Check</h2>
        <span className="mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: statusFor(dbs.expiry_date).colour }}>{statusFor(dbs.expiry_date).label}</span>
        <div className="mt-5 grid gap-3">
          <input value={dbs.certificate_number} onChange={(event) => setDbs((current) => ({ ...current, certificate_number: event.target.value }))} className={inputClass} placeholder="Certificate number" />
          <select value={dbs.dbs_type} onChange={(event) => setDbs((current) => ({ ...current, dbs_type: event.target.value as DbsDraft['dbs_type'] }))} className={inputClass}>
            <option value="basic" className="bg-[#0d1117]">Basic</option>
            <option value="standard" className="bg-[#0d1117]">Standard</option>
            <option value="enhanced" className="bg-[#0d1117]">Enhanced</option>
            <option value="enhanced_barred" className="bg-[#0d1117]">Enhanced with Barred Lists</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={dbs.issue_date} onChange={(event) => setDbs((current) => ({ ...current, issue_date: event.target.value, expiry_date: current.expiry_date || addYears(event.target.value, 3) }))} className={inputClass} />
            <input type="date" value={dbs.expiry_date} onChange={(event) => setDbs((current) => ({ ...current, expiry_date: event.target.value }))} className={inputClass} />
          </div>
          <input type="file" onChange={(event) => uploadCertificate(event, 'dbs')} className="text-sm text-white/40" />
        </div>
      </section>

      {message ? <p className="text-sm text-white/50">{message}</p> : null}
      <button type="submit" className="w-full rounded-full px-6 py-4 font-semibold text-black" style={{ backgroundColor: primaryColour }}>Save Compliance Profile</button>
    </form>
  );
}

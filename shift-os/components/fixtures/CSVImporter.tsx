'use client';

import { ChangeEvent, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ImportTeamOption {
  id: string;
  name: string;
}

interface CSVImporterProps {
  teams: ImportTeamOption[];
  lockedTeamId?: string;
  primaryColour: string;
  importedFrom: 'club_csv' | 'coach_csv';
}

interface FixtureImportRow {
  selected: boolean;
  date: string;
  time: string;
  type: 'match' | 'training' | 'tournament';
  is_home: boolean;
  opponent: string;
  venue: string;
  full_address: string;
  postcode: string;
  opposition_contact_name: string;
  opposition_contact_phone: string;
  coach_notes: string;
  tournify_link: string;
}

const aliases: Record<string, string[]> = {
  date: ['date', 'fixture_date', 'match date'],
  time: ['time', 'ko_time', 'kick off', 'ko'],
  opponent: ['opponent', 'opposition', 'away team', 'home team'],
  venue: ['venue', 'ground', 'location'],
  full_address: ['address', 'full address', 'ground address'],
  postcode: ['postcode', 'post code'],
  type: ['type'],
  home_away: ['home/away', 'home away', 'h/a'],
  opposition_contact_name: ['opposition contact name', 'contact name'],
  opposition_contact_phone: ['opposition contact phone', 'contact phone'],
  coach_notes: ['notes', 'coach notes'],
  tournify_link: ['tournify link', 'tournament link']
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else current += char;
  }
  cells.push(current.trim());
  return cells.map((cell) => cell.replace(/^"|"$/g, ''));
}

function findValue(headers: string[], cells: string[], key: keyof typeof aliases): string {
  const index = headers.findIndex((header) => aliases[key].includes(header.trim().toLowerCase()));
  return index >= 0 ? cells[index] ?? '' : '';
}

function toIsoDate(date: string, time: string): string | null {
  const [day, month, year] = date.split(/[/-]/);
  if (!day || !month || !year) return null;
  const parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time || '12:00'}`);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

export default function CSVImporter({ teams, lockedTeamId, primaryColour, importedFrom }: CSVImporterProps) {
  const [teamId, setTeamId] = useState(lockedTeamId ?? teams[0]?.id ?? '');
  const [rows, setRows] = useState<FixtureImportRow[]>([]);
  const [message, setMessage] = useState('');
  const selectedCount = useMemo(() => rows.filter((row) => row.selected).length, [rows]);

  function downloadTemplate() {
    const template = 'Date(DD/MM/YYYY),Time(HH:MM),Type(match/training/tournament),Home/Away(H/A),Opponent,Venue,Full Address,Postcode,Opposition Contact Name,Opposition Contact Phone,Notes,Tournify Link\n01/09/2026,10:30,match,H,Example FC,Main Pitch,1 Club Road,AB1 2CD,Alex Smith,+44 7700 000000,Arrive 30 minutes early,\n';
    const url = URL.createObjectURL(new Blob([template], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shift-os-fixture-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function parseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const lines = text.split(/\r?\n/).filter(Boolean);
      const headers = splitCsvLine(lines[0] ?? '').map((header) => header.trim().toLowerCase());
      const parsedRows: FixtureImportRow[] = lines.slice(1).map((line) => {
        const cells = splitCsvLine(line);
        const typeValue = findValue(headers, cells, 'type').toLowerCase();
        const sessionType: FixtureImportRow['type'] = typeValue === 'training' || typeValue === 'tournament' ? typeValue : 'match';
        const homeAway = findValue(headers, cells, 'home_away').toLowerCase();
        return {
          selected: true,
          date: findValue(headers, cells, 'date'),
          time: findValue(headers, cells, 'time'),
          type: sessionType,
          is_home: homeAway !== 'a' && homeAway !== 'away',
          opponent: findValue(headers, cells, 'opponent'),
          venue: findValue(headers, cells, 'venue'),
          full_address: findValue(headers, cells, 'full_address'),
          postcode: findValue(headers, cells, 'postcode'),
          opposition_contact_name: findValue(headers, cells, 'opposition_contact_name'),
          opposition_contact_phone: findValue(headers, cells, 'opposition_contact_phone'),
          coach_notes: findValue(headers, cells, 'coach_notes'),
          tournify_link: findValue(headers, cells, 'tournify_link')
        };
      });
      setRows(parsedRows);
    };
    reader.readAsText(file);
  }

  async function importRows() {
    setMessage('');
    const selectedRows = rows.filter((row) => row.selected);
    const inserts = selectedRows.flatMap((row) => {
      const sessionDate = toIsoDate(row.date, row.time);
      if (!sessionDate) return [];
      return [{
        team_id: teamId,
        type: row.type,
        title: row.type === 'match' ? null : row.opponent || row.type,
        opponent: row.type === 'match' ? row.opponent : null,
        session_date: sessionDate,
        location: row.venue || null,
        full_address: row.full_address || null,
        postcode: row.postcode || null,
        opposition_contact_name: row.opposition_contact_name || null,
        opposition_contact_phone: row.opposition_contact_phone || null,
        coach_notes: row.coach_notes || null,
        tournify_link: row.type === 'tournament' ? row.tournify_link || null : null,
        is_home: row.is_home,
        imported_from: importedFrom
      }];
    });
    const { error } = await createClient().from('sessions').insert(inserts);
    setMessage(error ? error.message : `${inserts.length} imported, ${selectedRows.length - inserts.length} skipped`);
  }

  return (
    <section className="rounded-2xl border p-5" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <p className="text-sm text-white/35">Works with Full-Time FA, Pitchero and Tournify exports. Download our template or use your existing export file.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={downloadTemplate} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">Download CSV Template</button>
        <label className="cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-black" style={{ backgroundColor: primaryColour }}>
          Upload CSV
          <input type="file" accept=".csv,text/csv" onChange={parseFile} className="hidden" />
        </label>
      </div>
      {!lockedTeamId ? (
        <select value={teamId} onChange={(event) => setTeamId(event.target.value)} className="mt-5 w-full rounded-[10px] border border-white/[0.08] bg-white/[0.04] p-3 text-white outline-none">
          {teams.map((team) => <option key={team.id} value={team.id} className="bg-[#0d1117]">{team.name}</option>)}
        </select>
      ) : null}
      {rows.length > 0 ? (
        <>
          <div className="mt-5 max-h-[360px] overflow-auto rounded-xl border border-white/[0.06]">
            {rows.map((row, index) => (
              <label key={`${row.date}-${index}`} className="grid cursor-pointer grid-cols-[auto_1fr] gap-3 border-b border-white/[0.06] p-3 text-sm text-white/55">
                <input type="checkbox" checked={row.selected} onChange={() => setRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, selected: !item.selected } : item))} />
                <span>{row.date} {row.time} / {row.type} / {row.opponent || row.venue}</span>
              </label>
            ))}
          </div>
          <button type="button" onClick={importRows} className="mt-5 w-full rounded-full px-6 py-3 font-semibold text-black" style={{ backgroundColor: primaryColour }}>Import {selectedCount} Fixtures</button>
        </>
      ) : null}
      {message ? <p className="mt-4 text-sm text-white/50">{message}</p> : null}
    </section>
  );
}

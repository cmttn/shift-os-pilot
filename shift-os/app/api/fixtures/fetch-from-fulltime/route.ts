import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

type HomeAway = 'home' | 'away' | 'neutral' | null;

interface ExtractedFixture {
  date: string | null;
  time: string | null;
  opponent: string | null;
  venue: string | null;
  home_away: HomeAway;
  type: 'match';
}

interface FullTimePayload {
  url: string;
  teamName: string;
}

function isPayload(value: unknown): value is FullTimePayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.url === 'string' && typeof record.teamName === 'string';
}

function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function includesTeamName(value: string, teamName: string): boolean {
  const haystack = normalise(value);
  const needle = normalise(teamName);
  return Boolean(needle) && (haystack.includes(needle) || needle.includes(haystack));
}

function parseDate(value: string): string | null {
  const dateMatch = value.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
  if (!dateMatch) return null;
  const day = dateMatch[1].padStart(2, '0');
  const month = dateMatch[2].padStart(2, '0');
  const rawYear = dateMatch[3];
  const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
  return `${year}-${month}-${day}`;
}

function parseTime(value: string): string | null {
  const timeMatch = value.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;
  return `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
}

function isFutureFixture(date: string | null): boolean {
  if (!date) return true;
  const parsed = new Date(`${date}T23:59:59`);
  return parsed >= new Date();
}

function findOpponent(cells: string[], teamName: string): { opponent: string | null; homeAway: HomeAway } {
  const teamCellIndex = cells.findIndex((cell) => includesTeamName(cell, teamName));
  if (teamCellIndex === -1) {
    const likelyTeamCells = cells.filter((cell) => /[A-Za-z]/.test(cell) && !parseDate(cell) && !parseTime(cell));
    return { opponent: likelyTeamCells[0] ?? null, homeAway: null };
  }

  const otherTeam = cells.find((cell, index) => (
    index !== teamCellIndex
    && /[A-Za-z]/.test(cell)
    && !parseDate(cell)
    && !parseTime(cell)
    && !includesTeamName(cell, teamName)
    && !/venue|date|time|home|away|score|competition/i.test(cell)
  ));

  const homeAway: HomeAway = teamCellIndex <= Math.max(0, cells.length - 3) ? 'home' : 'away';
  return { opponent: otherTeam ?? null, homeAway };
}

function extractRows(html: string, teamName: string): ExtractedFixture[] {
  const $ = cheerio.load(html);
  const fixtures: ExtractedFixture[] = [];
  const rows = $('table tr, .fixtures tr, .fixture-row');

  rows.each((_, row) => {
    const cells = $(row).find('td,th').map((__, cell) => $(cell).text().replace(/\s+/g, ' ').trim()).get().filter(Boolean);
    if (cells.length < 3) return;

    const joined = cells.join(' ');
    const date = parseDate(joined);
    const time = parseTime(joined) ?? '10:00';
    const { opponent, homeAway } = findOpponent(cells, teamName);
    if (!date || !opponent || !isFutureFixture(date)) return;

    const venue = cells.find((cell) => (
      !includesTeamName(cell, teamName)
      && cell !== opponent
      && !parseDate(cell)
      && !parseTime(cell)
      && /(park|school|academy|ground|stadium|field|centre|center|venue|road|lane|street|drive|close|way)/i.test(cell)
    )) ?? null;

    fixtures.push({
      date,
      time,
      opponent,
      venue,
      home_away: homeAway,
      type: 'match'
    });
  });

  const seen = new Set<string>();
  return fixtures.filter((fixture) => {
    const key = `${fixture.date}-${fixture.opponent}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function POST(request: Request) {
  const payload: unknown = await request.json();
  if (!isPayload(payload)) {
    return NextResponse.json({ error: 'Invalid payload', fixtures: [] }, { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(payload.url);
  } catch {
    return NextResponse.json({ error: 'Invalid Full-Time URL', fixtures: [] }, { status: 400 });
  }

  if (url.protocol !== 'https:' || url.hostname !== 'fulltime.thefa.com') {
    return NextResponse.json({ error: 'Invalid Full-Time URL', fixtures: [] }, { status: 400 });
  }

  try {
    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SHIFT OS Fixture Importer)' }
    });
    if (!response.ok) {
      return NextResponse.json({ fixtures: [], error: 'Could not fetch from Full-Time. Make sure the URL is correct and try again.' }, { status: 502 });
    }

    const html = await response.text();
    const fixtures = extractRows(html, payload.teamName);
    return NextResponse.json({
      fixtures,
      source: 'fulltime',
      message: fixtures.length === 0 ? 'No future fixtures found on this Full-Time page.' : undefined
    });
  } catch (error) {
    console.error('[fixtures/fetch-from-fulltime]', error);
    return NextResponse.json({ fixtures: [], error: 'Could not fetch from Full-Time. Make sure the URL is correct and try again.' }, { status: 502 });
  }
}

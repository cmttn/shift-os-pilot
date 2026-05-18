import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type HomeAway = 'home' | 'away' | 'neutral' | null;
type FixtureType = 'match' | 'training' | 'tournament';

interface ExtractedFixture {
  date: string | null;
  time: string | null;
  opponent: string | null;
  venue: string | null;
  home_away: HomeAway;
  type: FixtureType | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toHomeAway(value: unknown): HomeAway {
  if (value === 'home' || value === 'away' || value === 'neutral') return value;
  return null;
}

function toFixtureType(value: unknown): FixtureType {
  if (value === 'training' || value === 'tournament') return value;
  return 'match';
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normaliseFixture(value: unknown): ExtractedFixture | null {
  if (!isRecord(value)) return null;
  return {
    date: toNullableString(value.date),
    time: toNullableString(value.time),
    opponent: toNullableString(value.opponent),
    venue: toNullableString(value.venue),
    home_away: toHomeAway(value.home_away),
    type: toFixtureType(value.type)
  };
}

function parseFixtureJson(text: string): ExtractedFixture[] {
  const clean = text.replace(/```json|```/g, '').trim();
  const parsed: unknown = JSON.parse(clean);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normaliseFixture).filter((fixture): fixture is ExtractedFixture => Boolean(fixture));
}

function mediaTypeFor(file: File): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  if (file.type === 'image/png') return 'image/png';
  if (file.type === 'image/gif') return 'image/gif';
  if (file.type === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

function dedupeFixtures(fixtures: ExtractedFixture[]): ExtractedFixture[] {
  const seen = new Set<string>();
  const result: ExtractedFixture[] = [];
  for (const fixture of fixtures) {
    const key = `${fixture.date ?? ''}-${fixture.opponent ?? ''}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(fixture);
  }
  return result;
}

function getAnthropicApiKey(): string | null {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim().replace(/^["']|["']$/g, '');
  return apiKey || null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (isRecord(error) && typeof error.message === 'string') return error.message;
  return 'Unknown Anthropic error';
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll('images').filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: 'No images were uploaded.', fixtures: [] }, { status: 400 });
  }

  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return NextResponse.json({
      code: 'ocr_not_configured',
      error: 'Fixture screenshot scanning is not configured. Add ANTHROPIC_API_KEY in Vercel and redeploy.',
      fixtures: []
    }, { status: 503 });
  }

  const client = new Anthropic({ apiKey });
  const allFixtures: ExtractedFixture[] = [];

  try {
    for (const file of files) {
      const imageBase64 = Buffer.from(await file.arrayBuffer()).toString('base64');
      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaTypeFor(file),
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: `Extract all football fixtures from this screenshot.
Return ONLY a valid JSON array. No explanation, no markdown,
no backticks. Raw JSON only.

Each fixture:
{
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "opponent": "Team name",
  "venue": "Venue name or null",
  "home_away": "home" or "away" or "neutral" or null,
  "type": "match"
}

Rules:
- Convert all dates to YYYY-MM-DD format
- Convert all times to 24hr HH:MM format
- If year not shown assume current season (Sept 2025 to June 2026)
- Extract every fixture visible in the image
- If a field cannot be determined use null
- Return empty array [] if no fixtures found`
            }
          ]
        }]
      });

      const text = response.content
        .map((block) => block.type === 'text' ? block.text : '')
        .join('\n');
      allFixtures.push(...parseFixtureJson(text));
    }
  } catch (error) {
    console.error('[fixtures/extract-from-image]', error);
    const errorMessage = getErrorMessage(error);
    if (/api key|authentication|unauthorized/i.test(errorMessage)) {
      return NextResponse.json({
        code: 'anthropic_auth_failed',
        error: errorMessage,
        fixtures: []
      }, { status: 503 });
    }
    return NextResponse.json({ error: errorMessage, fixtures: [] }, { status: 422 });
  }

  const fixtures = dedupeFixtures(allFixtures);
  return NextResponse.json({
    fixtures,
    source: 'image',
    message: fixtures.length === 0 ? 'No fixtures found in image' : undefined
  });
}

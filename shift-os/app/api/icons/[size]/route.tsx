import { ImageResponse } from 'next/og';
import { NextResponse, type NextRequest } from 'next/server';

export const runtime = 'edge';

const supportedSizes = new Set(['192', '512']);

export async function GET(_request: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const { size: sizeParam } = await params;

  if (!supportedSizes.has(sizeParam)) {
    return NextResponse.json({ error: 'Unsupported icon size' }, { status: 404 });
  }

  const size = Number(sizeParam);

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#080a0f',
          color: '#00C851',
          display: 'flex',
          fontFamily: 'Arial, sans-serif',
          fontSize: Math.round(size * 0.62),
          fontWeight: 900,
          height: '100%',
          justifyContent: 'center',
          width: '100%'
        }}
      >
        S
      </div>
    ),
    {
      height: size,
      width: size,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    }
  );
}

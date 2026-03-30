import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const alt = 'Scout — Your TV Sidekick';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const logoBuffer = readFileSync(join(process.cwd(), 'public', 'logo.png'));
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: 'hsl(30, 20%, 97%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={140} height={140} alt="Scout" />
        <div style={{ fontSize: 72, fontWeight: 700, color: '#1c1410', marginTop: 24 }}>
          Scout
        </div>
        <div style={{ fontSize: 30, color: '#7a6a5a', fontWeight: 500, marginTop: 8 }}>
          Your TV Sidekick
        </div>
        <div
          style={{
            marginTop: 28,
            padding: '10px 24px',
            background: 'rgba(220, 100, 20, 0.1)',
            border: '1.5px solid rgba(220, 100, 20, 0.3)',
            borderRadius: 100,
            fontSize: 16,
            fontWeight: 600,
            color: '#dc6414',
            letterSpacing: '0.08em',
          }}
        >
          PRIVATE BETA
        </div>
      </div>
    ),
    { ...size }
  );
}

import { verifySession } from '@/lib/jwt';
import { AccessToken } from 'livekit-server-sdk';
import StreamerDashboard from '@/components/StreamerDashboard';
import StreamPlayer from '@/components/StreamPlayer';
import Link from 'next/link';
import { Settings } from 'lucide-react';

async function getLiveKitToken(isStreamer: boolean) {
  const roomName = 'main-stream';
  
  const participantName = isStreamer 
    ? 'Streamer' 
    : `Viewer_${Math.floor(Math.random() * 10000)}`;

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit credentials not configured');
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    name: participantName,
  });

  if (isStreamer) {
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
  } else {
    at.addGrant({ roomJoin: true, room: roomName, canPublish: false, canSubscribe: true });
  }

  return at.toJwt();
}

export default async function Home() {
  const isStreamer = await verifySession();
  
  try {
    const token = await getLiveKitToken(isStreamer);

    return (
      <main style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {!isStreamer && (
          <header style={{ 
            padding: '1rem 1.5rem', 
            background: 'var(--surface)', 
            borderBottom: '1px solid var(--surface-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Live Screen Stream</h1>
            <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a1a1aa', fontSize: '0.9rem' }}>
              <Settings size={16} /> Streamer Login
            </Link>
          </header>
        )}

        {isStreamer ? (
          <StreamerDashboard token={token} />
        ) : (
          <StreamPlayer token={token} />
        )}
      </main>
    );
  } catch (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Configuration Error</h2>
        <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>
          Please make sure your LiveKit environment variables are configured correctly in the .env.local file.
        </p>
      </div>
    );
  }
}

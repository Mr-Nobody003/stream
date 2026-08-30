import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { verifySession } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  const roomName = 'main-stream';
  
  // Create a unique participant name based on whether they are the streamer or a viewer
  const isStreamer = await verifySession();
  const participantName = isStreamer 
    ? 'Streamer' 
    : `Viewer_${Math.floor(Math.random() * 10000)}`;

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    name: participantName,
  });

  if (isStreamer) {
    // Streamer can publish tracks (audio/video/screen)
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
  } else {
    // Viewers can only subscribe (watch)
    at.addGrant({ roomJoin: true, room: roomName, canPublish: false, canSubscribe: true });
  }

  const token = await at.toJwt();
  
  return NextResponse.json({ token });
}

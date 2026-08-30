import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/ratelimit';
import { signSession, clearSession } from '@/lib/jwt';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // Rate limit: Max 5 attempts per minute per IP
  const { success } = await rateLimit(`login:${ip}`, 5, 60);
  if (!success) {
    return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
  }

  try {
    const { username, password } = await request.json();

    const validUsername = process.env.STREAMER_USERNAME;
    const validPassword = process.env.STREAMER_PASSWORD;

    if (!validUsername || !validPassword) {
      console.error('STREAMER_USERNAME or STREAMER_PASSWORD not set in environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (username === validUsername && password === validPassword) {
      await signSession();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';

// These are server-only env vars (no NEXT_PUBLIC_ prefix — never sent to the browser)
const FLAGS_API = process.env.NEXT_PUBLIC_OPTIMIZELY_FLAGS_API_URL ?? 'https://api.optimizely.com/flags/v1';
const TOKEN = process.env.NEXT_PUBLIC_OPTIMIZELY_API_TOKEN;
const PROJECT_ID = process.env.NEXT_PUBLIC_OPTIMIZELY_PROJECT_ID;

export async function GET(request: NextRequest) {
  if (!TOKEN || !PROJECT_ID) {
    return NextResponse.json(
      { error: 'Optimizely credentials not configured', unconfigured: true },
      { status: 503 }
    );
  }

  const res = await fetch(
    `${FLAGS_API}/projects/${PROJECT_ID}/flags`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/json',
      },
      // Always fetch fresh from Optimizely — caching is handled by React Query
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    const body = await res.text();
    return NextResponse.json(
      { error: `Optimizely API error: ${res.status}`, detail: body },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}

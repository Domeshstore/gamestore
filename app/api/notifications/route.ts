// app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || '';
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || '';

export async function GET(req: NextRequest) {
  const backendUrl = `${BACKEND_URL}/api/notifications/subscribe`;
  
  console.log('[SSE Proxy] Connecting to:', backendUrl);

  try {
    const backendRes = await fetch(backendUrl, {
      headers: {
        'x-api-key': BACKEND_API_KEY,
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!backendRes.ok) {
      console.error('[SSE Proxy] Backend error:', backendRes.status);
      return new NextResponse('SSE connection failed', { status: 500 });
    }

    console.log('[SSE Proxy] Connected successfully');

    // Stream the SSE response straight to the browser
    return new NextResponse(backendRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
        'X-Accel-Buffering': 'no', // Disable proxy buffering
      },
    });
  } catch (err) {
    console.error('[SSE Proxy] Error:', err);
    return new NextResponse('SSE connection error', { status: 500 });
  }
}

// OPTIONS handler untuk CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
// app/api/proxy/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;

async function forwardRequest(req: NextRequest, pathSegments: string[]) {
  // Validasi environment variables
  if (!BACKEND_URL) {
    console.error('[Proxy] BACKEND_URL is not set');
    return NextResponse.json(
      { success: false, message: 'Server configuration error: BACKEND_URL missing' },
      { status: 500 }
    );
  }

  if (!BACKEND_API_KEY) {
    console.error('[Proxy] BACKEND_API_KEY is not set');
    return NextResponse.json(
      { success: false, message: 'Server configuration error: BACKEND_API_KEY missing' },
      { status: 500 }
    );
  }

  try {
    // Build URL
    let baseUrl = `${BACKEND_URL}/api/${pathSegments.join('/')}`;
    const searchParams = req.nextUrl.search || '';
    
    // Tambahkan timestamp anti-cache untuk GET requests
    let finalUrl = baseUrl;
    if (req.method === 'GET') {
      const separator = searchParams ? '&' : '?';
      const timestamp = Date.now();
      if (searchParams) {
        // Cek apakah sudah ada parameter _t
        if (!searchParams.includes('_t=')) {
          finalUrl = `${baseUrl}${searchParams}${separator}_t=${timestamp}`;
        } else {
          finalUrl = baseUrl + searchParams;
        }
      } else {
        finalUrl = `${baseUrl}${separator}_t=${timestamp}`;
      }
    } else {
      finalUrl = baseUrl + searchParams;
    }
    
    console.log(`[Proxy] ${req.method} → ${finalUrl}`);

    // Headers yang akan dikirim ke backend
    const headers: Record<string, string> = {
      'x-api-key': BACKEND_API_KEY,
      'Accept': 'application/json',
    };

    const contentType = req.headers.get('content-type');
    let body: BodyInit | null = null;
    
    // Handle body berdasarkan tipe content
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      // KRUSIAL: Handle FormData untuk upload file
      if (contentType?.includes('multipart/form-data')) {
        // Baca sebagai FormData dan kirim langsung
        // JANGAN set Content-Type header - biar fetch yang set dengan boundary
        const formData = await req.formData();
        body = formData;
        // Hapus Content-Type dari headers (biar fetch yang generate)
        // headers['Content-Type'] tidak diset
      } 
      else if (contentType?.includes('application/json')) {
        headers['Content-Type'] = 'application/json';
        body = await req.text();
      }
      else if (contentType?.includes('application/x-www-form-urlencoded')) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        body = await req.text();
      }
      else if (contentType) {
        headers['Content-Type'] = contentType;
        body = await req.text();
      }
    }

    // Copy authorization token (JWT dari user)
    const auth = req.headers.get('authorization');
    if (auth) {
      headers['Authorization'] = auth;
    }

    // Timeout handler (60 detik untuk upload file)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    // Forward request ke backend
    const response = await fetch(finalUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log(`[Proxy] Response status: ${response.status}`);

    // Baca response body
    let responseData: any;
    const responseText = await response.text();
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    // Return response dengan anti-cache headers
    return NextResponse.json(responseData, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (err: any) {
    console.error('[Proxy Error]', err.message);
    
    if (err.name === 'AbortError') {
      return NextResponse.json(
        { success: false, message: 'Request timeout' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Proxy error: ' + err.message },
      { status: 500 }
    );
  }
}

// ─── HANDLERS ─────────────────────────────
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return forwardRequest(req, path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return forwardRequest(req, path);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return forwardRequest(req, path);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return forwardRequest(req, path);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return forwardRequest(req, path);
}

// OPTIONS handler untuk CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
      'Access-Control-Max-Age': '86400',
    },
  });
}
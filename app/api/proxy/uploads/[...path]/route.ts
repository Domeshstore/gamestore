// app/api/proxy/uploads/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;
const BACKEND_API_KEY = process.env.BACKEND_API_KEY;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = path.join('/');
    
    if (!BACKEND_URL) {
      return NextResponse.json({ error: 'Backend URL not configured' }, { status: 500 });
    }
    
    const imageUrl = `${BACKEND_URL}/uploads/${filePath}`;
    
    console.log('[Image Proxy] Fetching:', imageUrl);
    
    // KRUSIAL: Tambahkan API key ke headers
    const response = await fetch(imageUrl, {
      headers: {
        'x-api-key': BACKEND_API_KEY || '', // Tambahkan API key!
        'Accept': 'image/jpeg,image/png,image/webp,image/*',
      },
    });
    
    if (!response.ok) {
      console.error('[Image Proxy] Failed:', response.status);
      return NextResponse.json(
        { error: 'Image not found', status: response.status },
        { status: response.status }
      );
    }
    
    const imageBuffer = await response.arrayBuffer();
    
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error: any) {
    console.error('[Image Proxy Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
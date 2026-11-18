import { NextResponse } from 'next/server';
import { decodeId } from '@/lib/ids';
import { fetchFrame } from '@/lib/frames';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
+) {
  const url = decodeId(params.id);
  if (!url) {
    return NextResponse.json({ error: 'معرّف غير صالح' }, { status: 400 });
  }

  const frame = await fetchFrame(url, 5000);
  if (!frame) {
    return NextResponse.json({ error: 'الكاميرا لا تُرجع صورة' }, { status: 502 });
  }

  return new NextResponse(new Uint8Array(frame.buf), {
    status: 200,
    headers: {
      'content-type': frame.contentType,
      'content-length': String(frame.buf.length),
      'cache-control': 'public, max-age=0, s-maxage=10, stale-while-revalidate=30',
      'x-camera-src': new URL(url).host,
    },
  });
}

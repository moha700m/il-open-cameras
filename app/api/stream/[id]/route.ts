import { NextResponse } from 'next/server';
import { decodeId } from '@/lib/ids';
import { fetchFrame } from '@/lib/frames';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** عرض كامل: يفتح إطارًا مكبّرًا في تبويب جديد، ويجدّد نفسه ذاتيًا. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const url = decodeId(params.id);
  if (!url) return NextResponse.json({ error: 'معرّف غير صالح' }, { status: 400 });

  const frame = await fetchFrame(url, 6000);
  if (!frame) return NextResponse.json({ error: 'البث غير متاح' }, { status: 502 });

  return new NextResponse(new Uint8Array(frame.buf), {
    status: 200,
    headers: {
      'content-type': frame.contentType,
      'cache-control': 'no-store',
      'x-camera-src': new URL(url).host,
    },
  });
}

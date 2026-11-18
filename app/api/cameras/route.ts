import { encodeId } from '@/lib/ids';
import { dedupe, scrapeSource, type Camera } from '@/lib/sources';
import { fetchFrame } from '@/lib/frames';
import { mapLimit } from '@/lib/http';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

let cache: { at: number; data: Camera[] } | null = null;
const TTL = 5 * 60 * 1000;

async function buildList(): Promise<Camera[]> {
  const [insecam, opencctv] = await Promise.allSettled([
    scrapeSource('insecam'),
    scrapeSource('opencctv'),
  ]);

  const all = [
    ...(insecam.status === 'fulfilled' ? insecam.value : []),
    ...(opencctv.status === 'fulfilled' ? opencctv.value : []),
  ];
  const unique = dedupe(all);

  // فلتر الحياة: لا نعرض شيئًا لا نستطيع إرجاع صورة منه الآن
  const alive = await mapLimit(unique, 24, async (cam) => {
    const frame = await fetchFrame(cam.src, 4200);
    return frame ? cam : null;
  });

  return alive.filter((c): c is Camera => Boolean(c));
}

export async function GET() {
  const now = Date.now();
  if (cache && now - cache.at < TTL) {
    return NextResponse.json(
      { cameras: cache.data, cached: true, at: cache.at },
      { headers: { 'cache-control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
  }

  let data: Camera[] = [];
  try {
    data = await buildList();
  } catch {
    data = cache?.data ?? [];
  }

  if (data.length) cache = { at: now, data };
  else if (cache) data = cache.data;

  const payload = data.map((c) => ({
    id: encodeId(c.src),
    ref: c.id,
    city: c.city,
    source: c.source,
    kind: c.kind,
    page: c.page,
  }));

  return NextResponse.json(
    { cameras: payload, cached: false, at: Date.now(), total: payload.length },
    { headers: { 'cache-control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  );
}

import { BROWSER_UA } from './http';

export type Frame = { buf: Buffer; contentType: string };

const MIN_BYTES = 2500;

export function isJpeg(buf: Buffer): boolean {
  return buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8;
}

/** يستخرج أول إطار JPEG كامل من تدفّق multipart/x-mixed-replace. */
async function firstJpegFromStream(url: string, timeoutMs: number): Promise<Frame | null> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      cache: 'no-store',
      redirect: 'follow',
      headers: { 'user-agent': BROWSER_UA, accept: 'multipart/x-mixed-replace, image/jpeg, */*' },
    });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok) return null;
    if (type.includes('image/')) {
      const buf = Buffer.from(await res.arrayBuffer());
      return buf.length >= MIN_BYTES && isJpeg(buf) ? { buf, contentType: 'image/jpeg' } : null;
    }
    if (!res.body) return null;
    const reader = res.body.getReader();
    const chunks: Buffer[] = [];
    let total = 0;
    let start = -1;
    while (total < 900_000) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      chunks.push(Buffer.from(value));
      total += value.byteLength;
      const joined = Buffer.concat(chunks);
      start = joined.indexOf(Buffer.from([0xff, 0xd8]));
      if (start >= 0) {
        const end = joined.indexOf(Buffer.from([0xff, 0xd9]), start + 2);
        if (end > start + MIN_BYTES) {
          const frame = joined.subarray(start, end + 2);
          await reader.cancel().catch(() => {});
          return { buf: Buffer.from(frame), contentType: 'image/jpeg' };
        }
      }
      if (ac.signal.aborted) break;
    }
    await reader.cancel().catch(() => {});
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** يجلب إطارًا واحدًا من الكاميرا، ويرفض كل ما ليس صورة JPEG صالحة. */
export async function fetchFrame(url: string, timeoutMs = 4500): Promise<Frame | null> {
  if (/mjpg|mjpeg|stream|video|multipart/i.test(url)) {
    const streamed = await firstJpegFromStream(url, timeoutMs);
    if (streamed) return streamed;
  }
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      cache: 'no-store',
      redirect: 'follow',
      headers: { 'user-agent': BROWSER_UA, accept: 'image/jpeg, image/*, */*' },
    });
    if (!res.ok) return null;
    const type = res.headers.get('content-type') ?? '';
    if (!type.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < MIN_BYTES) return null;
    if (!isJpeg(buf) && !type.includes('png') && !type.includes('webp')) return null;
    return { buf, contentType: type.split(';')[0] };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

import { fetchText, mapLimit } from './http';
import { hashId } from './ids';

export type Camera = {
  id: string;
  src: string;
  city: string;
  brand?: string;
  source: 'insecam' | 'opencctv';
  kind: 'snapshot' | 'mjpeg';
  page?: string;
};

const CITY_RE = /Live camera in (.+?),\s*Israel/i;

function cleanImageUrl(raw: string): string | null {
  let url = raw.trim().replace(/&amp;/g, '&');
  if (!/^https?:\/\//i.test(url)) return null;
  url = url.split('#')[0];
  if (!/\/\/[^/]*\d+\.\d+\.\d+\.\d+/.test(url)) return null;
  // نحذف وسيط COUNTER ليبقى الرابط ثابتًا قابلًا للتخزين المؤقت
  url = url
    .replace(/([?&])COUNTER=\d+/gi, '$1')
    .replace(/[?&]$/, '')
    .replace(/\?&/, '?');
  return url;
}

function detectKind(url: string): 'snapshot' | 'mjpeg' {
  return /mjpg|mjpeg|stream|video|axis-cgi\/mjpg|multipart/i.test(url) ? 'mjpeg' : 'snapshot';
}

/** يستخرج سجلات insecam من HTML الصفحة. */
export function parseInsecam(html: string): Camera[] {
  const out: Camera[] = [];
  const anchorRe = /<a\b[^>]*href="([^"]*\/en\/view\/(\d+)\/?)"[^>]*>([\s\S]{0,900}?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(html))) {
    const block = m[3];
    if (!block.includes('<img')) continue;
    const imgMatch = /<img\b[^>]*src="([^"]+)"/i.exec(block);
    if (!imgMatch) continue;
    const src = cleanImageUrl(imgMatch[1]);
    if (!src) continue;
    const titleAttr = /title="([^"]*)"/i.exec(m[0])?.[1] ?? '';
    const alt = /alt="([^"]*)"/i.exec(block)?.[1] ?? '';
    const city = (CITY_RE.exec(titleAttr) || CITY_RE.exec(alt))?.[1]?.trim() || 'إسرائيل';
    out.push({
      id: `is_${m[2]}`,
      src,
      city,
      source: 'insecam',
      kind: detectKind(src),
      page: m[1].startsWith('http') ? m[1] : `http://insecam.org${m[1]}`,
    });
  }
  return out;
}

/** يستخرج سجلات opencctv من HTML الصفحة. */
export function parseOpcctv(html: string): Camera[] {
  const out: Camera[] = [];
  const re = /<a\b[^>]*href="([^"]*\/cameras\/israel\/[^"]+)"[^>]*>([\s\S]{0,1400}?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const block = m[2];
    if (!block.includes('<img')) continue;
    let src = (/<img\b[^>]*src="([^"]+)"/i.exec(block)?.[1] ?? '').trim().replace(/&amp;/g, '&');
    if (src.startsWith('/')) src = `https://opencctv.org${src}`;
    if (!/^https:\/\/opencctv\.org\/api\/feed\//i.test(src)) continue;
    const text = block
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
    const cityMatch =
      /,\s*([A-Z][A-Za-z' .-]{2,40}),\s*IL\b/.exec(text) ||
      /,\s*([A-Z][A-Za-z' .-]{2,40})\s*,\s*[A-Za-z ]*District\b/.exec(text);
    const city = cityMatch?.[1]?.trim() || 'إسرائيل';
    out.push({
      id: `oc_${hashId(m[1])}_${hashId(src)}`,
      src,
      city,
      source: 'opencctv',
      kind: 'snapshot',
      page: m[1].startsWith('http') ? m[1] : `https://opencctv.org${m[1]}`,
    });
  }
  return out;
}

export async function scrapeSource(source: 'insecam' | 'opencctv'): Promise<Camera[]> {
  const pages: string[] = [];
  if (source === 'insecam') {
    for (let n = 1; n <= 8; n++) {
      pages.push(
        n === 1 ? 'http://insecam.org/en/bycountry/IL/' : `http://insecam.org/en/bycountry/IL/?page=${n}`,
      );
    }
  } else {
    for (let n = 1; n <= 3; n++) {
      pages.push(
        n === 1 ? 'https://opencctv.org/cameras/israel' : `https://opencctv.org/cameras/israel?page=${n}`,
      );
    }
  }

  const results = await mapLimit(pages, 4, async (pageUrl) => {
    if (source === 'opencctv') {
      const res = await fetch(pageUrl, {
        cache: 'no-store',
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; il-cams/1.0)' },
      }).catch(() => null);
      if (!res || !res.ok) return [] as Camera[];
      return parseOpcctv(await res.text());
    }
    const html = await fetchText(pageUrl);
    if (!html) return [] as Camera[];
    return parseInsecam(html);
  });

  return results.flat().filter(Boolean);
}

export function dedupe(cams: Camera[]): Camera[] {
  const seenSrc = new Set<string>();
  const perCity = new Map<string, number>();
  const out: Camera[] = [];
  const sorted = [...cams].sort((a, b) =>
    a.source === b.source ? 0 : a.source === 'insecam' ? -1 : 1,
  );
  for (const c of sorted) {
    const key = c.src.replace(/^https?:/, '').toLowerCase();
    if (seenSrc.has(key)) continue;
    seenSrc.add(key);
    const n = perCity.get(c.city) ?? 0;
    if (n > 14) continue;
    perCity.set(c.city, n + 1);
    out.push(c);
  }
  return out;
}

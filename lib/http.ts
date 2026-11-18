export const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

/**
 * المصادر على http — المتصفح لا يتصل بها مباشرة، لكن سيرفر Next يصل إليها بلا مشكلة.
 * المباشر أولًا، والبروكسي العام احتياط إذا حجب المصدر عنوان السيرفر.
 */
export const PROXIES: Array<(target: string) => string> = [
  (t) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(t)}`,
  (t) => `https://api.allorigins.win/raw?url=${encodeURIComponent(t)}`,
  (t) => `https://api.cors.lol/?url=${encodeURIComponent(t)}`,
];

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const HTML_HEADERS: Record<string, string> = {
  'user-agent': BROWSER_UA,
  accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9',
  'cache-control': 'no-cache',
};

async function getOnce(url: string, timeoutMs: number): Promise<{ ok: boolean; text: string }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      cache: 'no-store',
      redirect: 'follow',
      headers: HTML_HEADERS,
    });
    if (!res.ok) return { ok: false, text: '' };
    return { ok: true, text: await res.text() };
  } catch {
    return { ok: false, text: '' };
  } finally {
    clearTimeout(timer);
  }
}

/** يقرأ صفحة HTML: مباشر ثم عبر بروكسيات احتياطية. */
export async function fetchText(target: string, timeoutMs = 8000): Promise<string | null> {
  const direct = await getOnce(target, timeoutMs);
  if (direct.ok && direct.text.length > 1500) return direct.text;

  for (const build of PROXIES) {
    const proxied = await getOnce(build(target), timeoutMs);
    if (proxied.ok && proxied.text.length > 1500) return proxied.text;
  }
  return direct.ok ? direct.text : null;
}

/** يجري عملية على قائمة بحدّ تزامن. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = new Array(Math.min(limit, items.length || 1)).fill(0).map(async () => {
    while (cursor < items.length) {
      const i = cursor++;
      try {
        out[i] = await fn(items[i], i);
      } catch {
        out[i] = undefined as unknown as R;
      }
    }
  });
  await Promise.all(workers);
  return out;
}

export const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

export const PROXIES: Array<(target: string) => string> = [
  (t) => `https://api.allorigins.win/raw?url=${encodeURIComponent(t)}`,
  (t) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(t)}`,
  (t) => `https://api.cors.lol/?url=${encodeURIComponent(t)}`,
];

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** يقرأ صفحة HTML عبر بروكسي عام (المصدر على http). */
export async function fetchText(target: string, timeoutMs = 9000): Promise<string | null> {
  for (const build of PROXIES) {
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort(), timeoutMs);
      const res = await fetch(build(target), {
        signal: ac.signal,
        cache: 'no-store',
        headers: {
          'user-agent': BROWSER_UA,
          accept: 'text/html,application/xhtml+xml',
          'accept-language': 'en-US,en;q=0.9',
        },
      });
      clearTimeout(t);
      if (!res.ok) continue;
      const text = await res.text();
      if (text && text.length > 500) return text;
    } catch {
      /* البروكسي التالي */
    }
  }
  return null;
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

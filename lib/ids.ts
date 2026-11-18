export function encodeId(url: string): string {
  return Buffer.from(url, 'utf8').toString('base64url');
}

export function decodeId(id: string): string | null {
  try {
    const url = Buffer.from(id, 'base64url').toString('utf8');
    if (!/^https?:\/\//i.test(url)) return null;
    return url;
  } catch {
    return null;
  }
}

export function hashId(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

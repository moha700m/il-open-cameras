'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type Cam = {
  id: string;
  ref: string;
  city: string;
  source: 'insecam' | 'opencctv';
  kind: 'snapshot' | 'mjpeg';
  page?: string;
};

const REFRESH_MS = 3000;
const MAX_FAILS = 3;

/** بطاقة كاميرا: تجلب إطارًا حيًا وتخفي نفسها إذا مات الجهاز. */
export default function CamCard({
  cam,
  onDead,
  index,
}: {
  cam: Cam;
  onDead: (ref: string) => void;
  index: number;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const fails = useRef(0);
  const alive = useRef(true);

  const load = useCallback(() => {
    if (!alive.current) return;
    const img = new Image();
    const bust = `/api/frame/${cam.id}?t=${Date.now()}`;
    img.onload = () => {
      fails.current = 0;
      setSrc(bust);
      setReady(true);
    };
    img.onerror = () => {
      fails.current += 1;
      if (fails.current >= MAX_FAILS) {
        alive.current = false;
        onDead(cam.ref);
      }
    };
    img.src = bust;
  }, [cam.id, cam.ref, onDead]);

  useEffect(() => {
    alive.current = true;
    fails.current = 0;
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => {
      alive.current = false;
      clearInterval(t);
    };
  }, [load]);

  return (
    <article className="card" style={{ animationDelay: `${Math.min(index, 12) * 22}ms` }}>
      <div className="shot">
        {!ready && <div className="skeleton">📹</div>}
        {src && <img src={src} alt={`كاميرا حيّة في ${cam.city}`} loading="lazy" />}
        <span className="badge-live">
          <i />
          حيّة
        </span>
      </div>
      <div className="card-body">
        <div className="city" title={cam.city}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <span>{cam.city}</span>
        </div>
        <div className="meta">
          <b>{cam.source === 'insecam' ? 'Insecam' : 'OpenCCTV'}</b>
          <b>{cam.kind === 'mjpeg' ? 'MJPEG' : 'لقطة'}</b>
        </div>
        <a
          className="btn btn-primary"
          href={`/cam/${cam.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          افتح البث
          ↗
        </a>
      </div>
    </article>
  );
}

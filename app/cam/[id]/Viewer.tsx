'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const INTERVAL = 1800;

export default function Viewer({
  id,
  host,
  src,
}: {
  id: string;
  host: string | null;
  src: string | null;
}) {
  const [frame, setFrame] = useState<string | null>(null);
  const [fails, setFails] = useState(0);
  const [paused, setPaused] = useState(false);
  const [full, setFull] = useState(false);
  const run = useRef(true);

  const pull = useCallback(() => {
    if (!run.current) return;
    const img = new Image();
    const url = `/api/stream/${id}?t=${Date.now()}`;
    img.onload = () => {
      setFrame(url);
      setFails(0);
    };
    img.onerror = () => setFails((f) => f + 1);
    img.src = url;
  }, [id]);

  useEffect(() => {
    if (paused) return;
    run.current = true;
    pull();
    const t = setInterval(pull, INTERVAL);
    return () => {
      run.current = false;
      clearInterval(t);
    };
  }, [pull, paused]);

  return (
    <div className="viewer">
      <div className="viewer-bar">
        <a className="btn" href="/">
          → القائمة
        </a>
        <span className="stat">
          <i className="dot" />
          {fails === 0 ? 'البث يعمل' : `محاولات فاشلة: ${fails}`}
        </span>
        <span className="spacer" />
        {host && <span className="stat" dir="ltr">{host}</span>}
        <button className="btn" onClick={() => setPaused((p) => !p)}>
          {paused ? '▶ استئناف' : '⏸ إيقاف مؤقت'}
        </button>
        <button className="btn btn-primary" onClick={() => setFull(true)}>
          ⛶ ملء الشاشة
        </button>
      </div>

      <div className="viewer-stage">
        {frame ? (
          <img src={frame} alt={`بث الكاميرا ${host ?? ''}`} />
        ) : (
          <div className="note">
            {src ? 'جاري الاتصال بالكاميرا…' : 'معرّف غير صالح.'}
          </div>
        )}
      </div>

      {fails >= 3 && (
        <div className="wrap" style={{ padding: 14 }}>
          <p className="note">
            الكاميرا لا تُرجع صورة الآن (قد تكون مشغولة أو أُغلقت). أعد المحاولة بعد قليل، أو
            ارجع للقائمة واختر جهازًا آخر.
          </p>
        </div>
      )}

      {full && frame && (
        <div
          onClick={() => setFull(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: '#04060c',
            display: 'grid',
            placeItems: 'center',
            zIndex: 90,
            cursor: 'zoom-out',
          }}
        >
          <img src={frame} alt="بث مكبّر" style={{ maxWidth: '100vw', maxHeight: '100vh' }} />
        </div>
      )}
    </div>
  );
}

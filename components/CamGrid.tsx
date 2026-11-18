'use client';

import CamCard, { type Cam } from './CamCard';
import { useCallback, useEffect, useMemo, useState } from 'react';

type Payload = { cameras: Cam[]; total: number };

export default function CamGrid() {
  const [cams, setCams] = useState<Cam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState('all');
  const [q, setQ] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    setError(null);
    fetch('/api/cameras')
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return (await r.json()) as Payload;
      })
      .then((d) => {
        if (cancel) return;
        setCams(d.cameras ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (cancel) return;
        setError('تعذّر جلب قائمة الكاميرات — جرّب التحديث.');
        setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [tick]);

  const onDead = useCallback((ref: string) => {
    setCams((prev) => prev.filter((c) => c.ref !== ref));
  }, []);

  const cities = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of cams) map.set(c.city, (map.get(c.city) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 9);
  }, [cams]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cams.filter(
      (c) =>
        (city === 'all' || c.city === city) &&
        (!needle ||
          c.city.toLowerCase().includes(needle) ||
          c.source.toLowerCase().includes(needle)),
    );
  }, [cams, city, q]);

  return (
    <>
      <div className="hero">
        <h1>
          كاميرات إسرائيل <em>المكشوفة</em> على الإنترنت
        </h1>
        <p>
          أجهزة تعرض صورتها بلا كلمة مرور ولا تسجيل. كل صورة هنا تُسحب الآن عبر API خاص
          يتجاوز حظر المحتوى المختلط و CORS، والكاميرا التي لا ترجع صورة تُحذف من الشبكة تلقائيًا.
          القراءة فقط — لا تعديل على إعدادات أي جهاز.
        </p>
      </div>

      <div className="tools">
        <div className="field">
          <input
            type="search"
            placeholder="ابحث باسم المدينة…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="بحث بالمدينة"
          />
        </div>
        <div className="field" style={{ maxWidth: 200 }}>
          <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="تصفية بالمدينة">
            <option value="all">كل المدن ({cams.length})</option>
            {cities.map(([c, n]) => (
              <option key={c} value={c}>
                {c} ({n})
              </option>
            ))}
          </select>
        </div>
        <button className="btn" onClick={() => setTick((t) => t + 1)} disabled={loading}>
          {loading ? 'جاري الفحص…' : 'تحديث الآن'}
        </button>
      </div>

      {cities.length > 1 && (
        <div className="chips">
          <button className="chip" aria-pressed={city === 'all'} onClick={() => setCity('all')}>
            الكل
          </button>
          {cities.map(([c, n]) => (
            <button
              key={c}
              className="chip"
              aria-pressed={city === c}
              onClick={() => setCity(c)}
            >
              {c} <span style={{ opacity: 0.6 }}>{n}</span>
            </button>
          ))}
        </div>
      )}

      {loading && cams.length === 0 && (
        <div className="loading-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="empty">
          <b>خطأ في الاتصال</b>
          {error}
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => setTick((t) => t + 1)}>
              إعادة المحاولة
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="grid">
          {shown.map((c, i) => (
            <CamCard key={c.ref} cam={c} onDead={onDead} index={i} />
          ))}
          {shown.length === 0 && (
            <div className="empty">
              <b>لا نتائج مطابقة</b>
              جرّب مدينة أخرى أو أعد التحديث لفحص الأجهزة من جديد.
            </div>
          )}
        </div>
      )}
    </>
  );
}

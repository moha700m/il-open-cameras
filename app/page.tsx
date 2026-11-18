import CamGrid from '@/components/CamGrid';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <>
      <header className="site-head">
        <div className="wrap head-row">
          <a className="brand" href="/">
            <span className="brand-badge">📹</span>
            <span>
              كاميرات مفتوحة
              <small>إسرائيل — وصول مباشر بلا كلمة مرور</small>
            </span>
          </a>
          <span className="spacer" />
          <span className="stat">
            <i className="dot" />
            فلتر الحياة مُفعّل
          </span>
        </div>
      </header>

      <main className="wrap">
        <CamGrid />
      </main>

      <footer className="site-foot">
        <div className="wrap">
          المصادر: <a href="http://insecam.org/en/bycountry/IL/" target="_blank" rel="noopener">Insecam</a>{' '}
          و{' '}
          <a href="https://opencctv.org/cameras/israel" target="_blank" rel="noopener">
            OpenCCTV
          </a>
          . الصور تُمرّر عبر سيرفرنا لأن الأجهزة تعمل على HTTP والموقع على HTTPS. الكاميرا التي
          تتوقف عن إرجاع صورة تُستبعد تلقائيًا بعد ثلاث محاولات.
        </div>
      </footer>
    </>
  );
}

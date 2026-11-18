import type { Metadata } from 'next';
import { decodeId } from '@/lib/ids';
import Viewer from './Viewer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'بث مباشر — كاميرات مفتوحة',
  description: 'عرض مكبّر لكاميرا مفتوحة، يُحدّث الإطار تلقائيًا عبر بروكسي.',
};

export default function CamPage({ params }: { params: { id: string } }) {
  const src = decodeId(params.id);
  const host = src ? new URL(src).host : null;
  return <Viewer id={params.id} host={host} src={src} />;
}

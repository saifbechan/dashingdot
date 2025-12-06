'use client';

import dynamic from 'next/dynamic';

const PhaserComponent = dynamic(() => import('@/components/PhaserComponent'), {
  ssr: false,
});

export default function Page() {
  return <PhaserComponent />;
}

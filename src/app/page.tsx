'use client';

import Dashboard from '@/components/Dashboard';
import dynamic from 'next/dynamic';

const PhaserComponent = dynamic(() => import('@/components/PhaserComponent'), {
  ssr: false,
});

export default function Page() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#01040a]">
      {/* Game Area - Centered in remaining space */}
      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <PhaserComponent />
      </div>

      {/* Dashboard - Fixed Sidebar on the right */}
      <div className="w-[400px] flex-shrink-0 border-l border-white/5">
        <Dashboard />
      </div>
    </div>
  );
}

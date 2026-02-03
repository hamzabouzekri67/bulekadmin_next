// app/dashboard/zones/page.tsx
'use client'
import dynamic from 'next/dynamic';

// استيراد المكون بشكل ديناميكي مع تعطيل SSR
const MapZoneNoSSR = dynamic(() => import('../components/MapComponent'), { 
  ssr: false,
  loading: () => <p>Chargement de la carte (Leaflet)...</p>
});

export default function ZonesPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">تحديد مناطق التوصيل</h1>
      <div className="rounded-xl overflow-hidden border">
        <MapZoneNoSSR />
      </div>
    </div>
  );
}
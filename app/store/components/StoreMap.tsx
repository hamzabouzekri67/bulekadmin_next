// components/StoreMap.tsx
"use client";

import { useState, useEffect } from "react";
import { APIProvider, Map, Marker, MapMouseEvent } from "@vis.gl/react-google-maps";
import { Navigation } from "lucide-react"; 

interface StoreMapProps {
  coordinates: { lat: number; lng: number } | null;
  setCoordinates: (coords: { lat: number; lng: number }) => void;
}

export default function StoreMap({ coordinates, setCoordinates }: StoreMapProps) {
  const defaultCenter = { lat: 35.4147, lng: 7.1444 }; 
  const [mapCenter, setMapCenter] = useState(coordinates || defaultCenter);

  // 💡 حل مشكلة التجميد عند تحديث الإحداثيات من الأب
  useEffect(() => {
    if (coordinates) {
      setMapCenter(coordinates);
    }
  }, [coordinates]);

  const handleMapClick = (e: MapMouseEvent) => {
    if (e.detail.latLng) {
      setCoordinates({
        lat: e.detail.latLng.lat,
        lng: e.detail.latLng.lng,
      });
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoordinates(currentCoords);
          setMapCenter(currentCoords);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("يرجى السماح للمتصفح بالوصول إلى موقعك الحالي.");
        }
      );
    } else {
      alert("متصفحك لا يدعم خاصية تحديد الموقع الجغرافي.");
    }
  };

  return (
    // ✅ إضافة touch-action: none و select-none لمنع المتصفح من حظر سحب الخريطة
    <div className="w-full h-full relative select-none touch-action-none">
      
      {/* زر تحديد الموقع الحالي */}
      <button
        type="button"
        onClick={handleGetCurrentLocation}
        className="absolute top-3 right-3 z-30 bg-white text-gray-750 p-2.5 rounded-xl shadow-md border border-gray-200 hover:bg-gray-50 active:scale-95 transition flex items-center gap-1.5 text-xs font-bold"
      >
        <Navigation size={15} className="text-red-500 fill-red-500" />
        تحديد موقعي الحالي
      </button>

      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
        <Map
          style={{ width: "100%", height: "100%" }}
          center={mapCenter} 
          defaultZoom={14}
          
          // 💡 تغيير الإعدادات لتصبح متوافقة تماماً مع السحب العادي والموبايل
          gestureHandling={"auto"} 
          disableDefaultUI={false}
          
          // تأكيد تشغيل عناصر السحب والتحريك صراحة
          draggable={true}
          keyboardShortcuts={false}
          
          fullscreenControl={false} // معطل لأننا قمنا ببناء مودال مخصص في الأب
          zoomControl={true}
          streetViewControl={false}
          mapTypeControl={false}
          
          // تحديث المركز عند قيام المستخدم بسحب الخريطة بنفسه لمنع ارتدادها
          onCenterChanged={(e) => {
            if (e.map) {
              const center = e.map.getCenter();
              if (center) {
                setMapCenter({ lat: center.lat(), lng: center.lng() });
              }
            }
          }}
          onClick={handleMapClick}
        >
          {coordinates && (
            <Marker 
              position={coordinates} 
              clickable={true}
            />
          )}
        </Map>
      </APIProvider>
    </div>
  );
}
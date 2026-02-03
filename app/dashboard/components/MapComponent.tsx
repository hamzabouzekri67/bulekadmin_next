'use client'
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { LatLngExpression, Map as LeafletMap, Polygon } from 'leaflet';
import { useEffect, useState } from 'react';
// استيراد النوع الخاص بحدث الرسم
//import { L } from 'leaflet'; 

export default function MapComponent() {
  const position: LatLngExpression = [35.4147, 7.1420];
  const [map, setMap] = useState<LeafletMap | null>(null);

  useEffect(() => {
    if (map) {
      setTimeout(() => { map.invalidateSize(); }, 100);
    }
  }, [map]);

  // تحديد النوع الصحيح للحدث بدلاً من any
  const _onCreated = (e: { layerType: string; layer: L.Layer }) => {
    const { layerType, layer } = e;

    if (layerType === 'polygon') {
      const polygonLayer = layer as Polygon;
      // الحصول على الإحداثيات (تكون عادة مصفوفة من المصفوفات)
      const coordinates = polygonLayer.getLatLngs();
      
      console.log("النقاط المرسومة:", coordinates);
      
      // مثال لإرسال البيانات
      // handleSaveZone(coordinates);
    }
  };

  return (
    <div style={{ height: "600px", width: "100%", position: "relative" }}>
      <MapContainer 
        center={position} 
        zoom={12} 
        style={{ height: "100%", width: "100%" }}
        ref={setMap}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FeatureGroup>
          <EditControl
            position='topright'
            onCreated={_onCreated}
            draw={{
              rectangle: false,
              circle: false,
              polyline: false,
              marker: false,
              circlemarker: false
            }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}
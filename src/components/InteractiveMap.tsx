import React, { useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { Property } from '../types';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// TrafficLayer component
const TrafficLayerComponent = () => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
    return () => trafficLayer.setMap(null);
  }, [map]);
  return null;
};

interface InteractiveMapProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  buttonLabel?: string;
}

const DEFAULT_CENTER = { lat: 34.8021, lng: 38.9968 };

export default function InteractiveMap({ properties, onSelectProperty, buttonLabel = "حجز موعد معاينة" }: InteractiveMapProps) {
  if (!hasValidKey) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f9fafb' }}>
        <div style={{ textAlign: 'center', maxWidth: 520, padding: 20 }}>
          <h2>Google Maps API Key Required</h2>
          <p><strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener">Get an API Key</a></p>
          <p><strong>Step 2:</strong> Add your key as a secret in AI Studio:</p>
          <ul style={{ textAlign: 'left', lineHeight: '1.8' }}>
            <li>Open <strong>Settings</strong> (⚙️ gear icon, <strong>top-right corner</strong>)</li>
            <li>Select <strong>Secrets</strong></li>
            <li>Type <code>GOOGLE_MAPS_PLATFORM_KEY</code> as the secret name, press <strong>Enter</strong></li>
            <li>Paste your API key as the value, press <strong>Enter</strong></li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <Map
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={7}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%', minHeight: '500px' }}
      >
        <TrafficLayerComponent />
        {properties.map((property) => (
          <AdvancedMarker
            key={property.id}
            position={{ lat: property.coordinates[0], lng: property.coordinates[1] }}
            title={property.title}
            onClick={() => onSelectProperty(property)}
          >
            <Pin background={property.type === 'Commercial' ? '#EF4444' : property.type === 'Land' ? '#10B981' : '#3B82F6'} />
          </AdvancedMarker>
        ))}
      </Map>
    </APIProvider>
  );
}

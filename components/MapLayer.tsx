
import React, { useEffect, useRef } from 'react';

declare const L: any;

interface MapLayerProps {
  center: { lat: number; lng: number };
  points?: { lat: number; lng: number; label?: string; type?: 'incident' | 'history' | 'current' }[];
  path?: { lat: number; lng: number }[];
  zoom?: number;
  className?: string;
}

const MapLayer: React.FC<MapLayerProps> = ({ center, points = [], path = [], zoom = 15, className = "h-64 w-full" }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || typeof L === 'undefined') return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([center.lat, center.lng], zoom);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(mapInstance.current);
      
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);
    } else {
      mapInstance.current.setView([center.lat, center.lng], zoom);
    }

    // Clear existing layers
    mapInstance.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        mapInstance.current.removeLayer(layer);
      }
    });

    // Add path if provided
    if (path.length > 1) {
      const latlngs = path.map(p => [p.lat, p.lng]);
      L.polyline(latlngs, { color: '#8b5cf6', weight: 4, opacity: 0.6, dashArray: '5, 10' }).addTo(mapInstance.current);
    }

    // Add markers
    points.forEach(p => {
      const color = p.type === 'incident' ? '#ef4444' : (p.type === 'current' ? '#8b5cf6' : '#94a3b8');
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 12px; height: 12px; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      });

      const marker = L.marker([p.lat, p.lng], { icon }).addTo(mapInstance.current);
      if (p.label) {
        marker.bindPopup(`<div class="text-xs font-bold">${p.label}</div>`);
      }
    });

    return () => {
      // We keep the instance alive but clean up if unmounted by React
    };
  }, [center, points, path, zoom]);

  return <div ref={mapRef} className={className} />;
};

export default MapLayer;

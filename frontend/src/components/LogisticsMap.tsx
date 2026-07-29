"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, CheckCircle } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default marker icons in Next.js
const customIcon = (icon: React.ReactNode, colorClass: string) => {
  const iconMarkup = renderToStaticMarkup(
    <div className={`w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center ${colorClass}`}>
      {icon}
    </div>
  );
  
  return L.divIcon({
    html: iconMarkup,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const pickupIcon = customIcon(<MapPin className="w-5 h-5 text-white" />, "bg-indigo-600");
const deliveryIcon = customIcon(<CheckCircle className="w-5 h-5 text-white" />, "bg-emerald-500");

interface LogisticsMapProps {
  pickupCoords?: [number, number];
  deliveryCoords?: [number, number];
}

export default function LogisticsMap({ pickupCoords, deliveryCoords }: LogisticsMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-slate-400">Loading Map...</div>;

  const defaultPickup: [number, number] = pickupCoords || [28.6139, 77.2090];
  const defaultDelivery: [number, number] = deliveryCoords || [28.5355, 77.3910];

  // Calculate center between the two points
  const center: [number, number] = [
    (defaultPickup[0] + defaultDelivery[0]) / 2,
    (defaultPickup[1] + defaultDelivery[1]) / 2,
  ];

  return (
    <MapContainer 
      center={center} 
      zoom={11} 
      style={{ height: '100%', width: '100%', zIndex: 1 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <Marker position={defaultPickup} icon={pickupIcon}>
        <Popup>
          <div className="font-bold text-slate-800">Pickup Location</div>
        </Popup>
      </Marker>

      <Marker position={defaultDelivery} icon={deliveryIcon}>
        <Popup>
          <div className="font-bold text-slate-800">Delivery Destination</div>
        </Popup>
      </Marker>

      <Polyline 
        positions={[defaultPickup, defaultDelivery]} 
        color="#6366f1" 
        weight={4} 
        dashArray="10, 10" 
      />
    </MapContainer>
  );
}

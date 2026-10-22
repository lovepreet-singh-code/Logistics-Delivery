"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js + Leaflet
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2769/2769339.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'hue-rotate-[120deg] filter', // green tint
});

const iconTruck = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'hue-rotate-[240deg] filter', // blue tint
});

interface TrackingMapProps {
  orderData?: any;
  driverLocation?: { lat: number; lng: number } | null;
  orders?: any[];
  vehicles?: any[];
}

export default function TrackingMap({
  orderData,
  driverLocation,
  orders = [],
  vehicles = [],
}: TrackingMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-slate-900 text-slate-400 font-medium text-sm">
        Initializing map...
      </div>
    );
  }

  // Determine map center
  let center: [number, number] = [28.6139, 77.2090]; // Delhi default
  if (driverLocation && driverLocation.lat && driverLocation.lng) {
    center = [driverLocation.lat, driverLocation.lng];
  } else if (orderData?.deliveryAddress?.lat && orderData?.deliveryAddress?.lng) {
    center = [orderData.deliveryAddress.lat, orderData.deliveryAddress.lng];
  } else if (orderData?.sender?.lat && orderData?.sender?.lng) {
    center = [orderData.sender.lat, orderData.sender.lng];
  } else if (orders.length > 0 && orders[0].location?.lat) {
    center = [orders[0].location.lat, orders[0].location.lng];
  }

  return (
    <div className="w-full h-full min-h-[400px] rounded-xl overflow-hidden shadow-lg border border-slate-700/50">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Customer Tracking: Delivery Destination */}
        {orderData?.deliveryAddress?.lat && orderData?.deliveryAddress?.lng && (
          <Marker
            position={[orderData.deliveryAddress.lat, orderData.deliveryAddress.lng]}
            icon={destinationIcon}
          >
            <Popup>
              <div className="text-xs font-sans">
                <strong className="text-slate-900 block mb-1">Destination</strong>
                <span className="text-slate-600">
                  {orderData.deliveryAddress.fullAddress || "Delivery Address"}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Customer Tracking: Live Driver Location */}
        {driverLocation && driverLocation.lat && driverLocation.lng && (
          <Marker
            position={[driverLocation.lat, driverLocation.lng]}
            icon={driverIcon}
          >
            <Popup>
              <div className="text-xs font-sans">
                <strong className="text-indigo-600 block mb-1">Live Tracking</strong>
                <span className="text-slate-700">Delivery Agent is en route</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Fleet / Admin Tracking Fallbacks */}
        {vehicles.map((v, i) => (
          v.currentLocation?.lat && v.currentLocation?.lng && (
            <Marker
              key={`v-${i}`}
              position={[v.currentLocation.lat, v.currentLocation.lng]}
              icon={iconTruck}
            >
              <Popup>
                <div className="text-xs font-bold">{v.registrationNumber}</div>
                <div className="text-xs">Status: {v.status}</div>
              </Popup>
            </Marker>
          )
        ))}

        {orders.map((o, i) => {
          if (!o.location?.lat || !o.location?.lng) return null;
          return (
            <Marker key={`o-${i}`} position={[o.location.lat, o.location.lng]} icon={defaultIcon}>
              <Popup>
                <div className="text-xs font-bold text-slate-900">{o.orderId}</div>
                <div className="text-xs text-slate-700">Status: {o.status}</div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

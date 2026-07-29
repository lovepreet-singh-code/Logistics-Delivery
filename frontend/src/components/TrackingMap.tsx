"use client";

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js + Leaflet
const iconTruck = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', // We can use custom icons later
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'hue-rotate-[240deg] filter' // make it look blue/indigo
});

const iconBox = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'hue-rotate-[120deg] filter' // make it look green
});

export default function TrackingMap({ orders, vehicles }: { orders: any[], vehicles: any[] }) {
  // Center roughly in India
  const center: [number, number] = [20.5937, 78.9629];

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden shadow-xl border border-slate-800">
      <MapContainer 
        center={center} 
        zoom={5} 
        scrollWheelZoom={true} 
        className="w-full h-full"
        style={{ background: '#0f172a' }} // Dark theme fallback
      >
        {/* Dark mode map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Vehicles */}
        {vehicles.map((v, i) => (
          v.currentLocation && v.currentLocation.lat && v.currentLocation.lng && (
            <Marker key={`v-${i}`} position={[v.currentLocation.lat, v.currentLocation.lng]} icon={iconTruck}>
              <Popup className="bg-slate-900 border border-slate-800 text-slate-200">
                <div className="font-bold">{v.registrationNumber}</div>
                <div className="text-sm">Status: {v.status}</div>
                <div className="text-sm">Capacity: {v.capacity.weight}kg</div>
              </Popup>
            </Marker>
          )
        ))}

        {/* Orders (Mock coordinates for demo if they don't have them) */}
        {orders.map((o, i) => {
          // If we don't have exact lat/lng in order model yet, we can scatter them for the demo based on the center.
          // Realistically, these would come from order.deliveryAddress.lat/lng
          const lat = o.location?.lat || center[0] + (Math.random() - 0.5) * 10;
          const lng = o.location?.lng || center[1] + (Math.random() - 0.5) * 10;
          return (
            <Marker key={`o-${i}`} position={[lat, lng]} icon={iconBox}>
              <Popup>
                <div className="font-bold text-slate-900">{o.orderId}</div>
                <div className="text-sm text-slate-700">Status: {o.status}</div>
                <div className="text-sm text-slate-700">Rev: ₹{o.pricing?.total}</div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

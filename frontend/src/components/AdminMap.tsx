"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Truck, Warehouse, Package } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

// Custom Icon generator using Lucide Icons
const createCustomIcon = (iconElement: JSX.Element, colorClass: string) => {
  const iconMarkup = renderToStaticMarkup(
    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg ${colorClass}`}>
      {iconElement}
    </div>
  );
  return L.divIcon({
    html: iconMarkup,
    className: "bg-transparent",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const vehicleIcon = createCustomIcon(<Truck className="w-4 h-4 text-white" />, "bg-indigo-500");
const hubIcon = createCustomIcon(<Warehouse className="w-4 h-4 text-white" />, "bg-emerald-500");
const orderIcon = createCustomIcon(<Package className="w-4 h-4 text-white" />, "bg-amber-500");

export default function AdminMap() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Fix leafet icon issues
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-[400px] bg-slate-900/50 rounded-3xl animate-pulse"></div>;
  }

  // Mock coordinates for Mumbai
  const hubs = [
    { id: 1, name: "Mumbai Central Hub", position: [19.0760, 72.8777] as [number, number] },
    { id: 2, name: "Andheri Sort Facility", position: [19.1136, 72.8697] as [number, number] }
  ];

  const vehicles = [
    { id: 'V-101', name: "Driver Rahul", position: [19.0850, 72.8850] as [number, number] },
    { id: 'V-102', name: "Driver Amit", position: [19.1000, 72.8750] as [number, number] },
    { id: 'V-103', name: "Driver Priya", position: [19.0600, 72.8900] as [number, number] }
  ];

  const orders = [
    { id: 'ORD-991', position: [19.0950, 72.8650] as [number, number] },
    { id: 'ORD-992', position: [19.0800, 72.8950] as [number, number] }
  ];

  return (
    <div className="w-full h-[400px] rounded-3xl overflow-hidden border border-slate-800 relative shadow-xl z-0">
      <MapContainer 
        center={[19.0900, 72.8777]} 
        zoom={12} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%", background: "#0f172a" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="bottomright" />

        {hubs.map((hub) => (
          <Marker key={hub.id} position={hub.position} icon={hubIcon}>
            <Popup>
              <div className="font-bold text-slate-800">{hub.name}</div>
              <div className="text-xs text-slate-500">Active Sort Facility</div>
            </Popup>
          </Marker>
        ))}

        {vehicles.map((v) => (
          <Marker key={v.id} position={v.position} icon={vehicleIcon}>
            <Popup>
              <div className="font-bold text-slate-800">{v.name}</div>
              <div className="text-xs text-slate-500">In Transit • {v.id}</div>
            </Popup>
          </Marker>
        ))}

        {orders.map((o) => (
          <Marker key={o.id} position={o.position} icon={orderIcon}>
            <Popup>
              <div className="font-bold text-slate-800">Pending Pickup</div>
              <div className="text-xs text-slate-500">{o.id}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

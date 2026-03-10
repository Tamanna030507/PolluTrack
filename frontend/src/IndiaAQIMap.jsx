import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 🔥 IMPORTANT FIX
window.L = L;
require("leaflet.heat");

// ---------------- CITY DATA ----------------
const cities = [
  { name: "Delhi", lat: 28.6139, lon: 77.209, aqi: 240 },
  { name: "Mumbai", lat: 19.076, lon: 72.8777, aqi: 120 },
  { name: "Chennai", lat: 13.0827, lon: 80.2707, aqi: 110 },
  { name: "Bengaluru", lat: 12.9716, lon: 77.5946, aqi: 90 },
  { name: "Hyderabad", lat: 17.385, lon: 78.4867, aqi: 160 },
  { name: "Pune", lat: 18.5204, lon: 73.8567, aqi: 120 },
  { name: "Ahmedabad", lat: 23.0225, lon: 72.5714, aqi: 210 },
  { name: "Jaipur", lat: 26.9124, lon: 75.7873, aqi: 240 },
  { name: "Lucknow", lat: 26.8467, lon: 80.9462, aqi: 260 },
  { name: "Patna", lat: 25.5941, lon: 85.1376, aqi: 280 },
  { name: "Indore", lat: 22.7196, lon: 75.8577, aqi: 170 },
  { name: "Bhopal", lat: 23.2599, lon: 77.4126, aqi: 150 },
  { name: "Chandigarh", lat: 30.7333, lon: 76.7794, aqi: 135 }
];

// ---------------- AQI COLOR LOGIC ----------------
const getColor = (aqi) => {
  if (aqi <= 50) return "#2ecc71";
  if (aqi <= 100) return "#f1c40f";
  if (aqi <= 200) return "#e67e22";
  return "#e74c3c";
};

// ---------------- HEATMAP LAYER ----------------
function HeatmapLayer() {
  const map = useMap();

  useEffect(() => {
    const heatData = cities.map(city => [
      city.lat,
      city.lon,
      city.aqi
    ]);

    const heatLayer = L.heatLayer(heatData, {
      radius: 45,
      blur: 30,
      maxZoom: 7,
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map]);

  return null;
}

// ---------------- MAIN COMPONENT ----------------
export default function IndiaAQIMap() {
  return (
    <MapContainer
      center={[22.5937, 78.9629]}
      zoom={5}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <HeatmapLayer />

      {cities.map((city, index) => (
        <CircleMarker
          key={index}
          center={[city.lat, city.lon]}
          radius={8}
          fillColor={getColor(city.aqi)}
          color="#000"
          weight={1}
          fillOpacity={0.9}
        >
          <Tooltip>
            <strong>{city.name}</strong><br />
            AQI: {city.aqi}
          </Tooltip>
        </CircleMarker>

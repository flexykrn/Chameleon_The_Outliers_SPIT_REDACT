"use client";

import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * MapZone props:
 * - zones: single zone object or array of zones
 * - initialZoom, mapHeight
 *
 * This version fixes the "iconUrl not set" runtime error by explicitly
 * setting L.Icon.Default URLs to CDN-hosted images.
 */

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !bounds || bounds.length === 0) return;
    try {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } catch (err) {
      const first = bounds[0];
      map.setView(first, map.getZoom());
    }
  }, [map, bounds]);
  return null;
}

export default function MapZone({ zones = [], initialZoom = 6, mapHeight = "320px" }) {
  const zoneArray = useMemo(() => (Array.isArray(zones) ? zones : [zones]), [zones]);

  // --- Fix: explicitly set default icon URLs (CDN) to avoid bundler issues ---
  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined") return;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
  }, []);

  // Build bounds
  const bounds = useMemo(() => {
    const pts = [];
    zoneArray.forEach((z) => {
      if (!z || typeof z.lat !== "number" || typeof z.lng !== "number") return;
      pts.push([z.lat, z.lng]);
      if (z.radius && z.radius > 0) {
        const metersToDegrees = (m) => m / 111320;
        const delta = metersToDegrees(z.radius);
        pts.push([z.lat + delta, z.lng + delta]);
        pts.push([z.lat - delta, z.lng - delta]);
      }
    });
    return pts;
  }, [zoneArray]);

  const center =
    zoneArray.length && zoneArray[0] && typeof zoneArray[0].lat === "number"
      ? [zoneArray[0].lat, zoneArray[0].lng]
      : [20.5937, 78.9629];

  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tileAttribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <div style={{ height: mapHeight, width: "100%" }} className="rounded-md border-3 overflow-hidden">
      <MapContainer center={center} zoom={initialZoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution={tileAttribution} url={tileUrl} />

        {bounds.length > 0 && <FitBounds bounds={bounds} />}

        {zoneArray.map((z, idx) => {
          if (!z || typeof z.lat !== "number" || typeof z.lng !== "number") return null;
          const rad = typeof z.radius === "number" ? z.radius : 500;
          const color = z.color || "rgba(240,196,25,0.9)";
          return (
            <React.Fragment key={z.id ?? idx}>
              <Marker position={[z.lat, z.lng]} />
              <Circle
                center={[z.lat, z.lng]}
                radius={rad}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.12, weight: 2 }}
              />
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}

// Живая карта Петропавловска: OpenStreetMap через Leaflet (бесплатно, без ключа).
// Точки ставятся по latitude и longitude из базы — ровно туда, где место в городе.
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Cleanup, Spot } from "../types";
import { plannedCleanupFor, spotState } from "../utils";
import { ZoomInIcon, ZoomOutIcon } from "./Icons";

// Центр Петропавловска
const CENTER: L.LatLngTuple = [54.8667, 69.15];
const START_ZOOM = 13;

interface Props {
  spots: Spot[];
  cleanups: Cleanup[];
  onSpotClick?: (spot: Spot) => void;
  picking?: boolean;
  picked?: { latitude: number; longitude: number } | null;
  onPick?: (p: { latitude: number; longitude: number }) => void;
  // Оставлено для совместимости со старой схемой: живая карта всегда заполняет блок
  fit?: "slice" | "meet";
}

function markerIcon(state: "dirty" | "planned" | "clean", count?: number) {
  const size = state === "planned" ? 30 : 22;
  return L.divIcon({
    className: "tm-marker-wrap",
    html: `<div class="tm-marker tm-${state}" style="width:${size}px;height:${size}px">${count ?? ""}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const pickedIcon = L.divIcon({
  className: "tm-marker-wrap",
  html: `<div class="tm-pin"><span></span></div>`,
  iconSize: [28, 38],
  iconAnchor: [14, 38],
});

export function CityMap({ spots, cleanups, onSpotClick, picking, picked, onPick }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const pickedRef = useRef<L.Marker | null>(null);
  const fittedRef = useRef(false);

  // Свежие колбэки без пересоздания карты
  const cb = useRef({ onSpotClick, onPick, picking });
  cb.current = { onSpotClick, onPick, picking };

  // Создаём карту один раз
  useEffect(() => {
    const host = hostRef.current!;
    const map = L.map(host, { zoomControl: false, attributionControl: true }).setView(CENTER, START_ZOOM);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);
    map.attributionControl.setPrefix(false);
    markersRef.current = L.layerGroup().addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (cb.current.picking && cb.current.onPick) {
        cb.current.onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      }
    });
    mapRef.current = map;

    // Карта живёт внутри гибких блоков — пересчитываем размер, когда блок меняется
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(host);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Точки мест
  useEffect(() => {
    const group = markersRef.current;
    if (!group) return;
    group.clearLayers();
    for (const spot of spots) {
      const state = spotState(spot, cleanups);
      const cleanup = plannedCleanupFor(spot, cleanups);
      const m = L.marker([spot.latitude, spot.longitude], {
        icon: markerIcon(state, cleanup?.participants),
        keyboard: true,
        title: spot.title,
      });
      m.on("click", () => {
        if (!cb.current.picking) cb.current.onSpotClick?.(spot);
      });
      group.addLayer(m);
    }
    // Первый раз показываем все места сразу
    if (!fittedRef.current && spots.length > 0 && mapRef.current) {
      fittedRef.current = true;
      const bounds = L.latLngBounds(spots.map((s) => [s.latitude, s.longitude] as L.LatLngTuple));
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [spots, cleanups]);

  // Новая точка при выборе места
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    pickedRef.current?.remove();
    pickedRef.current = null;
    if (picked) {
      pickedRef.current = L.marker([picked.latitude, picked.longitude], { icon: pickedIcon, interactive: false }).addTo(map);
    }
  }, [picked]);

  return (
    <div className={picking ? "map picking" : "map"}>
      <div ref={hostRef} className="leaflet-host" role="region" aria-label="Карта Петропавловска с отмеченными местами" />

      {!picking && (
        <div className="legend">
          <span><i style={{ background: "var(--red)" }} />Грязно</span>
          <span><i style={{ background: "var(--amber)" }} />Уборка назначена</span>
          <span><i style={{ background: "var(--green)" }} />Убрано</span>
        </div>
      )}
      <div className="zoom">
        <button onClick={() => mapRef.current?.zoomIn()} aria-label="Приблизить"><ZoomInIcon /></button>
        <button onClick={() => mapRef.current?.zoomOut()} aria-label="Отдалить"><ZoomOutIcon /></button>
      </div>
    </div>
  );
}

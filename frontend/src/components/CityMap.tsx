// Схема карты Петропавловска для прототипа.
// В настоящей версии здесь будет живая карта (Leaflet или 2GIS),
// а точки останутся теми же: у каждой есть latitude и longitude.
import { useRef, useState, type PointerEvent } from "react";
import type { Cleanup, Spot } from "../types";
import { plannedCleanupFor, spotState } from "../utils";
import { ZoomInIcon, ZoomOutIcon } from "./Icons";

// Границы схемы в градусах
const BOUNDS = { north: 54.91, south: 54.83, west: 69.08, east: 69.2 };
const W = 400;
const H = 460;

export function toXY(lat: number, lng: number) {
  return {
    x: ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * W,
    y: ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * H,
  };
}
export function toLatLng(x: number, y: number) {
  return {
    latitude: BOUNDS.north - (y / H) * (BOUNDS.north - BOUNDS.south),
    longitude: BOUNDS.west + (x / W) * (BOUNDS.east - BOUNDS.west),
  };
}

const COLORS = { dirty: "var(--red)", planned: "var(--amber)", clean: "var(--green)" };

interface Props {
  spots: Spot[];
  cleanups: Cleanup[];
  onSpotClick?: (spot: Spot) => void;
  picking?: boolean;
  picked?: { latitude: number; longitude: number } | null;
  onPick?: (p: { latitude: number; longitude: number }) => void;
  // "slice" — карта заполняет экран телефона, "meet" — видна целиком (компьютер)
  fit?: "slice" | "meet";
}

export function CityMap({ spots, cleanups, onSpotClick, picking, picked, onPick, fit = "slice" }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, w: W, h: H });
  const drag = useRef<{ px: number; py: number; vx: number; vy: number; moved: boolean } | null>(null);

  const k = view.w / W; // чтобы точки не меняли размер при зуме

  function svgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  }

  function clampView(v: typeof view) {
    return {
      ...v,
      x: Math.min(Math.max(v.x, -300), W - v.w + 300),
      y: Math.min(Math.max(v.y, -300), H - v.h + 300),
    };
  }

  function zoom(factor: number) {
    setView((v) => {
      const w = Math.min(W, Math.max(W / 3.5, v.w * factor));
      const h = (w / W) * H;
      return clampView({ x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h });
    });
  }

  function onPointerDown(e: PointerEvent<SVGSVGElement>) {
    drag.current = { px: e.clientX, py: e.clientY, vx: view.x, vy: view.y, moved: false };
  }
  function onPointerMove(e: PointerEvent<SVGSVGElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    if (!d.moved) svgRef.current!.setPointerCapture(e.pointerId);
    d.moved = true;
    const scale = svgRef.current!.getScreenCTM()!.a;
    setView((v) => clampView({ ...v, x: d.vx - dx / scale, y: d.vy - dy / scale }));
  }
  function onPointerUp(e: PointerEvent<SVGSVGElement>) {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved || !picking || !onPick) return;
    const p = svgPoint(e.clientX, e.clientY);
    onPick(toLatLng(Math.min(Math.max(p.x, 0), W), Math.min(Math.max(p.y, 0), H)));
  }

  const pickedXY = picked ? toXY(picked.latitude, picked.longitude) : null;

  return (
    <div className={picking ? "map picking" : "map"}>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        preserveAspectRatio={`xMidYMid ${fit}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (drag.current = null)}
        role="img"
        aria-label="Схема карты Петропавловска с отмеченными местами"
      >
        <rect x={-1500} y={-1500} width={W + 3000} height={H + 3000} fill="var(--map-land)" />
        {/* Кварталы */}
        <g fill="var(--map-block)">
          <rect x={150} y={150} width={200} height={240} rx={6} />
          <rect x={60} y={190} width={80} height={200} rx={6} />
          <rect x={250} y={60} width={90} height={80} rx={6} />
        </g>
        {/* Парки */}
        <g fill="var(--map-park)">
          <rect x={196} y={182} width={52} height={58} rx={10} />
          <rect x={70} y={300} width={56} height={44} rx={10} />
          <rect x={290} y={330} width={60} height={50} rx={10} />
        </g>
        {/* Улицы */}
        <g stroke="var(--map-road)" strokeLinecap="round" fill="none">
          <path d="M-900 172 H1300" strokeWidth={9} />
          <path d="M-900 262 H1300" strokeWidth={7} />
          <path d="M140 395 H1300" strokeWidth={6} />
          <path d="M172 60 V1300" strokeWidth={8} />
          <path d="M252 -900 V1300" strokeWidth={6} />
          <path d="M318 -900 V1300" strokeWidth={7} />
          <path d="M120 116 L172 172 L252 262 L318 300 L1300 640" strokeWidth={6} />
          <path d="M140 400 L140 1300" strokeWidth={5} />
        </g>
        {/* Железная дорога */}
        <path d="M120 1300 L200 520 C 260 420, 300 330, 440 250 L1300 -250" stroke="var(--map-rail)" strokeWidth={2} strokeDasharray="6 5" fill="none" />
        {/* Река Ишим */}
        <path
          d="M-400 900 L-40 330 C 20 280, 40 190, 95 140 S 190 70, 290 52 S 400 24, 450 14 L1300 -120"
          stroke="var(--map-water)"
          strokeWidth={24}
          fill="none"
          strokeLinecap="round"
        />
        {/* Мост */}
        <path d="M102 100 L150 150" stroke="var(--map-road)" strokeWidth={7} strokeLinecap="round" />
        {/* Озеро */}
        <ellipse cx={372} cy={138} rx={34} ry={20} fill="var(--map-water)" />
        {/* Подписи */}
        <g className="map-label">
          <text x={210} y={64} transform="rotate(-12 210 64)">Ишим</text>
          <text x={372} y={110} textAnchor="middle">оз. Пёстрое</text>
          <text x={198} y={252}>Парк Победы</text>
          <text x={322} y={278} textAnchor="end">Вокзал</text>
        </g>

        {/* Отмеченные места */}
        {spots.map((spot) => {
          const { x, y } = toXY(spot.latitude, spot.longitude);
          const state = spotState(spot, cleanups);
          const cleanup = plannedCleanupFor(spot, cleanups);
          const r = (state === "planned" ? 15 : 11) * k;
          return (
            <g
              key={spot.id}
              className="marker"
              onPointerUp={(e) => {
                if (drag.current?.moved || picking) return;
                e.stopPropagation();
                drag.current = null;
                onSpotClick?.(spot);
              }}
            >
              <circle cx={x} cy={y} r={r + 6 * k} fill="transparent" />
              <circle cx={x} cy={y} r={r} fill={COLORS[state]} stroke="#fff" strokeWidth={3 * k} />
              {cleanup && (
                <text x={x} y={y + 4 * k} textAnchor="middle" fontSize={11 * k} className="marker-count">
                  {cleanup.participants}
                </text>
              )}
            </g>
          );
        })}

        {/* Новая точка при выборе места */}
        {pickedXY && (
          <g pointerEvents="none">
            <circle cx={pickedXY.x} cy={pickedXY.y} r={22 * k} fill="var(--ink)" opacity={0.12} className="pulse" />
            <path
              d={`M${pickedXY.x} ${pickedXY.y} l${-10 * k} ${-16 * k} a${12 * k} ${12 * k} 0 1 1 ${20 * k} 0 z`}
              fill="var(--ink)"
              stroke="#fff"
              strokeWidth={2.5 * k}
            />
            <circle cx={pickedXY.x} cy={pickedXY.y - 22 * k} r={4 * k} fill="#fff" />
          </g>
        )}
      </svg>

      {!picking && (
        <div className="legend">
          <span><i style={{ background: "var(--red)" }} />Грязно</span>
          <span><i style={{ background: "var(--amber)" }} />Уборка назначена</span>
          <span><i style={{ background: "var(--green)" }} />Убрано</span>
        </div>
      )}
      <div className="zoom">
        <button onClick={() => zoom(0.7)} aria-label="Приблизить"><ZoomInIcon /></button>
        <button onClick={() => zoom(1 / 0.7)} aria-label="Отдалить"><ZoomOutIcon /></button>
      </div>
    </div>
  );
}

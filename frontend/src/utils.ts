import type { Cleanup, Spot, TrashLevel } from "./types";

export const TRASH_LABEL: Record<TrashLevel, string> = {
  low: "Немного мусора",
  medium: "Средне",
  high: "Мусора много",
};

// Уровень игрока: каждые 200 монет — новый уровень
export const COINS_PER_LEVEL = 200;
export function levelOf(coins: number) {
  const level = Math.floor(coins / COINS_PER_LEVEL) + 1;
  const from = (level - 1) * COINS_PER_LEVEL;
  const to = level * COINS_PER_LEVEL;
  return { level, progress: (coins - from) / (to - from), to };
}

const TITLES = ["Новичок", "Помощник", "Активист", "Дворовый герой", "Чистильщик", "Страж района", "Хранитель парка", "Легенда города"];
export function titleOf(level: number) {
  return TITLES[Math.min(level, TITLES.length) - 1];
}

export function formatNumber(n: number) {
  return n.toLocaleString("ru-RU");
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long" });
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
}

export function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "сегодня";
  if (days === 1) return "вчера";
  if (days < 5) return `${days} дня назад`;
  return `${days} дней назад`;
}

export function plannedCleanupFor(spot: Spot, cleanups: Cleanup[]) {
  return cleanups.find((c) => c.spot_id === spot.id && c.status === "planned");
}

// Цвет и подпись точки на карте
export type SpotState = "dirty" | "planned" | "clean";
export function spotState(spot: Spot, cleanups: Cleanup[]): SpotState {
  if (spot.status === "clean") return "clean";
  return plannedCleanupFor(spot, cleanups) ? "planned" : "dirty";
}
export const STATE_LABEL: Record<SpotState, string> = {
  dirty: "Грязно",
  planned: "Уборка назначена",
  clean: "Убрано",
};

export function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

// Фото с телефона → строка data:, чтобы показать сразу.
// Потом фото будет загружаться на сервер (Cloudinary/S3).
export function readPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 900;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * k);
      canvas.height = Math.round(img.height * k);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = url;
  });
}

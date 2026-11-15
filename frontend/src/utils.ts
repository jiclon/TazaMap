import { ApiError } from "./api";
import type { DictKey } from "./i18n";
import type { Cleanup, Spot, TrashLevel } from "./types";

// Тексты лежат в словарях (src/i18n). Здесь — только ключи и расчёты.

export function trashKey(level: TrashLevel): DictKey {
  return `trash_${level}`;
}

// Уровень игрока: каждые 200 очков — новый уровень
export const COINS_PER_LEVEL = 200;
export function levelOf(xp: number) {
  const level = Math.floor(xp / COINS_PER_LEVEL) + 1;
  const from = (level - 1) * COINS_PER_LEVEL;
  const to = level * COINS_PER_LEVEL;
  return { level, progress: (xp - from) / (to - from), to };
}

// Звание по уровню: title_1 … title_8 в словаре
const TITLES: DictKey[] = ["title_1", "title_2", "title_3", "title_4", "title_5", "title_6", "title_7", "title_8"];
export function titleKey(level: number): DictKey {
  return TITLES[Math.min(Math.max(level, 1), TITLES.length) - 1];
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
export function stateKey(state: SpotState): DictKey {
  return `state_${state}`;
}

export function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase();
}

// Ошибка → ключ текста в словаре
export function errorKey(e: unknown): DictKey {
  if (!(e instanceof ApiError)) return "e_unknown";
  switch (e.code) {
    case "phone_taken": return "e_phone_taken";
    case "invalid_credentials": return "e_invalid_credentials";
    case "invalid_phone": return "e_phone";
    case "invalid_name":
    case "invalid_password":
    case "invalid_input": return "e_invalid_input";
    case "not_authenticated":
    case "user_not_found": return "e_session";
    case "network": return "e_network";
    case "timeout": return "e_timeout";
    case "too_many": return "e_too_many";
    case "auth_unavailable": return "e_auth_unavailable";
    case "server": return "e_server";
    case "not_enough_coins": return "e_not_enough_coins";
    case "reward_not_found": return "e_reward_not_found";
    default: return "e_unknown";
  }
}

// Телефон. Храним 10 цифр после +7, показываем как «+7 700 123 45 67».
// Понимает и набор по одной цифре, и вставку «8 (700) 123-45-67» или «+77001234567».
export function phoneDigits(raw: string): string {
  let d = (raw.trim().startsWith("+7") ? raw.trim().slice(2) : raw).replace(/\D/g, "");
  // 11 цифр: человек набрал номер вместе с «8» или «7» в начале (8 700… или 7 700…) — убираем её.
  // Номер после +7 начинается с 6, 7 или 9, поэтому лишнюю цифру в конце с этим не спутать.
  if (d.length === 11 && (d[0] === "8" || (d[0] === "7" && "679".includes(d[1])))) d = d.slice(1);
  return d.slice(0, 10);
}
export function formatPhone(digits: string): string {
  if (!digits) return "";
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)].filter(Boolean);
  return `+7 ${parts.join(" ")}`;
}

// Фото с телефона → строка data:, чтобы показать сразу и отправить на сервер.
// Потом фото будет загружаться в хранилище (Cloudinary/S3).
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
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("photo"));
    };
    img.src = url;
  });
}

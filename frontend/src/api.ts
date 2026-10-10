// Все запросы к серверу собраны здесь.
// Места и уборки берём с настоящего бэкенда (FastAPI на Render + Neon).
// Если сервер не ответил за несколько секунд (на бесплатном Render он «спит»),
// сайт переходит в демо-режим и показывает данные из памяти — так он работает всегда.
// Остальное (профиль, рейтинг, магазин) пока демо: этих эндпоинтов в бэкенде ещё нет.

import type { Purchase, Reward } from "./types";
import type { Cleanup, Player, Spot, TrashLevel, User } from "./types";

// Адрес бэкенда. Для локальной проверки: VITE_API_BASE=http://localhost:8000
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "https://tazamap.onrender.com";

// Откуда данные: "live" — с сервера, "demo" — из памяти. Решается один раз за визит.
let source: "unknown" | "live" | "demo" = "unknown";
let deciding: Promise<void> | null = null;
export function dataSource() {
  return source;
}

async function request<T>(path: string, init?: RequestInit, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(API_BASE + path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`Сервер ответил ${res.status}`);
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

// Уборка с сервера — без полей, которых в таблице cleanups пока нет
type ApiCleanup = Omit<Cleanup, "participants" | "joined" | "after_image">;
function fromApi(c: ApiCleanup): Cleanup {
  return { ...c, participants: 1, joined: false, after_image: null };
}

// Пробуем сервер один раз; если не ответил за 4 секунды — демо до конца визита
function decide(): Promise<void> {
  if (!deciding) {
    deciding = (async () => {
      try {
        const [s, c] = await Promise.all([
          request<Spot[]>("/spots", undefined, 4000),
          request<ApiCleanup[]>("/cleanups", undefined, 4000),
        ]);
        if (!Array.isArray(s) || s.length === 0) throw new Error("пусто");
        spots = s;
        cleanups = c.map(fromApi);
        source = "live";
      } catch {
        source = "demo";
      }
    })();
  }
  return deciding;
}

// Изменения, которых сервер пока не умеет хранить (участие, завершение уборки)
const spotPatch = new Map<number, Partial<Spot>>();
const cleanupPatch = new Map<number, Partial<Cleanup>>();
function patchSpots(list: Spot[]) {
  return list.map((s) => ({ ...s, ...spotPatch.get(s.id) }));
}
function patchCleanups(list: Cleanup[]) {
  return list.map((c) => {
    const prev = cleanups.find((x) => x.id === c.id);
    return { ...c, ...(prev ? { participants: prev.participants, joined: prev.joined } : {}), ...cleanupPatch.get(c.id) };
  });
}

const now = new Date();
function daysAgo(n: number): string {
  return new Date(now.getTime() - n * 86400000).toISOString();
}
function nextWeekday(day: number, hour: number): string {
  // day: 0 — воскресенье, 6 — суббота
  const d = new Date(now);
  d.setDate(d.getDate() + ((day - d.getDay() + 7) % 7 || 7));
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

let spots: Spot[] = [
  {
    id: 1,
    title: "Берег Ишима у моста",
    description: "Пластик и бутылки вдоль берега, примерно 6–8 мешков. Нужны перчатки.",
    latitude: 54.8915,
    longitude: 69.1205,
    image: "",
    trash_level: "high",
    status: "dirty",
    created_at: daysAgo(2),
  },
  {
    id: 2,
    title: "Сквер у вокзала",
    description: "Окурки и пакеты у скамеек.",
    latitude: 54.8605,
    longitude: 69.1745,
    image: "",
    trash_level: "low",
    status: "dirty",
    created_at: daysAgo(1),
  },
  {
    id: 3,
    title: "Парк Победы",
    description: "После выходных много мусора у аллеи и у пруда.",
    latitude: 54.8745,
    longitude: 69.1455,
    image: "",
    trash_level: "medium",
    status: "dirty",
    created_at: daysAgo(4),
  },
  {
    id: 4,
    title: "Пустырь за школой",
    description: "Строительный мусор и пакеты.",
    latitude: 54.8495,
    longitude: 69.1335,
    image: "",
    trash_level: "high",
    status: "dirty",
    created_at: daysAgo(6),
  },
  {
    id: 5,
    title: "Двор на ул. Жамбыла",
    description: "Убрали вчетвером за час.",
    latitude: 54.8685,
    longitude: 69.1595,
    image: "",
    trash_level: "medium",
    status: "clean",
    created_at: daysAgo(12),
  },
  {
    id: 6,
    title: "Берег озера Пёстрое",
    description: "Убрали 11 мешков.",
    latitude: 54.8835,
    longitude: 69.1865,
    image: "",
    trash_level: "high",
    status: "clean",
    created_at: daysAgo(20),
  },
];

let cleanups: Cleanup[] = [
  {
    id: 1,
    spot_id: 3,
    starts_at: nextWeekday(6, 11),
    gathering_place: "У главного входа в парк",
    chat_link: "https://t.me/",
    status: "planned",
    created_at: daysAgo(3),
    participants: 14,
    joined: false,
    after_image: null,
  },
  {
    id: 2,
    spot_id: 5,
    starts_at: daysAgo(10),
    gathering_place: "У подъезда №2",
    chat_link: null,
    status: "done",
    created_at: daysAgo(11),
    participants: 4,
    joined: true,
    after_image: null,
  },
  {
    id: 3,
    spot_id: 6,
    starts_at: daysAgo(18),
    gathering_place: "Парковка у пляжа",
    chat_link: null,
    status: "done",
    created_at: daysAgo(19),
    participants: 9,
    joined: false,
    after_image: null,
  },
];

let user: User = {
  name: "Ерасыл",
  coins: 1240,
  xp: 1240,
  cleanups_done: 12,
  spots_marked: 9,
  hours: 18,
};

const players: Player[] = [
  { name: "Айдос", coins: 2310 },
  { name: "Дана", coins: 1980 },
  { name: "Мирас", coins: 1415 },
  { name: "Алина", coins: 1105 },
  { name: "Тимур", coins: 870 },
  { name: "Сабина", coins: 640 },
];

// Награды — те же числа, что на экранах макета
export const COINS = {
  organizer: 150,
  participant: 100,
  markSpot: 5,
};

// Небольшая пауза, чтобы вести себя как настоящий сервер
const wait = () => new Promise((r) => setTimeout(r, 150));

// GET /spots
export async function getSpots(): Promise<Spot[]> {
  await decide();
  if (source === "live") {
    try {
      spots = await request<Spot[]>("/spots");
    } catch {
      /* сервер не ответил — показываем последнее, что знали */
    }
    return patchSpots(spots);
  }
  await wait();
  return [...spots];
}

// GET /cleanups
export async function getCleanups(): Promise<Cleanup[]> {
  await decide();
  if (source === "live") {
    try {
      const list = await request<ApiCleanup[]>("/cleanups");
      cleanups = patchCleanups(list.map(fromApi));
    } catch {
      /* сервер не ответил — показываем последнее, что знали */
    }
    return [...cleanups];
  }
  await wait();
  return [...cleanups];
}

// GET /me
export async function getMe(): Promise<User> {
  await wait();
  return { ...user };
}

// GET /rating
export async function getRating(): Promise<Player[]> {
  await wait();
  return [...players, { name: user.name, coins: user.xp, me: true }].sort(
    (a, b) => b.coins - a.coins,
  );
}

// POST /spots
export async function createSpot(data: {
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  image: string;
  trash_level: TrashLevel;
}): Promise<Spot> {
  await decide();
  if (source === "live") {
    // Длины как в models.py: title — 40, description — 120 символов
    const body = {
      ...data,
      title: data.title.slice(0, 40),
      description: data.description ? data.description.slice(0, 120) : null,
    };
    const spot = await request<Spot>("/spots", { method: "POST", body: JSON.stringify(body) });
    spots = [...spots, spot];
    user = { ...user, coins: user.coins + COINS.markSpot, xp: user.xp + COINS.markSpot, spots_marked: user.spots_marked + 1 };
    return spot;
  }
  await wait();
  const spot: Spot = {
    ...data,
    id: Math.max(0, ...spots.map((s) => s.id)) + 1,
    status: "dirty",
    created_at: new Date().toISOString(),
  };
  spots = [...spots, spot];
  user = { ...user, coins: user.coins + COINS.markSpot, xp: user.xp + COINS.markSpot, spots_marked: user.spots_marked + 1 };
  return spot;
}

// POST /cleanups
export async function createCleanup(data: {
  spot_id: number;
  starts_at: string;
  gathering_place: string | null;
  chat_link: string | null;
}): Promise<Cleanup> {
  await decide();
  if (source === "live") {
    const body = {
      ...data,
      gathering_place: data.gathering_place ? data.gathering_place.slice(0, 80) : null,
      chat_link: data.chat_link ? data.chat_link.slice(0, 200) : null,
    };
    const created = fromApi(await request<ApiCleanup>("/cleanups", { method: "POST", body: JSON.stringify(body) }));
    const cleanup = { ...created, joined: true };
    cleanupPatch.set(cleanup.id, { joined: true, participants: 1 });
    cleanups = [...cleanups, cleanup];
    return cleanup;
  }
  await wait();
  const cleanup: Cleanup = {
    ...data,
    id: Math.max(0, ...cleanups.map((c) => c.id)) + 1,
    status: "planned",
    created_at: new Date().toISOString(),
    participants: 1,
    joined: true,
    after_image: null,
  };
  cleanups = [...cleanups, cleanup];
  return cleanup;
}

// POST /cleanups/{id}/join
export async function joinCleanup(id: number): Promise<Cleanup> {
  await wait();
  cleanups = cleanups.map((c) =>
    c.id === id && !c.joined ? { ...c, joined: true, participants: c.participants + 1 } : c,
  );
  const joined = cleanups.find((c) => c.id === id)!;
  cleanupPatch.set(id, { ...cleanupPatch.get(id), joined: joined.joined, participants: joined.participants });
  return joined;
}

// POST /cleanups/{id}/leave
export async function leaveCleanup(id: number): Promise<Cleanup> {
  await wait();
  cleanups = cleanups.map((c) =>
    c.id === id && c.joined ? { ...c, joined: false, participants: c.participants - 1 } : c,
  );
  const left = cleanups.find((c) => c.id === id)!;
  cleanupPatch.set(id, { ...cleanupPatch.get(id), joined: left.joined, participants: left.participants });
  return left;
}

// POST /cleanups/{id}/finish — фото «после», место становится чистым
export async function finishCleanup(id: number, afterImage: string): Promise<Cleanup> {
  await wait();
  const cleanup = cleanups.find((c) => c.id === id)!;
  cleanups = cleanups.map((c) =>
    c.id === id ? { ...c, status: "done", after_image: afterImage } : c,
  );
  spots = spots.map((s) => (s.id === cleanup.spot_id ? { ...s, status: "clean" } : s));
  cleanupPatch.set(id, { ...cleanupPatch.get(id), status: "done", after_image: afterImage });
  spotPatch.set(cleanup.spot_id, { status: "clean" });
  user = {
    ...user,
    coins: user.coins + COINS.participant,
    xp: user.xp + COINS.participant,
    cleanups_done: user.cleanups_done + 1,
    hours: user.hours + 2,
  };
  return cleanups.find((c) => c.id === id)!;
}

// ---------- Магазин наград ----------
// Партнёры — примеры для демо. Настоящие появятся после запуска:
// промокоды покупаются на грант и у партнёров, а игроки меняют на них монеты.
const rewards: Reward[] = [
  { id: 1, title: "Кофе в подарок", partner: "Кафе-партнёр", description: "Любой кофе среднего размера", price: 300, kind: "promo" },
  { id: 2, title: "−1 000 ₸ на доставку еды", partner: "Сервис доставки", description: "Промокод на первый заказ от 4 000 ₸", price: 500, kind: "promo" },
  { id: 3, title: "Скидка 20% на абонемент", partner: "Спортзал-партнёр", description: "Абонемент на месяц", price: 800, kind: "discount" },
  { id: 4, title: "Билет в кино", partner: "Кинотеатр-партнёр", description: "Один билет на любой сеанс в будни", price: 900, kind: "promo" },
  { id: 5, title: "Сертификат волонтёра", partner: "TazaMap", description: "Именной сертификат для портфолио", price: 1000, kind: "merch" },
  { id: 6, title: "Футболка TazaMap", partner: "TazaMap", description: "Для самых активных — выдаём на уборке", price: 1500, kind: "merch" },
];

let purchases: Purchase[] = [];

function makeCode() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "TAZA-";
  for (let i = 0; i < 6; i++) code += abc[Math.floor(Math.random() * abc.length)];
  return code;
}

// GET /rewards
export async function getRewards(): Promise<Reward[]> {
  await wait();
  return [...rewards];
}

// GET /me/purchases
export async function getPurchases(): Promise<Purchase[]> {
  await wait();
  return [...purchases];
}

// POST /rewards/{id}/buy — списывает монеты, возвращает промокод
export async function buyReward(id: number): Promise<Purchase> {
  await wait();
  const reward = rewards.find((r) => r.id === id);
  if (!reward) throw new Error("Награда не найдена");
  if (user.coins < reward.price) throw new Error("Не хватает монет");
  user = { ...user, coins: user.coins - reward.price };
  const purchase: Purchase = {
    id: purchases.length + 1,
    reward_id: reward.id,
    title: reward.title,
    partner: reward.partner,
    code: makeCode(),
    created_at: new Date().toISOString(),
  };
  purchases = [purchase, ...purchases];
  return purchase;
}

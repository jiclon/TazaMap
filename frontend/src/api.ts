// Все запросы к серверу собраны здесь.
// Сейчас бэкенда нет, поэтому данные лежат прямо в памяти (демо).
// Когда вы напишете эндпоинты, в каждой функции надо будет заменить
// работу с массивом на fetch(...) — экраны менять не придётся.

import type { Purchase, Reward } from "./types";
import type { Cleanup, Player, Spot, TrashLevel, User } from "./types";

// Потом: адрес сервера на Render, как в Montiro (VITE_API_BASE)
export const API_BASE = "http://localhost:8000";

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
  await wait();
  return [...spots];
}

// GET /cleanups
export async function getCleanups(): Promise<Cleanup[]> {
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
  return cleanups.find((c) => c.id === id)!;
}

// POST /cleanups/{id}/leave
export async function leaveCleanup(id: number): Promise<Cleanup> {
  await wait();
  cleanups = cleanups.map((c) =>
    c.id === id && c.joined ? { ...c, joined: false, participants: c.participants - 1 } : c,
  );
  return cleanups.find((c) => c.id === id)!;
}

// POST /cleanups/{id}/finish — фото «после», место становится чистым
export async function finishCleanup(id: number, afterImage: string): Promise<Cleanup> {
  await wait();
  const cleanup = cleanups.find((c) => c.id === id)!;
  cleanups = cleanups.map((c) =>
    c.id === id ? { ...c, status: "done", after_image: afterImage } : c,
  );
  spots = spots.map((s) => (s.id === cleanup.spot_id ? { ...s, status: "clean" } : s));
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

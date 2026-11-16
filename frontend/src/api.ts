// Все запросы к серверу собраны здесь.
//
// Обычная сборка (Vercel): места, уборки и аккаунт — с настоящего бэкенда (FastAPI на Render + Neon).
// Бесплатный Render «спит» и просыпается до минуты. Пока он просыпается, сайт показывает
// примеры мест с пометкой, а всё, что человек отправляет (регистрация, новое место, уборка),
// идёт только на сервер: если сервер не ответил — показываем ошибку, а не ложный успех.
//
// Режим прототипа (config.ts → DEMO): сервер не трогаем совсем, всё живёт в памяти.
//
// Рейтинг и магазин пока примеры: этих эндпоинтов в бэкенде ещё нет.

import { API_BASE, DEMO } from "./config";
import type { Account, Cleanup, Player, Purchase, Reward, Spot, TrashLevel, User } from "./types";

// ---------- Ошибки ----------
// Код ошибки → текст на нужном языке выбирает интерфейс (см. errorKey в utils.ts).
// Первые коды присылает сам бэкенд в поле detail.
const SERVER_CODES = [
  "phone_taken",
  "invalid_credentials",
  "not_authenticated",
  "user_not_found",
  "invalid_phone",
  "invalid_name",
  "invalid_password",
  "invalid_input",
] as const;

export type ErrorCode =
  | (typeof SERVER_CODES)[number]
  | "network" // нет связи
  | "timeout" // сервер не ответил вовремя
  | "server" // ошибка 5xx
  | "too_many" // 429: слишком много запросов
  | "not_found" // 404: такого адреса на сервере нет
  | "auth_unavailable" // на сервере ещё нет регистрации и входа
  | "not_enough_coins"
  | "reward_not_found"
  | "unknown";

export class ApiError extends Error {
  code: ErrorCode;
  status: number;
  field?: string; // какое поле не понравилось серверу (для ошибок 422)
  constructor(code: ErrorCode, status = 0, field?: string) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

function isServerCode(v: unknown): v is (typeof SERVER_CODES)[number] {
  return typeof v === "string" && (SERVER_CODES as readonly string[]).includes(v);
}

async function toApiError(res: Response): Promise<ApiError> {
  let detail: unknown = null;
  try {
    detail = (await res.json())?.detail;
  } catch {
    /* ответ не JSON — разберёмся по статусу */
  }
  const s = res.status;
  if (isServerCode(detail)) return new ApiError(detail, s);
  // Стандартная ошибка проверки данных FastAPI: [{ loc: ["body", "phone"], msg: "…" }]
  if (Array.isArray(detail) && detail.length > 0) {
    const loc: unknown = detail[0]?.loc;
    const field = Array.isArray(loc) ? String(loc[loc.length - 1]) : undefined;
    const code: ErrorCode =
      field === "phone" ? "invalid_phone"
      : field === "name" ? "invalid_name"
      : field === "password" ? "invalid_password"
      : "invalid_input";
    return new ApiError(code, s, field);
  }
  if (s === 401) return new ApiError("not_authenticated", s);
  if (s === 404 || s === 405) return new ApiError("not_found", s);
  if (s === 422) return new ApiError("invalid_input", s);
  if (s === 429) return new ApiError("too_many", s);
  if (s >= 500) return new ApiError("server", s);
  return new ApiError("unknown", s);
}

// ---------- Запрос ----------
const QUICK = 8000; // обычный запрос
const PATIENT = 70000; // отправка данных: ждём, пока Render проснётся

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  auth?: boolean; // приложить токен входа
  timeoutMs?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = false, timeoutMs = QUICK } = options;
  // Заголовки добавляем только когда они нужны: простой GET уходит без предварительного
  // запроса CORS, и «спящий» сервер просыпается быстрее.
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && token) headers["Authorization"] = `Bearer ${token}`;

  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch {
    throw new ApiError(ctrl.signal.aborted ? "timeout" : "network");
  } finally {
    window.clearTimeout(timer);
  }
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

// ---------- Вход и аккаунт ----------
// Токен (JWT) выдаёт POST /login. Храним его в localStorage, чтобы вход не слетал
// после перезагрузки страницы. Пароль не хранится нигде.
const TOKEN_KEY = "tazamap.token";
const ACCOUNT_KEY = "tazamap.account";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* хранилище недоступно — вход проживёт до закрытия вкладки */
  }
}

let token: string | null = DEMO ? null : readStorage(TOKEN_KEY);

export function hasSession(): boolean {
  return token !== null;
}

// Аккаунт, сохранённый с прошлого визита: показываем сразу, не дожидаясь сервера
export function cachedAccount(): Account | null {
  if (!token) return null;
  try {
    const raw = readStorage(ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}

// Вход или выход в другой вкладке: перечитываем хранилище
export function syncSession(): Account | null {
  token = readStorage(TOKEN_KEY);
  return cachedAccount();
}

function saveSession(newToken: string, account: Account) {
  token = newToken;
  writeStorage(TOKEN_KEY, newToken);
  writeStorage(ACCOUNT_KEY, JSON.stringify(account));
}

export function logout() {
  token = null;
  writeStorage(TOKEN_KEY, null);
  writeStorage(ACCOUNT_KEY, null);
}

// В токене записан id пользователя (поле sub). Это не секрет: токен подписан, но не зашифрован.
function tokenUserId(jwt: string): number | null {
  try {
    const part = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, "=")));
    const id = Number(payload.sub);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}

// GET /me. Пока этого эндпоинта нет на сервере, берём id из токена и спрашиваем GET /users/{id}.
async function fetchAccount(jwt: string, timeoutMs: number): Promise<Account> {
  try {
    return await request<Account>("/me", { auth: true, timeoutMs });
  } catch (e) {
    if (!(e instanceof ApiError) || e.code !== "not_found") throw e;
    const id = tokenUserId(jwt);
    if (id === null) throw e;
    return await request<Account>(`/users/${id}`, { timeoutMs });
  }
}

// Если на сервере ещё нет регистрации и входа, он отвечает 404 — говорим об этом понятно
function authError(e: unknown): unknown {
  return e instanceof ApiError && e.code === "not_found" ? new ApiError("auth_unavailable", e.status) : e;
}

// POST /users — регистрация
export async function register(data: { name: string; phone: string; password: string }): Promise<Account> {
  if (DEMO) throw new ApiError("auth_unavailable");
  try {
    return await request<Account>("/users", { method: "POST", body: data, timeoutMs: PATIENT });
  } catch (e) {
    throw authError(e);
  }
}

// POST /login — вход. known — аккаунт, который мы уже знаем (сразу после регистрации).
export async function login(phone: string, password: string, known?: Account): Promise<Account> {
  if (DEMO) throw new ApiError("auth_unavailable");
  let jwt: string;
  try {
    const res = await request<{ access_token: string }>("/login", {
      method: "POST",
      body: { phone, password },
      timeoutMs: PATIENT,
    });
    jwt = res.access_token;
  } catch (e) {
    throw authError(e);
  }
  token = jwt;
  let account: Account;
  try {
    account = await fetchAccount(jwt, QUICK);
  } catch (e) {
    if (!known) {
      token = null;
      throw e;
    }
    account = known;
  }
  saveSession(jwt, account);
  return account;
}

// Проверяем сохранённый вход при открытии сайта.
// Вернёт аккаунт; null — входа нет; бросит not_authenticated — токен устарел, нужно войти снова.
export async function restoreSession(): Promise<Account | null> {
  const jwt = token;
  if (!jwt) return null;
  try {
    const account = await fetchAccount(jwt, PATIENT);
    if (token === jwt) saveSession(jwt, account);
    return account;
  } catch (e) {
    if (e instanceof ApiError && (e.code === "not_authenticated" || e.code === "user_not_found")) {
      if (token === jwt) logout();
      throw new ApiError("not_authenticated", e.status);
    }
    return cachedAccount(); // сервер недоступен — остаёмся с тем, что знали
  }
}

// ---------- Откуда данные ----------
// "live" — с сервера, "demo" — примеры из памяти.
let source: "unknown" | "live" | "demo" = DEMO ? "demo" : "unknown";
let deciding: Promise<void> | null = null;
let waking = false;
let loadedAt = 0;

// Состояние для интерфейса:
// loading — первые секунды, ещё ждём ответа; live — данные с сервера;
// waking — сервер просыпается, показаны примеры; offline — сервер не ответил, показаны примеры;
// demo — режим прототипа.
export type ServerState = "loading" | "live" | "waking" | "offline" | "demo";
export function serverState(): ServerState {
  if (DEMO) return "demo";
  if (source === "live") return "live";
  if (source === "unknown") return "loading";
  return waking ? "waking" : "offline";
}

// Сервер «проснулся» или перестал отвечать — сообщаем приложению, чтобы оно перерисовалось
const listeners = new Set<() => void>();
export function onLive(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function notify() {
  listeners.forEach((cb) => cb());
}

// Уборка с сервера — без полей, которых в таблице cleanups пока нет
type ApiCleanup = Omit<Cleanup, "participants" | "joined" | "after_image">;
function fromApi(c: ApiCleanup): Cleanup {
  // Сервер пока не считает участников: показываем одного — организатора
  return { ...c, participants: 1, joined: myCleanups.has(c.id), after_image: null };
}
// Уборки, которые человек создал в этом визите: он организатор, значит «идёт»
const myCleanups = new Set<number>();

async function loadLive(timeoutMs: number): Promise<void> {
  const [s, c] = await Promise.all([
    request<Spot[]>("/spots", { timeoutMs }),
    request<ApiCleanup[]>("/cleanups", { timeoutMs }),
  ]);
  if (!Array.isArray(s) || !Array.isArray(c)) throw new ApiError("server");
  spots = s;
  cleanups = c.map(fromApi);
  source = "live";
  loadedAt = Date.now();
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Ждём сервер в фоне и переключаемся на настоящие данные, когда он ответит
const isLive = () => source === "live";
async function wakeServer() {
  if (waking || isLive()) return;
  waking = true;
  notify();
  for (let attempt = 0; attempt < 3 && !isLive(); attempt++) {
    try {
      await loadLive(60000);
    } catch {
      await pause(3000); // ещё не проснулся — пробуем снова
    }
  }
  waking = false;
  notify();
}

// Кнопка «Повторить», когда сервер так и не ответил
export function retryServer() {
  void wakeServer();
}

// Пробуем сервер быстро; не ответил за 4 секунды — показываем примеры, а сервер ждём в фоне
function decide(): Promise<void> {
  if (!deciding) {
    deciding = (async () => {
      if (DEMO) return;
      try {
        await loadLive(4000);
      } catch {
        source = "demo";
        void wakeServer();
      }
    })();
  }
  return deciding;
}

// Свежие данные с сервера. Несколько вызовов подряд дают один запрос.
let refreshing: Promise<void> | null = null;
function refresh(): Promise<void> {
  if (!refreshing) {
    refreshing = loadLive(QUICK)
      .catch(() => {
        /* сервер не ответил — показываем последнее, что знали */
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}
async function fresh() {
  await decide();
  if (source === "live" && Date.now() - loadedAt > 1500) await refresh();
}

// ---------- Примеры (режим прототипа и пока сервер просыпается) ----------
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

// Примеры мест и уборок — только для режима прототипа (DEMO).
// В обычной сборке массивы пустые: пока сервер не ответил, карта пустая, а не с выдуманными точками.
const DEMO_SPOTS: Spot[] = [
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

const DEMO_CLEANUPS: Cleanup[] = [
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

let spots: Spot[] = DEMO ? DEMO_SPOTS : [];
let cleanups: Cleanup[] = DEMO ? DEMO_CLEANUPS : [];

// Демо-профиль — только для режима прототипа
let demoUser: User = {
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

// Небольшая пауза, чтобы прототип вёл себя как настоящий сервер
const wait = () => pause(150);

// ---------- Места и уборки ----------
// GET /spots
export async function getSpots(): Promise<Spot[]> {
  await fresh();
  return [...spots];
}

// GET /cleanups
export async function getCleanups(): Promise<Cleanup[]> {
  await fresh();
  return [...cleanups];
}

// Демо-профиль (только режим прототипа). Настоящий аккаунт приходит из login() и restoreSession().
export async function getDemoUser(): Promise<User> {
  await wait();
  return { ...demoUser };
}

// GET /rating — пока пример
export async function getRating(): Promise<Player[]> {
  await wait();
  // Эндпоинта рейтинга на сервере ещё нет: в обычной сборке список пустой,
  // экран показывает «рейтинг появится после запуска».
  if (!DEMO) return [];
  const list = [...players, { name: demoUser.name, coins: demoUser.xp, me: true }];
  return list.sort((a, b) => b.coins - a.coins);
}

// После успешной отправки, если до этого показывались примеры, переходим на данные сервера
async function switchToLive(fallback: () => void) {
  try {
    await loadLive(QUICK);
  } catch {
    fallback();
    source = "live";
    loadedAt = Date.now();
  }
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
  if (DEMO) {
    await wait();
    const spot: Spot = {
      ...data,
      id: Math.max(0, ...spots.map((s) => s.id)) + 1,
      status: "dirty",
      created_at: new Date().toISOString(),
    };
    spots = [...spots, spot];
    demoUser = {
      ...demoUser,
      coins: demoUser.coins + COINS.markSpot,
      xp: demoUser.xp + COINS.markSpot,
      spots_marked: demoUser.spots_marked + 1,
    };
    return spot;
  }
  const spot = await request<Spot>("/spots", { method: "POST", body: data, auth: true, timeoutMs: PATIENT });
  if (source === "live") {
    spots = [...spots, spot];
  } else {
    // Место сохранено, значит, сервер проснулся: переходим на его данные
    await switchToLive(() => {
      spots = [spot];
      cleanups = [];
    });
  }
  return spot;
}

// POST /cleanups
export async function createCleanup(data: {
  spot_id: number;
  starts_at: string;
  gathering_place: string | null;
  chat_link: string | null;
}): Promise<Cleanup> {
  if (DEMO) {
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
  const created = await request<ApiCleanup>("/cleanups", {
    method: "POST",
    body: data,
    auth: true,
    timeoutMs: PATIENT,
  });
  myCleanups.add(created.id);
  const cleanup = fromApi(created);
  cleanups = [...cleanups, cleanup];
  return cleanup;
}

// Запись на уборку, выход и завершение работают только в прототипе.
// Когда появятся эндпоинты — напишите запросы здесь и включите их в config.ts → SERVER_CAN.

// POST /cleanups/{id}/join
export async function joinCleanup(id: number): Promise<Cleanup> {
  if (!DEMO) throw new ApiError("unknown");
  await wait();
  cleanups = cleanups.map((c) =>
    c.id === id && !c.joined ? { ...c, joined: true, participants: c.participants + 1 } : c,
  );
  return cleanups.find((c) => c.id === id)!;
}

// POST /cleanups/{id}/leave
export async function leaveCleanup(id: number): Promise<Cleanup> {
  if (!DEMO) throw new ApiError("unknown");
  await wait();
  cleanups = cleanups.map((c) =>
    c.id === id && c.joined ? { ...c, joined: false, participants: c.participants - 1 } : c,
  );
  return cleanups.find((c) => c.id === id)!;
}

// POST /cleanups/{id}/finish — фото «после», место становится чистым
export async function finishCleanup(id: number, afterImage: string): Promise<Cleanup> {
  if (!DEMO) throw new ApiError("unknown");
  await wait();
  const cleanup = cleanups.find((c) => c.id === id)!;
  cleanups = cleanups.map((c) => (c.id === id ? { ...c, status: "done", after_image: afterImage } : c));
  spots = spots.map((s) => (s.id === cleanup.spot_id ? { ...s, status: "clean" } : s));
  demoUser = {
    ...demoUser,
    coins: demoUser.coins + COINS.participant,
    xp: demoUser.xp + COINS.participant,
    cleanups_done: demoUser.cleanups_done + 1,
    hours: demoUser.hours + 2,
  };
  return cleanups.find((c) => c.id === id)!;
}

// ---------- Магазин наград ----------
// Партнёры проекта. Названия и условия лежат в словарях i18n (reward_1_title и т.д.),
// чтобы их было видно на всех трёх языках: localized: true.
// Цены в монетах можно менять прямо здесь, в поле price.
const rewards: Reward[] = [
  { id: 1, title: "", partner: "", description: "", price: 500, kind: "discount", localized: true },
  { id: 2, title: "", partner: "", description: "", price: 200, kind: "discount", localized: true },
  { id: 3, title: "", partner: "", description: "", price: 350, kind: "discount", localized: true },
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

// POST /rewards/{id}/buy — списывает монеты, возвращает промокод (пока только в прототипе)
export async function buyReward(id: number): Promise<Purchase> {
  if (!DEMO) throw new ApiError("unknown");
  await wait();
  const reward = rewards.find((r) => r.id === id);
  if (!reward) throw new ApiError("reward_not_found");
  if (demoUser.coins < reward.price) throw new ApiError("not_enough_coins");
  demoUser = { ...demoUser, coins: demoUser.coins - reward.price };
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

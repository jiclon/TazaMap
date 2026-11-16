// Общее состояние приложения: данные с сервера, аккаунт и навигация между экранами.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as api from "./api";
import { DEMO, MARKING_OPEN, REQUIRE_LOGIN } from "./config";
import { useI18n } from "./i18n";
import type { Account, Cleanup, Spot, User } from "./types";

// Почему человека попросили войти — от этого зависит подсказка на экране входа
export type AuthReason = "mark" | "action" | "session";

export type Screen =
  | { name: "home" }
  | { name: "map" }
  | { name: "spot"; id: number }
  | { name: "newSpot"; latitude: number; longitude: number }
  | { name: "cleanup"; id: number }
  | { name: "newCleanup"; spotId: number }
  | { name: "cleanups" }
  | { name: "rating" }
  | { name: "profile" }
  | { name: "shop" }
  | { name: "auth"; mode: "register" | "login"; reason?: AuthReason };

export type DialogName = "settings" | "privacy";

interface Store {
  spots: Spot[];
  cleanups: Cleanup[];
  loaded: boolean; // первая загрузка мест закончилась
  reload: () => Promise<void>;

  // Аккаунт с сервера (null — гость) и профиль для экранов
  account: Account | null;
  user: User | null;
  signedIn: (account: Account) => void;
  signOut: () => void;
  sessionExpired: () => void;
  // Выполнить действие, если человек вошёл; иначе — сначала экран входа, потом действие
  requireAuth: (action: () => void, reason?: AuthReason) => void;
  // «Отметить мусор»: открыть карту в режиме выбора точки
  startMarking: () => void;

  screen: Screen;
  go: (s: Screen) => void;
  back: () => void;
  tab: (s: Screen) => void;

  toast: string | null;
  showToast: (text: string) => void;
  dialog: DialogName | null;
  openDialog: (name: DialogName | null) => void;

  // Режим «отметить мусор»: пользователь выбирает точку на карте
  picking: boolean;
  setPicking: (on: boolean) => void;
  picked: LatLng | null;
  setPicked: (p: LatLng | null) => void;
}

export type LatLng = { latitude: number; longitude: number };

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [cleanups, setCleanups] = useState<Cleanup[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [account, setAccount] = useState<Account | null>(() => api.cachedAccount());
  const [demoUser, setDemoUser] = useState<User | null>(null);
  const [history, setHistory] = useState<Screen[]>([{ name: "home" }]);
  const [toast, setToast] = useState<string | null>(null);
  const [dialog, openDialog] = useState<DialogName | null>(null);
  const [picking, setPickingState] = useState(false);
  const [picked, setPicked] = useState<LatLng | null>(null);

  // Действие, которое ждёт входа («отметить мусор» → вход → карта)
  const afterAuth = useRef<(() => void) | null>(null);
  const toastTimer = useRef(0);

  const setPicking = useCallback((on: boolean) => {
    setPickingState(on);
    if (!on) setPicked(null);
  }, []);

  const showToast = useCallback((text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const reload = useCallback(async () => {
    const [s, c, u] = await Promise.all([api.getSpots(), api.getCleanups(), DEMO ? api.getDemoUser() : null]);
    setSpots(s);
    setCleanups(c);
    setDemoUser(u);
    setLoaded(true);
  }, []);

  useEffect(() => {
    reload();
    // Сервер проснулся — подгружаем настоящие данные вместо примеров
    return api.onLive(() => {
      reload();
    });
  }, [reload]);

  // Сохранённый вход: проверяем на сервере, что он ещё действует
  const tRef = useRef(t);
  tRef.current = t;
  useEffect(() => {
    if (!api.hasSession()) return;
    let alive = true;
    api
      .restoreSession()
      .then((acc) => {
        if (alive) setAccount(acc);
      })
      .catch(() => {
        if (!alive) return;
        setAccount(null);
        showToast(tRef.current("e_session"));
      });
    return () => {
      alive = false;
    };
  }, [showToast]);

  // Вошли или вышли в другой вкладке
  useEffect(() => {
    if (DEMO) return;
    const onStorage = () => setAccount(api.syncSession());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const go = useCallback((s: Screen) => setHistory((h) => [...h, s]), []);
  const back = useCallback(() => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : [{ name: "home" }])), []);
  const tab = useCallback((s: Screen) => setHistory([s]), []);

  const signedIn = useCallback((acc: Account) => {
    setAccount(acc);
    // Убираем экран входа из истории: «Назад» не должен на него возвращать
    setHistory((h) => {
      const rest = h.filter((s) => s.name !== "auth");
      return rest.length ? rest : [{ name: "home" }];
    });
    const next = afterAuth.current;
    afterAuth.current = null;
    next?.();
  }, []);

  const signOut = useCallback(() => {
    api.logout();
    setAccount(null);
    setPicking(false);
    setHistory([{ name: "home" }]);
  }, [setPicking]);

  const sessionExpired = useCallback(() => {
    api.logout();
    setAccount(null);
    setHistory((h) => [...h.filter((s) => s.name !== "auth"), { name: "auth", mode: "login", reason: "session" }]);
  }, []);

  const requireAuth = useCallback(
    (action: () => void, reason: AuthReason = "action") => {
      if (DEMO || !REQUIRE_LOGIN || account) {
        action();
        return;
      }
      afterAuth.current = action;
      setHistory((h) => [...h.filter((s) => s.name !== "auth"), { name: "auth", mode: "register", reason }]);
    },
    [account],
  );

  const startMarking = useCallback(() => {
    // Отметка мест закрыта (config.ts → MARKING_OPEN): честно говорим об этом
    if (!MARKING_OPEN) {
      showToast(tRef.current("marking_soon"));
      return;
    }
    requireAuth(() => {
      setHistory([{ name: "map" }]);
      setPicking(true);
    }, "mark");
  }, [requireAuth, setPicking, showToast]);

  // Профиль для экранов. В прототипе — демо. В обычном режиме — из аккаунта:
  // монет и статистики на сервере пока нет, поэтому показываем только то, что знаем точно.
  const user = useMemo<User | null>(() => {
    if (DEMO) return demoUser;
    if (!account) return null;
    return {
      name: account.name,
      coins: account.coins ?? 0,
      xp: account.xp ?? 0,
      cleanups_done: 0,
      spots_marked: spots.filter((s) => s.user_id === account.id).length,
      hours: 0,
    };
  }, [account, demoUser, spots]);

  const value: Store = {
    spots,
    cleanups,
    loaded,
    reload,
    account,
    user,
    signedIn,
    signOut,
    sessionExpired,
    requireAuth,
    startMarking,
    screen: history[history.length - 1],
    go,
    back,
    tab,
    toast,
    showToast,
    dialog,
    openDialog,
    picking,
    setPicking,
    picked,
    setPicked,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore нужно вызывать внутри StoreProvider");
  return store;
}

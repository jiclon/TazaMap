// Общее состояние приложения: данные с «сервера» и навигация между экранами.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import * as api from "./api";
import type { Cleanup, Spot, User } from "./types";

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
  | { name: "shop" };

interface Store {
  spots: Spot[];
  cleanups: Cleanup[];
  user: User | null;
  reload: () => Promise<void>;
  screen: Screen;
  go: (s: Screen) => void;
  back: () => void;
  tab: (s: Screen) => void;
  toast: string | null;
  showToast: (text: string) => void;
  // Режим «отметить мусор»: пользователь выбирает точку на карте
  picking: boolean;
  setPicking: (on: boolean) => void;
  picked: LatLng | null;
  setPicked: (p: LatLng | null) => void;
}

export type LatLng = { latitude: number; longitude: number };

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [cleanups, setCleanups] = useState<Cleanup[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<Screen[]>([{ name: "home" }]);
  const [toast, setToast] = useState<string | null>(null);
  const [picking, setPickingState] = useState(false);
  const [picked, setPicked] = useState<LatLng | null>(null);

  const setPicking = useCallback((on: boolean) => {
    setPickingState(on);
    if (!on) setPicked(null);
  }, []);

  const reload = useCallback(async () => {
    const [s, c, u] = await Promise.all([api.getSpots(), api.getCleanups(), api.getMe()]);
    setSpots(s);
    setCleanups(c);
    setUser(u);
  }, []);

  useEffect(() => {
    reload();
    // Когда сервер проснётся — подгружаем настоящие данные вместо демо
    return api.onLive(() => {
      reload();
    });
  }, [reload]);

  const showToast = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const value: Store = {
    spots,
    cleanups,
    user,
    reload,
    screen: history[history.length - 1],
    go: (s) => setHistory((h) => [...h, s]),
    back: () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h)),
    tab: (s) => setHistory([s]),
    toast,
    showToast,
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

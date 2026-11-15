// Тема оформления: «как в системе», светлая или тёмная.
// Цвета описаны в styles.css: светлые в :root, тёмные в :root[data-theme="dark"].
// Здесь только выбор темы: ставим data-theme на <html> и запоминаем выбор.
// Тот же ключ читает маленький скрипт в index.html, чтобы страница не мигала при загрузке.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type ThemePref = "system" | "light" | "dark";
export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "tazamap.theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

// Цвет панели браузера на телефоне — как у шапки сайта (--surface)
const BROWSER_BAR: Record<ThemeMode, string> = { light: "#ffffff", dark: "#17201b" };

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

interface Theme {
  pref: ThemePref; // что выбрал человек
  mode: ThemeMode; // что сейчас на экране
  system: ThemeMode; // тема телефона или компьютера
  setPref: (pref: ThemePref) => void;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(readPref);
  const [system, setSystem] = useState<ThemeMode>(() => (window.matchMedia(DARK_QUERY).matches ? "dark" : "light"));

  // Система сама меняет тему (например, вечером) — следим за этим
  useEffect(() => {
    const mq = window.matchMedia(DARK_QUERY);
    const onChange = () => setSystem(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Тему поменяли в другой вкладке — подхватываем
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) setPrefState(readPref());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const mode: ThemeMode = pref === "system" ? system : pref;

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.querySelector('meta[name="color-scheme"]')?.setAttribute("content", mode);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BROWSER_BAR[mode]);
  }, [mode]);

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next);
    try {
      // «Как в системе» — это отсутствие записи: тогда тема снова следует за устройством
      if (next === "system") localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* не сохранилось — тема всё равно применится до закрытия вкладки */
    }
  }, []);

  const value = useMemo(() => ({ pref, mode, system, setPref }), [pref, mode, system, setPref]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error("useTheme нужно вызывать внутри ThemeProvider");
  return theme;
}

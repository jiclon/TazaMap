// Языки интерфейса: русский, казахский, английский.
// В компоненте: const { t } = useI18n();  t("nav_home")  →  «Главная».
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ru } from "./ru";
import { kk } from "./kk";
import { en } from "./en";
import type { Dict, DictKey, Lang } from "./types";

export type { DictKey, Lang } from "./types";

const DICTS: Record<Lang, Dict> = { ru, kk, en };

// Названия языков пишутся на самом языке — так их узнают носители
// soon: true — язык виден в настройках, но выбрать его пока нельзя («в разработке»).
// Казахский перевод нужно вычитать носителю языка; после этого уберите soon.
export const LANGS: { code: Lang; label: string; soon?: boolean }[] = [
  { code: "ru", label: "Русский" },
  { code: "kk", label: "Қазақша", soon: true },
  { code: "en", label: "English" },
];

// Формат дат и чисел для каждого языка
const LOCALE: Record<Lang, string> = { ru: "ru-RU", kk: "kk-KZ", en: "en-GB" };

const STORAGE_KEY = "tazamap.lang";

// Язык можно включить, только если он есть в списке и не помечен soon
function isLang(v: unknown): v is Lang {
  return LANGS.some((l) => l.code === v && !l.soon);
}

// Язык при первом визите: сохранённый → язык браузера → русский
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    /* хранилище недоступно — берём язык браузера */
  }
  for (const l of navigator.languages ?? [navigator.language]) {
    const short = l.slice(0, 2).toLowerCase();
    if (isLang(short)) return short;
  }
  return "ru";
}

// Формы числа через «|». Русский: «1 место|2 места|5 мест». Английский: «1 place|2 places».
function pickForm(forms: string[], n: number, lang: Lang): string {
  if (forms.length === 1) return forms[0];
  const rule = new Intl.PluralRules(LOCALE[lang]).select(n);
  if (forms.length === 2) return rule === "one" ? forms[0] : forms[1];
  if (rule === "one") return forms[0];
  if (rule === "few") return forms[1];
  return forms[2];
}

export type Vars = Record<string, string | number>;

interface I18n {
  lang: Lang;
  setLang: (lang: Lang) => void;
  // Строка по ключу. {name} заменяется значением, число n выбирает форму слова.
  t: (key: DictKey, vars?: Vars) => string;
  // То же, но <b>…</b> в строке становится жирным текстом
  rich: (key: DictKey, vars?: Vars) => ReactNode;
  num: (n: number) => string;
  dateTime: (iso: string) => string; // «сб, 21 ноября, 11:00»
  date: (iso: string) => string; // «21 ноября 2026 г.»
  time: (iso: string) => string; // «11:00»
  monthShort: (iso: string) => string; // «нояб»
  ago: (iso: string) => string; // «сегодня», «вчера», «3 дня назад»
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* не сохранилось — язык всё равно переключится до закрытия вкладки */
    }
  }, []);

  // Браузер и программы чтения с экрана должны знать язык страницы
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18n>(() => {
    const locale = LOCALE[lang];
    const dict = DICTS[lang];
    const num = (n: number) => n.toLocaleString(locale);

    const t = (key: DictKey, vars?: Vars) => {
      let text: string = dict[key] ?? ru[key];
      if (text.includes("|")) {
        const n = vars?.n;
        text = pickForm(text.split("|"), typeof n === "number" ? n : 2, lang);
      }
      return text.replace(/\{(\w+)\}/g, (_, name: string) => {
        const v = vars?.[name];
        if (v === undefined) return "";
        return typeof v === "number" ? num(v) : v;
      });
    };

    const rich = (key: DictKey, vars?: Vars) =>
      t(key, vars)
        .split(/<b>(.*?)<\/b>/)
        .map((part, i) => (i % 2 ? <b key={i}>{part}</b> : part));

    const dateTime = (iso: string) => {
      const d = new Date(iso);
      const day = d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "long" });
      return `${day}, ${d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}`;
    };
    const date = (iso: string) =>
      new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
    const time = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    const monthShort = (iso: string) =>
      new Date(iso).toLocaleDateString(locale, { month: "short" }).replace(".", "");

    const ago = (iso: string) => {
      const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
      if (typeof Intl.RelativeTimeFormat === "function") {
        return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-days, "day");
      }
      return date(iso); // очень старый браузер — просто дата
    };

    return { lang, setLang, t, rich, num, dateTime, date, time, monthShort, ago };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const i18n = useContext(I18nContext);
  if (!i18n) throw new Error("useI18n нужно вызывать внутри I18nProvider");
  return i18n;
}

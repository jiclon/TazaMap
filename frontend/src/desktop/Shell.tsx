// Оболочка сайта: одни и те же страницы на компьютере и телефоне.
// Компьютер — меню сверху. Телефон — меню снизу.
import type { ReactNode } from "react";
import { useStore, type Screen } from "../store";
import { useI18n, type DictKey } from "../i18n";
import * as api from "../api";
import { DEMO } from "../config";
import { CoinsBadge } from "../components/Common";
import { PrivacyDialog, SettingsDialog } from "../components/Dialogs";
import { CalendarIcon, ChartIcon, GearIcon, HomeIcon, MapIcon, PlusIcon, ShopIcon, UserIcon } from "../components/Icons";
import { AuthScreen } from "../screens/AuthScreen";
import { HomePage } from "./HomePage";
import { MapPage } from "./MapPage";
import { CleanupsPage } from "./CleanupsPage";
import { RatingPage } from "./RatingPage";
import { ProfilePage } from "./ProfilePage";
import { ShopPage } from "./ShopPage";

type TabName = "home" | "map" | "cleanups" | "rating" | "shop" | "profile";

const LINKS: { label: DictKey; to: TabName; icon: ReactNode }[] = [
  { label: "nav_home", to: "home", icon: <HomeIcon /> },
  { label: "nav_map", to: "map", icon: <MapIcon /> },
  { label: "nav_cleanups", to: "cleanups", icon: <CalendarIcon /> },
  { label: "nav_rating", to: "rating", icon: <ChartIcon /> },
  { label: "nav_shop", to: "shop", icon: <ShopIcon /> },
  { label: "nav_profile", to: "profile", icon: <UserIcon /> },
];

// Экраны места и уборки относятся к разделу «Карта»
const MAP_SCREENS: Screen["name"][] = ["map", "spot", "newSpot", "cleanup", "newCleanup"];

export function Shell({ detail, desktop }: { detail: ReactNode; desktop: boolean }) {
  const { screen, tab, go, setPicking, toast, user, startMarking, openDialog } = useStore();
  const { t } = useI18n();
  const active = MAP_SCREENS.includes(screen.name) ? "map" : screen.name;

  function open(name: TabName) {
    setPicking(false);
    tab({ name });
  }

  let page: ReactNode;
  switch (screen.name) {
    case "home": page = <HomePage />; break;
    case "cleanups": page = <CleanupsPage />; break;
    case "rating": page = <RatingPage />; break;
    case "profile": page = <ProfilePage />; break;
    case "shop": page = <ShopPage />; break;
    case "auth": page = <AuthScreen mode={screen.mode} reason={screen.reason} />; break;
    // На компьютере карта справа и панель слева, на телефоне — экран целиком
    default: page = desktop ? <MapPage detail={detail} /> : detail;
  }

  // Пока сервер не ответил, на карте примеры мест — честно говорим об этом
  const server = api.serverState();

  return (
    <div className="site">
      <header className="site-nav">
        <button className="site-logo" onClick={() => open("home")}>
          <span className="logo-mark" aria-hidden="true" />
          TazaMap
        </button>
        {desktop && (
          <nav className="site-links">
            {LINKS.map((l) => (
              <button key={l.to} className={active === l.to ? "on" : ""} onClick={() => open(l.to)}>
                {t(l.label)}
              </button>
            ))}
          </nav>
        )}
        <div className="site-right">
          {user ? (
            <CoinsBadge />
          ) : (
            !DEMO && screen.name !== "auth" && (
              <button className="btn ghost small-btn" onClick={() => go({ name: "auth", mode: "login" })}>
                {t("sign_in")}
              </button>
            )
          )}
          <button className="round-btn" onClick={() => openDialog("settings")} aria-label={t("settings")}>
            <GearIcon />
          </button>
          {desktop && (
            <button className="btn primary" onClick={startMarking}>
              <PlusIcon size={18} />
              {t("mark_trash")}
            </button>
          )}
        </div>
      </header>

      {(server === "waking" || server === "offline") && (
        <div className="banner" role="status">
          {t(server === "waking" ? "banner_waking" : "banner_demo")}{" "}
          {server === "offline" && (
            <button className="text-link" onClick={api.retryServer}>{t("retry")}</button>
          )}
        </div>
      )}

      <main className={active === "map" ? "site-main full" : "site-main"}>{page}</main>

      {!desktop && (
        <nav className="bottom-nav">
          {LINKS.map((l) => (
            <button key={l.to} className={active === l.to ? "on" : ""} onClick={() => open(l.to)}>
              {l.icon}
              {t(l.label)}
            </button>
          ))}
        </nav>
      )}

      {toast && <div className="toast site-toast" role="status">{toast}</div>}
      {DEMO && <div className="demo-tag site-demo">{t("src_demo")}</div>}
      <SettingsDialog />
      <PrivacyDialog />
    </div>
  );
}

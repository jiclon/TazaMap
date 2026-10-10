// Оболочка сайта: одни и те же страницы на компьютере и телефоне.
// Компьютер — меню сверху. Телефон — меню снизу.
import type { ReactNode } from "react";
import { useStore, type Screen } from "../store";
import { CoinsBadge } from "../components/Common";
import { CalendarIcon, ChartIcon, HomeIcon, MapIcon, PlusIcon, ShopIcon, UserIcon } from "../components/Icons";
import { HomePage } from "./HomePage";
import { MapPage } from "./MapPage";
import { CleanupsPage } from "./CleanupsPage";
import { RatingPage } from "./RatingPage";
import { ProfilePage } from "./ProfilePage";
import { ShopPage } from "./ShopPage";

const LINKS: { label: string; to: Screen["name"]; icon: ReactNode }[] = [
  { label: "Главная", to: "home", icon: <HomeIcon /> },
  { label: "Карта", to: "map", icon: <MapIcon /> },
  { label: "Уборки", to: "cleanups", icon: <CalendarIcon /> },
  { label: "Рейтинг", to: "rating", icon: <ChartIcon /> },
  { label: "Магазин", to: "shop", icon: <ShopIcon /> },
  { label: "Профиль", to: "profile", icon: <UserIcon /> },
];

// Экраны места и уборки относятся к разделу «Карта»
const MAP_SCREENS: Screen["name"][] = ["map", "spot", "newSpot", "cleanup", "newCleanup"];

export function Shell({ detail, desktop }: { detail: ReactNode; desktop: boolean }) {
  const { screen, tab, setPicking, toast } = useStore();
  const active = MAP_SCREENS.includes(screen.name) ? "map" : screen.name;

  function open(name: Screen["name"]) {
    setPicking(false);
    tab({ name } as Screen);
  }

  let page: ReactNode;
  switch (active) {
    case "home": page = <HomePage />; break;
    case "cleanups": page = <CleanupsPage />; break;
    case "rating": page = <RatingPage />; break;
    case "profile": page = <ProfilePage />; break;
    case "shop": page = <ShopPage />; break;
    // На компьютере карта справа и панель слева, на телефоне — экран целиком
    default: page = desktop ? <MapPage detail={detail} /> : detail;
  }

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
                {l.label}
              </button>
            ))}
          </nav>
        )}
        <div className="site-right">
          <CoinsBadge />
          {desktop && (
            <button
              className="btn primary"
              onClick={() => {
                tab({ name: "map" });
                setPicking(true);
              }}
            >
              <PlusIcon size={18} />
              Отметить мусор
            </button>
          )}
        </div>
      </header>

      <main className={active === "map" ? "site-main full" : "site-main"}>{page}</main>

      {!desktop && (
        <nav className="bottom-nav">
          {LINKS.map((l) => (
            <button key={l.to} className={active === l.to ? "on" : ""} onClick={() => open(l.to)}>
              {l.icon}
              {l.label}
            </button>
          ))}
        </nav>
      )}

      {toast && <div className="toast site-toast" role="status">{toast}</div>}
      <div className="demo-tag site-demo">демо-данные</div>
    </div>
  );
}

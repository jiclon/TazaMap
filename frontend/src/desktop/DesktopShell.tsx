// Версия для компьютера: верхнее меню и отдельные страницы.
import type { ReactNode } from "react";
import { useStore, type Screen } from "../store";
import { CoinsBadge } from "../components/Common";
import { PlusIcon } from "../components/Icons";
import { HomePage } from "./HomePage";
import { MapPage } from "./MapPage";
import { CleanupsPage } from "./CleanupsPage";
import { RatingPage } from "./RatingPage";
import { ProfilePage } from "./ProfilePage";

const LINKS: { label: string; to: Screen["name"] }[] = [
  { label: "Главная", to: "home" },
  { label: "Карта", to: "map" },
  { label: "Уборки", to: "cleanups" },
  { label: "Рейтинг", to: "rating" },
  { label: "Профиль", to: "profile" },
];

// Экраны места и уборки открываются в панели на странице «Карта»
const MAP_SCREENS: Screen["name"][] = ["map", "spot", "newSpot", "cleanup", "newCleanup"];

export function DesktopShell({ detail }: { detail: ReactNode }) {
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
    default: page = <MapPage detail={detail} />;
  }

  return (
    <div className="site">
      <header className="site-nav">
        <button className="site-logo" onClick={() => open("home")}>
          <span className="logo-mark" aria-hidden="true" />
          TazaMap
        </button>
        <nav className="site-links">
          {LINKS.map((l) => (
            <button key={l.to} className={active === l.to ? "on" : ""} onClick={() => open(l.to)}>
              {l.label}
            </button>
          ))}
        </nav>
        <div className="site-right">
          <CoinsBadge />
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
        </div>
      </header>
      <main className={active === "map" ? "site-main full" : "site-main"}>{page}</main>
      {toast && <div className="toast site-toast" role="status">{toast}</div>}
      <div className="demo-tag site-demo">демо-данные</div>
    </div>
  );
}

import { useStore } from "../store";
import { BackIcon, CoinIcon } from "./Icons";
import { formatNumber, levelOf } from "../utils";

export function CoinsBadge() {
  const { user, tab } = useStore();
  if (!user) return null;
  const { level } = levelOf(user.xp);
  return (
    <div className="badges">
      <button className="pill coins" onClick={() => tab({ name: "shop" })} aria-label="Монеты — открыть магазин">
        <CoinIcon />
        {formatNumber(user.coins)}
      </button>
      <span className="pill level">Ур. {level}</span>
    </div>
  );
}

export function BackButton() {
  const { back } = useStore();
  return (
    <button className="round-btn" onClick={back} aria-label="Назад">
      <BackIcon />
    </button>
  );
}

export function TopBar({ title }: { title: string }) {
  return (
    <header className="topbar">
      <BackButton />
      <h1 className="topbar-title">{title}</h1>
    </header>
  );
}

// Фото места; если фото нет — аккуратная заглушка
export function Photo({ src, label, tone = "dirty" }: { src: string | null; label: string; tone?: "dirty" | "clean" }) {
  if (src) return <img className="photo" src={src} alt={label} />;
  return (
    <div className={`photo placeholder ${tone}`}>
      <span>{label}</span>
    </div>
  );
}

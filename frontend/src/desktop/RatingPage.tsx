import { useEffect, useState } from "react";
import { useStore } from "../store";
import { useI18n } from "../i18n";
import { COINS, getRating } from "../api";
import { DEMO } from "../config";
import type { Player } from "../types";
import { CoinIcon } from "../components/Icons";
import { initials, levelOf } from "../utils";

export function RatingPage() {
  const { user } = useStore();
  const { t, rich, num } = useI18n();
  const [players, setPlayers] = useState<Player[]>([]);
  useEffect(() => {
    getRating().then(setPlayers);
  }, [user?.coins]);

  const top = players.slice(0, 3);
  const rest = players.slice(3);
  const myPlace = players.findIndex((p) => p.me) + 1;
  const me = players[myPlace - 1];
  const above = players[myPlace - 2];

  // Пьедестал: 2-е место слева, 1-е по центру, 3-е справа
  const podium = [top[1], top[0], top[2]].filter(Boolean);

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-h1">{t("rating_title")}</h1>
        <p className="muted">{t("rating_sub")}</p>
      </div>
      {!DEMO && <p className="note">{t("rating_demo_note")}</p>}
      <div className="rating-layout">
        <div className="stack">
          <div className="podium">
            {podium.map((p) => {
              const place = players.indexOf(p) + 1;
              return (
                <div key={p.name} className={`pod pod-${place}${p.me ? " me" : ""}`}>
                  <span className="face big">{initials(p.name)}</span>
                  <b>{p.me ? t("you") : p.name}</b>
                  <span className="coins-num"><CoinIcon size={14} />{num(p.coins)}</span>
                  <div className="pod-step"><span>{place}</span></div>
                </div>
              );
            })}
          </div>
          <ol className="rating" start={4}>
            {rest.map((p, i) => (
              <li key={p.name} className={p.me ? "me" : ""}>
                <span className="place">{i + 4}</span>
                <span className="face">{initials(p.name)}</span>
                <span className="grow">
                  <b>{p.me ? t("you_suffix", { name: p.name }) : p.name}</b>
                  <span className="muted small">{t("level_dot", { n: levelOf(p.coins).level })}</span>
                </span>
                <span className="coins-num"><CoinIcon size={14} />{num(p.coins)}</span>
              </li>
            ))}
          </ol>
        </div>

        <aside className="stack">
          {me && (
            <div className="dark-card">
              <span className="eyebrow on-dark">{t("your_place")}</span>
              <div className="big-place">#{myPlace}</div>
              <p className="on-dark-muted">
                {above ? rich("to_place", { n: myPlace - 1, coins: above.coins - me.coins + 1 }) : t("you_first")}
              </p>
            </div>
          )}
          <div className="card stack-sm">
            <span className="card-title">{t("how_earn")}</span>
            <div className="task"><span className="grow">{t("earn_mark")}</span><span className="reward-num">+{COINS.markSpot}</span></div>
            <div className="task"><span className="grow">{t("earn_confirm")}</span><span className="reward-num">+10</span></div>
            <div className="task"><span className="grow">{t("earn_come")}</span><span className="reward-num">+{COINS.participant}</span></div>
            <div className="task"><span className="grow">{t("earn_organize")}</span><span className="reward-num">+{COINS.organizer}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}

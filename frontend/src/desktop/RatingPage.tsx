import { useEffect, useState } from "react";
import { useStore } from "../store";
import { COINS, getRating } from "../api";
import type { Player } from "../types";
import { CoinIcon } from "../components/Icons";
import { formatNumber, initials, levelOf } from "../utils";

export function RatingPage() {
  const { user } = useStore();
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
        <h1 className="page-h1">Рейтинг города</h1>
        <p className="muted">Петропавловск · за всё время</p>
      </div>
      <div className="rating-layout">
        <div className="stack">
          <div className="podium">
            {podium.map((p) => {
              const place = players.indexOf(p) + 1;
              return (
                <div key={p.name} className={`pod pod-${place}${p.me ? " me" : ""}`}>
                  <span className="face big">{initials(p.name)}</span>
                  <b>{p.me ? "Вы" : p.name}</b>
                  <span className="coins-num"><CoinIcon size={14} />{formatNumber(p.coins)}</span>
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
                  <b>{p.me ? `${p.name} (вы)` : p.name}</b>
                  <span className="muted small"> · ур. {levelOf(p.coins).level}</span>
                </span>
                <span className="coins-num"><CoinIcon size={14} />{formatNumber(p.coins)}</span>
              </li>
            ))}
          </ol>
        </div>

        <aside className="stack">
          {me && (
            <div className="dark-card">
              <span className="eyebrow on-dark">Ваше место</span>
              <div className="big-place">#{myPlace}</div>
              {above ? (
                <p className="on-dark-muted">
                  До {myPlace - 1}-го места — <b className="on-dark">{formatNumber(above.coins - me.coins + 1)}</b> монет.
                  Это одна уборка и пара отмеченных мест.
                </p>
              ) : (
                <p className="on-dark-muted">Вы первые в городе. Держитесь!</p>
              )}
            </div>
          )}
          <div className="card stack-sm">
            <span className="card-title">Как заработать монеты</span>
            <div className="task"><span className="grow">Отметить грязное место</span><span className="reward-num">+{COINS.markSpot}</span></div>
            <div className="task"><span className="grow">Подтвердить чужую уборку</span><span className="reward-num">+10</span></div>
            <div className="task"><span className="grow">Прийти на уборку</span><span className="reward-num">+{COINS.participant}</span></div>
            <div className="task"><span className="grow">Организовать уборку</span><span className="reward-num">+{COINS.organizer}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}

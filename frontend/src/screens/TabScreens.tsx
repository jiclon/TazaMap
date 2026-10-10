import { useEffect, useState } from "react";
import { useStore } from "../store";
import { getRating } from "../api";
import { CoinsBadge, TabBar } from "../components/Common";
import { CheckIcon, CoinIcon } from "../components/Icons";
import type { Cleanup, Player } from "../types";
import { formatDateTime, formatNumber, initials, levelOf, titleOf } from "../utils";

function CleanupRow({ c }: { c: Cleanup }) {
  const { spots, go } = useStore();
  const spot = spots.find((s) => s.id === c.spot_id);
  if (!spot) return null;
  return (
    <button className="card list-row" onClick={() => go({ name: "cleanup", id: c.id })}>
      <div className={`dot state-${c.status === "planned" ? "planned" : "clean"}`} />
      <div className="grow">
        <div className="card-title">{spot.title}</div>
        <div className="muted small">{formatDateTime(c.starts_at)} · {c.participants} чел.</div>
      </div>
      {c.joined && <span className="chip done">{c.status === "planned" ? "Вы идёте" : "Вы были"}</span>}
    </button>
  );
}

export function CleanupsScreen() {
  const { cleanups } = useStore();
  const planned = cleanups.filter((c) => c.status === "planned").sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const done = cleanups.filter((c) => c.status === "done").sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  return (
    <div className="screen">
      <header className="home-header">
        <h1 className="page-title">Уборки</h1>
        <CoinsBadge />
      </header>
      <div className="scroll stack">
        <span className="eyebrow amber">Скоро</span>
        {planned.length ? planned.map((c) => <CleanupRow key={c.id} c={c} />) : (
          <p className="muted">Пока нет. Откройте грязное место на карте и создайте уборку.</p>
        )}
        <span className="eyebrow green">Уже убрано</span>
        {done.map((c) => <CleanupRow key={c.id} c={c} />)}
      </div>
      <TabBar />
    </div>
  );
}

export function RatingScreen() {
  const { user } = useStore();
  const [players, setPlayers] = useState<Player[]>([]);
  useEffect(() => {
    getRating().then(setPlayers);
  }, [user?.coins]);

  return (
    <div className="screen">
      <header className="home-header">
        <h1 className="page-title">Рейтинг города</h1>
        <CoinsBadge />
      </header>
      <div className="scroll stack">
        <p className="muted small">Петропавловск · за всё время</p>
        <ol className="rating">
          {players.map((p, i) => (
            <li key={p.name} className={p.me ? "me" : ""}>
              <span className="place">{i + 1}</span>
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
      <TabBar />
    </div>
  );
}

const TASKS = [
  { text: "Отметьте 1 новое место", reward: 5, done: true },
  { text: "Подтвердите чужую уборку", reward: 10, done: false },
  { text: "Поднимите мусор по дороге домой", reward: 5, done: false },
];

export function ProfileScreen() {
  const { user } = useStore();
  if (!user) return null;
  const { level, progress, to } = levelOf(user.coins);
  return (
    <div className="screen">
      <div className="scroll stack">
        <div className="profile-head">
          <div className="profile-top">
            <span className="face big">{initials(user.name)}</span>
            <div>
              <div className="h2 light">{user.name}</div>
              <div className="on-dark-muted">Уровень {level} · {titleOf(level)}</div>
            </div>
          </div>
          <div className="row-between small on-dark-muted">
            <span>До уровня {level + 1}</span>
            <span className="tabular">{formatNumber(user.coins)} / {formatNumber(to)}</span>
          </div>
          <div className="bar"><div style={{ width: `${Math.round(progress * 100)}%` }} /></div>
        </div>

        <div className="stats">
          <div><b>{user.cleanups_done}</b><span>уборок</span></div>
          <div><b>{user.spots_marked}</b><span>мест отмечено</span></div>
          <div><b>{user.hours} ч</b><span>волонтёрства</span></div>
        </div>

        <div className="card stack-sm">
          <div className="row-between">
            <span className="card-title">Задания на сегодня</span>
            <span className="muted small">серия 5 дней</span>
          </div>
          {TASKS.map((t) => (
            <div key={t.text} className="task">
              <span className={t.done ? "check on" : "check"}>{t.done && <CheckIcon />}</span>
              <span className="grow">{t.text}</span>
              <span className="reward-num">+{t.reward}</span>
            </div>
          ))}
        </div>

        <div className="card stack-sm">
          <span className="card-title">Обменять монеты</span>
          <div className="task"><span className="grow">Кофе в кафе-партнёре</span><span className="reward-num">300</span></div>
          <div className="task"><span className="grow">Сертификат волонтёра</span><span className="reward-num">1 000</span></div>
          <p className="muted small">Партнёры появятся после запуска</p>
        </div>
      </div>
      <TabBar />
    </div>
  );
}

import { useStore } from "../store";
import { CalendarIcon, ChartIcon, CheckIcon, CoinIcon, MapIcon, PinIcon } from "../components/Icons";
import { formatNumber, initials, levelOf, titleOf } from "../utils";

const TASKS = [
  { text: "Отметьте 1 новое место", reward: 5, done: true },
  { text: "Подтвердите чужую уборку", reward: 10, done: false },
  { text: "Поднимите мусор по дороге домой", reward: 5, done: false },
];

// Кольцо прогресса уровня
function LevelRing({ progress, level }: { progress: number; level: number }) {
  const r = 52;
  const len = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 128 128" aria-hidden="true">
      <circle cx="64" cy="64" r={r} fill="none" stroke="#2a3b31" strokeWidth="10" />
      <circle
        cx="64"
        cy="64"
        r={r}
        fill="none"
        stroke="var(--amber)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={`${len * progress} ${len}`}
        transform="rotate(-90 64 64)"
      />
      <text x="64" y="60" textAnchor="middle" className="ring-num">{level}</text>
      <text x="64" y="82" textAnchor="middle" className="ring-label">уровень</text>
    </svg>
  );
}

export function ProfilePage() {
  const { user, tab } = useStore();
  if (!user) return null;
  const { level, progress, to } = levelOf(user.xp);

  const badges = [
    { title: "Первая уборка", hint: "сходить на 1 уборку", got: user.cleanups_done >= 1, icon: <CheckIcon size={20} /> },
    { title: "Десятка", hint: "10 уборок", got: user.cleanups_done >= 10, icon: <CalendarIcon /> },
    { title: "Разведчик", hint: "отметить 10 мест", got: user.spots_marked >= 10, icon: <PinIcon size={22} /> },
    { title: "Хранитель парка", hint: "дойти до 7 уровня", got: level >= 7, icon: <MapIcon /> },
    { title: "Марафон", hint: "серия 7 дней", got: false, icon: <ChartIcon /> },
    { title: "Полсотни", hint: "50 часов волонтёрства", got: user.hours >= 50, icon: <CoinIcon size={22} /> },
  ];

  return (
    <div className="page">
      <div className="profile-grid">
        <section className="dark-card profile-card">
          <LevelRing progress={progress} level={level} />
          <div className="stack-sm">
            <div className="profile-name">
              <span className="face big">{initials(user.name)}</span>
              <div>
                <div className="h2 light">{user.name}</div>
                <div className="on-dark-muted">{titleOf(level)}</div>
              </div>
            </div>
            <p className="on-dark-muted">
              <b className="on-dark tabular">{formatNumber(user.coins)}</b> монет на счету · до уровня {level + 1} осталось{" "}
              <b className="on-dark tabular">{formatNumber(to - user.xp)}</b> очков
            </p>
          </div>
        </section>

        <section className="stats big-stats">
          <div><b>{user.cleanups_done}</b><span>уборок</span></div>
          <div><b>{user.spots_marked}</b><span>мест отмечено</span></div>
          <div><b>{user.hours} ч</b><span>волонтёрства</span></div>
        </section>

        <section className="card stack-sm">
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
        </section>

        <section className="card stack-sm">
          <span className="card-title">Достижения · {badges.filter((b) => b.got).length} из {badges.length}</span>
          <div className="badges-grid">
            {badges.map((b) => (
              <div key={b.title} className={b.got ? "badge got" : "badge"} title={b.hint}>
                <span className="badge-icon" aria-hidden="true">{b.icon}</span>
                <b>{b.title}</b>
                <span>{b.got ? "получено" : b.hint}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card rewards-card shop-teaser">
          <div className="grow stack-sm">
            <span className="card-title">Магазин наград</span>
            <span className="muted">Меняйте монеты на кофе, скидки и промокоды от партнёров</span>
          </div>
          <button className="btn primary" onClick={() => tab({ name: "shop" })}>Открыть магазин</button>
        </section>
      </div>
    </div>
  );
}

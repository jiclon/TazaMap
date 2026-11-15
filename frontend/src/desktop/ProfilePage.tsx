import { useStore } from "../store";
import { useI18n, type DictKey } from "../i18n";
import { DEMO, PROMO_FIRST_20 } from "../config";
import { CalendarIcon, ChartIcon, CheckIcon, CoinIcon, GearIcon, LogoutIcon, MapIcon, PinIcon } from "../components/Icons";
import { initials, levelOf, titleKey } from "../utils";

// Задания — пока только в прототипе: на сервере их ещё нет
const TASKS: { text: DictKey; reward: number; done: boolean }[] = [
  { text: "task_1", reward: 5, done: true },
  { text: "task_2", reward: 10, done: false },
  { text: "task_3", reward: 5, done: false },
];

// Кольцо прогресса уровня
function LevelRing({ progress, level, label }: { progress: number; level: number; label: string }) {
  const r = 52;
  const len = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 128 128" aria-hidden="true">
      <circle cx="64" cy="64" r={r} fill="none" stroke="var(--panel-line)" strokeWidth="10" />
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
      <text x="64" y="82" textAnchor="middle" className="ring-label">{label}</text>
    </svg>
  );
}

export function ProfilePage() {
  const { user, account, spots, tab, go, signOut, showToast, openDialog } = useStore();
  const { t, rich, num, date } = useI18n();

  const links = (
    <>
      <button className="btn ghost" onClick={() => openDialog("settings")}>
        <GearIcon size={18} />
        {t("settings")}
      </button>
      <button className="link-btn" onClick={() => openDialog("privacy")}>{t("privacy_link")}</button>
    </>
  );

  // Гость: предлагаем создать аккаунт
  if (!user) {
    return (
      <div className="page narrow">
        <section className="dark-card">
          <div className="h2 light">{t("guest_title")}</div>
          <p className="on-dark-muted">{t("guest_text")}</p>
          <div className="hero-actions">
            <button className="btn primary" onClick={() => go({ name: "auth", mode: "register" })}>
              {t("create_account")}
            </button>
            <button className="btn ghost" onClick={() => go({ name: "auth", mode: "login" })}>{t("sign_in")}</button>
          </div>
        </section>
        {PROMO_FIRST_20 && (
          <div className="promo">
            <CoinIcon size={22} />
            <p>{t("promo_first20")}</p>
          </div>
        )}
        <div className="profile-links">{links}</div>
      </div>
    );
  }

  const { level, progress, to } = levelOf(user.xp);
  // Статистику показываем, только когда она настоящая: в прототипе или когда сервер
  // начал присылать, кто отметил место (поле user_id).
  const statsKnown = DEMO || spots.some((s) => s.user_id != null);

  const badges = [
    { title: "badge_1", hint: "badge_1_hint", got: user.cleanups_done >= 1, icon: <CheckIcon size={20} /> },
    { title: "badge_2", hint: "badge_2_hint", got: user.cleanups_done >= 10, icon: <CalendarIcon /> },
    { title: "badge_3", hint: "badge_3_hint", got: user.spots_marked >= 10, icon: <PinIcon size={22} /> },
    { title: "badge_4", hint: "badge_4_hint", got: level >= 7, icon: <MapIcon /> },
    { title: "badge_5", hint: "badge_5_hint", got: false, icon: <ChartIcon /> },
    { title: "badge_6", hint: "badge_6_hint", got: user.hours >= 50, icon: <CoinIcon size={22} /> },
  ] satisfies { title: DictKey; hint: DictKey; got: boolean; icon: unknown }[];

  return (
    <div className="page">
      <div className="profile-grid">
        <section className="dark-card profile-card">
          <LevelRing progress={progress} level={level} label={t("level_word")} />
          <div className="stack-sm">
            <div className="profile-name">
              <span className="face big">{initials(user.name)}</span>
              <div>
                <div className="h2 light">{user.name}</div>
                <div className="on-dark-muted">{t(titleKey(level))}</div>
              </div>
            </div>
            <p className="on-dark-muted">
              {rich("profile_balance", { coins: user.coins, next: level + 1, left: to - user.xp })}
            </p>
          </div>
        </section>

        {statsKnown ? (
          <section className="stats big-stats">
            <div><b>{num(user.cleanups_done)}</b><span>{t("stat_cleanups")}</span></div>
            <div><b>{num(user.spots_marked)}</b><span>{t("stat_spots")}</span></div>
            <div><b>{t("hours_short", { n: user.hours })}</b><span>{t("stat_hours")}</span></div>
          </section>
        ) : (
          account && (
            <section className="card stack-sm">
              <span className="card-title">{t("account")}</span>
              <span className="muted">{t("member_since", { date: date(account.created_at) })}</span>
              {!account.is_verified && (
                <span className="muted small">
                  <span className="chip state-planned">{t("phone_unverified")}</span> {t("phone_unverified_hint")}
                </span>
              )}
            </section>
          )
        )}

        {DEMO && (
          <section className="card stack-sm">
            <div className="row-between">
              <span className="card-title">{t("tasks_title")}</span>
              <span className="muted small">{t("streak", { n: 5 })}</span>
            </div>
            {TASKS.map((task) => (
              <div key={task.text} className="task">
                <span className={task.done ? "check on" : "check"}>{task.done && <CheckIcon />}</span>
                <span className="grow">{t(task.text)}</span>
                <span className="reward-num">+{task.reward}</span>
              </div>
            ))}
          </section>
        )}

        <section className="card stack-sm">
          <span className="card-title">
            {t("achievements", { got: badges.filter((b) => b.got).length, all: badges.length })}
          </span>
          <div className="badges-grid">
            {badges.map((b) => (
              <div key={b.title} className={b.got ? "badge got" : "badge"}>
                <span className="badge-icon" aria-hidden="true">{b.icon}</span>
                <b>{t(b.title)}</b>
                <span>{b.got ? t("badge_got") : t(b.hint)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card rewards-card shop-teaser">
          <div className="grow stack-sm">
            <span className="card-title">{t("shop_title")}</span>
            <span className="muted">{t("shop_teaser_text")}</span>
          </div>
          <button className="btn primary" onClick={() => tab({ name: "shop" })}>{t("open_shop")}</button>
        </section>
      </div>

      <div className="profile-links">
        {links}
        {!DEMO && (
          <button
            className="btn ghost"
            onClick={() => {
              signOut();
              showToast(t("signed_out"));
            }}
          >
            <LogoutIcon />
            {t("sign_out")}
          </button>
        )}
      </div>
    </div>
  );
}

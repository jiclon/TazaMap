import { useStore } from "../store";
import { useI18n } from "../i18n";
import { CityMap } from "../components/CityMap";
import { CoinIcon } from "../components/Icons";
import { COINS } from "../api";
import { DEMO, PROMO_FIRST_20 } from "../config";
import { CleanupCard } from "./CleanupsPage";
import type { DictKey } from "../i18n";

// Вопросы и ответы: тексты лежат в словарях (faq_q1/faq_a1 и так далее)
const FAQ = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function HomePage() {
  const { spots, cleanups, user, go, tab, startMarking } = useStore();
  const { t, num } = useI18n();

  const cleaned = spots.filter((s) => s.status === "clean").length;
  const dirty = spots.length - cleaned;
  const people = cleanups.filter((c) => c.status === "done").reduce((sum, c) => sum + c.participants, 0);
  const upcoming = cleanups
    .filter((c) => c.status === "planned")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 3);

  return (
    <div className="page">
      <section className="hero">
        <div className="hero-text">
          <span className="eyebrow green">{t("home_eyebrow")}</span>
          <h1 className="hero-title">
            {t("hero_1a")} <span className="hl">{t("hero_1b")}</span>
            <br />
            {t("hero_2a")} <span className="hl amber">{t("hero_2b")}</span>
          </h1>
          <p className="hero-sub">{t("hero_sub")}</p>
          <div className="hero-actions">
            <button className="btn primary big-inline" onClick={() => tab({ name: "map" })}>{t("open_map")}</button>
            <button className="btn ghost big-inline" onClick={startMarking}>{t("mark_trash")}</button>
          </div>
        </div>
        <div
          className="hero-map"
          role="button"
          tabIndex={0}
          aria-label={t("open_map")}
          onClick={() => tab({ name: "map" })}
          onKeyDown={(e) => e.key === "Enter" && tab({ name: "map" })}
        >
          <CityMap spots={spots} cleanups={cleanups} />
          <span className="hero-map-cta">{t("hero_map_cta", { n: spots.length })}</span>
        </div>
      </section>

      {!DEMO && !user && PROMO_FIRST_20 && (
        <section className="promo wide">
          <CoinIcon size={28} />
          <div className="grow">
            <b>{t("promo_title")}</b>
            <p>{t("promo_first20")}</p>
          </div>
          <button className="btn primary" onClick={() => go({ name: "auth", mode: "register" })}>
            {t("create_account")}
          </button>
        </section>
      )}

      <section className="stats-strip">
        <div><b>{num(dirty)}</b><span>{t("stat_waiting", { n: dirty })}</span></div>
        <div><b>{num(cleaned)}</b><span>{t("stat_cleaned")}</span></div>
        <div><b>{num(people)}</b><span>{t("stat_people", { n: people })}</span></div>
        <div><b>+{COINS.participant}</b><span>{t("stat_coins")}</span></div>
      </section>

      <section className="steps">
        <h2 className="section-title">{t("how_title")}</h2>
        <ol>
          <li>
            <span className="step-num">1</span>
            <h3>{t("step1_title")}</h3>
            <p>{t("step1_text")}</p>
          </li>
          <li>
            <span className="step-num">2</span>
            <h3>{t("step2_title")}</h3>
            <p>{t("step2_text")}</p>
          </li>
          <li>
            <span className="step-num">3</span>
            <h3>{t("step3_title")}</h3>
            <p>{t("step3_text")}</p>
          </li>
        </ol>
      </section>

      <section className="quote">
        <p>{t("quote_text")}</p>
        <span>{t("quote_author")}</span>
      </section>

      <section className="faq">
        <h2 className="section-title">{t("faq_title")}</h2>
        <div className="faq-list">
          {FAQ.map((n) => (
            <details key={n}>
              <summary>{t(`faq_q${n}` as DictKey)}</summary>
              <p>{t(`faq_a${n}` as DictKey)}</p>
            </details>
          ))}
        </div>
      </section>

      <section>
        <div className="row-between section-head">
          <h2 className="section-title">{t("upcoming_title")}</h2>
          <button className="link-btn" onClick={() => tab({ name: "cleanups" })}>{t("all_cleanups")}</button>
        </div>
        <div className="cleanup-grid">
          {upcoming.length ? (
            upcoming.map((c) => (
              <CleanupCard key={c.id} c={c} onOpen={() => { tab({ name: "map" }); go({ name: "cleanup", id: c.id }); }} />
            ))
          ) : (
            <p className="muted">{t("none_planned")}</p>
          )}
        </div>
      </section>
    </div>
  );
}

import { useStore } from "../store";
import { CityMap } from "../components/CityMap";
import { COINS } from "../api";
import { formatNumber } from "../utils";
import { CleanupCard } from "./CleanupsPage";

export function HomePage() {
  const { spots, cleanups, go, tab, setPicking } = useStore();

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
          <span className="eyebrow green">Петропавловск · карта уборок</span>
          <h1 className="hero-title">
            Видишь мусор&nbsp;— <span className="hl">отметь.</span>
            <br />
            Хочешь помочь&nbsp;— <span className="hl amber">убери.</span>
          </h1>
          <p className="hero-sub">
            Жители отмечают грязные места с фото. Те, кто готов убирать, видят их на карте, собираются и получают
            монеты, уровни и бонусы от партнёров.
          </p>
          <div className="hero-actions">
            <button className="btn primary big-inline" onClick={() => tab({ name: "map" })}>Открыть карту</button>
            <button
              className="btn ghost big-inline"
              onClick={() => {
                tab({ name: "map" });
                setPicking(true);
              }}
            >
              Отметить мусор
            </button>
          </div>
        </div>
        <div
          className="hero-map"
          role="button"
          tabIndex={0}
          aria-label="Открыть карту"
          onClick={() => tab({ name: "map" })}
          onKeyDown={(e) => e.key === "Enter" && tab({ name: "map" })}
        >
          <CityMap spots={spots} cleanups={cleanups} fit="slice" />
          <span className="hero-map-cta">Смотреть все {spots.length} мест →</span>
        </div>
      </section>

      <section className="stats-strip">
        <div><b>{dirty}</b><span>мест ждут уборки</span></div>
        <div><b>{cleaned}</b><span>уже убрано</span></div>
        <div><b>{formatNumber(people)}</b><span>человек вышли убирать</span></div>
        <div><b>+{COINS.participant}</b><span>монет за каждую уборку</span></div>
      </section>

      <section className="steps">
        <h2 className="section-title">Как это работает</h2>
        <ol>
          <li>
            <span className="step-num">1</span>
            <h3>Отметьте место</h3>
            <p>Фото и точка на карте. Даже если убирать сами не собираетесь — кто-то другой увидит.</p>
          </li>
          <li>
            <span className="step-num">2</span>
            <h3>Соберитесь</h3>
            <p>Создайте уборку на время или просто приходите. Чат в Telegram — в один клик.</p>
          </li>
          <li>
            <span className="step-num">3</span>
            <h3>Покажите «после»</h3>
            <p>Фото результата, три участника подтверждают — и всем начисляются монеты.</p>
          </li>
        </ol>
      </section>

      <section className="quote">
        <p>«Есть места, которые я никогда не увижу, но там нужна помощь»</p>
        <span>энтузиаст, который сам убирает город и снимает это для Instagram</span>
      </section>

      <section>
        <div className="row-between section-head">
          <h2 className="section-title">Ближайшие уборки</h2>
          <button className="link-btn" onClick={() => tab({ name: "cleanups" })}>Все уборки →</button>
        </div>
        <div className="cleanup-grid">
          {upcoming.map((c) => (
            <CleanupCard key={c.id} c={c} onOpen={() => { tab({ name: "map" }); go({ name: "cleanup", id: c.id }); }} />
          ))}
        </div>
      </section>
    </div>
  );
}

import { useStore } from "../store";
import { useI18n } from "../i18n";
import { DEMO } from "../config";
import type { Cleanup } from "../types";
import { initials } from "../utils";

// Лица-примеры — только в прототипе. На сервере списка участников пока нет.
const FACES = ["Айдос", "Дана", "Мирас", "Алина"];

// Карточка уборки с «листком календаря» слева
export function CleanupCard({ c, onOpen }: { c: Cleanup; onOpen: () => void }) {
  const { spots } = useStore();
  const { t, monthShort, time } = useI18n();
  const spot = spots.find((s) => s.id === c.spot_id);
  if (!spot) return null;
  const planned = c.status === "planned";
  return (
    <button className={planned ? "cl-card" : "cl-card done"} onClick={onOpen}>
      <div className="cal">
        <span className="cal-month">{monthShort(c.starts_at)}</span>
        <span className="cal-day">{new Date(c.starts_at).getDate()}</span>
        <span className="cal-time">{time(c.starts_at)}</span>
      </div>
      <div className="cl-body">
        <span className={planned ? "chip state-planned" : "chip state-clean"}>
          {t(planned ? "chip_soon" : "state_clean")}
        </span>
        <h3>{spot.title}</h3>
        <p className="muted small">{c.gathering_place ?? t("place_tbd")}</p>
        <div className="cl-foot">
          {DEMO && (
            <div className="faces">
              {FACES.slice(0, Math.min(3, c.participants)).map((n) => (
                <span key={n} className="face sm">{initials(n)}</span>
              ))}
            </div>
          )}
          <span className="small muted">{t("people_short", { n: c.participants })}</span>
          {c.joined && <span className="chip done">{t(planned ? "you_go" : "you_were")}</span>}
        </div>
      </div>
    </button>
  );
}

export function CleanupsPage() {
  const { cleanups, tab, go } = useStore();
  const { t } = useI18n();
  const planned = cleanups.filter((c) => c.status === "planned").sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const done = cleanups.filter((c) => c.status === "done").sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const open = (id: number) => {
    tab({ name: "map" });
    go({ name: "cleanup", id });
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-h1">{t("cleanups_title")}</h1>
        <p className="muted">{t("cleanups_sub")}</p>
      </div>
      <h2 className="section-title">{t("soon_count", { n: planned.length })}</h2>
      <div className="cleanup-grid">
        {planned.length ? planned.map((c) => <CleanupCard key={c.id} c={c} onOpen={() => open(c.id)} />) : (
          <p className="muted">{t("none_planned")}</p>
        )}
      </div>
      {done.length > 0 && (
        <>
          <h2 className="section-title">{t("done_count", { n: done.length })}</h2>
          <div className="cleanup-grid">
            {done.map((c) => <CleanupCard key={c.id} c={c} onOpen={() => open(c.id)} />)}
          </div>
        </>
      )}
    </div>
  );
}

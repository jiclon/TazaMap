import { useStore } from "../store";
import type { Cleanup } from "../types";
import { initials } from "../utils";

const FACES = ["Айдос", "Дана", "Мирас", "Алина"];

// Карточка уборки с «листком календаря» слева
export function CleanupCard({ c, onOpen }: { c: Cleanup; onOpen: () => void }) {
  const { spots } = useStore();
  const spot = spots.find((s) => s.id === c.spot_id);
  if (!spot) return null;
  const d = new Date(c.starts_at);
  const planned = c.status === "planned";
  return (
    <button className={planned ? "cl-card" : "cl-card done"} onClick={onOpen}>
      <div className="cal">
        <span className="cal-month">{d.toLocaleDateString("ru-RU", { month: "short" }).replace(".", "")}</span>
        <span className="cal-day">{d.getDate()}</span>
        <span className="cal-time">{d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <div className="cl-body">
        <span className={planned ? "chip state-planned" : "chip state-clean"}>{planned ? "Скоро" : "Убрано"}</span>
        <h3>{spot.title}</h3>
        <p className="muted small">{c.gathering_place ?? "Место сбора уточняется в чате"}</p>
        <div className="cl-foot">
          <div className="faces">
            {FACES.slice(0, Math.min(3, c.participants)).map((n) => (
              <span key={n} className="face sm">{initials(n)}</span>
            ))}
          </div>
          <span className="small muted">{c.participants} чел.</span>
          {c.joined && <span className="chip done">{planned ? "Вы идёте" : "Вы были"}</span>}
        </div>
      </div>
    </button>
  );
}

export function CleanupsPage() {
  const { cleanups, tab, go } = useStore();
  const planned = cleanups.filter((c) => c.status === "planned").sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const done = cleanups.filter((c) => c.status === "done").sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  const open = (id: number) => {
    tab({ name: "map" });
    go({ name: "cleanup", id });
  };

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-h1">Уборки</h1>
        <p className="muted">Выберите уборку и нажмите «Я иду». Чтобы создать свою — откройте грязное место на карте.</p>
      </div>
      <h2 className="section-title">Скоро · {planned.length}</h2>
      <div className="cleanup-grid">
        {planned.length ? planned.map((c) => <CleanupCard key={c.id} c={c} onOpen={() => open(c.id)} />) : (
          <p className="muted">Пока нет запланированных уборок.</p>
        )}
      </div>
      <h2 className="section-title">Уже убрано · {done.length}</h2>
      <div className="cleanup-grid">
        {done.map((c) => <CleanupCard key={c.id} c={c} onOpen={() => open(c.id)} />)}
      </div>
    </div>
  );
}

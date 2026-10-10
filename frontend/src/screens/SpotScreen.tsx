import { useStore } from "../store";
import { Photo, TopBar } from "../components/Common";
import { CoinIcon } from "../components/Icons";
import { COINS } from "../api";
import { STATE_LABEL, TRASH_LABEL, formatDateTime, plannedCleanupFor, spotState, timeAgo } from "../utils";

export function SpotScreen({ id }: { id: number }) {
  const { spots, cleanups, go } = useStore();
  const spot = spots.find((s) => s.id === id);
  if (!spot) return null;

  const state = spotState(spot, cleanups);
  const planned = plannedCleanupFor(spot, cleanups);
  const done = cleanups.filter((c) => c.spot_id === spot.id && c.status === "done");

  return (
    <div className="screen">
      <TopBar title="Место" />
      <div className="scroll">
        <Photo src={spot.image} label="Фото «до»" tone={state === "clean" ? "clean" : "dirty"} />
        <div className="stack">
          <div className="chips">
            <span className={`chip state-${state}`}>{STATE_LABEL[state]}</span>
            <span className="chip">{TRASH_LABEL[spot.trash_level]}</span>
          </div>
          <div>
            <h2 className="h2">{spot.title}</h2>
            <p className="muted small">
              Отмечено {timeAgo(spot.created_at)} · {spot.latitude.toFixed(4)}° N, {spot.longitude.toFixed(4)}° E
            </p>
          </div>
          {spot.description && <p className="body">{spot.description}</p>}

          {state === "dirty" && (
            <div className="reward">
              <CoinIcon size={20} />
              <div>
                <b>+{COINS.organizer} монет</b> организатору, <b>+{COINS.participant}</b> каждому участнику после
                подтверждения
              </div>
            </div>
          )}

          {planned && (
            <button className="card next-card" onClick={() => go({ name: "cleanup", id: planned.id })}>
              <span className="eyebrow amber">Уборка назначена</span>
              <div className="card-title">{formatDateTime(planned.starts_at)}</div>
              <span className="muted small">Идут {planned.participants} · нажмите, чтобы присоединиться</span>
            </button>
          )}

          {state === "clean" && done[0] && (
            <button className="card" onClick={() => go({ name: "cleanup", id: done[0].id })}>
              <span className="eyebrow green">Убрано</span>
              <div className="card-title">Уборка {formatDateTime(done[0].starts_at)}</div>
              <span className="muted small">Участников: {done[0].participants} · посмотреть «до/после»</span>
            </button>
          )}
        </div>
      </div>
      {state === "dirty" && (
        <div className="bottom-actions column">
          <button className="btn primary big" onClick={() => go({ name: "newCleanup", spotId: spot.id })}>
            Организовать уборку
          </button>
        </div>
      )}
    </div>
  );
}

import { useStore } from "../store";
import { useI18n } from "../i18n";
import { Photo, TopBar } from "../components/Common";
import { CoinIcon } from "../components/Icons";
import { COINS, serverState } from "../api";
import { CLEANUPS_OPEN } from "../config";
import { plannedCleanupFor, spotState, stateKey, trashKey } from "../utils";

export function SpotScreen({ id }: { id: number }) {
  const { spots, cleanups, go, requireAuth, showToast } = useStore();
  const { t, rich, dateTime, ago } = useI18n();
  const spot = spots.find((s) => s.id === id);
  if (!spot) return null;

  const state = spotState(spot, cleanups);
  const planned = plannedCleanupFor(spot, cleanups);
  const done = cleanups.filter((c) => c.spot_id === spot.id && c.status === "done");
  // Сервер ещё не ответил: уборку создавать не на чем
  const example = serverState() !== "live" && serverState() !== "demo";

  return (
    <div className="screen">
      <TopBar title={t("spot_title")} />
      <div className="scroll">
        <Photo src={spot.image || null} label={t("photo_before")} tone={state === "clean" ? "clean" : "dirty"} />
        <div className="stack">
          <div className="chips">
            <span className={`chip state-${state}`}>{t(stateKey(state))}</span>
            <span className="chip">{t(trashKey(spot.trash_level))}</span>
            {example && <span className="chip dark">{t("example")}</span>}
          </div>
          <div>
            <h2 className="h2">{spot.title}</h2>
            <p className="muted small">
              {t("marked_when", { when: ago(spot.created_at) })} · {spot.latitude.toFixed(4)}° N, {spot.longitude.toFixed(4)}° E
            </p>
          </div>
          {spot.description && <p className="body">{spot.description}</p>}

          {state === "dirty" && (
            <div className="reward">
              <CoinIcon size={20} />
              <div>{rich("reward_text", { org: COINS.organizer, part: COINS.participant })}</div>
            </div>
          )}

          {planned && (
            <button className="card next-card" onClick={() => go({ name: "cleanup", id: planned.id })}>
              <span className="eyebrow amber">{t("state_planned")}</span>
              <div className="card-title">{dateTime(planned.starts_at)}</div>
              <span className="muted small">{t("going_join", { n: planned.participants })}</span>
            </button>
          )}

          {state === "clean" && done[0] && (
            <button className="card" onClick={() => go({ name: "cleanup", id: done[0].id })}>
              <span className="eyebrow green">{t("state_clean")}</span>
              <div className="card-title">{t("cleanup_on", { date: dateTime(done[0].starts_at) })}</div>
              <span className="muted small">{t("participants_see", { n: done[0].participants })}</span>
            </button>
          )}
        </div>
      </div>
      {state === "dirty" && (
        <div className="bottom-actions column">
          {CLEANUPS_OPEN ? (
            <button
              className="btn primary big"
              onClick={() => {
                if (example) showToast(t("example_spot_hint"));
                else requireAuth(() => go({ name: "newCleanup", spotId: spot.id }));
              }}
            >
              {t("organize")}
            </button>
          ) : (
            <p className="muted small center">{t("cleanups_soon")}</p>
          )}
        </div>
      )}
    </div>
  );
}

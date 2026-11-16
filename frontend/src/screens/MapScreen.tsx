import { useStore } from "../store";
import { useI18n } from "../i18n";
import { CityMap } from "../components/CityMap";
import { PlusIcon } from "../components/Icons";
import { COINS } from "../api";
import { MARKING_OPEN } from "../config";
import { spotState, stateKey, trashKey } from "../utils";

// На телефоне карта внутри экрана. На компьютере карта справа (см. MapPage.tsx),
// а здесь — шапка, ближайшая уборка и список мест.
export function MapScreen({ desktop = false }: { desktop?: boolean }) {
  const { spots, cleanups, loaded, go, picking, setPicking, picked, setPicked, startMarking } = useStore();
  const { t, dateTime } = useI18n();

  // Ближайшая запланированная уборка
  const next = cleanups
    .filter((c) => c.status === "planned")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  const nextSpot = next && spots.find((s) => s.id === next.spot_id);

  const hint = t(picked ? "pick_hint_placed" : "pick_hint");

  const pickActions = (
    <div className="bottom-actions">
      <button className="btn ghost" onClick={() => setPicking(false)}>{t("cancel")}</button>
      <button
        className="btn primary"
        disabled={!picked}
        onClick={() => {
          if (!picked) return;
          go({ name: "newSpot", ...picked });
          setPicking(false);
        }}
      >
        {t("next")}
      </button>
    </div>
  );

  const nextCard = next && nextSpot && (
    <button className="card next-card" onClick={() => go({ name: "cleanup", id: next.id })}>
      <div className="row-between">
        <span className="eyebrow amber">{t("next_cleanup")}</span>
        <span className="muted small">{t("coins_plus", { n: COINS.participant })}</span>
      </div>
      <div className="card-title">{nextSpot.title}</div>
      <div className="row-between">
        <span className="muted small">{t("date_going", { date: dateTime(next.starts_at), n: next.participants })}</span>
        <span className={next.joined ? "chip done" : "chip dark"}>{t(next.joined ? "you_go" : "details")}</span>
      </div>
    </button>
  );

  if (desktop) {
    const dirtyFirst = [...spots].sort((a, b) => Number(a.status === "clean") - Number(b.status === "clean"));
    return (
      <div className="screen">
        <header className="panel-head">
          <h1 className="page-title">{t("map_title")}</h1>
          <span className="muted small">{loaded ? t("spots_count", { n: spots.length }) : t("loading")}</span>
        </header>
        {picking ? (
          <>
            <div className="scroll stack">
              <div className="card how">
                <span className="eyebrow">{t("new_spot")}</span>
                <p className="small">{hint}</p>
              </div>
            </div>
            {pickActions}
          </>
        ) : (
          <div className="scroll stack desk-list">
            {nextCard}
            {loaded && spots.length === 0 && <p className="muted">{t("no_spots")}</p>}
            {spots.length > 0 && <span className="eyebrow">{t("dirty_first")}</span>}
            {dirtyFirst.map((s) => {
              const state = spotState(s, cleanups);
              return (
                <button key={s.id} className="card list-row" onClick={() => go({ name: "spot", id: s.id })}>
                  <div className={`dot state-${state}`} />
                  <div className="grow">
                    <div className="card-title">{s.title}</div>
                    <div className="muted small">{t(stateKey(state))} · {t(trashKey(s.trash_level)).toLowerCase()}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="map-wrap">
        <CityMap
          spots={spots}
          cleanups={cleanups}
          onSpotClick={(s) => go({ name: "spot", id: s.id })}
          picking={picking}
          picked={picked}
          onPick={setPicked}
        />
        {picking && <div className="pick-hint">{hint}</div>}
      </div>
      {picking ? pickActions : (
        <>
          {nextCard}
          <div className="action-row">
            {MARKING_OPEN ? (
              <button className="btn primary big" onClick={startMarking}>
                <PlusIcon />
                {t("mark_trash")}
              </button>
            ) : (
              <p className="muted small center">{t("marking_soon")}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

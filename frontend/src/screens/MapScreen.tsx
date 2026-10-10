import { useStore } from "../store";
import { CityMap } from "../components/CityMap";
import { PlusIcon } from "../components/Icons";
import { COINS } from "../api";
import { STATE_LABEL, TRASH_LABEL, formatDateTime, spotState } from "../utils";

// На телефоне карта внутри экрана. На компьютере карта справа (см. App.tsx),
// а здесь — шапка, ближайшая уборка и список мест.
export function MapScreen({ desktop = false }: { desktop?: boolean }) {
  const { spots, cleanups, go, picking, setPicking, picked, setPicked } = useStore();

  // Ближайшая запланированная уборка
  const next = cleanups
    .filter((c) => c.status === "planned")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  const nextSpot = next && spots.find((s) => s.id === next.spot_id);

  const hint = picked ? "Точка стоит. Можно поправить — нажмите в другом месте." : "Нажмите на карту там, где мусор";

  const pickActions = (
    <div className="bottom-actions">
      <button className="btn ghost" onClick={() => setPicking(false)}>Отмена</button>
      <button
        className="btn primary"
        disabled={!picked}
        onClick={() => {
          if (!picked) return;
          go({ name: "newSpot", ...picked });
          setPicking(false);
        }}
      >
        Далее
      </button>
    </div>
  );

  const nextCard = next && nextSpot && (
    <button className="card next-card" onClick={() => go({ name: "cleanup", id: next.id })}>
      <div className="row-between">
        <span className="eyebrow amber">Ближайшая уборка</span>
        <span className="muted small">+{COINS.participant} монет</span>
      </div>
      <div className="card-title">{nextSpot.title}</div>
      <div className="row-between">
        <span className="muted small">
          {formatDateTime(next.starts_at)} · идут {next.participants}
        </span>
        <span className={next.joined ? "chip done" : "chip dark"}>{next.joined ? "Вы идёте" : "Подробнее"}</span>
      </div>
    </button>
  );

  const markButton = (
    <div className="action-row">
      <button className="btn primary big" onClick={() => setPicking(true)}>
        <PlusIcon />
        Отметить мусор
      </button>
    </div>
  );

  if (desktop) {
    const dirtyFirst = [...spots].sort((a, b) => Number(a.status === "clean") - Number(b.status === "clean"));
    return (
      <div className="screen">
        <header className="panel-head">
          <h1 className="page-title">Карта мест</h1>
          <span className="muted small">{spots.length} мест</span>
        </header>
        {picking ? (
          <>
            <div className="scroll stack">
              <div className="card how">
                <span className="eyebrow">Новое место</span>
                <p className="small">{hint}</p>
              </div>
            </div>
            {pickActions}
          </>
        ) : (
          <>
            <div className="scroll stack desk-list">
              {nextCard}
              <span className="eyebrow">Сначала грязные</span>
              {dirtyFirst.map((s) => {
                const state = spotState(s, cleanups);
                return (
                  <button key={s.id} className="card list-row" onClick={() => go({ name: "spot", id: s.id })}>
                    <div className={`dot state-${state}`} />
                    <div className="grow">
                      <div className="card-title">{s.title}</div>
                      <div className="muted small">{STATE_LABEL[state]} · {TRASH_LABEL[s.trash_level].toLowerCase()}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
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
          {markButton}
        </>
      )}
    </div>
  );
}

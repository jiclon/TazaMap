import type { ReactNode } from "react";
import { useStore } from "../store";
import { useI18n } from "../i18n";
import { CityMap } from "../components/CityMap";

// Слева панель (список мест или открытое место/уборка), справа большая карта
export function MapPage({ detail }: { detail: ReactNode }) {
  const store = useStore();
  const { t } = useI18n();
  return (
    <div className="map-page">
      <aside className="panel">{detail}</aside>
      <section className="desk-map">
        <CityMap
          spots={store.spots}
          cleanups={store.cleanups}
          onSpotClick={(s) => {
            store.tab({ name: "map" });
            store.go({ name: "spot", id: s.id });
          }}
          picking={store.picking}
          picked={store.picked}
          onPick={store.setPicked}
        />
        {store.picking && (
          <div className="pick-hint">{t(store.picked ? "pick_hint_placed_desktop" : "pick_hint")}</div>
        )}
      </section>
    </div>
  );
}

import type { ReactNode } from "react";
import { useStore } from "../store";
import { CityMap } from "../components/CityMap";

// Слева панель (список мест или открытое место/уборка), справа большая карта
export function MapPage({ detail }: { detail: ReactNode }) {
  const store = useStore();
  return (
    <div className="map-page">
      <aside className="panel">{detail}</aside>
      <section className="desk-map">
        <CityMap
          fit="meet"
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
          <div className="pick-hint">
            {store.picked ? "Точка стоит — нажмите «Далее» слева" : "Нажмите на карту там, где мусор"}
          </div>
        )}
      </section>
    </div>
  );
}

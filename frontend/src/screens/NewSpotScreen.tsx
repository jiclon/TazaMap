import { useState, type FormEvent } from "react";
import { useStore } from "../store";
import { createSpot, COINS } from "../api";
import { TopBar } from "../components/Common";
import { CameraIcon, PinIcon } from "../components/Icons";
import type { TrashLevel } from "../types";
import { TRASH_LABEL, readPhoto } from "../utils";

export function NewSpotScreen({ latitude, longitude }: { latitude: number; longitude: number }) {
  const { reload, tab, go, showToast } = useStore();
  const [image, setImage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<TrashLevel>("medium");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const spot = await createSpot({
      title: title.trim(),
      description: description.trim() || null,
      latitude,
      longitude,
      image,
      trash_level: level,
    });
    await reload();
    showToast(`Место отмечено · +${COINS.markSpot} монет`);
    tab({ name: "map" });
    go({ name: "spot", id: spot.id });
  }

  return (
    <div className="screen">
      <TopBar title="Новое место" />
      <form className="scroll stack form" onSubmit={onSubmit} id="new-spot">
        <label className="photo-input">
          {image ? (
            <img src={image} alt="Фото места" />
          ) : (
            <span className="photo-input-empty">
              <CameraIcon size={28} />
              Добавить фото «до»
            </span>
          )}
          <input
            id="spot-photo"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setImage(await readPhoto(file));
            }}
          />
        </label>

        <p className="muted small coords">
          <PinIcon /> {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
        </p>

        <label className="field">
          <span>Название</span>
          <input
            id="spot-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: берег у моста"
            maxLength={80}
            required
          />
        </label>

        <label className="field">
          <span>Описание</span>
          <textarea
            id="spot-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Что за мусор, сколько примерно мешков, что взять с собой"
            rows={3}
          />
        </label>

        <fieldset className="field">
          <span>Сколько мусора</span>
          <div className="segmented">
            {(Object.keys(TRASH_LABEL) as TrashLevel[]).map((l) => (
              <button type="button" key={l} className={l === level ? "on" : ""} onClick={() => setLevel(l)}>
                {TRASH_LABEL[l]}
              </button>
            ))}
          </div>
        </fieldset>
      </form>
      <div className="bottom-actions column">
        <button className="btn primary big" type="submit" form="new-spot" disabled={!title.trim() || saving}>
          {saving ? "Сохраняем…" : "Отметить место"}
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState, type FormEvent } from "react";
import { useStore } from "../store";
import { useI18n } from "../i18n";
import { ApiError, createSpot, COINS } from "../api";
import { DEMO, LIMITS, REQUIRE_PHOTO } from "../config";
import { TopBar } from "../components/Common";
import { CameraIcon, PinIcon } from "../components/Icons";
import type { TrashLevel } from "../types";
import { errorKey, readPhoto, trashKey } from "../utils";

const LEVELS: TrashLevel[] = ["low", "medium", "high"];

export function NewSpotScreen({ latitude, longitude }: { latitude: number; longitude: number }) {
  const { reload, tab, go, showToast, sessionExpired } = useStore();
  const { t } = useI18n();
  const [image, setImage] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<TrashLevel>("medium");
  const [saving, setSaving] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoNeeded = REQUIRE_PHOTO && !DEMO;
  const ready = title.trim() !== "" && (!photoNeeded || image !== "");

  // Сохраняем дольше 4 секунд — скорее всего, сервер просыпается
  useEffect(() => {
    if (!saving) {
      setSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, [saving]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    try {
      const spot = await createSpot({
        title: title.trim(),
        description: description.trim() || null,
        latitude,
        longitude,
        image,
        trash_level: level,
      });
      await reload();
      // Монеты на сервере начисляются после проверки точки — не обещаем их сразу
      showToast(DEMO ? t("spot_marked_demo", { n: COINS.markSpot }) : t("spot_marked"));
      tab({ name: "map" });
      go({ name: "spot", id: spot.id });
    } catch (err) {
      if (err instanceof ApiError && err.code === "not_authenticated") {
        sessionExpired();
        return;
      }
      setError(t(errorKey(err)));
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      <TopBar title={t("new_spot")} />
      <form className="scroll stack form" onSubmit={onSubmit} id="new-spot">
        <label className="photo-input">
          {image ? (
            <img src={image} alt={t("photo_alt")} />
          ) : (
            <span className="photo-input-empty">
              <CameraIcon size={28} />
              {t("add_photo")}
            </span>
          )}
          <input
            id="spot-photo"
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                setImage(await readPhoto(file));
              } catch {
                showToast(t("e_photo"));
              }
            }}
          />
        </label>
        {photoNeeded && !image && <p className="field-hint">{t("photo_required")}</p>}
        <p className="field-hint">{t("photo_rules")}</p>

        <p className="muted small coords">
          <PinIcon /> {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E
        </p>

        <label className="field">
          <span>{t("field_title")}</span>
          <input
            id="spot-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("title_ph")}
            maxLength={LIMITS.spotTitleMax}
            required
          />
        </label>

        <label className="field">
          <span>{t("field_desc")}</span>
          <textarea
            id="spot-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("desc_ph")}
            maxLength={LIMITS.spotDescriptionMax}
            rows={3}
          />
        </label>

        <fieldset className="field">
          <legend>{t("how_much")}</legend>
          <div className="segmented">
            {LEVELS.map((l) => (
              <button type="button" key={l} className={l === level ? "on" : ""} aria-pressed={l === level} onClick={() => setLevel(l)}>
                {t(trashKey(l))}
              </button>
            ))}
          </div>
        </fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
      <div className="bottom-actions column">
        {slow && <p className="muted small center" role="status">{t("saving_waking")}</p>}
        <button className="btn primary big" type="submit" form="new-spot" disabled={!ready || saving}>
          {saving ? t("saving") : t("mark_place")}
        </button>
      </div>
    </div>
  );
}

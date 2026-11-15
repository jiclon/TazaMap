import { useState, type FormEvent } from "react";
import { useStore } from "../store";
import { useI18n } from "../i18n";
import { ApiError, createCleanup } from "../api";
import { LIMITS } from "../config";
import { TopBar } from "../components/Common";
import { errorKey } from "../utils";

function nextSaturday() {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function NewCleanupScreen({ spotId }: { spotId: number }) {
  const { spots, reload, tab, go, showToast, sessionExpired } = useStore();
  const { t } = useI18n();
  const spot = spots.find((s) => s.id === spotId);
  const [date, setDate] = useState(nextSaturday());
  const [time, setTime] = useState("11:00");
  const [place, setPlace] = useState("");
  const [chat, setChat] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startsAt = new Date(`${date}T${time}`);
  const inPast = isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (inPast || saving) return;
    setSaving(true);
    setError(null);
    try {
      const cleanup = await createCleanup({
        spot_id: spotId,
        starts_at: startsAt.toISOString(),
        gathering_place: place.trim() || null,
        chat_link: chat.trim() || null,
      });
      await reload();
      showToast(t("cleanup_created_toast"));
      tab({ name: "map" });
      go({ name: "cleanup", id: cleanup.id });
    } catch (err) {
      if (err instanceof ApiError && err.code === "not_authenticated") {
        sessionExpired();
        return;
      }
      setError(t(errorKey(err)));
      setSaving(false);
    }
  }

  if (!spot) return null;

  return (
    <div className="screen">
      <TopBar title={t("new_cleanup")} />
      <form className="scroll stack form" onSubmit={onSubmit} id="new-cleanup">
        <div>
          <span className="eyebrow">{t("place_label")}</span>
          <h2 className="h2">{spot.title}</h2>
        </div>
        <div className="two-cols">
          <label className="field">
            <span>{t("date")}</span>
            <input id="cleanup-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="field">
            <span>{t("time")}</span>
            <input id="cleanup-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </label>
        </div>
        {inPast && <p className="error">{t("pick_future")}</p>}
        <label className="field">
          <span>{t("where_meet")}</span>
          <input
            id="cleanup-place"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder={t("where_ph")}
            maxLength={LIMITS.placeMax}
          />
        </label>
        <label className="field">
          <span>{t("chat_label")}</span>
          <input
            id="cleanup-chat"
            type="url"
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            placeholder="https://t.me/…"
            maxLength={LIMITS.chatLinkMax}
          />
        </label>
        <p className="muted small">{t("organizer_note")}</p>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>
      <div className="bottom-actions column">
        <button className="btn primary big" type="submit" form="new-cleanup" disabled={inPast || saving}>
          {saving ? t("creating") : t("create_cleanup")}
        </button>
      </div>
    </div>
  );
}

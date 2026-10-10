import { useState, type FormEvent } from "react";
import { useStore } from "../store";
import { createCleanup } from "../api";
import { TopBar } from "../components/Common";

function nextSaturday() {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function NewCleanupScreen({ spotId }: { spotId: number }) {
  const { spots, reload, tab, go, showToast } = useStore();
  const spot = spots.find((s) => s.id === spotId);
  const [date, setDate] = useState(nextSaturday());
  const [time, setTime] = useState("11:00");
  const [place, setPlace] = useState("");
  const [chat, setChat] = useState("");
  const [saving, setSaving] = useState(false);

  const startsAt = new Date(`${date}T${time}`);
  const inPast = isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (inPast) return;
    setSaving(true);
    const cleanup = await createCleanup({
      spot_id: spotId,
      starts_at: startsAt.toISOString(),
      gathering_place: place.trim() || null,
      chat_link: chat.trim() || null,
    });
    await reload();
    showToast("Уборка создана — зовите людей");
    tab({ name: "map" });
    go({ name: "cleanup", id: cleanup.id });
  }

  if (!spot) return null;

  return (
    <div className="screen">
      <TopBar title="Новая уборка" />
      <form className="scroll stack form" onSubmit={onSubmit} id="new-cleanup">
        <div>
          <span className="eyebrow">Место</span>
          <h2 className="h2">{spot.title}</h2>
        </div>
        <div className="two-cols">
          <label className="field">
            <span>Дата</span>
            <input id="cleanup-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="field">
            <span>Время</span>
            <input id="cleanup-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
          </label>
        </div>
        {inPast && <p className="error">Выберите время в будущем</p>}
        <label className="field">
          <span>Где собираемся</span>
          <input
            id="cleanup-place"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Например: у главного входа"
          />
        </label>
        <label className="field">
          <span>Ссылка на чат в Telegram</span>
          <input
            id="cleanup-chat"
            type="url"
            value={chat}
            onChange={(e) => setChat(e.target.value)}
            placeholder="https://t.me/…"
          />
        </label>
        <p className="muted small">Вы станете организатором. После уборки загрузите фото «после» — участники подтвердят, и все получат монеты.</p>
      </form>
      <div className="bottom-actions column">
        <button className="btn primary big" type="submit" form="new-cleanup" disabled={inPast || saving}>
          {saving ? "Создаём…" : "Создать уборку"}
        </button>
      </div>
    </div>
  );
}

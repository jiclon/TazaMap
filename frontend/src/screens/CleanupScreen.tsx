import { useState } from "react";
import { useStore } from "../store";
import { COINS, finishCleanup, joinCleanup, leaveCleanup } from "../api";
import { Photo, TopBar } from "../components/Common";
import { CameraIcon, CheckIcon, TelegramIcon } from "../components/Icons";
import { formatDateTime, initials, readPhoto } from "../utils";

const FACES = ["Айдос", "Дана", "Мирас", "Алина", "Тимур", "Сабина"];

export function CleanupScreen({ id }: { id: number }) {
  const { spots, cleanups, user, reload, showToast } = useStore();
  const [busy, setBusy] = useState(false);
  const cleanup = cleanups.find((c) => c.id === id);
  const spot = cleanup && spots.find((s) => s.id === cleanup.spot_id);
  if (!cleanup || !spot) return null;

  const planned = cleanup.status === "planned";
  const faces = [...(cleanup.joined && user ? [user.name] : []), ...FACES].slice(0, 4);
  const more = cleanup.participants - faces.length;

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    await action();
    await reload();
    setBusy(false);
    showToast(message);
  }

  return (
    <div className="screen">
      <TopBar title="Уборка" />
      <div className="scroll stack">
        <div className="chips">
          <span className={planned ? "chip state-planned" : "chip state-clean"}>
            {planned ? "Уборка назначена" : "Убрано"}
          </span>
        </div>
        <div>
          <h2 className="h2">{spot.title}</h2>
          <p className="muted">
            {formatDateTime(cleanup.starts_at)}
            {cleanup.gathering_place && ` · ${cleanup.gathering_place}`}
          </p>
        </div>

        <div className="card row-between">
          <div>
            <div className="card-title">
              {planned ? "Идут" : "Убирали"} {cleanup.participants} чел.
            </div>
            <div className="muted small">{cleanup.joined ? "Вы в списке" : "Присоединяйтесь"}</div>
          </div>
          <div className="faces">
            {faces.map((n) => (
              <span key={n} className={n === user?.name ? "face me" : "face"}>{initials(n)}</span>
            ))}
            {more > 0 && <span className="face more">+{more}</span>}
          </div>
        </div>

        <div className="before-after">
          <figure>
            <Photo src={spot.image || null} label="фото «до»" />
            <figcaption>До</figcaption>
          </figure>
          <figure>
            {cleanup.after_image ? (
              <Photo src={cleanup.after_image} label="фото «после»" tone="clean" />
            ) : planned ? (
              <div className="photo placeholder empty"><span>снимается на месте</span></div>
            ) : (
              <Photo src={null} label="фото «после»" tone="clean" />
            )}
            <figcaption>После</figcaption>
          </figure>
        </div>

        <div className="card how">
          <span className="eyebrow">Как засчитывается</span>
          <p className="small">
            Отметьтесь на месте → фото «после» → 3 участника подтверждают → <b>+{COINS.participant} монет</b>
          </p>
        </div>

        {cleanup.chat_link && planned && (
          <a className="btn tg" href={cleanup.chat_link} target="_blank" rel="noreferrer">
            <TelegramIcon />
            Чат уборки в Telegram
          </a>
        )}
      </div>

      {planned && (
        <div className="bottom-actions column">
          {!cleanup.joined ? (
            <button
              className="btn primary big"
              disabled={busy}
              onClick={() => run(() => joinCleanup(cleanup.id), "Вы записаны на уборку")}
            >
              Я иду
            </button>
          ) : (
            <>
              <label className={busy ? "btn primary big disabled" : "btn primary big"}>
                <CameraIcon />
                Завершить: фото «после»
                <input
                  id="after-photo"
                  type="file"
                  accept="image/*"
                  hidden
                  disabled={busy}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const photo = await readPhoto(file);
                    run(() => finishCleanup(cleanup.id, photo), `Место убрано · +${COINS.participant} монет`);
                  }}
                />
              </label>
              <button
                className="btn ghost"
                disabled={busy}
                onClick={() => run(() => leaveCleanup(cleanup.id), "Вы больше не в списке")}
              >
                <CheckIcon /> Вы идёте · отменить
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useStore } from "../store";
import { useI18n } from "../i18n";
import { COINS, finishCleanup, joinCleanup, leaveCleanup } from "../api";
import { DEMO, SERVER_CAN } from "../config";
import { Photo, TopBar } from "../components/Common";
import { CameraIcon, CheckIcon, TelegramIcon } from "../components/Icons";
import { errorKey, initials, readPhoto } from "../utils";

// Лица-примеры — только в прототипе. На сервере списка участников пока нет.
const FACES = ["Айдос", "Дана", "Мирас", "Алина", "Тимур", "Сабина"];

export function CleanupScreen({ id }: { id: number }) {
  const { spots, cleanups, user, reload, showToast } = useStore();
  const { t, rich, dateTime } = useI18n();
  const [busy, setBusy] = useState(false);
  const cleanup = cleanups.find((c) => c.id === id);
  const spot = cleanup && spots.find((s) => s.id === cleanup.spot_id);
  if (!cleanup || !spot) return null;

  const planned = cleanup.status === "planned";
  const mine = cleanup.joined && user ? [user.name] : [];
  const faces = (DEMO ? [...mine, ...FACES] : mine).slice(0, 4);
  const more = DEMO ? cleanup.participants - faces.length : 0;
  // Запись и завершение пока умеет только прототип: на сервере этих эндпоинтов нет
  const canJoin = DEMO || SERVER_CAN.joinCleanup;
  const canFinish = DEMO || SERVER_CAN.finishCleanup;

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    try {
      await action();
      await reload();
      showToast(message);
    } catch (e) {
      showToast(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <TopBar title={t("cleanup_title")} />
      <div className="scroll stack">
        <div className="chips">
          <span className={planned ? "chip state-planned" : "chip state-clean"}>
            {t(planned ? "state_planned" : "state_clean")}
          </span>
        </div>
        <div>
          <h2 className="h2">{spot.title}</h2>
          <p className="muted">
            {dateTime(cleanup.starts_at)}
            {cleanup.gathering_place && ` · ${cleanup.gathering_place}`}
          </p>
        </div>

        <div className="card row-between">
          <div>
            <div className="card-title">{t(planned ? "going_n" : "were_n", { n: cleanup.participants })}</div>
            <div className="muted small">{t(cleanup.joined ? "in_list" : "join_us")}</div>
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
            <Photo src={spot.image || null} label={t("photo_before_lc")} />
            <figcaption>{t("before")}</figcaption>
          </figure>
          <figure>
            {cleanup.after_image ? (
              <Photo src={cleanup.after_image} label={t("photo_after_lc")} tone="clean" />
            ) : planned ? (
              <div className="photo placeholder empty"><span>{t("shot_on_site")}</span></div>
            ) : (
              <Photo src={null} label={t("photo_after_lc")} tone="clean" />
            )}
            <figcaption>{t("after")}</figcaption>
          </figure>
        </div>

        <div className="card how">
          <span className="eyebrow">{t("how_counted")}</span>
          <p className="small">{rich("how_counted_text", { n: COINS.participant })}</p>
        </div>

        {cleanup.chat_link && planned && (
          <a className="btn tg" href={cleanup.chat_link} target="_blank" rel="noreferrer">
            <TelegramIcon />
            {t("tg_chat")}
          </a>
        )}
      </div>

      {planned && (
        <div className="bottom-actions column">
          {!cleanup.joined ? (
            <button
              className="btn primary big"
              disabled={busy}
              onClick={() => {
                if (canJoin) run(() => joinCleanup(cleanup.id), t("joined_toast"));
                else showToast(t("soon_join"));
              }}
            >
              {t("i_go")}
            </button>
          ) : (
            <>
              {canFinish ? (
                <label className={busy ? "btn primary big disabled" : "btn primary big"}>
                  <CameraIcon />
                  {t("finish_btn")}
                  <input
                    id="after-photo"
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={busy}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const photo = await readPhoto(file);
                        run(() => finishCleanup(cleanup.id, photo), t("finished_toast", { n: COINS.participant }));
                      } catch {
                        showToast(t("e_photo"));
                      }
                    }}
                  />
                </label>
              ) : (
                <button className="btn primary big" onClick={() => showToast(t("soon_finish"))}>
                  <CameraIcon />
                  {t("finish_btn")}
                </button>
              )}
              {canJoin && (
                <button
                  className="btn ghost"
                  disabled={busy}
                  onClick={() => run(() => leaveCleanup(cleanup.id), t("left_toast"))}
                >
                  <CheckIcon /> {t("go_cancel")}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

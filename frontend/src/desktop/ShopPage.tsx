// Магазин наград: монеты за уборки меняются на промокоды и скидки партнёров.
import { useEffect, useState } from "react";
import { useStore } from "../store";
import { useI18n, type DictKey } from "../i18n";
import { buyReward, getPurchases, getRewards } from "../api";
import { DEMO, SERVER_CAN } from "../config";
import type { Purchase, Reward } from "../types";
import { Modal } from "../components/Common";
import { CoinIcon } from "../components/Icons";
import { errorKey } from "../utils";

const KIND_LABEL: Record<Reward["kind"], DictKey> = {
  promo: "kind_promo",
  discount: "kind_discount",
  merch: "kind_merch",
};

export function ShopPage() {
  const { user, reload, showToast, go } = useStore();
  const { t, rich, num } = useI18n();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [confirm, setConfirm] = useState<Reward | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    getRewards().then(setRewards);
    getPurchases().then(setPurchases);
  }, []);

  const canBuy = DEMO || SERVER_CAN.buyReward;
  const coins = user?.coins ?? 0;

  // У наград-примеров тексты лежат в словаре: reward_1_title, reward_1_partner, reward_1_text
  const text = (r: { id: number; demo?: boolean }, part: "title" | "partner" | "text", own: string) =>
    r.demo ? t(`reward_${r.id}_${part}` as DictKey) : own;

  async function buy(reward: Reward) {
    setBusy(true);
    try {
      const p = await buyReward(reward.id);
      setPurchases((list) => [p, ...list]);
      await reload();
      showToast(t("bought_toast", { code: p.code }));
    } catch (e) {
      showToast(t(errorKey(e)));
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  }

  function copy(p: Purchase) {
    navigator.clipboard?.writeText(p.code).catch(() => {});
    setCopied(p.id);
    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="page">
      <div className="shop-head">
        <div className="page-head">
          <h1 className="page-h1">{t("shop_title")}</h1>
          <p className="muted">{t("shop_sub")}</p>
        </div>
        {user ? (
          <div className="balance">
            <span className="muted small">{t("on_account")}</span>
            <b><CoinIcon size={22} /> {num(coins)}</b>
          </div>
        ) : (
          <button className="btn primary" onClick={() => go({ name: "auth", mode: "login" })}>{t("sign_in")}</button>
        )}
      </div>

      {!DEMO && <p className="note">{t("shop_demo_note")} {t(user ? "shop_soon" : "shop_login_hint")}</p>}

      <div className="shop-grid">
        {rewards.map((r) => {
          const lack = r.price - coins;
          const locked = !canBuy || lack > 0;
          return (
            <article key={r.id} className={locked ? "shop-item locked" : "shop-item"}>
              <span className={`chip kind-${r.kind}`}>{t(KIND_LABEL[r.kind])}</span>
              <div className="stack-xs">
                <b className="shop-title">{text(r, "title", r.title)}</b>
                <span className="muted small">{text(r, "partner", r.partner)} · {text(r, "text", r.description)}</span>
              </div>
              <div className="row-between">
                <span className="reward-num"><CoinIcon size={16} /> {num(r.price)}</span>
                {!canBuy ? (
                  <span className="muted small">{t("exchange_soon")}</span>
                ) : lack > 0 ? (
                  <span className="muted small">{t("lack", { n: lack })}</span>
                ) : (
                  <button className="btn primary small-btn" onClick={() => setConfirm(r)}>{t("exchange")}</button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {canBuy && (
        <section className="card stack-sm">
          <span className="card-title">{t("my_codes")}</span>
          {purchases.length === 0 ? (
            <p className="muted">{t("codes_empty")}</p>
          ) : (
            purchases.map((p) => {
              const r = rewards.find((x) => x.id === p.reward_id);
              return (
                <div key={p.id} className="promo-row">
                  <div className="grow stack-xs">
                    <b>{r ? text(r, "title", p.title) : p.title}</b>
                    <span className="muted small">{r ? text(r, "partner", p.partner) : p.partner}</span>
                  </div>
                  <code className="promo-code">{p.code}</code>
                  <button className="btn ghost small-btn" onClick={() => copy(p)}>
                    {t(copied === p.id ? "copied" : "copy")}
                  </button>
                </div>
              );
            })
          )}
        </section>
      )}

      {DEMO && <p className="muted small">{t("shop_demo_note")}</p>}

      <Modal open={confirm !== null} onClose={() => !busy && setConfirm(null)} labelledBy="confirm-title">
        {confirm && (
          <>
            <b id="confirm-title" className="shop-title">{text(confirm, "title", confirm.title)}</b>
            <p className="muted">{rich("confirm_text", { price: confirm.price, left: coins - confirm.price })}</p>
            <div className="sheet-actions">
              <button className="btn ghost" onClick={() => setConfirm(null)} disabled={busy}>{t("cancel")}</button>
              <button className="btn primary" onClick={() => buy(confirm)} disabled={busy}>
                {t(busy ? "exchanging" : "exchange")}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

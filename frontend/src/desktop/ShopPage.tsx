// Магазин наград: монеты за уборки меняются на промокоды и скидки партнёров.
import { useEffect, useState } from "react";
import { useStore } from "../store";
import { buyReward, getPurchases, getRewards } from "../api";
import type { Purchase, Reward } from "../types";
import { CoinIcon } from "../components/Icons";
import { formatNumber } from "../utils";

const KIND_LABEL: Record<Reward["kind"], string> = {
  promo: "Промокод",
  discount: "Скидка",
  merch: "От TazaMap",
};

export function ShopPage() {
  const { user, reload, showToast } = useStore();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [confirm, setConfirm] = useState<Reward | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    getRewards().then(setRewards);
    getPurchases().then(setPurchases);
  }, []);

  if (!user) return null;

  async function buy(reward: Reward) {
    setBusy(true);
    try {
      const p = await buyReward(reward.id);
      setPurchases((list) => [p, ...list]);
      await reload();
      showToast(`Готово! Промокод ${p.code}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Не получилось");
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
          <h1 className="page-h1">Магазин наград</h1>
          <p className="muted">Монеты за уборки — на кофе, скидки и промокоды партнёров</p>
        </div>
        <div className="balance">
          <span className="muted small">На счету</span>
          <b><CoinIcon size={22} /> {formatNumber(user.coins)}</b>
        </div>
      </div>

      <div className="shop-grid">
        {rewards.map((r) => {
          const lack = r.price - user.coins;
          return (
            <article key={r.id} className={lack > 0 ? "shop-item locked" : "shop-item"}>
              <span className={`chip kind-${r.kind}`}>{KIND_LABEL[r.kind]}</span>
              <div className="stack-xs">
                <b className="shop-title">{r.title}</b>
                <span className="muted small">{r.partner} · {r.description}</span>
              </div>
              <div className="row-between">
                <span className="reward-num"><CoinIcon size={16} /> {formatNumber(r.price)}</span>
                {lack > 0 ? (
                  <span className="muted small">не хватает {formatNumber(lack)}</span>
                ) : (
                  <button className="btn primary small-btn" onClick={() => setConfirm(r)}>Обменять</button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <section className="card stack-sm">
        <span className="card-title">Мои промокоды</span>
        {purchases.length === 0 ? (
          <p className="muted">Пока пусто. Обменяйте монеты — промокод появится здесь.</p>
        ) : (
          purchases.map((p) => (
            <div key={p.id} className="promo-row">
              <div className="grow stack-xs">
                <b>{p.title}</b>
                <span className="muted small">{p.partner}</span>
              </div>
              <code className="promo-code">{p.code}</code>
              <button className="btn ghost small-btn" onClick={() => copy(p)}>
                {copied === p.id ? "Скопировано" : "Копировать"}
              </button>
            </div>
          ))
        )}
      </section>

      <p className="muted small">Демо: партнёры и промокоды появятся после запуска. Промокоды закупаются на грант и у партнёров.</p>

      {confirm && (
        <div className="sheet-backdrop" onClick={() => !busy && setConfirm(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Подтверждение обмена" onClick={(e) => e.stopPropagation()}>
            <b className="shop-title">{confirm.title}</b>
            <p className="muted">
              Спишем <b className="tabular">{formatNumber(confirm.price)}</b> монет. Останется{" "}
              <b className="tabular">{formatNumber(user.coins - confirm.price)}</b>.
            </p>
            <div className="sheet-actions">
              <button className="btn ghost" onClick={() => setConfirm(null)} disabled={busy}>Отмена</button>
              <button className="btn primary" onClick={() => buy(confirm)} disabled={busy}>
                {busy ? "Обмениваем…" : "Обменять"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

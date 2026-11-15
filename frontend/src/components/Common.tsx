import { useEffect, useRef, type ReactNode } from "react";
import { useStore } from "../store";
import { useI18n } from "../i18n";
import { BackIcon, CoinIcon } from "./Icons";
import { levelOf } from "../utils";

export function CoinsBadge() {
  const { user, tab } = useStore();
  const { t, num } = useI18n();
  if (!user) return null;
  const { level } = levelOf(user.xp);
  return (
    <div className="badges">
      <button className="pill coins" onClick={() => tab({ name: "shop" })} aria-label={t("coins_open_shop")}>
        <CoinIcon />
        {num(user.coins)}
      </button>
      <span className="pill level">{t("level_short", { n: level })}</span>
    </div>
  );
}

export function BackButton() {
  const { back } = useStore();
  const { t } = useI18n();
  return (
    <button className="round-btn" onClick={back} aria-label={t("back")}>
      <BackIcon />
    </button>
  );
}

export function TopBar({ title }: { title: string }) {
  return (
    <header className="topbar">
      <BackButton />
      <h1 className="topbar-title">{title}</h1>
    </header>
  );
}

// Фото места; если фото нет — аккуратная заглушка
export function Photo({ src, label, tone = "dirty" }: { src: string | null; label: string; tone?: "dirty" | "clean" }) {
  if (src) return <img className="photo" src={src} alt={label} />;
  return (
    <div className={`photo placeholder ${tone}`}>
      <span>{label}</span>
    </div>
  );
}

// Окно поверх страницы на встроенном <dialog>: браузер сам держит фокус внутри,
// закрывает по Esc и по кнопке «Назад» на телефоне.
export function Modal({
  open,
  onClose,
  labelledBy,
  className = "",
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`sheet ${className}`}
      aria-labelledby={labelledBy}
      onClose={onClose}
      // Нажатие мимо окна закрывает его (в новых браузерах это же делает closedby="any")
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      {...{ closedby: "any" }}
    >
      {open && <div className="sheet-body">{children}</div>}
    </dialog>
  );
}

// Переключатель из нескольких вариантов (язык, тема)
export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; disabled?: boolean; note?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="field">
      <legend>{label}</legend>
      <div className="choice">
        {options.map((o) => (
          <label key={o.value} className={o.disabled ? "off" : o.value === value ? "on" : ""}>
            <input
              type="radio"
              name={label}
              value={o.value}
              checked={o.value === value}
              disabled={o.disabled}
              onChange={() => onChange(o.value)}
            />
            {o.label}
            {o.note && <span className="choice-note">{o.note}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

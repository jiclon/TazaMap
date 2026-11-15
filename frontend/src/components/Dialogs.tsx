// Окна поверх страницы: настройки (язык и тема) и политика конфиденциальности.
import { useStore } from "../store";
import { LANGS, useI18n } from "../i18n";
import { POLICY } from "../i18n/policy";
import { useTheme, type ThemePref } from "../theme";
import { CONTACT } from "../config";
import { Choice, Modal } from "./Common";
import { CloseIcon } from "./Icons";

export function SettingsDialog() {
  const { dialog, openDialog } = useStore();
  const { t, lang, setLang } = useI18n();
  const { pref, system, setPref } = useTheme();
  const close = () => openDialog(null);

  const themes: { value: ThemePref; label: string }[] = [
    // У варианта «Как в системе» показываем, какая тема сейчас на устройстве
    { value: "system", label: t("theme_system_now", { mode: t(system === "dark" ? "now_dark" : "now_light") }) },
    { value: "light", label: t("theme_light") },
    { value: "dark", label: t("theme_dark") },
  ];

  return (
    <Modal open={dialog === "settings"} onClose={close} labelledBy="settings-title">
      <div className="sheet-head">
        <h2 id="settings-title" className="sheet-title">{t("settings")}</h2>
        <button className="round-btn" onClick={close} aria-label={t("close")}>
          <CloseIcon />
        </button>
      </div>
      <Choice
        label={t("language")}
        value={lang}
        options={LANGS.map((l) => ({
          value: l.code,
          label: l.label,
          disabled: l.soon,
          note: l.soon ? t("in_development") : undefined,
        }))}
        onChange={setLang}
      />
      <Choice label={t("theme")} value={pref} options={themes} onChange={setPref} />
      <button className="link-btn start" onClick={() => openDialog("privacy")}>
        {t("privacy_link")}
      </button>
      <button className="btn primary" onClick={close}>
        {t("done")}
      </button>
    </Modal>
  );
}

export function PrivacyDialog() {
  const { dialog, openDialog } = useStore();
  const { t, lang, date } = useI18n();
  const policy = POLICY[lang];
  const close = () => openDialog(null);

  return (
    <Modal open={dialog === "privacy"} onClose={close} labelledBy="privacy-title" className="wide">
      <div className="sheet-head">
        <h2 id="privacy-title" className="sheet-title">{t("privacy_link")}</h2>
        <button className="round-btn" onClick={close} aria-label={t("close")}>
          <CloseIcon />
        </button>
      </div>
      <div className="policy">
        <p className="muted small">{t("policy_updated", { date: date(policy.updated) })}</p>
        {policy.intro.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {policy.sections.map((s) => (
          <section key={s.title}>
            <h3>{s.title}</h3>
            <ul>
              {s.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
        <p>{policy.contact.replace("{contact}", CONTACT)}</p>
      </div>
      <button className="btn primary" onClick={close}>
        {t("done")}
      </button>
    </Modal>
  );
}

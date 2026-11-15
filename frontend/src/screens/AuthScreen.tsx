// Регистрация и вход по номеру телефона и паролю.
// Запросы: POST /users (регистрация) и POST /login (вход) — см. api.ts.
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useStore, type AuthReason } from "../store";
import { useI18n, type DictKey } from "../i18n";
import * as api from "../api";
import { ApiError } from "../api";
import { CONTACT, LIMITS, PROMO_FIRST_20 } from "../config";
import { BackButton } from "../components/Common";
import { CoinIcon, EyeIcon, EyeOffIcon } from "../components/Icons";
import { errorKey, formatPhone, phoneDigits } from "../utils";

type Mode = "register" | "login";
type FieldName = "name" | "phone" | "password" | "password2" | "consent";
type FieldErrors = Partial<Record<FieldName, string>>;

const REASON_TEXT: Record<AuthReason, DictKey> = {
  mark: "need_login_to_mark",
  action: "need_login",
  session: "e_session",
};

// Поле формы: подпись, само поле и текст ошибки под ним
function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (ids: { id: string; describedBy?: string }) => ReactNode }) {
  const id = useId();
  const noteId = `${id}-note`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children({ id, describedBy: error || hint ? noteId : undefined })}
      {error ? (
        <p id={noteId} className="field-error">{error}</p>
      ) : (
        hint && <p id={noteId} className="field-hint">{hint}</p>
      )}
    </div>
  );
}

export function AuthScreen({ mode: startMode, reason }: { mode: Mode; reason?: AuthReason }) {
  const { signedIn, showToast, openDialog } = useStore();
  const { t } = useI18n();

  const [mode, setMode] = useState<Mode>(startMode);
  const [name, setName] = useState("");
  const [phoneText, setPhoneText] = useState("");
  const [digits, setDigits] = useState(""); // 10 цифр после +7
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [consent, setConsent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [phoneTaken, setPhoneTaken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [forgot, setForgot] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isRegister = mode === "register";
  const phone = `+7${digits}`;

  // Если ответа нет дольше 4 секунд — скорее всего, сервер просыпается. Говорим об этом.
  useEffect(() => {
    if (!busy) {
      setSlow(false);
      return;
    }
    const timer = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(timer);
  }, [busy]);

  // Проверки — такие же, как в schemas.py на бэкенде
  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (digits.length !== 10) errors.phone = t("e_phone");
    if (!password) errors.password = t("e_password_empty");
    if (!isRegister) return errors;

    const cleanName = name.trim();
    if (cleanName.length < LIMITS.nameMin) errors.name = t("e_name_short", { n: LIMITS.nameMin });
    else if (cleanName.length > LIMITS.nameMax) errors.name = t("e_name_long", { n: LIMITS.nameMax });
    if (password && password.length < LIMITS.passwordMin) {
      errors.password = t("e_password_short", { n: LIMITS.passwordMin });
    } else if (password.length > LIMITS.passwordMax) {
      errors.password = t("e_password_long", { n: LIMITS.passwordMax });
    }
    if (!password2) errors.password2 = t("e_password2_empty");
    else if (password2 !== password) errors.password2 = t("e_password2");
    if (!consent) errors.consent = t("e_consent");
    return errors;
  }

  const errors = validate();
  // Ошибку показываем после того, как человек вышел из поля или нажал кнопку, — не во время набора
  const shown = (field: FieldName) =>
    serverErrors[field] ?? (submitted || touched[field] ? errors[field] : undefined);
  const touch = (field: FieldName) => setTouched((prev) => ({ ...prev, [field]: true }));
  const clearServer = (field: FieldName) => {
    setServerErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
    if (field === "phone") setPhoneTaken(false);
  };

  function switchMode(next: Mode) {
    setMode(next);
    setSubmitted(false);
    setTouched({});
    setServerErrors({});
    setFormError(null);
    setPhoneTaken(false);
    setForgot(false);
    setPassword2("");
  }

  function showError(e: unknown) {
    if (e instanceof ApiError) {
      if (e.code === "phone_taken") {
        setServerErrors({ phone: t("e_phone_taken") });
        setPhoneTaken(true);
        return;
      }
      if (e.code === "invalid_phone") return setServerErrors({ phone: t("e_phone") });
      if (e.code === "invalid_name") return setServerErrors({ name: t("e_invalid_input") });
      if (e.code === "invalid_password") return setServerErrors({ password: t("e_invalid_input") });
    }
    setFormError(t(errorKey(e)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setSubmitted(true);
    setFormError(null);
    setNotice(null);
    const firstInvalid = (Object.keys(errors) as FieldName[])[0];
    if (firstInvalid) {
      // Ставим курсор в первое поле с ошибкой
      formRef.current?.querySelector<HTMLElement>(`[data-field="${firstInvalid}"]`)?.focus();
      return;
    }

    setBusy(true);
    try {
      if (isRegister) {
        const created = await api.register({ name: name.trim(), phone, password });
        try {
          const account = await api.login(phone, password, created);
          signedIn(account);
          showToast(t("welcome_toast", { name: account.name }));
        } catch {
          // Аккаунт создан, но войти сразу не получилось — просим войти вручную
          switchMode("login");
          setNotice(t("registered_login_now"));
        }
      } else {
        const account = await api.login(phone, password);
        signedIn(account);
        showToast(t("welcome_toast", { name: account.name }));
      }
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  const reasonText = reason ? t(REASON_TEXT[reason]) : null;

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-top">
          <BackButton />
        </div>
        <div className="auth-head">
          <h1 className="page-h1">{t(isRegister ? "auth_title_register" : "auth_title_login")}</h1>
          <p className="muted">{t(isRegister ? "auth_sub_register" : "auth_sub_login")}</p>
        </div>

        {reasonText && <p className="note">{reasonText}</p>}
        {notice && <p className="note good" role="status">{notice}</p>}

        {isRegister && PROMO_FIRST_20 && (
          <div className="promo">
            <CoinIcon size={22} />
            <p>{t("promo_first20")}</p>
          </div>
        )}

        <div className="segmented two" role="group" aria-label={t("tabs_aria")}>
          <button type="button" className={isRegister ? "on" : ""} aria-pressed={isRegister} onClick={() => switchMode("register")}>
            {t("tab_register")}
          </button>
          <button type="button" className={!isRegister ? "on" : ""} aria-pressed={!isRegister} onClick={() => switchMode("login")}>
            {t("tab_login")}
          </button>
        </div>

        {/* key: браузер и менеджер паролей должны видеть регистрацию и вход как две разные формы */}
        <form key={mode} ref={formRef} className="stack form" onSubmit={onSubmit} noValidate>
          {isRegister && (
            <Field label={t("f_name")} error={shown("name")}>
              {({ id, describedBy }) => (
                <input
                  id={id}
                  data-field="name"
                  name="name"
                  autoComplete="given-name"
                  enterKeyHint="next"
                  placeholder={t("f_name_ph")}
                  maxLength={LIMITS.nameMax}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearServer("name");
                  }}
                  onBlur={() => touch("name")}
                  aria-invalid={!!shown("name")}
                  aria-describedby={describedBy}
                  required
                />
              )}
            </Field>
          )}

          <Field label={t("f_phone")} error={shown("phone")} hint={isRegister ? t("phone_hint") : undefined}>
            {({ id, describedBy }) => (
              <input
                id={id}
                data-field="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                // username: так менеджер паролей запомнит номер вместе с паролем
                autoComplete="username"
                enterKeyHint="next"
                placeholder="+7 700 123 45 67"
                value={phoneText}
                onChange={(e) => {
                  const d = phoneDigits(e.target.value);
                  setDigits(d);
                  // Пока цифр нет, оставляем набранное «+7», чтобы поле не «съедало» ввод
                  setPhoneText(d ? formatPhone(d) : e.target.value.replace(/[^+\d]/g, "").slice(0, 2));
                  clearServer("phone");
                }}
                onBlur={() => touch("phone")}
                aria-invalid={!!shown("phone")}
                aria-describedby={describedBy}
                required
              />
            )}
          </Field>
          {phoneTaken && (
            <button type="button" className="link-btn start" onClick={() => switchMode("login")}>
              {t("login_instead")}
            </button>
          )}

          <Field
            label={t("f_password")}
            error={shown("password")}
            hint={isRegister ? t("f_password_hint", { n: LIMITS.passwordMin }) : undefined}
          >
            {({ id, describedBy }) => (
              <div className="password-wrap">
                <input
                  id={id}
                  data-field="password"
                  name={isRegister ? "new-password" : "current-password"}
                  type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  enterKeyHint={isRegister ? "next" : "go"}
                  maxLength={LIMITS.passwordMax}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearServer("password");
                  }}
                  onBlur={() => touch("password")}
                  aria-invalid={!!shown("password")}
                  aria-describedby={describedBy}
                  required
                />
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={t(showPassword ? "hide_password" : "show_password")}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            )}
          </Field>

          {isRegister && (
            <Field label={t("f_password2")} error={shown("password2")}>
              {({ id, describedBy }) => (
                <input
                  id={id}
                  data-field="password2"
                  name="new-password-repeat"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  enterKeyHint="go"
                  maxLength={LIMITS.passwordMax}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                  onBlur={() => touch("password2")}
                  aria-invalid={!!shown("password2")}
                  aria-describedby={describedBy}
                  required
                />
              )}
            </Field>
          )}

          {isRegister && (
            <div className="consent">
              <label>
                <input
                  type="checkbox"
                  data-field="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  aria-invalid={!!shown("consent")}
                  required
                />
                <span>
                  {t("consent_text")}{" "}
                  <button type="button" className="text-link" onClick={() => openDialog("privacy")}>
                    {t("consent_link")}
                  </button>
                </span>
              </label>
              {shown("consent") && <p className="field-error">{shown("consent")}</p>}
            </div>
          )}

          {formError && <p className="form-error" role="alert">{formError}</p>}

          <button className="btn primary big" type="submit" disabled={busy}>
            {busy ? t(isRegister ? "busy_register" : "busy_login") : t(isRegister ? "btn_register" : "btn_login")}
          </button>
          {slow && <p className="muted small center" role="status">{t("waking_hint")}</p>}

          {!isRegister && (
            <div className="center">
              <button type="button" className="link-btn" aria-expanded={forgot} onClick={() => setForgot((v) => !v)}>
                {t("forgot_password")}
              </button>
              {forgot && <p className="muted small">{t("forgot_text", { contact: CONTACT })}</p>}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

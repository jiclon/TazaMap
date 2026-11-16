// Настройки фронтенда в одном месте.

// Адрес бэкенда. Для локальной проверки создайте файл .env.local со строкой
// VITE_API_BASE=http://localhost:8000
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? "https://tazamap.onrender.com";

// Режим прототипа: демо-профиль с монетами, всё работает без входа и без сервера.
// Включается сборкой «npm run build:single» или переменной VITE_DEMO=1.
// В обычной сборке (Vercel) выключен: аккаунт и данные берутся только с сервера.
export const DEMO: boolean = import.meta.env.MODE === "single" || import.meta.env.VITE_DEMO === "1";

// Отметка мест закрыта: фото берётся из галереи, а модерации пока нет.
// Откроется вместе с проверкой фото администратором. Поставьте true, чтобы включить.
export const MARKING_OPEN = false;

// Организация уборок закрыта на зиму: под снегом убирать нечего.
export const CLEANUPS_OPEN = false;

// Отмечать места и создавать уборки можно только после входа.
// Должно совпадать с бэкендом: если POST /spots требует токен — здесь true.
export const REQUIRE_LOGIN = true;

// Без фото место не отправится: по фото проверяется точка перед начислением монет.
export const REQUIRE_PHOTO = true;

// Что сервер уже умеет хранить. Пока false — кнопка честно отвечает «скоро»
// и не показывает успех, которого на сервере нет.
// Появился эндпоинт — допишите запрос в api.ts и поставьте true.
export const SERVER_CAN = {
  joinCleanup: false, // POST /cleanups/{id}/join и /leave
  finishCleanup: false, // POST /cleanups/{id}/finish
  buyReward: false, // POST /rewards/{id}/buy
};

// Акция «первые 20 участников получат 100 монет». Закончилась — поставьте false.
export const PROMO_FIRST_20 = true;

// Ограничения полей — такие же, как в schemas.py и models.py на бэкенде
export const LIMITS = {
  nameMin: 2,
  nameMax: 40,
  passwordMin: 8,
  passwordMax: 128,
  spotTitleMax: 40,
  spotDescriptionMax: 120,
  placeMax: 80,
  chatLinkMax: 200,
};

// Куда писать, если забыли пароль или нужно удалить данные
export const CONTACT = "Instagram @tazamap";

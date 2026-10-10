# TazaMap — фронтенд

React + TypeScript + Vite.

## Запуск
npm install
npm run dev

## Где что лежит
- src/types.ts   — типы, как таблицы spots и cleanups в бэкенде
- src/api.ts     — все запросы к серверу. Сейчас демо-данные в памяти.
                   Когда будут эндпоинты — меняете только этот файл на fetch().
- src/store.tsx  — общее состояние и переходы между экранами
- src/desktop/   — оболочка (Shell.tsx) и страницы: Главная, Карта, Уборки, Рейтинг, Профиль
- src/screens/   — экраны раздела «Карта»: место, новое место, уборка, новая уборка
- src/components/CityMap.tsx — схема карты (потом заменить на Leaflet/2GIS)

## Сборка
npm run build         — для Vercel
npm run build:single  — один html-файл (прототип для ссылки)

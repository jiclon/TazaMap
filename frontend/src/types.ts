// Типы повторяют таблицы, которые вы пишете в бэкенде (models.py).
// Когда бэкенд будет готов, сервер будет присылать JSON ровно такой формы.

export type TrashLevel = "low" | "medium" | "high";

// Таблица spots
export interface Spot {
  id: number;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  image: string; // ссылка на фото «до»
  trash_level: TrashLevel;
  status: "dirty" | "clean";
  created_at: string; // дата приходит из API строкой: "2026-10-02T17:30:00"
}

// Таблица cleanups
export interface Cleanup {
  id: number;
  spot_id: number;
  starts_at: string;
  gathering_place: string | null;
  chat_link: string | null;
  status: "planned" | "done" | "canceled";
  created_at: string;
  // Этих полей нет в таблице cleanups — потом их посчитает
  // сервер из таблицы participants и отдаст вместе с уборкой.
  participants: number;
  joined: boolean;
  after_image: string | null;
}

export interface User {
  name: string;
  coins: number; // баланс: сколько можно потратить в магазине
  xp: number; // всего заработано за всё время — от этого считается уровень

  cleanups_done: number;
  spots_marked: number;
  hours: number;
}

// Таблица rewards — награды в магазине
export interface Reward {
  id: number;
  title: string;
  partner: string;
  description: string;
  price: number; // в монетах
  kind: "promo" | "discount" | "merch";
}

// Таблица purchases — что пользователь купил
export interface Purchase {
  id: number;
  reward_id: number;
  title: string;
  partner: string;
  code: string; // промокод, который показывают на кассе или вводят в приложении
  created_at: string;
}

export interface Player {
  name: string;
  coins: number;
  me?: boolean;
}

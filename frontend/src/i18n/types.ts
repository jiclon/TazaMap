import type { ru } from "./ru";

// Ключи берутся из русского словаря: забыли перевод в kk.ts или en.ts — сборка покажет ошибку.
export type DictKey = keyof typeof ru;
export type Dict = Record<DictKey, string>;
export type Lang = "ru" | "kk" | "en";

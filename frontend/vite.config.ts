import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Обычная сборка (npm run build) — для Vercel.
// Сборка в один файл (npm run build:single) — для ссылки-прототипа.
export default defineConfig(({ mode }) => ({
  plugins: mode === "single" ? [react(), viteSingleFile()] : [react()],
}));

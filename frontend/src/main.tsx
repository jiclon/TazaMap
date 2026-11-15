import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { StoreProvider } from "./store";
import { I18nProvider } from "./i18n";
import { ThemeProvider } from "./theme";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
);

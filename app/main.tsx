import { App } from "@/app/App";
import { registerServiceWorker } from "@/app/pwa";
import "@/app/styles/index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

registerServiceWorker();

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

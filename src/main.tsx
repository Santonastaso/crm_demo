import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@andrea/repo-ui/styles.css";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// TODO: Switch back to "@santonastaso/crm-ui/styles.css" once package is published
import "./temp-crm-ui-styles.css";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

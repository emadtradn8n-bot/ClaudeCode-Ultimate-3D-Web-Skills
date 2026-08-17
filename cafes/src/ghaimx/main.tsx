import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import GhaimExperience from "./GhaimExperience";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GhaimExperience />
  </StrictMode>
);

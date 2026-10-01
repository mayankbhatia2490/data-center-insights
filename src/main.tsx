import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, hydrate } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

const queryClient = new QueryClient();
const root = document.getElementById("root")!;

// Pre-rendered pages (see scripts/prerender.mjs) ship their data and HTML; attach to them.
// Pages that are not pre-rendered start empty and render on the client as before.
const state = (window as { __RQ_STATE__?: unknown }).__RQ_STATE__;
if (state) hydrate(queryClient, state as never);

const app = (
  <HelmetProvider>
    <App queryClient={queryClient} />
  </HelmetProvider>
);

if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}

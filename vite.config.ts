import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Production origin used in index.html fallback meta (social-preview bots). Keep in sync with
// VITE_SITE_URL, which Seo.tsx and scripts/generate-sitemap.ts read.
const SITE_URL = (process.env.VITE_SITE_URL || process.env.SITE_URL || "https://data-center-insights-fawn.vercel.app").replace(/\/$/, "");
const siteUrlPlugin = () => ({
  name: "site-url-html",
  transformIndexHtml: (html: string) => html.replace(/__SITE_URL__/g, SITE_URL),
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), siteUrlPlugin(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

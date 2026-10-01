// Writes static HTML for public pages into dist/ after `vite build` and the SSR build.
// Crawlers and AI bots that do not run JavaScript get the real <h1>, body text, title,
// canonical and JSON-LD; the browser then hydrates the same markup.
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DIST = path.resolve("dist");
const SSR = path.resolve("dist-ssr/entry-server.js");

// Pages whose content does not depend on live data. Data-driven pages are added in later steps.
const STATIC_ROUTES = ["/", "/news", "/about", "/about/methodology", "/pricing", "/privacy", "/terms", "/contact"];

const { render, getPublishedSlugs } = await import(pathToFileURL(SSR).href);
const template = fs.readFileSync(path.join(DIST, "index.html"), "utf8");

// Routes that are not pre-rendered (account pages, new stories, unknown URLs) are rewritten to this
// empty app shell by vercel.json. It must not be index.html: that file becomes the pre-rendered
// homepage, which would show homepage content and a homepage canonical on every other route.
fs.writeFileSync(path.join(DIST, "spa.html"), template);

// String replacers use functions below: page HTML and JSON can contain `$` sequences.
// Seo.tsx owns title, description, canonical, og and twitter tags; drop the static fallbacks
// (and the default <title>) so each page has exactly one of each.
const base = template
  .replace(/\s*<meta data-static-seo[^>]*>/g, "")
  .replace(/\s*<title>[^<]*<\/title>/, "");

// Every published story gets a page. If the list cannot be fetched, ship the static pages only:
// story URLs then fall back to the client-side route instead of failing the deploy.
let storyRoutes = [];
try {
  storyRoutes = (await getPublishedSlugs()).map((slug) => `/news/${slug}`);
} catch (e) {
  console.warn("prerender: could not list published stories, skipping story pages:", e?.message ?? e);
}
const ROUTES = [...STATIC_ROUTES, ...storyRoutes];

for (const route of ROUTES) {
  const { html, helmet, state, ready } = await render(route);
  if (!ready) {
    console.warn(`prerender: skipped ${route} (story not found at build time)`);
    continue;
  }
  if (!helmet) throw new Error(`No head tags rendered for ${route}`);
  const head = [helmet.title, helmet.meta, helmet.link, helmet.script].map((h) => h.toString()).join("\n    ");
  const page = base
    .replace("</head>", () => `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', () => `<div id="root">${html}</div>`)
    .replace("</body>", () => `    <script>window.__RQ_STATE__=${JSON.stringify(state).replace(/</g, "\\u003c")}</script>\n  </body>`);
  const out = route === "/" ? path.join(DIST, "index.html") : path.join(DIST, route, "index.html");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, page);
  console.log(`prerendered ${route} (${html.length} bytes of body HTML)`);
}

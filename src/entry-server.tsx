import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import App from "./App";

export function render(url: string) {
  const helmetContext: { helmet?: HelmetServerState } = {};
  const html = renderToString(
    <HelmetProvider context={helmetContext}>
      <App Router={({ children }) => <StaticRouter location={url}>{children}</StaticRouter>} />
    </HelmetProvider>,
  );
  return { html, helmet: helmetContext.helmet };
}

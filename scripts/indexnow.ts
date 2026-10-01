// Tells IndexNow search engines (Bing, Yandex and others that use Bing's index) about new or changed URLs.
// Google does not use IndexNow; it reads the sitemap. The key is public by design: the protocol proves
// ownership by fetching it from the site itself (public/indexnow-key.txt).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ENDPOINT = "https://api.indexnow.org/indexnow";

export async function submitIndexNow(site: string, urls: string[]): Promise<void> {
  const base = site.replace(/\/$/, "");
  const host = new URL(base).host;
  const list = [...new Set(urls)].filter((u) => {
    try {
      return new URL(u).host === host;
    } catch {
      return false;
    }
  });
  if (list.length === 0) {
    console.log("indexnow: nothing new or changed to submit");
    return;
  }

  const key = readFileSync(resolve("public/indexnow-key.txt"), "utf8").trim();
  const keyLocation = `${base}/indexnow-key.txt`;

  // The engines fetch the key file to check ownership, so it must already be live. On the very first
  // deploy it may not be: skip rather than send a request that will be rejected.
  const live = await fetch(`${keyLocation}?t=${Date.now()}`).then((r) => (r.ok ? r.text() : null)).catch(() => null);
  if (live?.trim() !== key) {
    console.warn(`indexnow: ${keyLocation} is not live yet (or does not match); skipping ${list.length} URLs`);
    return;
  }

  for (let i = 0; i < list.length; i += 10000) {
    const chunk = list.slice(i, i + 10000);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation, urlList: chunk }),
    });
    // 200 and 202 both mean accepted. Anything else is logged but never fails the job: a missed ping
    // only delays discovery, and the sitemap still lists the URLs.
    if (res.status === 200 || res.status === 202) console.log(`indexnow: submitted ${chunk.length} URLs (${res.status})`);
    else console.warn(`indexnow: ${res.status} ${res.statusText} for ${chunk.length} URLs`);
  }
}

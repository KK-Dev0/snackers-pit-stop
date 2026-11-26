import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { serwist } from "@serwist/next/config";

// Next already precaches every prerendered route, including /offline. Adding a
// second entry with a different revision makes Serwist throw during SW startup.
//
// The Next config strips ".html" from globbed public files before it rewrites
// the "public/" prefix, turning public/landing.html into "/public/landing",
// which 404s and aborts the service worker install. Skip the globbed file and
// precache it at the URL Next actually serves it from, with a content hash so
// edits to the landing page still bust the cache.
const landingHtml = readFileSync(new URL("./public/landing.html", import.meta.url));
const landingRevision = createHash("sha256").update(landingHtml).digest("hex");

export default serwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  globIgnores: ["public/landing.html"],
  additionalPrecacheEntries: [{ url: "/landing.html", revision: landingRevision }],
});

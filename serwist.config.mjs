import { serwist } from "@serwist/next/config";

// Next already precaches every prerendered route, including /offline. Adding a
// second entry with a different revision makes Serwist throw during SW startup.
export default serwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
});

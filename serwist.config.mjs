import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

import { serwist } from "@serwist/next/config";

// A stable revision keeps precached pages from going stale across deploys.
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  randomUUID();

export default serwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/offline", revision }],
});

import { spawnSync } from "node:child_process";

/** Seed the local recipe catalog so the smoke flow has deterministic data. */
export default function globalSetup() {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const env = {
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL ?? "file:local.db",
    NEXT_TELEMETRY_DISABLED: "1",
  };

  for (const script of ["db:migrate", "db:seed"]) {
    const result = spawnSync(npm, ["run", script], { stdio: "inherit", env, shell: true });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`npm run ${script} failed`);
  }
}

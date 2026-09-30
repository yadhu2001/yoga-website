import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { spawn } from "node:child_process";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const runtimeRoot = process.env.SITES_RUNTIME_ROOT ?? resolve(projectRoot, ".sites-runtime");

for (const directory of ["home", "npm-cache", "xdg-config", "tmp", "wrangler/logs"]) {
  mkdirSync(resolve(runtimeRoot, directory), { recursive: true });
}

const vinext = resolve(projectRoot, "node_modules/vinext/dist/cli.js");

const timeoutMs = parseDuration(process.env.SITES_BUILD_TIMEOUT ?? "3m");
const killAfterMs = parseDuration(process.env.SITES_BUILD_KILL_AFTER ?? "10s");

console.log("Running bounded vinext build...");
const child = spawn(process.execPath, [vinext, "build"], {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    SITES_ENV_READY: "1",
    SITES_PROJECT_ROOT: projectRoot,
    TMPDIR: resolve(runtimeRoot, "tmp"),
    WRANGLER_WRITE_LOGS: "false",
    WRANGLER_LOG_PATH: resolve(runtimeRoot, "wrangler/logs"),
    MINIFLARE_REGISTRY_PATH: resolve(runtimeRoot, "wrangler/registry"),
  },
});

let timedOut = false;
const timeout = setTimeout(() => {
  timedOut = true;
  console.error(`Build exceeded ${process.env.SITES_BUILD_TIMEOUT ?? "3m"}; stopping it.`);
  child.kill("SIGTERM");
  setTimeout(() => child.kill("SIGKILL"), killAfterMs).unref();
}, timeoutMs);

child.on("error", (error) => {
  clearTimeout(timeout);
  console.error(`Unable to run vinext: ${error.message}`);
  process.exitCode = 69;
});

child.on("exit", (code, signal) => {
  clearTimeout(timeout);
  process.exitCode = timedOut ? 124 : (code ?? (signal ? 1 : 0));
});

function parseDuration(value) {
  const match = /^(\d+)(ms|s|m|h)?$/.exec(value);
  if (!match) throw new Error(`Invalid duration: ${value}`);
  const unit = match[2] ?? "ms";
  return Number(match[1]) * ({ ms: 1, s: 1_000, m: 60_000, h: 3_600_000 })[unit];
}

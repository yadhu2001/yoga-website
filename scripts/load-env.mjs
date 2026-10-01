// Loads KEY=value pairs from .env (and .env.local) into process.env without overriding existing values.
import { readFileSync } from "node:fs";
import path from "node:path";

export function loadEnv() {
  for (const name of [".env.local", ".env"]) {
    let text = "";
    try {
      text = readFileSync(path.join(process.cwd(), name), "utf8");
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
    }
  }
}

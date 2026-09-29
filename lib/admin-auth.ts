import { readFileSync } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import "./local-env";

const COOKIE = "spy_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

function readEnvFile() {
  const values: Record<string, string> = {};
  try {
    const text = readFileSync(path.join(process.cwd(), ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      values[key] = value;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return values;
}

function credentials() {
  const file = readEnvFile();
  return {
    username: (file.ADMIN_USERNAME ?? process.env.ADMIN_USERNAME ?? "").trim(),
    password: file.ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "",
  };
}

export function adminConfigured() {
  const { username, password } = credentials();
  return Boolean(username && password);
}

export function adminLabel() {
  return credentials().username || "Administrator";
}

export const sessionCookie = {
  name: COOKIE,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  },
};

async function hmacKey() {
  const { username, password } = credentials();
  const material = new TextEncoder().encode(`${process.env.ADMIN_SESSION_SECRET ?? ""}\0${username}\0${password}`);
  return crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function digestEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const aa = new Uint8Array(a);
  const bb = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}

export async function passwordsMatch(username: string, password: string) {
  const { username: expectedUser, password: expectedPassword } = credentials();
  if (!expectedUser || !expectedPassword) return false;
  const [userOk, passwordOk] = await Promise.all([
    digestEqual(username, expectedUser),
    digestEqual(password, expectedPassword),
  ]);
  return userOk && passwordOk;
}

export async function createSessionToken() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `v1.${exp}`;
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(), new TextEncoder().encode(payload));
  return `${payload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function sessionValid(token: string | undefined) {
  if (!token || !adminConfigured()) return false;
  const [version, exp, signature] = token.split(".");
  if (version !== "v1" || !exp || !signature || token.split(".").length !== 3) return false;
  const expires = Number(exp);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return false;
  try {
    return crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      base64UrlToBytes(signature),
      new TextEncoder().encode(`v1.${exp}`),
    );
  } catch {
    return false;
  }
}

export async function adminSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  return sessionValid(token);
}

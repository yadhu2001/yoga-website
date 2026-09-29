import { adminConfigured, createSessionToken, passwordsMatch, sessionCookie } from "@/lib/admin-auth";
import { db, fail, sameOrigin } from "@/lib/server";
import { cookies } from "next/headers";
import { z } from "zod";

const input = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return fail("Request not permitted.", 403);
    if (!adminConfigured()) return fail("Add ADMIN_USERNAME and ADMIN_PASSWORD to the .env file, then restart the server.", 503);
    if (Number(request.headers.get("content-length")) > 4000) return fail("Submission too large.", 413);

    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") || "local";
    const bucket = Math.floor(Date.now() / 600000);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`admin-login:${ip}:${bucket}`));
    const rateId = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
    const rate = await db()
      .prepare("INSERT INTO rate_limits (id,count,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count")
      .bind(rateId, Date.now() + 600000)
      .first();
    if (rate.count > 8) return fail("Too many attempts. Please try again in 10 minutes.", 429);

    const body = input.parse(await request.json());
    if (!(await passwordsMatch(body.username, body.password))) return fail("Incorrect username or password.", 401);

    const jar = await cookies();
    jar.set(sessionCookie.name, await createSessionToken(), sessionCookie.options);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return fail("Enter your username and password.", 400);
    console.error(error);
    return fail();
  }
}

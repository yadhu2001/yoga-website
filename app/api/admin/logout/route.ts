import { sessionCookie } from "@/lib/admin-auth";
import { fail, sameOrigin } from "@/lib/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) return fail("Request not permitted.", 403);
    const jar = await cookies();
    jar.set(sessionCookie.name, "", { ...sessionCookie.options, maxAge: 0 });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(error);
    return fail();
  }
}

import { admin, ensureInitialized, fail, sameOrigin } from "@/lib/server";

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request) || !(await admin())) return fail("Administrator access required.", 403);
    await ensureInitialized();
    return Response.json({ ok: true });
  } catch (error) {
    console.error(error);
    return fail();
  }
}

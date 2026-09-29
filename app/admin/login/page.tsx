import { LoginForm } from "@/app/admin/login/login-form";
import { adminConfigured } from "@/lib/admin-auth";
import { admin } from "@/lib/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin login | Sree Pranavam Yoga", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await admin()) redirect("/admin");
  return <LoginForm ready={adminConfigured()} />;
}

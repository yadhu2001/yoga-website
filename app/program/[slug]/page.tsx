import { Site } from "@/components/site";
import { getEntries, getSettings, publicSettings } from "@/lib/server";
import { plainText } from "@/lib/rich-text";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [entries, settings] = await Promise.all([getEntries(), getSettings()]);
  const program = entries.find((entry) => entry.type === "programs" && entry.slug === slug);
  if (!program) return { title: "Program" };
  const description = plainText(program.tagline || program.description || settings.seoDescription);
  const base = String(settings.siteUrl || "").replace(/\/$/, "");
  return {
    title: `${program.title} | ${settings.name}`,
    description,
    alternates: { canonical: `${base}/program/${slug}` },
    robots: { index: !!settings.indexable, follow: !!settings.indexable },
    openGraph: { title: program.title, description, url: `${base}/program/${slug}`, siteName: settings.fullName, type: "website", locale: "en_IN" },
  };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [entries, settings] = await Promise.all([getEntries(), getSettings()]);
  if (!entries.some((entry) => entry.type === "programs" && entry.slug === slug)) notFound();
  return <Site entries={entries} s={publicSettings(settings)} page="program-detail" program={slug} />;
}

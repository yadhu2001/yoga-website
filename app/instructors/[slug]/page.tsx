import { Site } from "@/components/site";
import { getEntries, getSettings, publicSettings } from "@/lib/server";
import { plainText } from "@/lib/rich-text";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [entries, settings] = await Promise.all([getEntries(), getSettings()]);
  const person = entries.find((entry) => entry.type === "instructors" && entry.slug === slug);
  if (!person) return { title: "Instructor" };
  const description = plainText(person.heading || person.description || settings.seoDescription);
  const base = String(settings.siteUrl || "").replace(/\/$/, "");
  return {
    title: `${person.title} | ${settings.name}`,
    description,
    alternates: { canonical: `${base}/instructors/${slug}` },
    robots: { index: !!settings.indexable, follow: !!settings.indexable },
    openGraph: { title: person.title, description, url: `${base}/instructors/${slug}`, siteName: settings.fullName, type: "website", locale: "en_IN" },
  };
}

export default async function InstructorDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [entries, settings] = await Promise.all([getEntries(), getSettings()]);
  if (!entries.some((entry) => entry.type === "instructors" && entry.slug === slug)) notFound();
  return <Site entries={entries} s={publicSettings(settings)} page="instructor-detail" instructor={slug} />;
}

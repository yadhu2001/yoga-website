import { Site } from "@/components/site";
import { getEntries, getSettings, publicSettings } from "@/lib/server";
import { plainText } from "@/lib/rich-text";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [entries, settings] = await Promise.all([getEntries(), getSettings()]);
  const event = entries.find((entry) => entry.type === "events" && entry.slug === slug);
  if (!event) return { title: "Event" };
  const description = plainText(event.description || settings.seoDescription);
  const base = String(settings.siteUrl || "").replace(/\/$/, "");
  return {
    title: `${event.title} | ${settings.name}`,
    description,
    alternates: { canonical: `${base}/events/${slug}` },
    robots: { index: !!settings.indexable, follow: !!settings.indexable },
    openGraph: { title: event.title, description, url: `${base}/events/${slug}`, siteName: settings.fullName, type: "website", locale: "en_IN" },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [entries, settings] = await Promise.all([getEntries(), getSettings()]);
  if (!entries.some((entry) => entry.type === "events" && entry.slug === slug)) notFound();
  return <Site entries={entries} s={publicSettings(settings)} page="event-detail" event={slug} />;
}

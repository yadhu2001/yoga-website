import { Site } from "@/components/site";
import { getEntries, getSettings, publicSettings } from "@/lib/server";
import { plainText } from "@/lib/rich-text";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [entries, settings] = await Promise.all([getEntries(), getSettings()]);
  const course = entries.find((entry) => entry.type === "courses" && entry.slug === slug);
  if (!course) return { title: "Course" };
  const description = plainText(course.tagline || course.description || settings.seoDescription);
  const base = String(settings.siteUrl || "").replace(/\/$/, "");
  return {
    title: `${course.title} | ${settings.name}`,
    description,
    alternates: { canonical: `${base}/course/${slug}` },
    robots: { index: !!settings.indexable, follow: !!settings.indexable },
    openGraph: { title: course.title, description, url: `${base}/course/${slug}`, siteName: settings.fullName, type: "website", locale: "en_IN" },
  };
}

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [entries, settings] = await Promise.all([getEntries(), getSettings()]);
  if (!entries.some((entry) => entry.type === "courses" && entry.slug === slug)) notFound();
  return <Site entries={entries} s={publicSettings(settings)} page="course-detail" course={slug} />;
}

import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/** 認証不要でインデックスしてよい公開ページのみ */
const PUBLIC_PATHS: {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"];
  priority: number;
}[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.5 },
  { path: "/commerce-disclosure", changeFrequency: "yearly", priority: 0.5 },
  { path: "/login", changeFrequency: "monthly", priority: 0.4 },
  { path: "/signup", changeFrequency: "monthly", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const lastModified = new Date();

  return PUBLIC_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path || "/"}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}

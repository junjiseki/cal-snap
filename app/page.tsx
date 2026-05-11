import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicHome } from "@/components/landing/public-home";
import { absoluteSiteUrl, siteHomeAbsoluteUrl } from "@/lib/site-url";
import { getAuthenticatedUserCached } from "@/lib/supabase/server";

const HOME_OG_TITLE = "カロスナ - 3秒で終わる食事管理";
const HOME_OG_DESCRIPTION =
  "好きな物を我慢しすぎず、カロリーを把握しながら健康的にダイエット。食事写真からカロリー・PFCを推定し、毎日の栄養管理を続けられます。";

function homeSocialImage() {
  return {
    url: absoluteSiteUrl("/logo.png"),
    width: 1024,
    height: 1024,
    alt: "カロスナのロゴ",
  } as const;
}

export function generateMetadata(): Metadata {
  const homeUrl = siteHomeAbsoluteUrl();
  return {
    title: "健康的に痩せたい人の食事写真カロリー管理",
    description:
      "好きな物を我慢しすぎず、カロリーを把握しながら健康的にダイエット。食事写真からカロリー・PFCを推定し、摂取カロリーを管理できます。",
    alternates: {
      canonical: homeUrl,
    },
    openGraph: {
      url: homeUrl,
      title: HOME_OG_TITLE,
      description: HOME_OG_DESCRIPTION,
      images: [homeSocialImage()],
    },
    twitter: {
      card: "summary_large_image",
      title: HOME_OG_TITLE,
      description: HOME_OG_DESCRIPTION,
      images: [homeSocialImage()],
    },
  };
}

export default async function Home() {
  const { user } = await getAuthenticatedUserCached();
  if (user) {
    redirect("/meals/new");
  }
  return <PublicHome />;
}

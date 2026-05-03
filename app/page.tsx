import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicHome } from "@/components/landing/public-home";
import { getAuthenticatedUserCached } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "健康的に痩せたい人の食事写真カロリー管理",
  description:
    "好きな物を我慢しすぎず、カロリーを把握しながら健康的にダイエット。食事写真からカロリー・PFCを推定し、摂取カロリーを管理できます。",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "カロスナ - 3秒で終わる食事管理",
    description:
      "好きな物を我慢しすぎず、カロリーを把握しながら健康的にダイエット。食事写真からカロリー・PFCを推定し、毎日の栄養管理を続けられます。",
    images: ["/logo.png"],
  },
};

export default async function Home() {
  const { user } = await getAuthenticatedUserCached();
  if (user) {
    redirect("/meals/new");
  }
  return <PublicHome />;
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicHome } from "@/components/landing/public-home";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "食事写真をAI解析してカロリー記録",
  description:
    "食事写真からカロリー・たんぱく質・脂質・炭水化物を推定。日次の摂取カロリー推移を確認できる食事管理アプリです。",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "カロリースナップ | 食事写真で摂取カロリー記録",
    description:
      "食事写真からカロリー・PFCをAI推定し、日次の食事データを可視化。毎日の栄養管理をシンプルに続けられます。",
    images: ["/logo.png"],
  },
};

export default async function Home() {
  const { user } = await getAuthenticatedUser();
  if (user) {
    redirect("/meals/new");
  }
  return <PublicHome />;
}

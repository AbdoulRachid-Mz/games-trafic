import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ shopId: string }>;
}

export default async function LegacyShopProductCreatePage({ params }: PageProps) {
  const { shopId } = await params;
  redirect(`/marketplace/create?shopId=${encodeURIComponent(shopId)}`);
}

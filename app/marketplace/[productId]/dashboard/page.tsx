import { getProductById } from "@/actions/products";
import { notFound } from "next/navigation";
import { ProductOverview } from "./product-overview";
import { getAppUrlEnv } from "@/utils/app-url";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProductById(productId);

  if (!product) {
    return {
      title: "Produit introuvable",
    };
  }

  return {
    title: `Dashboard de ${product.name}`,
    description: product.description?.slice(0, 160) || "Détails du produit",
    openGraph: {
      title: `Dashboard de ${product.name}`,
      description: product.description?.slice(0, 160) || "Détails du produit",
      images: product.images && product.images.length > 0 ? [product.images[0]] : [],
    },
    icons: {
      icon: "/icons/marketplace-240.png",
      shortcut: "/icons/marketplace-128.png",
    },
    keywords:"Compte, Produit, Marketplace, gaming, games-trafics, dashboard"
  };
}


export default async function ProductDashboardPage({ params }: PageProps) {
  const { productId } = await params;
  const product = await getProductById(productId);

  if (!product) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ProductOverview product={product} productId={productId} />
    </div>
  );
}

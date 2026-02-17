import { Metadata } from "next";
import { getProductById, getProducts } from "@/actions/products";
import { notFound } from "next/navigation";
import type { ProductWithRelations } from "@/database/schema";
import { ProductDetail } from "@/components/pages/products/product-detail/product-detail";
import { TransactionQRCode } from "@/components/shared/qr-code";
import { encodeTransactionQR } from "@/utils/qr-utils";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";

// mise en cache de la page
export const revalidate = 60; // 60 secondes

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
    title: `${product.name} | GT-V2 Marketplace`,
    description: product.description?.slice(0, 160) || "Détails du produit",
    openGraph: {
      title: `${product.name} | GT-V2`,
      description: product.description?.slice(0, 160) || "Détails du produit",
      images: product.images && product.images.length > 0 ? [product.images[0]] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { productId } = await params;

  const product = await getProductById(productId, { 
    populate: ["shop", "category", "user"] 
  }) as ProductWithRelations;

  if (!product) {
    notFound();
  }

  // Récupérer les produits similaires de même catégorie
  let relatedProducts: ProductWithRelations[] = [];
  
  if (product.categoryId) {
    const res = await getProducts({
      filters: { 
        categoryId: product.categoryId,
        status: ["NON_VENDU", "RESERVE"],
        isDeleted: false,
        isActive: true 
      },
      pagination: { limit: 6, page: 1 },
      options: { 
        sortBy: "viewCount", 
        sortOrder: "desc" 
      }
    });
    relatedProducts = (res.data as ProductWithRelations[]).filter(p => p.id !== product.id);
  }

  return (
    <div className="space-y-8">
      <ProductDetail productId={productId} initialProduct={product} initialRelated={relatedProducts} />
      {/* <Card className="max-w-md mx-auto">
        <CardContent className="p-6 flex flex-col items-center">
          <Typography variant="h4" className="font-black italic uppercase tracking-tighter mb-2">
            Achat Rapide
          </Typography>
          <Typography variant="caption1" theme="muted" className="mb-4 text-center">
            Scannez pour acheter ce produit
          </Typography>
          <TransactionQRCode
            data={encodeTransactionQR({
              t: "PRODUCT_PURCHASE",
              id: product.id,
              a: parseFloat(product.price || "0"),
              m: { name: product.name }
            })}
            label={product.name}
            className="shadow-none border-none p-0 bg-transparent"
          />
        </CardContent>
      </Card> */}
    </div>
  );
}

import { Metadata } from "next";
import { getProductById, getProducts } from "@/actions/products";
import { notFound } from "next/navigation";
// import { ProductDetail } from "@/components/pages/products/product-detail";
import type { ProductWithRelations } from "@/database/schema";
import { ProductDetail } from "@/components/pages/products/product-detail/product-detail";

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

  let relatedProducts: ProductWithRelations[] = [];
  
  if (product.categoryId) {
    const res = await getProducts({
      filters: { 
        categoryId: product.categoryId,
        status: ["NON_VENDU", "RESERVE"],
        isDeleted: false,
        isActive: true 
      },
      pagination: { limit: 8, page: 1 },
      options: { 
        sortBy: "viewCount", 
        sortOrder: "desc" 
      }
    });
    relatedProducts = (res.data as ProductWithRelations[]).filter(p => p.id !== product.id).slice(0, 6);
  }

  return <ProductDetail product={product} relatedProducts={relatedProducts} />;
}
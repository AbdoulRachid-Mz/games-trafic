import { getProductById } from "@/actions/products";
import { notFound } from "next/navigation";
import { ProductOverview } from "./product-overview";

interface PageProps {
  params: Promise<{ productId: string }>;
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

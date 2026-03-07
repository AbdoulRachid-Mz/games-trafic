import { getProductById } from "@/actions/products";
import { notFound } from "next/navigation";
import { Typography } from "@/components/ui/typography";
import { ProductSettingsForm } from "@/components/pages/marketplace/product-settings-form";
import { decryptData } from "@/lib/encryption";

interface PageProps {
    params: Promise<{ productId: string }>;
}

export default async function ProductSettingsPage({ params }: PageProps) {
    const { productId } = await params;
    const product = await getProductById(productId);

    if (!product) notFound();

    const decryptedPassword = product.encryptedPassword 
        ? decryptData(product.encryptedPassword) 
        : "";

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <Typography variant="h2" weight="bold" className="tracking-tight italic uppercase">
                    Paramètres du Produit
                </Typography>
                <Typography variant="body-sm" theme="muted" className="mt-1">
                    Gérez la visibilité et la sécurité de votre produit.
                </Typography>
            </div>

            <ProductSettingsForm 
                product={product} 
                decryptedPassword={decryptedPassword} 
            />
        </div>
    );
}

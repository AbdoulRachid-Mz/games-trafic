import { getProductById } from "@/actions/products";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface PageProps {
    params: Promise<{ productId: string }>;
}

export default async function ProductOrdersPage({ params }: PageProps) {
    const { productId } = await params;
    const product = await getProductById(productId);

    if (!product) notFound();

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-8">
                <Typography variant="h2" weight="bold" className="tracking-tight italic uppercase">
                    Commandes du Produit
                </Typography>
                <Typography variant="body-sm" theme="muted" className="mt-1">
                    Gérez les ventes et transactions liées à ce compte.
                </Typography>
            </div>

            <Card className="border-border/50 bg-card/30 backdrop-blur-sm rounded-[2.5rem]">
                <CardHeader>
                    <CardTitle className="font-bold italic uppercase tracking-tighter">Historique des Commandes</CardTitle>
                    <CardDescription>Gérez les ventes et transactions liées à ce compte.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="p-6 rounded-full bg-muted/20 border-2 border-dashed border-border flex items-center justify-center">
                            <ShoppingCart className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                        <div>
                            <Typography variant="body-lg" weight="bold">Aucune commande pour le moment</Typography>
                            <Typography variant="body-sm" theme="muted">Partagez votre produit pour augmenter vos chances de vente !</Typography>
                        </div>
                        <Button variant="outline" className="rounded-xl mt-4">
                            Copier le lien de vente
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

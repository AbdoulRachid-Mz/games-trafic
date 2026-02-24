import { getProductById } from "@/actions/products";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

interface PageProps {
    params: Promise<{ productId: string }>;
}

export default async function ProductSettingsPage({ params }: PageProps) {
    const { productId } = await params;
    const product = await getProductById(productId);

    if (!product) notFound();

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

            <Card className="border-border/50 bg-card/30 backdrop-blur-sm rounded-[2.5rem]">
                <CardHeader>
                    <CardTitle className="font-bold italic uppercase tracking-tighter">Configuration</CardTitle>
                    <CardDescription>Modifiez les informations de visibilité et les détails techniques.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-6 rounded-3xl border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors">
                            <Shield className="w-8 h-8 text-primary mb-3" />
                            <Typography variant="body-lg" weight="bold">Sécurité du compte</Typography>
                            <Typography variant="caption1" theme="muted" className="mb-4">Gérez les informations d'accès sensibles.</Typography>
                            <Button variant="secondary" size="sm" className="w-full rounded-xl">Modifier les accès</Button>
                        </div>
                        <div className="p-6 rounded-3xl border border-border/50 bg-muted/10 hover:bg-muted/20 transition-colors">
                            <Eye className="w-8 h-8 text-primary mb-3" />
                            <Typography variant="body-lg" weight="bold">Visibilité</Typography>
                            <Typography variant="caption1" theme="muted" className="mb-4">Définissez si le produit est public ou masqué.</Typography>
                            <Button variant="secondary" size="sm" className="w-full rounded-xl">Options de visibilité</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

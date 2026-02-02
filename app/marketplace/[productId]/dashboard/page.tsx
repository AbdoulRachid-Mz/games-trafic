import { getProductById, getProductStats } from "@/actions/products";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, ShoppingCart, Heart, TrendingUp } from "lucide-react";
import { notFound } from "next/navigation";
import { AdvancedChart } from "@/components/ui/advanced-chart";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default async function ProductDashboardPage({ params }: PageProps) {
  const { productId } = await params;
  const product = await getProductById(productId);

  if (!product) notFound();

  // Mock stats - à remplacer par de vraies stats spécifiques au produit si disponibles
  const stats = [
    { title: "Vues totales", value: product.viewCount || 0, icon: Eye, change: "+12%" },
    { title: "Ventes", value: product.status === "VENDU" ? 1 : 0, icon: ShoppingCart, change: "0%" },
    { title: "Favoris", value: 0, icon: Heart, change: "+5%" }, // Nécessite une table interactions
    { title: "Taux de conversion", value: "0%", icon: TrendingUp, change: "+2%" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vue d'ensemble</h2>
          <p className="text-muted-foreground">Performances de votre produit sur les 30 derniers jours.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/shops/${product.shopId}/products`}>
            <Button variant="outline">Compléter les infos</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
            <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        {stat.title}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                        {stat.change} par rapport au mois dernier
                    </p>
                </CardContent>
            </Card>
        ))}
      </div>

      {/* Graphiques ou liste de commandes récentes ici */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <AdvancedChart
            data={[
              { name: "Total", Vues: Number(product.viewCount || 0), Favoris: 0, Ventes: product.status === "VENDU" ? 1 : 0 },
            ]}
            kind="bar"
            series={[
              { key: (r: any) => r["Vues"], label: "Vues", color: "hsl(var(--primary))" },
              { key: (r: any) => r["Favoris"], label: "Favoris", color: "#f59e0b" },
              { key: (r: any) => r["Ventes"], label: "Ventes", color: "#22c55e" },
            ]}
            title="Activité"
            description="Indicateurs clés du produit"
            showLegend
            showTooltip
            height={240}
          />
        </div>
        <Card className="col-span-3">
             <CardHeader>
                <CardTitle>Dernières interactions</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center py-8">Aucune interaction récente</p>
                 </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

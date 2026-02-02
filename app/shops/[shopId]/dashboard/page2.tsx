// // app/(main)/shops/[id]/dashboard/page.tsx
// "use client";

// import React from "react";
// import { useParams, useRouter } from "next/navigation";
// import { 
//   BarChart3, Package, Users, CreditCard, Settings,
//   TrendingUp, Shield, Globe, Bell, ShoppingBag
// } from "lucide-react";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Typography } from "@/components/ui/typography";
// import { Skeleton } from "@/components/ui/skeleton";

// export default function ShopDashboardPage() {
//   const params = useParams();
//   const router = useRouter();

//   const stats = [
//     { label: "Vues aujourd'hui", value: "1.2k", change: "+12%", icon: TrendingUp, color: "text-blue-500" },
//     { label: "Commandes", value: "24", change: "+8%", icon: ShoppingBag, color: "text-green-500" },
//     { label: "Revenus", value: "1.2k GTC", change: "+15%", icon: CreditCard, color: "text-amber-500" },
//     { label: "Nouveaux clients", value: "18", change: "+5%", icon: Users, color: "text-purple-500" },
//   ];

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
//       <div className="container mx-auto px-4 py-8">
//         {/* En-tête */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
//           <div>
//             <Typography variant="h1" weight="bold" className="mb-2">
//               Tableau de bord
//             </Typography>
//             <Typography variant="body-base" theme="muted">
//               Gérez votre boutique et suivez vos performances
//             </Typography>
//           </div>
//           <div className="flex gap-3">
//             <Button variant="outline" className="gap-2">
//               <Globe className="h-4 w-4" />
//               Voir la boutique
//             </Button>
//             <Button className="gap-2">
//               <Package className="h-4 w-4" />
//               Ajouter un produit
//             </Button>
//           </div>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//           {stats.map((stat, index) => (
//             <Card key={index}>
//               <CardContent className="p-6">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className={`p-3 rounded-full ${stat.color}/10`}>
//                     <stat.icon className={`h-6 w-6 ${stat.color}`} />
//                   </div>
//                   <div className="text-right">
//                     <div className="text-sm font-medium text-muted-foreground">
//                       {stat.label}
//                     </div>
//                     <div className="text-2xl font-bold">{stat.value}</div>
//                   </div>
//                 </div>
//                 <div className={`text-sm ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
//                   {stat.change} depuis hier
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>

//         {/* Navigation */}
//         <Tabs defaultValue="overview" className="space-y-8">
//           <TabsList className="grid grid-cols-5">
//             <TabsTrigger value="overview" className="gap-2">
//               <BarChart3 className="h-4 w-4" />
//               Aperçu
//             </TabsTrigger>
//             <TabsTrigger value="products" className="gap-2">
//               <Package className="h-4 w-4" />
//               Produits
//             </TabsTrigger>
//             <TabsTrigger value="orders" className="gap-2">
//               <ShoppingBag className="h-4 w-4" />
//               Commandes
//             </TabsTrigger>
//             <TabsTrigger value="customers" className="gap-2">
//               <Users className="h-4 w-4" />
//               Clients
//             </TabsTrigger>
//             <TabsTrigger value="settings" className="gap-2">
//               <Settings className="h-4 w-4" />
//               Paramètres
//             </TabsTrigger>
//           </TabsList>

//           <TabsContent value="overview">
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//               {/* Graphiques et plus de contenu */}
//             </div>
//           </TabsContent>
//         </Tabs>
//       </div>
//     </div>
//   );
// }
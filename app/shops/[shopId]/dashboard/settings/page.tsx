import React from 'react'

const ShopSettingsPage = () => {
  return (
    <div>ShopSettingsPage</div>
  )
}

export default ShopSettingsPage





// // app/(main)/shops/[id]/dashboard/settings/page.tsx
// "use client";

// import React, { useState, useEffect } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { motion } from "framer-motion";
// import { 
//   Save, ArrowLeft, Store, Globe, Phone, MapPin, 
//   ImageIcon, Palette, Bell, Shield, CreditCard, 
//   Users, Link, Eye, EyeOff, Trash2, RefreshCw,
//   CheckCircle, AlertCircle, Building, Mail, GlobeIcon
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Typography } from "@/components/ui/typography";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { Switch } from "@/components/ui/switch";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { AdvancedUpload } from "@/components/ui/advanced-upload";
// import { toast } from "sonner";
// import { Skeleton } from "@/components/ui/skeleton";
// import { getShopById, updateShop } from "@/actions/shops";
// import { useAuthContext } from "@/contexts/auth-context";
// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { shopKeys, useShopById } from "@/hooks/use-shops";

// export default function ShopSettingsPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { user } = useAuthContext();
//   const queryClient = useQueryClient();

//   const [isSaving, setIsSaving] = useState(false);
//   const [activeTab, setActiveTab] = useState("general");

//   const socialPlatforms = [
//     { value: "facebook", label: "Facebook", icon: "📘", color: "text-blue-600" },
//     { value: "instagram", label: "Instagram", icon: "📷", color: "text-pink-600" },
//     { value: "twitter", label: "X (Twitter)", icon: "🐦", color: "text-sky-500" },
//     { value: "youtube", label: "YouTube", icon: "🎥", color: "text-red-600" },
//     { value: "tiktok", label: "TikTok", icon: "🎵", color: "text-black" },
//     { value: "discord", label: "Discord", icon: "💬", color: "text-indigo-500" },
//     { value: "twitch", label: "Twitch", icon: "🎮", color: "text-purple-600" },
//     { value: "linkedin", label: "LinkedIn", icon: "💼", color: "text-blue-700" },
//   ];

//   // Use countries list from the countries package
//   const countrySuggestions = [
//     "France", "Belgique", "Suisse", "Canada", "États-Unis",
//     "Royaume-Uni", "Allemagne", "Espagne", "Italie", "Portugal"
//   ];

//   const [formData, setFormData] = useState({
//     // Informations générales
//     name: "",
//     description: "",
//     country: "",
//     phoneNumber: "",
//     website: "",
    
//     // Images
//     profileImage: "",
//     coverImage: "",
    
//     // Adresse
//     address: {
//       street: "",
//       city: "",
//       state: "",
//       postalCode: "",
//       countryCode: "",
//     },
    
//     // Réseaux sociaux
//     socialMedia: [
//       { platform: "facebook", url: "" },
//       { platform: "instagram", url: "" },
//       { platform: "twitter", url: "" },
//       { platform: "youtube", url: "" },
//       { platform: "tiktok", url: "" },
//       { platform: "discord", url: "" },
//     ],
    
//     // Visibilité
//     isActive: true,
//     isVisible: true,
    
//     // Notifications
//     notificationSettings: {
//       notifyOnNewOrder: true,
//       notifyOnNewMessage: true,
//       notifyOnReview: true,
//       notifyOnFollow: false,
//       channels: ["IN_APP", "EMAIL"],
//       emailNotifications: true,
//       pushNotifications: true,
//     } as {
//       notifyOnNewOrder: boolean;
//       notifyOnNewMessage: boolean;
//       notifyOnReview: boolean;
//       notifyOnFollow: boolean;
//       channels: string[];
//       emailNotifications: boolean;
//       pushNotifications: boolean;
//     },
    
//     // Thème
//     themeId: "",
//     customTheme: {
//       primaryColor: "#3b82f6",
//       secondaryColor: "#8b5cf6",
//       backgroundColor: "#ffffff",
//       textColor: "#1f2937",
//       borderRadius: "0.5rem",
//       fontFamily: "Inter",
//     },
//   });

//   // Fetch shop data using the hook
//   const { data: shop, isLoading } = useShopById(params.id as string, { populate: ["theme"] });

//   // Populate form data when shop data is loaded
//   useEffect(() => {
//     if (shop) {
//       setFormData({
//         name: shop.name || "",
//         description: shop.description || "",
//         country: shop.country || "",
//         phoneNumber: shop.phoneNumber || "",
//         website: shop.website || "",
//         profileImage: shop.profileImage || "",
//         coverImage: shop.coverImage || "",
//         address: shop.address &&
//           typeof shop.address === "object" &&
//           "street" in shop.address &&
//           "city" in shop.address &&
//           "state" in shop.address &&
//           "postalCode" in shop.address &&
//           "countryCode" in shop.address
//           ? {
//               street: String(shop.address.street),
//               city: String(shop.address.city),
//               state: String(shop.address.state),
//               postalCode: String(shop.address.postalCode),
//               countryCode: String(shop.address.countryCode),
//             }
//           : {
//               street: "",
//               city: "",
//               state: "",
//               postalCode: "",
//               countryCode: "",
//             },
//         socialMedia: Array.isArray(shop.socialMedia) && shop.socialMedia.length > 0
//           ? shop.socialMedia
//           : formData.socialMedia,
//         isActive: shop.isActive ?? true,
//         isVisible: shop.isVisible ?? true,
//         notificationSettings: shop.notificationSettings ?? formData.notificationSettings,
//         themeId: shop.themeId ?? formData.themeId,
//         customTheme: shop.customTheme && typeof shop.customTheme === "object"
//           ? {
//               primaryColor: String(shop.customTheme.primaryColor ?? formData.customTheme.primaryColor),
//               secondaryColor: String(shop.customTheme.secondaryColor ?? formData.customTheme.secondaryColor),
//               backgroundColor: String(shop.customTheme.backgroundColor ?? formData.customTheme.backgroundColor),
//               textColor: String(shop.customTheme.textColor ?? formData.customTheme.textColor),
//               borderRadius: String(shop.customTheme.borderRadius ?? formData.customTheme.borderRadius),
//               fontFamily: String(shop.customTheme.fontFamily ?? formData.customTheme.fontFamily),
//             }
//           : formData.customTheme,
//       });
//     }
//   }, [shop]);

//   // Mutation for updating shop
//   const updateShopMutation = useMutation({
//     mutationFn: (data: any) => updateShop(params.id as string, { ...data, updatedAt: new Date() }),
//     onSuccess: (updatedShop) => {
//       toast.success("Paramètres mis à jour avec succès !");
//       queryClient.setQueryData(shopKeys.detail(params.id as string, ["theme"]), updatedShop);
//     },
//     onError: (error: any) => {
//       console.error("Erreur mise à jour:", error);
//       toast.error(error.message || "Erreur lors de la mise à jour");
//     },
//   });

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!formData.name.trim()) {
//       toast.error("Le nom de la boutique est requis");
//       return;
//     }

//     setIsSaving(true);
//     await updateShopMutation.mutateAsync(formData);
//     setIsSaving(false);
//   };

//   const handleSocialMediaChange = (index: number, field: string, value: string) => {
//     const updatedSocialMedia = [...formData.socialMedia];
//     updatedSocialMedia[index] = {
//       ...updatedSocialMedia[index],
//       [field]: value,
//     };
//     setFormData({ ...formData, socialMedia: updatedSocialMedia });
//   };

//   const addSocialMedia = () => {
//     setFormData({
//       ...formData,
//       socialMedia: [...formData.socialMedia, { platform: "facebook", url: "" }],
//     });
//   };

//   const removeSocialMedia = (index: number) => {
//     const updatedSocialMedia = formData.socialMedia.filter((_, i) => i !== index);
//     setFormData({ ...formData, socialMedia: updatedSocialMedia });
//   };

//   const handleColorChange = (colorField: string, value: string) => {
//     setFormData({
//       ...formData,
//       customTheme: {
//         ...formData.customTheme,
//         [colorField]: value,
//       },
//     });
//   };

//   const resetToDefaults = () => {
//     if (shop) {
//       setFormData({
//         name: shop.name || "",
//         description: shop.description || "",
//         country: shop.country || "",
//         phoneNumber: shop.phoneNumber || "",
//         website: shop.website || "",
//         profileImage: shop.profileImage || "",
//         coverImage: shop.coverImage || "",
//         isActive: shop.isActive ?? true,
//         isVisible: shop.isVisible ?? true,
//         notificationSettings: shop.notificationSettings ?? {
//           notifyOnNewOrder: true,
//           notifyOnNewMessage: true,
//           notifyOnReview: true,
//           notifyOnFollow: false,
//           channels: ["IN_APP", "EMAIL"],
//           emailNotifications: true,
//           pushNotifications: true,
//         },
//         themeId: shop.themeId || "",
//         customTheme: shop.customTheme && typeof shop.customTheme === "object"
//           ? {
//               primaryColor: String(shop.customTheme.primaryColor ?? formData.customTheme.primaryColor),
//               secondaryColor: String(shop.customTheme.secondaryColor ?? formData.customTheme.secondaryColor),
//               backgroundColor: String(shop.customTheme.backgroundColor ?? formData.customTheme.backgroundColor),
//               textColor: String(shop.customTheme.textColor ?? formData.customTheme.textColor),
//               borderRadius: String(shop.customTheme.borderRadius ?? formData.customTheme.borderRadius),
//               fontFamily: String(shop.customTheme.fontFamily ?? formData.customTheme.fontFamily),
//             }
//           : formData.customTheme,
//       });
//       toast.info("Paramètres réinitialisés aux valeurs d'origine");
//     }
//   };

//   const handleDeleteShop = async () => {
//     if (!confirm("Êtes-vous sûr de vouloir supprimer cette boutique ? Cette action est irréversible.")) {
//       return;
//     }

//     try {
//       // TODO: Implémenter la suppression
//       toast.success("Boutique supprimée avec succès");
//       router.push("/shops");
//     } catch (error) {
//       toast.error("Erreur lors de la suppression");
//     }
//   };

//   if (isLoading) {
//     return <SettingsSkeleton />;
//   }
//   if (!shop) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Card className="max-w-md">
//           <CardContent className="p-8 text-center">
//             <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
//             <Typography variant="h4" weight="bold" className="mb-2">
//               Boutique non trouvée
//             </Typography>
//             <Button onClick={() => router.push("/shops")}>
//               Retour aux boutiques
//             </Button>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
//       <div className="mx-auto px-3 py-6">
//         {/* En-tête */}
//         <motion.div
//           initial={{ opacity: 0, y: -20 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="mb-8"
//         >
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center gap-4">
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => router.push(`/shops/${params.id}/dashboard`)}
//                 className="rounded-full"
//               >
//                 <ArrowLeft className="h-5 w-5" />
//               </Button>
//               <div>
//                 <Typography variant="h1" weight="bold" className="mb-1">
//                   Paramètres de la boutique
//                 </Typography>
//                 <Typography variant="body-sm" theme="muted">
//                   Gérez les paramètres et la configuration de votre boutique
//                 </Typography>
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               <Badge variant={shop.isActive ? "default" : "destructive"}>
//                 {shop.isActive ? "Actif" : "Inactif"}
//               </Badge>
//               <Badge variant={shop.verified ? "default" : "outline"}>
//                 {shop.verified ? "Vérifié" : "Non vérifié"}
//               </Badge>
//             </div>
//           </div>

//           {/* Boutons d'action */}
//           <div className="flex flex-wrap gap-3 mb-6">
//             <Button
//               variant="outline"
//               className="gap-2"
//               onClick={resetToDefaults}
//             >
//               <RefreshCw className="h-4 w-4" />
//               Réinitialiser
//             </Button>
//             <Button
//               variant="destructive"
//               className="gap-2"
//               onClick={handleDeleteShop}
//             >
//               <Trash2 className="h-4 w-4" />
//               Supprimer la boutique
//             </Button>
//           </div>
//         </motion.div>

//         <form onSubmit={handleSubmit}>
//           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
//             {/* Sidebar de navigation */}
//             <div className="lg:col-span-1">
//               <Card className="sticky top-6">
//                 <CardContent className="p-6">
//                   <Tabs
//                     value={activeTab}
//                     onValueChange={setActiveTab}
//                     orientation="vertical"
//                     className="w-full"
//                   >
//                     <TabsList className="flex flex-col h-auto items-start bg-transparent p-0 gap-1">
//                       <TabsTrigger 
//                         value="general" 
//                         className="w-full justify-start gap-3 py-3 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
//                       >
//                         <Store className="h-4 w-4" />
//                         Informations générales
//                       </TabsTrigger>
//                       <TabsTrigger 
//                         value="appearance" 
//                         className="w-full justify-start gap-3 py-3 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
//                       >
//                         <Palette className="h-4 w-4" />
//                         Apparence
//                       </TabsTrigger>
//                       <TabsTrigger 
//                         value="contact" 
//                         className="w-full justify-start gap-3 py-3 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
//                       >
//                         <Phone className="h-4 w-4" />
//                         Contact & Adresse
//                       </TabsTrigger>
//                       <TabsTrigger 
//                         value="social" 
//                         className="w-full justify-start gap-3 py-3 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
//                       >
//                         <Users className="h-4 w-4" />
//                         Réseaux sociaux
//                       </TabsTrigger>
//                       <TabsTrigger 
//                         value="notifications" 
//                         className="w-full justify-start gap-3 py-3 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
//                       >
//                         <Bell className="h-4 w-4" />
//                         Notifications
//                       </TabsTrigger>
//                       <TabsTrigger 
//                         value="visibility" 
//                         className="w-full justify-start gap-3 py-3 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
//                       >
//                         <Eye className="h-4 w-4" />
//                         Visibilité
//                       </TabsTrigger>
//                       <TabsTrigger 
//                         value="security" 
//                         className="w-full justify-start gap-3 py-3 px-4 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
//                       >
//                         <Shield className="h-4 w-4" />
//                         Sécurité
//                       </TabsTrigger>
//                     </TabsList>
//                   </Tabs>

//                   <Separator className="my-6" />

//                   <div className="space-y-3">
//                     <Typography variant="body-sm" weight="medium" className="flex items-center gap-2">
//                       <CheckCircle className="h-4 w-4 text-green-500" />
//                       Dernière mise à jour
//                     </Typography>
//                     <Typography variant="caption2" theme="muted">
//                       {shop?.updatedAt ? new Date(shop.updatedAt).toLocaleString("fr-FR") : "Non disponible"}
//                     </Typography>
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Contenu principal */}
//             <div className="lg:col-span-3">
//               <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//                 {/* Onglet: Informations générales */}
//                 <TabsContent value="general" className="space-y-6 mt-0">
//                   <motion.div
//                     initial={{ opacity: 0, x: 20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                   >
//                     <Card>
//                       <CardHeader>
//                         <CardTitle className="flex items-center gap-2">
//                           <Store className="h-5 w-5" />
//                           Informations générales
//                         </CardTitle>
//                         <CardDescription>
//                           Configurez les informations de base de votre boutique
//                         </CardDescription>
//                       </CardHeader>
//                       <CardContent className="space-y-6">
//                         {/* Nom de la boutique */}
//                         <div className="space-y-2">
//                           <Label htmlFor="name">
//                             Nom de la boutique <span className="text-destructive">*</span>
//                           </Label>
//                           <Input
//                             id="name"
//                             value={formData.name}
//                             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                             placeholder="Ex: GameZone Pro"
//                             className="h-12 text-lg"
//                             required
//                           />
//                           <Typography variant="caption2" theme="muted">
//                             Le nom doit être unique et descriptif
//                           </Typography>
//                         </div>

//                         {/* Description */}
//                         <div className="space-y-2">
//                           <Label htmlFor="description">Description</Label>
//                           <Textarea
//                             id="description"
//                             value={formData.description}
//                             onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                             placeholder="Décrivez votre boutique, vos spécialités, vos valeurs..."
//                             rows={4}
//                           />
//                           <Typography variant="caption2" theme="muted">
//                             Maximum 500 caractères. Décrivez ce qui rend votre boutique unique.
//                           </Typography>
//                         </div>

//                         {/* Images */}
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                           <div className="space-y-2">
//                             <Label>Photo de profil</Label>
//                             <AdvancedUpload
//                               value={formData.profileImage}
//                               onChange={(url) => setFormData({ ...formData, profileImage: url })}
//                               isRounded={true}
//                               maxSizeMB={2}
//                               className="mt-2"
//                             />
//                           </div>
//                           <div className="space-y-2">
//                             <Label>Bannière</Label>
//                             <AdvancedUpload
//                               value={formData.coverImage}
//                               onChange={(url) => setFormData({ ...formData, coverImage: url })}
//                               maxSizeMB={3}
//                               className="mt-2"
//                             />
//                           </div>
//                         </div>

//                         {/* Pays */}
//                         <div className="space-y-2">
//                           <Label htmlFor="country">Pays</Label>
//                           <Select
//                             value={formData.country}
//                             onValueChange={(value) => setFormData({ ...formData, country: value })}
//                           >
//                             <SelectTrigger>
//                               <SelectValue placeholder="Sélectionnez un pays" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               {countrySuggestions.map((country) => (
//                                 <SelectItem key={country} value={country}>
//                                   {country}
//                                 </SelectItem>
//                               ))}
//                             </SelectContent>
//                           </Select>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   </motion.div>
//                 </TabsContent>

//                 {/* Onglet: Apparence */}
//                 <TabsContent value="appearance" className="space-y-6 mt-0">
//                   <motion.div
//                     initial={{ opacity: 0, x: 20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                   >
//                     <Card>
//                       <CardHeader>
//                         <CardTitle className="flex items-center gap-2">
//                           <Palette className="h-5 w-5" />
//                           Apparence et thème
//                         </CardTitle>
//                         <CardDescription>
//                           Personnalisez l'apparence de votre boutique
//                         </CardDescription>
//                       </CardHeader>
//                       <CardContent className="space-y-6">
//                         {/* Thème */}
//                         <div className="space-y-2">
//                           <Label>Thème principal</Label>
//                           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//                             {[
//                               { id: "default", name: "Défaut", colors: ["#3b82f6", "#8b5cf6"] },
//                               { id: "dark", name: "Sombre", colors: ["#1e293b", "#475569"] },
//                               { id: "light", name: "Clair", colors: ["#ffffff", "#f8fafc"] },
//                               { id: "gaming", name: "Gaming", colors: ["#ef4444", "#f97316"] },
//                             ].map((theme) => (
//                               <button
//                                 key={theme.id}
//                                 type="button"
//                                 onClick={() => setFormData({ ...formData, themeId: theme.id })}
//                                 className={`p-4 rounded-lg border-2 ${
//                                   formData.themeId === theme.id
//                                     ? "border-primary"
//                                     : "border-border"
//                                 }`}
//                               >
//                                 <div className="flex items-center gap-3">
//                                   <div className="flex gap-1">
//                                     {theme.colors.map((color, i) => (
//                                       <div
//                                         key={i}
//                                         className="w-6 h-6 rounded"
//                                         style={{ backgroundColor: color }}
//                                       />
//                                     ))}
//                                   </div>
//                                   <Typography variant="body-sm">{theme.name}</Typography>
//                                 </div>
//                               </button>
//                             ))}
//                           </div>
//                         </div>

//                         {/* Couleurs personnalisées */}
//                         <div className="space-y-4">
//                           <Typography variant="body-base" weight="medium">
//                             Couleurs personnalisées
//                           </Typography>
//                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             {[
//                               { label: "Couleur principale", field: "primaryColor", value: formData.customTheme.primaryColor },
//                               { label: "Couleur secondaire", field: "secondaryColor", value: formData.customTheme.secondaryColor },
//                               { label: "Arrière-plan", field: "backgroundColor", value: formData.customTheme.backgroundColor },
//                               { label: "Texte", field: "textColor", value: formData.customTheme.textColor },
//                             ].map((color) => (
//                               <div key={color.field} className="space-y-2">
//                                 <Label>{color.label}</Label>
//                                 <div className="flex items-center gap-3">
//                                   <div
//                                     className="w-10 h-10 rounded border"
//                                     style={{ backgroundColor: color.value }}
//                                   />
//                                   <Input
//                                     value={color.value}
//                                     onChange={(e) => handleColorChange(color.field, e.target.value)}
//                                     className="flex-1"
//                                   />
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   </motion.div>
//                 </TabsContent>

//                 {/* Onglet: Contact & Adresse */}
//                 <TabsContent value="contact" className="space-y-6 mt-0">
//                   <motion.div
//                     initial={{ opacity: 0, x: 20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     className="space-y-6"
//                   >
//                     <Card>
//                       <CardHeader>
//                         <CardTitle className="flex items-center gap-2">
//                           <Phone className="h-5 w-5" />
//                           Informations de contact
//                         </CardTitle>
//                         <CardDescription>
//                           Comment les clients peuvent vous contacter
//                         </CardDescription>
//                       </CardHeader>
//                       <CardContent className="space-y-6">
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                           <div className="space-y-2">
//                             <Label htmlFor="phoneNumber">Téléphone</Label>
//                             <Input
//                               id="phoneNumber"
//                               value={formData.phoneNumber}
//                               onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
//                               placeholder="+1 234 567 890"
//                             />
//                           </div>
//                           <div className="space-y-2">
//                             <Label htmlFor="website">Site web</Label>
//                             <Input
//                               id="website"
//                               value={formData.website}
//                               onChange={(e) => setFormData({ ...formData, website: e.target.value })}
//                               placeholder="https://exemple.com"
//                               type="url"
//                             />
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>

//                     <Card>
//                       <CardHeader>
//                         <CardTitle className="flex items-center gap-2">
//                           <Building className="h-5 w-5" />
//                           Adresse
//                         </CardTitle>
//                         <CardDescription>
//                           Adresse physique de votre boutique (optionnel)
//                         </CardDescription>
//                       </CardHeader>
//                       <CardContent className="space-y-4">
//                         <div className="space-y-2">
//                           <Label htmlFor="street">Rue et numéro</Label>
//                           <Input
//                             id="street"
//                             value={formData.address.street}
//                             onChange={(e) => setFormData({
//                               ...formData,
//                               address: { ...formData.address, street: e.target.value }
//                             })}
//                             placeholder="123 Rue de l'Exemple"
//                           />
//                         </div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                           <div className="space-y-2">
//                             <Label htmlFor="city">Ville</Label>
//                             <Input
//                               id="city"
//                               value={formData.address.city}
//                               onChange={(e) => setFormData({
//                                 ...formData,
//                                 address: { ...formData.address, city: e.target.value }
//                               })}
//                               placeholder="Paris"
//                             />
//                           </div>
//                           <div className="space-y-2">
//                             <Label htmlFor="postalCode">Code postal</Label>
//                             <Input
//                               id="postalCode"
//                               value={formData.address.postalCode}
//                               onChange={(e) => setFormData({
//                                 ...formData,
//                                 address: { ...formData.address, postalCode: e.target.value }
//                               })}
//                               placeholder="75000"
//                             />
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   </motion.div>
//                 </TabsContent>

//                 {/* Onglet: Réseaux sociaux */}
//                 <TabsContent value="social" className="space-y-6 mt-0">
//                   <motion.div
//                     initial={{ opacity: 0, x: 20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                   >
//                     <Card>
//                       <CardHeader>
//                         <CardTitle className="flex items-center gap-2">
//                           <Users className="h-5 w-5" />
//                           Réseaux sociaux
//                         </CardTitle>
//                         <CardDescription>
//                           Ajoutez vos liens de réseaux sociaux
//                         </CardDescription>
//                       </CardHeader>
//                       <CardContent className="space-y-4">
//                         {formData.socialMedia.map((social, index) => (
//                           <div key={index} className="flex items-center gap-4">
//                             <div className="w-32">
//                               <Select
//                                 value={social.platform}
//                                 onValueChange={(value) => handleSocialMediaChange(index, "platform", value)}
//                               >
//                                 <SelectTrigger>
//                                   <SelectValue />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                   {socialPlatforms.map((platform) => (
//                                     <SelectItem key={platform.value} value={platform.value}>
//                                       <div className="flex items-center gap-2">
//                                         <span className={platform.color}>{platform.icon}</span>
//                                         {platform.label}
//                                       </div>
//                                     </SelectItem>
//                                   ))}
//                                 </SelectContent>
//                               </Select>
//                             </div>
//                             <Input
//                               value={social.url}
//                               onChange={(e) => handleSocialMediaChange(index, "url", e.target.value)}
//                               placeholder="https://..."
//                               className="flex-1"
//                             />
//                             <Button
//                               type="button"
//                               variant="ghost"
//                               size="icon"
//                               onClick={() => removeSocialMedia(index)}
//                               disabled={formData.socialMedia.length <= 1}
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </Button>
//                           </div>
//                         ))}

//                         <Button
//                           type="button"
//                           variant="outline"
//                           onClick={addSocialMedia}
//                           className="w-full gap-2"
//                         >
//                           <Link className="h-4 w-4" />
//                           Ajouter un réseau social
//                         </Button>
//                       </CardContent>
//                     </Card>
//                   </motion.div>
//                 </TabsContent>

//                 {/* Onglet: Notifications */}
//                 <TabsContent value="notifications" className="space-y-6 mt-0">
//                   <motion.div
//                     initial={{ opacity: 0, x: 20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                   >
//                     <Card>
//                       <CardHeader>
//                         <CardTitle className="flex items-center gap-2">
//                           <Bell className="h-5 w-5" />
//                           Notifications
//                         </CardTitle>
//                         <CardDescription>
//                           Configurez vos préférences de notifications
//                         </CardDescription>
//                       </CardHeader>
//                       <CardContent className="space-y-6">
//                         <div className="space-y-4">
//                           {[
//                             { 
//                               label: "Nouvelles commandes", 
//                               description: "Recevoir une notification pour chaque nouvelle commande",
//                               field: "notifyOnNewOrder",
//                               value: formData.notificationSettings.notifyOnNewOrder 
//                             },
//                             { 
//                               label: "Nouveaux messages", 
//                               description: "Recevoir une notification pour chaque nouveau message",
//                               field: "notifyOnNewMessage",
//                               value: formData.notificationSettings.notifyOnNewMessage 
//                             },
//                             { 
//                               label: "Nouveaux avis", 
//                               description: "Recevoir une notification pour chaque nouvel avis",
//                               field: "notifyOnReview",
//                               value: formData.notificationSettings.notifyOnReview 
//                             },
//                             { 
//                               label: "Nouveaux followers", 
//                               description: "Recevoir une notification pour chaque nouveau follower",
//                               field: "notifyOnFollow",
//                               value: formData.notificationSettings.notifyOnFollow 
//                             },
//                           ].map((item) => (
//                             <div key={item.field} className="flex items-center justify-between">
//                               <div className="space-y-1">
//                                 <Typography variant="body-base" weight="medium">
//                                   {item.label}
//                                 </Typography>
//                                 <Typography variant="caption2" theme="muted">
//                                   {item.description}
//                                 </Typography>
//                               </div>
//                               <Switch
//                                 checked={item.value}
//                                 onCheckedChange={(checked) => setFormData({
//                                   ...formData,
//                                   notificationSettings: {
//                                     ...formData.notificationSettings,
//                                     [item.field]: checked
//                                   }
//                                 })}
//                               />
//                             </div>
//                           ))}
//                         </div>

//                         <Separator />

//                         <div className="space-y-4">
//                           <Typography variant="body-base" weight="medium">
//                             Canaux de notification
//                           </Typography>
//                           <div className="space-y-3">
//                             {[
//                               { label: "Notifications par email", field: "emailNotifications" },
//                               { label: "Notifications push", field: "pushNotifications" },
//                             ].map((item) => (
//                               <div key={item.field} className="flex items-center justify-between">
//                                 <Typography variant="body-base">{item.label}</Typography>
//                                 <Switch
//                                   checked={formData.notificationSettings[item.field as keyof typeof formData.notificationSettings] as boolean}
//                                   onCheckedChange={(checked) => setFormData({
//                                     ...formData,
//                                     notificationSettings: {
//                                       ...formData.notificationSettings,
//                                       [item.field]: checked
//                                     }
//                                   })}
//                                 />
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   </motion.div>
//                 </TabsContent>

//                 {/* Onglet: Visibilité */}
//                 <TabsContent value="visibility" className="space-y-6 mt-0">
//                   <motion.div
//                     initial={{ opacity: 0, x: 20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     className="space-y-6"
//                   >
//                     <Card>
//                       <CardHeader>
//                         <CardTitle className="flex items-center gap-2">
//                           <Eye className="h-5 w-5" />
//                           Visibilité de la boutique
//                         </CardTitle>
//                         <CardDescription>
//                           Contrôlez la visibilité de votre boutique
//                         </CardDescription>
//                       </CardHeader>
//                       <CardContent className="space-y-6">
//                         <div className="space-y-4">
//                           <div className="flex items-center justify-between">
//                             <div className="space-y-1">
//                               <Typography variant="body-base" weight="medium" className="flex items-center gap-2">
//                                 {formData.isActive ? (
//                                   <>
//                                     <Eye className="h-4 w-4 text-green-500" />
//                                     Boutique active
//                                   </>
//                                 ) : (
//                                   <>
//                                     <EyeOff className="h-4 w-4 text-muted-foreground" />
//                                     Boutique inactive
//                                   </>
//                                 )}
//                               </Typography>
//                               <Typography variant="caption2" theme="muted">
//                                 {formData.isActive
//                                   ? "Votre boutique est visible et peut recevoir des commandes"
//                                   : "Votre boutique est masquée et ne peut pas recevoir de commandes"
//                                 }
//                               </Typography>
//                             </div>
//                             <Switch
//                               checked={formData.isActive}
//                               onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
//                             />
//                           </div>

//                           <div className="flex items-center justify-between">
//                             <div className="space-y-1">
//                               <Typography variant="body-base" weight="medium">
//                                 Boutique visible publiquement
//                               </Typography>
//                               <Typography variant="caption2" theme="muted">
//                                 Rendre votre boutique visible dans les recherches et listes
//                               </Typography>
//                             </div>
//                             <Switch
//                               checked={formData.isVisible}
//                               onCheckedChange={(checked) => setFormData({ ...formData, isVisible: checked })}
//                             />
//                           </div>
//                         </div>

//                         <div className="bg-muted/30 rounded-lg p-4">
//                           <Typography variant="body-sm" weight="medium" className="flex items-center gap-2 mb-2">
//                             <AlertCircle className="h-4 w-4 text-amber-500" />
//                             Note importante
//                           </Typography>
//                           <Typography variant="caption2" theme="muted">
//                             Désactiver votre boutique masquera tous vos produits et empêchera les nouvelles commandes.
//                             Les commandes existantes continueront d'être traitées normalement.
//                           </Typography>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   </motion.div>
//                 </TabsContent>

//                 {/* Onglet: Sécurité */}
//                 <TabsContent value="security" className="space-y-6 mt-0">
//                   <motion.div
//                     initial={{ opacity: 0, x: 20 }}
//                     animate={{ opacity: 1, x: 0 }}
//                   >
//                     <Card>
//                       <CardHeader>
//                         <CardTitle className="flex items-center gap-2">
//                           <Shield className="h-5 w-5" />
//                           Sécurité et accès
//                         </CardTitle>
//                         <CardDescription>
//                           Paramètres de sécurité et gestion des accès
//                         </CardDescription>
//                       </CardHeader>
//                       <CardContent className="space-y-6">
//                         <div className="space-y-4">
//                           <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                             <div className="flex items-center gap-3">
//                               <Shield className="h-5 w-5 text-green-500" />
//                               <div>
//                                 <Typography variant="body-base" weight="medium" className="text-green-800">
//                                   Boutique sécurisée
//                                 </Typography>
//                                 <Typography variant="caption2" className="text-green-700">
//                                   Toutes les transactions sont chiffrées et sécurisées
//                                 </Typography>
//                               </div>
//                             </div>
//                           </div>

//                           {/* Sessions actives */}
//                           <div className="space-y-3">
//                             <Typography variant="body-base" weight="medium">
//                               Sessions actives
//                             </Typography>
//                             <div className="space-y-2">
//                               {[
//                                 { device: "Chrome sur Windows", location: "Paris, France", lastActive: "À l'instant" },
//                                 { device: "Safari sur iPhone", location: "Lyon, France", lastActive: "Il y a 2 heures" },
//                               ].map((session, index) => (
//                                 <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
//                                   <div className="space-y-1">
//                                     <Typography variant="body-sm" weight="medium">
//                                       {session.device}
//                                     </Typography>
//                                     <Typography variant="caption2" theme="muted">
//                                       {session.location} • {session.lastActive}
//                                     </Typography>
//                                   </div>
//                                   <Badge variant="outline">Actif</Badge>
//                                 </div>
//                               ))}
//                             </div>
//                           </div>

//                           {/* Journal d'activité */}
//                           <div className="space-y-3">
//                             <Typography variant="body-base" weight="medium">
//                               Dernières activités
//                             </Typography>
//                             <div className="space-y-2">
//                               {[
//                                 { action: "Mise à jour des paramètres", time: "Il y a 5 minutes" },
//                                 { action: "Ajout d'un produit", time: "Il y a 1 heure" },
//                                 { action: "Réception d'une commande", time: "Il y a 3 heures" },
//                               ].map((activity, index) => (
//                                 <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
//                                   <div className="w-2 h-2 rounded-full bg-primary" />
//                                   <Typography variant="body-sm">{activity.action}</Typography>
//                                   <Typography variant="caption2" theme="muted" className="ml-auto">
//                                     {activity.time}
//                                   </Typography>
//                                 </div>
//                               ))}
//                             </div>
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   </motion.div>
//                 </TabsContent>
//               </Tabs>

//               {/* Bouton de sauvegarde */}
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="sticky bottom-6 mt-8"
//               >
//                 <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
//                   <CardContent className="p-6">
//                     <div className="flex flex-col md:flex-row items-center justify-between gap-4">
//                       <div className="space-y-1">
//                         <Typography variant="body-base" weight="medium">
//                           Enregistrer les modifications
//                         </Typography>
//                         <Typography variant="caption2" theme="muted">
//                           Tous les changements seront appliqués immédiatement
//                         </Typography>
//                       </div>
//                       <Button
//                         type="submit"
//                         size="lg"
//                         className="gap-2 min-w-[200px]"
//                         disabled={isSaving}
//                       >
//                         {isSaving ? (
//                           <>
//                             <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
//                             Sauvegarde...
//                           </>
//                         ) : (
//                           <>
//                             <Save className="h-5 w-5" />
//                             Enregistrer les paramètres
//                           </>
//                         )}
//                       </Button>
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             </div>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // Skeleton pour loading
// function SettingsSkeleton() {
//   return (
//     <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
//       <div className="container mx-auto px-4 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
//           <div className="lg:col-span-1">
//             <Skeleton className="h-[600px] rounded-xl" />
//           </div>
//           <div className="lg:col-span-3 space-y-6">
//             <Skeleton className="h-64 rounded-xl" />
//             <Skeleton className="h-64 rounded-xl" />
//             <Skeleton className="h-24 rounded-xl" />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
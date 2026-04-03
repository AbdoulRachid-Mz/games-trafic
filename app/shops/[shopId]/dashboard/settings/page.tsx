"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Save,
  ArrowLeft,
  Store,
  Phone,
  ImageIcon,
  Palette,
  Bell,
  Shield,
  Users,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  CheckCircle,
  Building,
  Info,
  MapPin,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { toast } from "sonner";
import { useShopById } from "@/hooks/use-shops";
import { updateShop, deleteShop } from "@/actions/shops";
import {
  getCurrentUserWallet,
  updateUserWallet,
  verifyWalletPin,
  toggleWalletLock,
} from "@/actions/wallets";
import { AutoSyncField } from "@/components/shared/auto-sync-field";
import { Skeleton } from "@/components/ui/skeleton";
import { UserWallet } from "@/database/schema";

export default function ShopSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const shopId = params.shopId as string;
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  

  const {
    data: shop,
    isLoading,
    refetch,
  } = useShopById(shopId, { populate: ["theme"] });

  const loadWallet = async () => {
    const data = await getCurrentUserWallet();
    setWallet(data);
  };

  useEffect(() => {
    loadWallet();
  }, []);

  const handleUpdate = async (data: any) => {
    try {
      await updateShop(shopId, data);
      await refetch();
      return true;
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      return false;
    }
  };

  const handleAddressUpdate = async (key: string, value: any) => {
    const currentAddress = (shop?.address as any) || {};
    return handleUpdate({
      address: {
        ...currentAddress,
        [key]: value,
      },
    });
  };

  const handleNotificationUpdate = async (key: string, value: any) => {
    const currentSettings = (shop?.notificationSettings as any) || {};
    return handleUpdate({
      notificationSettings: {
        ...currentSettings,
        [key]: value,
      },
    });
  };

  const handleDelete = async () => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir supprimer cette boutique ? Cette action est irréversible.",
      )
    ) {
      try {
        await deleteShop(shopId);
        toast.success("Boutique supprimée");
        router.push("/dashboard/shops");
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  if (isLoading) return <SettingsSkeleton />;
  if (!shop) return <div>Boutique non trouvée</div>;

  return (
    <div className="min-h-screen bg-background/50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <Typography
                variant="h1"
                className="text-3xl font-bold tracking-tight"
              >
                Paramètres Boutique
              </Typography>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={shop.isActive ? "default" : "secondary"}>
                  {shop.isActive ? "Active" : "Inactive"}
                </Badge>
                <Typography variant="muted" className="text-sm">
                  ID: {shop.id.slice(0, 8)}...
                </Typography>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="general" className="gap-2">
              <Store className="h-4 w-4" /> Général
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" /> Apparence
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-2">
              <MapPin className="h-4 w-4" /> Contact
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" /> Notifications
            </TabsTrigger>
          </TabsList>

          {/* Section: Général */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Informations de base
                  </CardTitle>
                  <CardDescription>
                    Gérez l'identité et les paramètres de visibilité de votre
                    boutique.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <AutoSyncField<string>
                    label="Nom de la boutique"
                    value={shop.name || ""}
                    onChange={async (val: string) => {
                      await handleUpdate({ name: val });
                    }}
                    placeholder="Ex: Ma Boutique Gaming"
                  />
                  <AutoSyncField<string>
                    label="Description"
                    type="textarea"
                    value={shop.description || ""}
                    onChange={async (val: string) => {
                      await handleUpdate({ description: val });
                    }}
                    placeholder="Décrivez votre boutique..."
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <AutoSyncField<boolean>
                      label="Boutique Active"
                      type="switch"
                      value={shop.isActive ?? true}
                      onChange={async (val: boolean) => {
                        await handleUpdate({ isActive: val });
                      }}
                      helperText="Si désactivé, la boutique ne sera plus accessible."
                    />
                    <AutoSyncField<boolean>
                      label="Visible au public"
                      type="switch"
                      value={shop.isVisible ?? true}
                      onChange={async (val: boolean) => {
                        await handleUpdate({ isVisible: val });
                      }}
                      helperText="Afficher la boutique dans les résultats de recherche."
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Images</CardTitle>
                    <CardDescription>
                      Logo et bannière de la boutique.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Typography variant="body-sm" className="font-medium">
                        Logo / Profil
                      </Typography>
                      <AdvancedUpload
                        value={shop.profileImage || ""}
                        onChange={(url) => handleUpdate({ profileImage: url })}
                        isRounded
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Typography variant="body-sm" className="font-medium">
                        Bannière
                      </Typography>
                      <AdvancedUpload
                        value={shop.coverImage || ""}
                        onChange={(url) => handleUpdate({ coverImage: url })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Section: Apparence */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-500" />
                  Thème & Design
                </CardTitle>
                <CardDescription>
                  Personnalisez l'expérience visuelle de vos clients.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AutoSyncField
                    label="Couleur Primaire"
                    value={(shop.customTheme as any)?.primaryColor || "#3b82f6"}
                    onChange={async (val) => {
                      await handleUpdate({
                        customTheme: {
                          ...((shop.customTheme as any) || {}),
                          primaryColor: val,
                        },
                      });
                    }}
                  />
                  <AutoSyncField
                    label="Couleur Secondaire"
                    value={
                      (shop.customTheme as any)?.secondaryColor || "#8b5cf6"
                    }
                    onChange={async (val) => {
                      await handleUpdate({
                        customTheme: {
                          ...((shop.customTheme as any) || {}),
                          secondaryColor: val,
                        },
                      });
                    }}
                  />
                  <AutoSyncField
                    label="Arrondi des composants (px)"
                    value={(shop.customTheme as any)?.borderRadius || "8"}
                    onChange={async (val) => {
                      await handleUpdate({
                        customTheme: {
                          ...((shop.customTheme as any) || {}),
                          borderRadius: val,
                        },
                      });
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section: Contact */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" />
                  Contact & Localisation
                </CardTitle>
                <CardDescription>
                  Informations pour vous joindre et adresse physique.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <Typography
                      variant="body-base"
                      className="font-bold border-b pb-2"
                    >
                      Direct
                    </Typography>
                    <AutoSyncField
                      label="Téléphone"
                      value={shop.phoneNumber || ""}
                      onChange={async (val) => {
                        await handleUpdate({ phoneNumber: val });
                      }}
                      icon={Phone}
                    />
                    <AutoSyncField
                      label="Site Web"
                      value={shop.website || ""}
                      onChange={async (val) => {
                        await handleUpdate({ website: val });
                      }}
                      icon={Globe}
                    />
                    {wallet && (
                      <AutoSyncField<boolean>
                        label="Verrouiller le wallet"
                        type="switch"
                        value={wallet.isLocked ?? false}
                        onChange={async (val: boolean) => {
                          await toggleWalletLock(wallet.id, val);
                          await loadWallet();
                        }}
                        helperText="Empêche toutes les transactions sortantes"
                      />
                    )}
                    <AutoSyncField
                      label="Pays"
                      type="select"
                      value={shop.country || "France"}
                      options={[
                        { label: "France", value: "France" },
                        { label: "Belgique", value: "Belgique" },
                        { label: "Suisse", value: "Suisse" },
                        { label: "Canada", value: "Canada" },
                        { label: "États-Unis", value: "USA" },
                      ]}
                      onChange={async (val) => {
                        await handleUpdate({ country: val });
                      }}
                    />
                  </div>

                  <div className="space-y-6">
                    <Typography
                      variant="body-base"
                      className="font-bold border-b pb-2"
                    >
                      Adresse Physique
                    </Typography>
                    <AutoSyncField
                      label="Rue"
                      value={(shop.address as any)?.street || ""}
                      onChange={async (val) => {
                        await handleAddressUpdate("street", val);
                      }}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <AutoSyncField
                        label="Ville"
                        value={(shop.address as any)?.city || ""}
                        onChange={async (val) => {
                          await handleAddressUpdate("city", val);
                        }}
                      />
                      <AutoSyncField
                        label="Code Postal"
                        value={(shop.address as any)?.postalCode || ""}
                        onChange={async (val) => {
                          await handleAddressUpdate("postalCode", val);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section: Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  Préférences de Notifications
                </CardTitle>
                <CardDescription>
                  Choisissez ce dont vous voulez être informé.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                  <AutoSyncField
                    label="Nouvelles commandes"
                    type="switch"
                    value={
                      (shop.notificationSettings as any)?.notifyOnNewOrder ??
                      true
                    }
                    onChange={async (val) => {
                      await handleNotificationUpdate("notifyOnNewOrder", val);
                    }}
                  />
                  <AutoSyncField
                    label="Nouveaux messages"
                    type="switch"
                    value={
                      (shop.notificationSettings as any)?.notifyOnNewMessage ??
                      true
                    }
                    onChange={async (val) => {
                      await handleNotificationUpdate("notifyOnNewMessage", val);
                    }}
                  />
                  <AutoSyncField
                    label="Nouveaux avis clients"
                    type="switch"
                    value={
                      (shop.notificationSettings as any)?.notifyOnReview ?? true
                    }
                    onChange={async (val) => {
                      await handleNotificationUpdate("notifyOnReview", val);
                    }}
                  />
                  <AutoSyncField
                    label="Notifications par Email"
                    type="switch"
                    value={
                      (shop.notificationSettings as any)?.emailNotifications ??
                      true
                    }
                    onChange={async (val) => {
                      await handleNotificationUpdate("emailNotifications", val);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-96 md:col-span-2" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

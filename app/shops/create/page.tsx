// app/(main)/shops/create/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Store,
  Wallet,
  Sparkles,
  MapPin,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { SuccessDialog, ErrorDialog } from "@/components/shared/result-dialog";
import { createShop } from "@/actions/shops";
import { getCurrentUserWallet } from "@/actions/wallets";
import { useScreenSize } from "@/hooks/use-screen";
import { useUserProfile } from "@/hooks/use-profile";
import Image from "next/image";

export default function CreateShopPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { data: completeData } = useUserProfile();
  const { isSmallScreen, isXLargeScreen } = useScreenSize();
  const [isLoading, setIsLoading] = useState(false);
  const [hasWallet, setHasWallet] = useState(false);
  const [step, setStep] = useState(1);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdShopId, setCreatedShopId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: user ? `Boutique de ${user?.fullName || ""}` : "",
    description: "",
    profileImage: "/icons/shop.png",
    coverImage: "/images/icons/background/efootball.jpg",
    country: user?.country || "",
    phoneNumber: (user?.countryCode ?? "") + (user?.phoneNumber ?? "") || "",
    category: "gaming",
  });

  // Vérifier si l'utilisateur a un wallet
  useEffect(() => {
    const checkWallet = async () => {
      if (completeData?.wallet) {
        setHasWallet(true);
      } else {
        const wallet = await getCurrentUserWallet();
        setHasWallet(!!wallet);
      }
    };
    checkWallet();
  }, [completeData]);

  // Géolocalisation automatique
  useEffect(() => {
    if (!formData.country && navigator.geolocation) {
      fetch("https://ipapi.co/json/")
        .then((res) => res.json())
        .then((data) => {
          if (data.country_name) {
            setFormData((prev) => ({ ...prev, country: data.country_name }));
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasWallet) {
      setErrorMessage(
        "Vous devez créer un wallet avant de pouvoir créer une boutique",
      );
      setShowErrorDialog(true);
      return;
    }

    setIsLoading(true);
    try {
      const shop = await createShop({
        ownerId: user?.id || "",
        name: formData.name,
        description: formData.description,
        profileImage: formData.profileImage,
        coverImage: formData.coverImage,
        country: formData.country,
        phoneNumber: formData.phoneNumber,
        socialMedia: [],
        isActive: true,
        isVisible: true,
      });

      setCreatedShopId(shop.id);
      setShowSuccessDialog(true);
    } catch (error: any) {
      setErrorMessage(error.message || "Erreur lors de la création");
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  const quickCategories = [
    {
      id: "gaming",
      label: "🎮 Gaming",
      color: "bg-purple-500",
      desc: "Comptes, items, skins",
    },
    {
      id: "esports",
      label: "🏆 eSports",
      color: "bg-amber-500",
      desc: "Tournois, équipements",
    },
    {
      id: "digital",
      label: "💻 Digital",
      color: "bg-blue-500",
      desc: "Services, logiciels",
    },
    {
      id: "collectibles",
      label: "🃏 Collection",
      color: "bg-green-500",
      desc: "Cartes, figurines",
    },
  ];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <Typography variant="h2" weight="bold" gradient className="mb-2">
                Images de la boutique
              </Typography>
              <Typography variant="body-base" theme="muted">
                Ajoutez une photo de profil et une bannière
              </Typography>
            </div>

            {/* Zone d'upload superposés : cover en fond, profile en absolute centré en bas */}
            <div className="relative w-full max-w-2xl mx-auto mb-8">
              {/* Upload Cover (fond) */}
              <div className="relative h-48 rounded-2xl overflow-hidden border border-border">
                <AdvancedUpload
                  value={formData.coverImage}
                  onChange={(url) =>
                    setFormData({ ...formData, coverImage: url })
                  }
                  maxSizeMB={3}
                  className="absolute inset-0"
                />
                {!formData.coverImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Store className="h-16 w-16 text-primary/30" />
                  </div>
                )}
              </div>

              {/* Upload Profile (superposé) */}
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                <div className="relative">
                  <AdvancedUpload
                    value={formData.profileImage}
                    onChange={(url) =>
                      setFormData({ ...formData, profileImage: url })
                    }
                    isRounded={true}
                    maxSizeMB={2}
                    className="w-24 h-24"
                  />
                  {!formData.profileImage && (
                    <div className="absolute inset-0 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background">
                      <Store className="h-10 w-10 text-primary" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <Typography variant="h4" weight="semibold" className="mb-4">
                    Photo de profil
                  </Typography>
                  <AdvancedUpload
                    value={formData.profileImage}
                    onChange={(url) =>
                      setFormData({ ...formData, profileImage: url })
                    }
                    isRounded={true}
                    maxSizeMB={2}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Typography variant="h4" weight="semibold" className="mb-4">
                    Bannière (optionnel)
                  </Typography>
                  <AdvancedUpload
                    value={formData.coverImage}
                    onChange={(url) =>
                      setFormData({ ...formData, coverImage: url })
                    }
                    maxSizeMB={3}
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button onClick={() => setStep(2)} className="gap-2">
                Continuer
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Store className="h-10 w-10 text-primary" />
              </div>
              <Typography variant="h2" weight="bold" gradient className="mb-2">
                Créer votre boutique
              </Typography>
              <Typography variant="body-base" theme="muted">
                Vendez vos produits gaming en toute simplicité
              </Typography>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations de base */}
              <Card className="md:col-span-2">
                <CardContent className="p-6">
                  <Typography
                    variant="h4"
                    weight="semibold"
                    className="mb-6 flex items-center gap-2"
                  >
                    <Store className="h-5 w-5" />
                    Informations de base
                  </Typography>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom de la boutique *</Label>
                      <Input
                        id="name"
                        placeholder="Ex: GameZone Pro"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="h-12 text-lg"
                      />
                      <Typography variant="caption2" theme="muted">
                        Choisissez un nom unique et mémorable
                      </Typography>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Décrivez votre boutique et vos spécialités..."
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                      />
                      {!formData.description.trim() && (
                        <div className="mt-2 p-3 rounded-lg border border-border/50 bg-secondary/20">
                          <div className="flex items-center justify-between gap-3">
                            <Typography variant="caption1" theme="muted">
                              Suggestion automatique
                            </Typography>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  description: `${
                                    formData.name || "Nouvelle boutique"
                                  } • Produits gaming sélectionnés • Service rapide • Visibilité publique`,
                                })
                              }
                            >
                              Utiliser la suggestion
                            </Button>
                          </div>
                          <Typography variant="caption2" className="mt-2 block">
                            {(formData.name || "Nouvelle boutique") +
                              " • Produits gaming sélectionnés • Service rapide • Visibilité publique"}
                          </Typography>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">Pays</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="country"
                            placeholder="Votre pays"
                            value={formData.country}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                country: e.target.value,
                              })
                            }
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone (optionnel)</Label>
                        <Input
                          id="phone"
                          placeholder="+1 234 567 890"
                          value={formData.phoneNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phoneNumber: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Catégorie */}
              <Card>
                <CardContent className="p-6">
                  <Typography variant="h4" weight="semibold" className="mb-4">
                    Catégorie
                  </Typography>
                  <div className="space-y-3">
                    {quickCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, category: cat.id })
                        }
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          formData.category === cat.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full ${cat.color} flex items-center justify-center`}
                          >
                            <span className="text-lg">
                              {cat.label.split(" ")[0]}
                            </span>
                          </div>
                          <div>
                            <Typography variant="body-base" weight="semibold">
                              {cat.label}
                            </Typography>
                            <Typography variant="caption2" theme="muted">
                              {cat.desc}
                            </Typography>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Images déplacées à l'étape 1 */}
            </div>

            {/* Avertissement wallet */}
            {!hasWallet && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 rounded-xl p-6"
              >
                <div className="flex items-start gap-3">
                  <Wallet className="h-6 w-6 text-amber-600 mt-1" />
                  <div className="flex-1">
                    <Typography
                      variant="body-base"
                      weight="semibold"
                      className="text-amber-800 mb-1"
                    >
                      Wallet requis pour vendre
                    </Typography>
                    <Typography variant="body-sm" className="text-amber-700">
                      Vous pouvez créer la boutique maintenant, mais vous aurez
                      besoin d'un wallet pour :
                    </Typography>
                    <ul className="mt-2 space-y-1 text-amber-700 text-sm">
                      <li className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Recevoir des paiements
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Gérer votre chiffre d'affaires
                      </li>
                      <li className="flex items-center gap-2">
                        <Store className="h-4 w-4" />
                        Activer les ventes
                      </li>
                    </ul>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 border-amber-300 text-amber-700 hover:bg-amber-100"
                      onClick={() => router.push("/wallet/create")}
                    >
                      Créer un wallet maintenant
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Images
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!formData.name.trim()}
                title={
                  !formData.name.trim()
                    ? "Renseignez au minimum le nom de la boutique"
                    : undefined
                }
                className="gap-2"
              >
                Continuer
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <Typography variant="h2" weight="bold" className="mb-2">
                Récapitulatif
              </Typography>
              <Typography variant="body-base" theme="muted">
                Vérifiez les informations avant de créer
              </Typography>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Aperçu */}
                  <div className="relative rounded-xl overflow-hidden border">
                    <div className="h-40 bg-gradient-to-r from-primary/20 to-primary/10 relative">
                      {formData.coverImage ? (
                        <Image
                          src={formData.coverImage}
                          alt="Bannière"
                          fill={true}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Store className="h-16 w-16 text-primary/30" />
                        </div>
                      )}
                      <div className="absolute -bottom-10 left-6">
                        <div className="relative">
                          {formData.profileImage ? (
                            <Image
                              src={formData.profileImage}
                              alt="Profil"
                              width={80}
                              height={80}
                              className="w-20 h-20 rounded-full border-4 border-background object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full border-4 border-background bg-primary/10 flex items-center justify-center">
                              <Store className="h-10 w-10 text-primary" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-12 p-6">
                      <Typography variant="h3" weight="bold" className="mb-2">
                        {formData.name}
                      </Typography>
                      {formData.description && (
                        <Typography
                          variant="body-base"
                          theme="muted"
                          className="mb-4"
                        >
                          {formData.description}
                        </Typography>
                      )}

                      <div className="flex flex-wrap gap-3">
                        {formData.country && (
                          <Badge variant="outline" className="gap-1">
                            <MapPin className="h-3 w-3" />
                            {formData.country}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="gap-1">
                          <Store className="h-3 w-3" />
                          Nouvelle boutique
                        </Badge>
                        {!hasWallet && (
                          <Badge variant="destructive" className="gap-1">
                            <Wallet className="h-3 w-3" />
                            Wallet requis
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Détails */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Typography variant="body-base" weight="semibold">
                        Détails
                      </Typography>
                      {[
                        { label: "Nom", value: formData.name },
                        {
                          label: "Catégorie",
                          value:
                            quickCategories.find(
                              (c) => c.id === formData.category,
                            )?.label || "",
                        },
                        {
                          label: "Pays",
                          value: formData.country || "Non spécifié",
                        },
                        {
                          label: "Téléphone",
                          value: formData.phoneNumber || "Non spécifié",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between py-2 border-b"
                        >
                          <Typography variant="body-sm" theme="muted">
                            {item.label}
                          </Typography>
                          <Typography variant="body-sm" weight="medium">
                            {item.value}
                          </Typography>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <Typography variant="body-base" weight="semibold">
                        Configuration
                      </Typography>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-500" />
                            <Typography variant="body-sm">Sécurisé</Typography>
                          </div>
                          <Badge variant="default">Activé</Badge>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            <Typography variant="body-sm">Ventes</Typography>
                          </div>
                          <Badge
                            variant={hasWallet ? "default" : "destructive"}
                          >
                            {hasWallet ? "Prêt" : "Wallet requis"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-500" />
                            <Typography variant="body-sm">
                              Visibilité
                            </Typography>
                          </div>
                          <Badge variant="default">Publique</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt.6">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Modifier
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !formData.name.trim()}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Création...
                  </>
                ) : (
                  <>
                    <Store className="h-4 w-4" />
                    Créer la boutique
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <Typography variant="h4" weight="bold" className="mb-2">
              Connexion requise
            </Typography>
            <Typography variant="body-sm" theme="muted" className="mb-6">
              Vous devez être connecté pour créer une boutique
            </Typography>
            <Button onClick={() => router.push("/auth/signin")}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>

          {/* Indicateur de progression */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    s <= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                {s < 2 && (
                  <div
                    className={`h-1 w-16 rounded-full ${
                      s < step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {renderStep()}
      </div>

      {/* Success Dialog */}
      <SuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        title="Boutique créée avec succès !"
        description={`Votre boutique "${formData.name}" est maintenant en ligne et prête à accueillir vos produits.`}
        confettiType="celebration"
        primaryAction={{
          label: "Voir ma boutique",
          onClick: () => router.push(`/shops/${createdShopId}/dashboard`),
          primary: true,
        }}
        secondaryActions={[
          {
            label: "Ajouter des produits",
            onClick: () =>
              router.push(`/shops/${createdShopId}/products/create`),
            variant: "outline",
          },
        ]}
      />

      {/* Error Dialog */}
      <ErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        title="Erreur lors de la création"
        description={errorMessage}
        primaryAction={{
          label: "Réessayer",
          onClick: () => setShowErrorDialog(false),
          primary: true,
        }}
        secondaryActions={
          errorMessage.includes("wallet")
            ? [
                {
                  label: "Créer un wallet",
                  onClick: () => router.push("/wallet/create"),
                  variant: "outline",
                },
              ]
            : []
        }
      />
    </div>
  );
}

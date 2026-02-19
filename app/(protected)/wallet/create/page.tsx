// @/app/(dashboard)/wallet/create/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Shield,
  Lock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Mail,
  Key,
  AlertCircle,
  Sparkles,
  Globe,
  Zap,
  CreditCard,
  Settings,
  Smartphone,
  Bell,
  ShieldCheck,
  Gift,
  Coins,
  BarChart3,
  TrendingUp,
  SmartphoneIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { WalletUtils } from "@/lib/wallet/wallet-utils";
import { createWalletServer } from "@/actions/wallets";
import { PinPad } from "@/components/pages/wallet/create/pin-pad";
import { PinStrengthIndicator } from "@/components/pages/wallet/create/pin-strength-2";
import { ResultDialog } from "@/components/shared/result-dialog";

function CreateWalletLegacy() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuthContext();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [loading, isAuthenticated, router]);

  const username =
    user?.fullName?.split(" ")?.[0] ||
    user?.username ||
    user?.email?.split("@")?.[0] ||
    "utilisateur";
  const defaultWalletName = `wallet_${username}`;

  const validation = WalletUtils.validatePinStrength(pin);
  const canSubmit = pin.length >= 4 && validation.isValid && pin === confirmPin;

  const handleCreate = async () => {
    setCreating(true);
    setDialogError(null);
    try {
      const result = await createWalletServer(user!.id, pin);
      if (!result.success) {
        setDialogError(result.error || "Erreur lors de la création");
        setDialogOpen(true);
        return;
      }
      setDialogOpen(true);
    } catch (e: any) {
      setDialogError(e?.message || "Erreur lors de la création");
      setDialogOpen(true);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <Typography variant="h2" weight="bold" gradient>
            Créer mon wallet
          </Typography>
          <Typography variant="body-base" theme="muted">
            Un seul champ obligatoire: votre code PIN. Vous recevrez un bonus à l’activation.
          </Typography>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-6 space-y-6">
            <div className="rounded-xl bg-muted/30 p-4 text-center">
              <Typography variant="caption1" theme="muted">
                Nom par défaut du wallet: <span className="font-semibold">{defaultWalletName}</span>
              </Typography>
            </div>

            <div className="space-y-4">
              <div>
                <Typography variant="body-sm" weight="medium">
                  Code PIN
                </Typography>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="Minimum 4 chiffres"
                />
              </div>
              <div>
                <Typography variant="body-sm" weight="medium">
                  Confirmez le PIN
                </Typography>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="Retapez votre PIN"
                />
                <div className="mt-2 text-xs">
                  {confirmPin.length > 0 &&
                    (pin === confirmPin ? (
                      <span className="text-green-600">Les PIN correspondent</span>
                    ) : (
                      <span className="text-red-600">Les PIN ne correspondent pas</span>
                    ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm">Sécurisé</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <Zap className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="text-sm">Transactions rapides</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <Gift className="w-4 h-4 text-pink-600" />
                </div>
                <span className="text-sm">Bonus de bienvenue</span>
              </div>
            </div>

            <Button
              className="w-full h-12 gap-2"
              disabled={!canSubmit || creating}
              onClick={handleCreate}
            >
              {creating && (
                <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              <Wallet className="w-5 h-5" />
              Créer mon wallet
            </Button>
          </CardContent>
        </Card>

        <ResultDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          type={dialogError ? "error" : "success"}
          title={dialogError ? "Échec de la création" : "Wallet créé avec succès"}
          description={
            dialogError
              ? dialogError
              : "Votre compte financier a été initialisé et un bonus a été crédité."
          }
          confetti={dialogError ? "none" : "celebration"}
          primaryAction={{
            label: dialogError ? "Réessayer" : "Voir mon wallet",
            onClick: () => {
              setDialogOpen(false);
              if (dialogError) return;
              router.push("/wallet");
            },
            primary: true,
          }}
          secondaryActions={[
            {
              label: "Aller au tableau de bord",
              onClick: () => {
                setDialogOpen(false);
                router.push("/dashboard");
              },
              variant: "outline",
            },
          ]}
        />
      </div>
    </div>
  );
}

export default function CreateWalletPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuthContext();
  const [pinSimple, setPinSimple] = useState("");
  const [confirmPinSimple, setConfirmPinSimple] = useState("");
  const [creatingSimple, setCreatingSimple] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const usernameSimple =
    user?.fullName?.split(" ")?.[0] ||
    user?.username ||
    user?.email?.split("@")?.[0] ||
    "utilisateur";
  const defaultWalletNameSimple = `wallet_${usernameSimple}`;
  const validationSimple = WalletUtils.validatePinStrength(pinSimple);
  const canSubmitSimple = pinSimple.length >= 4 && validationSimple.isValid && pinSimple === confirmPinSimple;
  const handleCreateSimple = async () => {
    setCreatingSimple(true);
    setDialogError(null);
    try {
      const result = await createWalletServer(user!.id, pinSimple);
      if (!result.success) {
        setDialogError(result.error || "Erreur lors de la création");
        setDialogOpen(true);
        return;
      }
      setDialogOpen(true);
    } catch (e: any) {
      setDialogError(e?.message || "Erreur lors de la création");
      setDialogOpen(true);
    } finally {
      setCreatingSimple(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <Typography variant="h2" weight="bold">
            Créer mon wallet
          </Typography>
          <Typography variant="body-base" theme="muted">
            Un seul champ obligatoire: votre code PIN.
          </Typography>
        </div>
        <Card className="shadow-xl border-0">
          <CardContent className="p-6 space-y-6">
            <div className="rounded-xl bg-muted/30 p-4 text-center">
              <Typography variant="caption1" theme="muted">
                Nom par défaut du wallet: <span className="font-semibold">{defaultWalletNameSimple}</span>
              </Typography>
            </div>
            <div className="space-y-4">
              <div>
                <Typography variant="body-sm" weight="medium">
                  Code PIN
                </Typography>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={pinSimple}
                  onChange={(e) => setPinSimple(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="Minimum 4 chiffres"
                />
              </div>
              <div>
                <Typography variant="body-sm" weight="medium">
                  Confirmez le PIN
                </Typography>
                <Input
                  type="password"
                  inputMode="numeric"
                  value={confirmPinSimple}
                  onChange={(e) => setConfirmPinSimple(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="Retapez votre PIN"
                />
                <div className="mt-2 text-xs">
                  {confirmPinSimple.length > 0 &&
                    (pinSimple === confirmPinSimple ? (
                      <span className="text-green-600">Les PIN correspondent</span>
                    ) : (
                      <span className="text-red-600">Les PIN ne correspondent pas</span>
                    ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm">Sécurisé</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <Zap className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="text-sm">Transactions rapides</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-card p-3">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <Gift className="w-4 h-4 text-pink-600" />
                </div>
                <span className="text-sm">Bonus de bienvenue</span>
              </div>
            </div>
            <Button
              className="w-full h-12 gap-2"
              disabled={!canSubmitSimple || creatingSimple}
              onClick={handleCreateSimple}
            >
              {creatingSimple && (
                <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              <Wallet className="w-5 h-5" />
              Créer mon wallet
            </Button>
          </CardContent>
        </Card>
        <ResultDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          type={dialogError ? "error" : "success"}
          title={dialogError ? "Échec de la création" : "Wallet créé avec succès"}
          description={
            dialogError
              ? dialogError
              : "Votre compte financier a été initialisé et un bonus a été crédité."
          }
          confetti={dialogError ? "none" : "celebration"}
          primaryAction={{
            label: dialogError ? "Réessayer" : "completer le wallet",
            onClick: () => {
              setDialogOpen(false);
              if (dialogError) return;
              router.push("/wallet/verification");
            },
            primary: true,
          }}
          secondaryActions={[
            {
              label: "Aller au tableau de bord",
              onClick: () => {
                setDialogOpen(false);
                router.push("/dashboard");
              },
              variant: "outline",
            },
          ]}
        />
      </div>
    </div>
  );
  
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    pin: "",
    confirmPin: "",
    acceptTerms: false,
    enableBiometrics: false,
    enableNotifications: true,
    currency: "GTC",
    walletName: "Mon Wallet Principal",
  });
  const [showPin, setShowPin] = useState(false);
  const [pinStrength, setPinStrength] = useState<
    ReturnType<typeof WalletUtils.validatePinStrength>
  >({
    isValid: false,
    errors: [],
    strength: "weak",
  });
  const [generatedCardNumber, setGeneratedCardNumber] = useState<string>("");

  // Vérifier si l'utilisateur peut créer un wallet
  useEffect(() => {
    if (!loading && user) {
      const canCreate = isAuthenticated
        ? WalletUtils.canCreateWallet(user)
        : { canCreate: false, reason: "Données utilisateur incomplètes" };
      if (!canCreate.canCreate && canCreate.reason) {
        toast.error(canCreate.reason);
        if (canCreate.reason === "Vous avez déjà un wallet") {
          router.push("/wallet");
        }
      }
    }
  }, [loading, user, router]);

  // Générer un numéro de carte visuel à l'initialisation
  useEffect(() => {
    if (step === 1) {
      setGeneratedCardNumber(WalletUtils.generateSecureCardNumber());
    }
  }, [step]);

  const steps = [
    {
      number: 1,
      title: "Configuration",
      icon: Settings,
      description: "Personnalisez votre wallet",
    },
    {
      number: 2,
      title: "Sécurité",
      icon: Shield,
      description: "Protégez votre accès",
    },
    {
      number: 3,
      title: "Confirmation",
      icon: CheckCircle,
      description: "Vérifiez vos informations",
    },
  ];

  const currencies = [
    {
      code: "GTC",
      name: "Games Trafics Coin",
      rate: "1 GTC = 500 FCFA",
      icon: Coins,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      code: "EUR",
      name: "Euro",
      rate: "1 EUR = 655 FCFA",
      icon: Globe,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      code: "USD",
      name: "US Dollar",
      rate: "1 USD = 600 FCFA",
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  const features = [
    {
      icon: Zap,
      title: "Transactions Instantanées",
      description: "Envoyez et recevez de l'argent en quelques secondes",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: ShieldCheck,
      title: "Sécurité Maximale",
      description: "Cryptage bancaire et authentification multi-facteurs",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: SmartphoneIcon,
      title: "Multi-Device",
      description: "Accédez à votre wallet depuis tous vos appareils",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Gift,
      title: "Bonus de Bienvenue",
      description: "250 GTC offerts à la création",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  const securityTips = [
    "Ne partagez jamais votre code PIN",
    "Évitez les codes évidents comme 1234",
    "Activez l'authentification biométrique",
    "Changez votre PIN régulièrement",
    "Signalez toute activité suspecte",
  ];

  const handlePinInput = (digit: string) => {
    if (formData.pin.length < 4) {
      const newPin = formData.pin + digit;
      setFormData({ ...formData, pin: newPin });

      if (newPin.length === 4) {
        const validation = WalletUtils.validatePinStrength(newPin);
        setPinStrength(validation);

        if (!validation.isValid) {
          validation.errors.forEach((error) =>
            toast.warning(error, { duration: 4000 })
          );
        } else {
          toast.success("PIN valide !", { duration: 3000 });
        }
      }
    }
  };

  const handlePinDelete = () => {
    if (formData.pin.length > 0) {
      setFormData({ ...formData, pin: formData.pin.slice(0, -1) });
    }
  };

  const handleClearPin = () => {
    setFormData({ ...formData, pin: "" });
    setPinStrength({ isValid: false, errors: [], strength: "weak" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < 3) {
      // Validation pour passer à l'étape suivante
      if (step === 1) {
        if (!formData.walletName.trim()) {
          toast.error("Veuillez donner un nom à votre wallet");
          return;
        }
        if (!formData.currency) {
          toast.error("Veuillez sélectionner une devise");
          return;
        }
      }

      if (step === 2) {
        // Valider le PIN
        if (formData.pin.length !== 4) {
          toast.error("Le PIN doit contenir exactement 4 chiffres");
          return;
        }

        if (!pinStrength.isValid) {
          toast.error("PIN invalide. Veuillez corriger les erreurs");
          return;
        }

        if (formData.pin !== formData.confirmPin) {
          toast.error("Les PIN ne correspondent pas");
          return;
        }

        if (!formData.acceptTerms) {
          toast.error("Vous devez accepter les conditions d'utilisation");
          return;
        }
      }

      setStep(step + 1);
      return;
    }

    // Étape 3 : Création du wallet
    setIsCreating(true);
    try {
      const result = await createWalletServer(user!.id, formData.pin, {
        enableBiometrics: formData.enableBiometrics,
        enableNotifications: formData.enableNotifications,
        currency: formData.currency,
      });

      if (result.success && result.wallet) {
        toast.success("🎉 Wallet créé avec succès !", {
          duration: 5000,
          description: `250 GTC ont été crédités sur votre compte`,
        });

        // Animation de célébration
        await WalletUtils.celebrateWalletCreation();

        // Redirection après succès
        setTimeout(() => {
          router.push("/wallet/dashboard?welcome=true");
          // router.push("/wallet/dashboard?welcome=true");
        }, 2000);
      } else {
        throw new Error(result.error || "Erreur lors de la création");
      }
    } catch (error: any) {
      toast.error("❌ Erreur lors de la création", {
        description: error.message || "Une erreur est survenue",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStepContent = () => {
    switch (step) {
      case 1:
        return (
          <ConfigurationStep
            user={user}
            formData={formData}
            setFormData={setFormData}
            currencies={currencies}
            generatedCardNumber={generatedCardNumber}
          />
        );
      case 2:
        return (
          <SecurityStep
            formData={formData}
            setFormData={setFormData}
            pinStrength={pinStrength}
            showPin={showPin}
            setShowPin={setShowPin}
            handlePinInput={handlePinInput}
            handlePinDelete={handlePinDelete}
            handleClearPin={handleClearPin}
            securityTips={securityTips}
          />
        );
      case 3:
        return (
          <ConfirmationStep
            user={user}
            formData={formData}
            isCreating={isCreating}
            generatedCardNumber={generatedCardNumber}
            currencies={currencies}
            features={features}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"
          />
          <Typography variant="h4" weight="medium">
            Préparation de votre wallet...
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Chargement des données utilisateur
          </Typography>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Lock className="h-10 w-10 text-destructive" />
            </div>
            <Typography variant="h3" weight="bold">
              Accès Non Autorisé
            </Typography>
            <Typography variant="body-base" theme="muted">
              Vous devez être connecté pour créer un wallet
            </Typography>
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push("/auth/signin")}
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/5">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header avec navigation */}
          <HeaderSection step={step} setStep={setStep} router={router} />

          {/* Étapes avec progression */}
          <ProgressSection step={step} steps={steps} />

          {/* Formulaire principal */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: step === 1 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: step === 1 ? -20 : 20 }}
                transition={{ duration: 0.3 }}
              >
                {getStepContent()}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <NavigationSection
              step={step}
              setStep={setStep}
              isCreating={isCreating}
              formData={formData}
              pinStrength={pinStrength}
            />
          </form>

          {/* Features Grid */}
          <FeaturesSection features={features} />

          {/* Security Badge */}
          <SecurityBadge />

          {/* Footer */}
          <FooterSection />
        </motion.div>
      </div>
    </div>
  );
}

// Composant : Header Section
function HeaderSection({ step, setStep, router }: any) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() =>
            step > 1 ? setStep(step - 1) : router.push("/wallet")
          }
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        <Badge variant="outline" className="gap-2">
          <Shield className="h-3 w-3" />
          Sécurisé
        </Badge>
      </div>

      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-primary via-purple-600 to-pink-600 flex items-center justify-center shadow-lg"
        >
          <Wallet className="h-12 w-12 text-white" />
        </motion.div>

        <Typography
          variant="h2"
          weight="bold"
          className="mb-3"
          animated
        >
          Créer Votre Wallet
        </Typography>
        <Typography
          variant="body-lg"
          theme="muted"
          className="max-w-2xl mx-auto"
        >
          Rejoignez la révolution financière avec un wallet sécurisé, rapide et
          intelligent
        </Typography>
      </div>
    </div>
  );
}

// Composant : Progress Section
function ProgressSection({ step, steps }: any) {
  return (
    <div className="mb-8">
      <Progress value={(step / 3) * 100} className="h-2 mb-6" />
      <div className="grid grid-cols-3 gap-4">
        {steps.map((s: any) => {
          const StepIcon = s.icon;
          const isActive = step >= s.number;
          const isCurrent = step === s.number;

          return (
            <motion.div
              key={s.number}
              whileHover={{ scale: 1.05 }}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-xl transition-all cursor-pointer",
                isActive
                  ? "bg-primary/5 border border-primary/20"
                  : "bg-muted/30 border border-muted"
              )}
              onClick={() => step > s.number && !isCurrent}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all",
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted bg-background text-muted-foreground",
                  isCurrent && "ring-2 ring-primary ring-offset-2"
                )}
              >
                {step > s.number ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>
              <div className="text-center">
                <Typography
                  variant="caption1"
                  weight="medium"
                  className={
                    isActive ? "text-primary" : "text-muted-foreground"
                  }
                >
                  {s.title}
                </Typography>
                <Typography variant="caption2" theme="muted" className="mt-1">
                  {s.description}
                </Typography>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Composant : Configuration Step
function ConfigurationStep({
  user,
  formData,
  setFormData,
  currencies,
  generatedCardNumber,
}: any) {
  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Settings className="h-6 w-6 text-primary" />
            Configuration Initiale
          </CardTitle>
          <Typography variant="body-base" theme="muted">
            Personnalisez votre wallet selon vos préférences
          </Typography>
        </CardHeader>
      </div>

      <CardContent className="p-6 space-y-8">
        {/* Informations utilisateur */}
        <div className="space-y-4">
          <Typography
            variant="h5"
            weight="semibold"
            className="flex items-center gap-2"
          >
            <User className="h-5 w-5" />
            Vos Informations
          </Typography>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={user?.username || user?.fullName || ""}
                  disabled
                  className="bg-muted/50 pl-10"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted/50 pl-10"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Nom du wallet */}
        <div className="space-y-2">
          <Label htmlFor="walletName">
            <span className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Nom du Wallet
            </span>
          </Label>
          <Input
            id="walletName"
            value={formData.walletName}
            onChange={(e) =>
              setFormData({ ...formData, walletName: e.target.value })
            }
            placeholder="Ex: Mon Wallet Principal, Wallet Épargne..."
            className="text-lg"
          />
          <Typography variant="caption2" theme="muted">
            Ce nom vous aidera à identifier votre wallet
          </Typography>
        </div>

        {/* Devise par défaut */}
        <div className="space-y-4">
          <Label>Devise Principale</Label>
          <Tabs
            defaultValue="GTC"
            value={formData.currency}
            onValueChange={(value) =>
              setFormData({ ...formData, currency: value })
            }
          >
            <TabsList className="grid grid-cols-3 w-full h-auto p-1 bg-muted/30">
              {currencies.map((currency: any) => {
                const CurrencyIcon = currency.icon;
                return (
                  <TabsTrigger
                    key={currency.code}
                    value={currency.code}
                    className={cn(
                      "flex flex-col items-center justify-center h-auto py-4 px-2 data-[state=active]:shadow-lg",
                      "transition-all duration-200"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center mb-2",
                        currency.bgColor
                      )}
                    >
                      <CurrencyIcon className={cn("h-5 w-5", currency.color)} />
                    </div>
                    <Typography
                      variant="body-sm"
                      weight="bold"
                      className="mb-1"
                    >
                      {currency.code}
                    </Typography>
                    <Typography
                      variant="caption2"
                      theme="muted"
                      className="text-center"
                    >
                      {currency.name}
                    </Typography>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {currency.rate}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>

        {/* Carte visuelle */}
        <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-xl p-6 border border-primary/10">
          <Typography
            variant="body-sm"
            weight="medium"
            className="mb-4 flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Votre Future Carte
          </Typography>

          <div className="bg-gradient-to-r from-primary to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <Typography variant="caption2" className="opacity-80">
                  VISA
                </Typography>
                <Typography variant="body-lg" weight="bold" className="mt-1">
                  Games Trafics
                </Typography>
              </div>
              <div className="text-right">
                <Typography variant="caption2" className="opacity-80">
                  Numéro de carte
                </Typography>
                <Typography
                  variant="body-lg"
                  weight="bold"
                  className="tracking-widest font-mono"
                >
                  {generatedCardNumber.match(/.{1,4}/g)?.join(" ") ||
                    "•••• •••• •••• ••••"}
                </Typography>
              </div>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <Typography variant="caption2" className="opacity-80">
                  Titulaire
                </Typography>
                <Typography variant="body-sm" weight="medium">
                  {user?.fullName?.toUpperCase() ||
                    user?.username?.toUpperCase() ||
                    "VOTRE NOM"}
                </Typography>
              </div>
              <div className="text-right">
                <Typography variant="caption2" className="opacity-80">
                  Expire
                </Typography>
                <Typography variant="body-sm" weight="medium">
                  12/28
                </Typography>
              </div>
            </div>
          </div>

          <Typography
            variant="caption2"
            theme="muted"
            className="mt-4 text-center"
          >
            Votre carte virtuelle sera disponible immédiatement après création
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant : Security Step
function SecurityStep({
  formData,
  setFormData,
  pinStrength,
  showPin,
  setShowPin,
  handlePinInput,
  handlePinDelete,
  handleClearPin,
  securityTips,
}: any) {
  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Shield className="h-6 w-6 text-blue-600" />
            Sécurité & Protection
          </CardTitle>
          <Typography variant="body-base" theme="muted">
            Configurez les mesures de sécurité pour protéger vos fonds
          </Typography>
        </CardHeader>
      </div>

      <CardContent className="p-6 space-y-8">
        {/* Section PIN */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <Label className="text-lg flex items-center justify-center gap-2">
              <Lock className="h-5 w-5" />
              Code PIN de Sécurité
            </Label>
            <Typography variant="body-sm" theme="muted">
              Ce code à 4 chiffres sera requis pour toutes vos transactions
            </Typography>
          </div>

          {/* Afficheur du PIN */}
          <div className="relative">
            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3].map((index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  className={cn(
                    "w-16 h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-mono transition-all",
                    index < formData.pin.length
                      ? "border-primary bg-primary/10 text-primary shadow-md"
                      : "border-muted bg-muted/20 text-muted-foreground"
                  )}
                >
                  {index < formData.pin.length ? (
                    showPin ? (
                      formData.pin[index]
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-primary" />
                    )
                  ) : (
                    <span className="text-muted-foreground/50">○</span>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowPin(!showPin)}
                className="h-10 w-10"
              >
                {showPin ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              {formData.pin.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleClearPin}
                  className="h-10 w-10"
                >
                  <span className="text-sm">✕</span>
                </Button>
              )}
            </div>
          </div>

          {/* Indicateur de force du PIN */}
          {formData.pin.length === 4 && (
            <div className="animate-in fade-in duration-300">
              <PinStrengthIndicator validation={pinStrength} />
            </div>
          )}

          {/* Clavier numérique */}
          <div className="pt-4">
            <PinPad
              onDigit={handlePinInput}
              onDelete={handlePinDelete}
              disabled={false}
            />
          </div>

          {/* Confirmation du PIN */}
          <div className="space-y-3 pt-6">
            <Label className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Confirmez votre PIN
            </Label>
            <div className="relative">
              <Input
                type="password"
                value={formData.confirmPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setFormData({ ...formData, confirmPin: value });
                }}
                maxLength={4}
                placeholder="Entrez à nouveau les 4 chiffres"
                className="text-center tracking-widest text-lg font-mono pl-12 pr-12"
                disabled={formData.pin.length !== 4}
              />
              <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              {formData.confirmPin.length === 4 && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {formData.pin === formData.confirmPin ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            {formData.confirmPin.length === 4 &&
              formData.pin !== formData.confirmPin && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="h-4 w-4" />
                  <Typography variant="caption2">
                    Les PIN ne correspondent pas
                  </Typography>
                </motion.div>
              )}
          </div>
        </div>

        <Separator />

        {/* Options de sécurité */}
        <div className="space-y-6">
          <Typography
            variant="h5"
            weight="semibold"
            className="flex items-center gap-2"
          >
            <ShieldCheck className="h-5 w-5" />
            Options de Sécurité
          </Typography>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, acceptTerms: checked as boolean })
                }
              />
              <div className="space-y-1 flex-1">
                <Label htmlFor="terms" className="cursor-pointer text-base">
                  Conditions d'utilisation
                </Label>
                <Typography variant="body-sm" theme="muted">
                  En cochant cette case, vous acceptez nos{" "}
                  <a
                    href="/terms"
                    className="text-primary hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    conditions d'utilisation
                  </a>{" "}
                  et notre{" "}
                  <a
                    href="/privacy"
                    className="text-primary hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    politique de confidentialité
                  </a>
                  . Ces documents décrivent comment nous protégeons vos données.
                </Typography>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors">
              <Checkbox
                id="biometrics"
                checked={formData.enableBiometrics}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    enableBiometrics: checked as boolean,
                  })
                }
              />
              <div className="space-y-1 flex-1">
                <Label
                  htmlFor="biometrics"
                  className="cursor-pointer text-base"
                >
                  <span className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Authentification Biométrique
                  </span>
                </Label>
                <Typography variant="body-sm" theme="muted">
                  Utilisez votre empreinte digitale ou reconnaissance faciale
                  pour des connexions plus rapides et sécurisées. Cette option
                  nécessite un appareil compatible.
                </Typography>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-muted/30 transition-colors">
              <Checkbox
                id="notifications"
                checked={formData.enableNotifications}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    enableNotifications: checked as boolean,
                  })
                }
              />
              <div className="space-y-1 flex-1">
                <Label
                  htmlFor="notifications"
                  className="cursor-pointer text-base"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications de Sécurité
                  </span>
                </Label>
                <Typography variant="body-sm" theme="muted">
                  Recevez des alertes instantanées pour toutes les transactions,
                  les tentatives de connexion suspectes et les mises à jour de
                  sécurité. Recommandé pour une protection optimale.
                </Typography>
              </div>
            </div>
          </div>
        </div>

        {/* Conseils de sécurité */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <Typography
            variant="body-sm"
            weight="semibold"
            className="mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300"
          >
            <Shield className="h-4 w-4" />
            Conseils de Sécurité Essentiels
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {securityTips.map((tip: string, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <Typography variant="body-sm" theme="muted">
                  {tip}
                </Typography>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant : Confirmation Step
function ConfirmationStep({
  user,
  formData,
  isCreating,
  generatedCardNumber,
  currencies,
  features,
}: any) {
  const selectedCurrency = currencies.find(
    (c: any) => c.code === formData.currency
  );

  return (
    <Card className="border-0 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Dernière Vérification
          </CardTitle>
          <Typography variant="body-base" theme="muted">
            Vérifiez toutes les informations avant de créer votre wallet
          </Typography>
        </CardHeader>
      </div>

      <CardContent className="p-6 space-y-8">
        {/* Animation de chargement si création en cours */}
        {isCreating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="text-center space-y-6 max-w-sm mx-auto">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 mx-auto rounded-full border-4 border-primary border-t-transparent"
              />
              <div className="space-y-3">
                <Typography variant="h4" weight="bold" gradient>
                  Création en Cours
                </Typography>
                <Typography variant="body-base" theme="muted">
                  Sécurisation de votre wallet...
                </Typography>
                <div className="space-y-2">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-green-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                  <Typography variant="caption2" theme="muted">
                    Cryptage des données • Génération des clés • Configuration
                    de la sécurité
                  </Typography>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="text-center py-4">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              scale: { duration: 2, repeat: Infinity },
              rotate: { duration: 3, repeat: Infinity },
            }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center shadow-lg"
          >
            <Wallet className="h-12 w-12 text-green-600" />
          </motion.div>
          <Typography variant="h4" weight="bold" className="mb-3">
            Prêt à créer votre wallet!
          </Typography>
          <Typography
            variant="body-lg"
            theme="muted"
            className="max-w-md mx-auto"
          >
            Votre aventure financière commence maintenant. Vérifiez les détails
            ci-dessous.
          </Typography>
        </div>

        {/* Résumé */}
        <div className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <Typography
                  variant="body-sm"
                  weight="medium"
                  className="mb-4 text-muted-foreground"
                >
                  Informations Personnelles
                </Typography>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Typography variant="body-sm">Nom complet:</Typography>
                    <Typography variant="body-sm" weight="semibold">
                      {user?.fullName || user?.username}
                    </Typography>
                  </div>
                  <div className="flex justify-between items-center">
                    <Typography variant="body-sm">Email:</Typography>
                    <Typography variant="body-sm" weight="semibold">
                      {user?.email}
                    </Typography>
                  </div>
                  <div className="flex justify-between items-center">
                    <Typography variant="body-sm">Wallet:</Typography>
                    <Typography variant="body-sm" weight="semibold">
                      {formData.walletName}
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Typography
                  variant="body-sm"
                  weight="medium"
                  className="mb-4 text-muted-foreground"
                >
                  Configuration
                </Typography>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Typography variant="body-sm">Devise:</Typography>
                    <div className="flex items-center gap-2">
                      {selectedCurrency && (
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center",
                            selectedCurrency.bgColor
                          )}
                        >
                          <selectedCurrency.icon
                            className={cn("h-3 w-3", selectedCurrency.color)}
                          />
                        </div>
                      )}
                      <Badge variant="outline" className="font-mono">
                        {formData.currency}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <Typography variant="body-sm">Biométrie:</Typography>
                    <Badge
                      variant={
                        formData.enableBiometrics ? "default" : "secondary"
                      }
                    >
                      {formData.enableBiometrics ? "Activée" : "Désactivée"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <Typography variant="body-sm">Notifications:</Typography>
                    <Badge
                      variant={
                        formData.enableNotifications ? "default" : "secondary"
                      }
                    >
                      {formData.enableNotifications
                        ? "Activées"
                        : "Désactivées"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Détails de sécurité */}
          <Card>
            <CardContent className="p-6">
              <Typography
                variant="body-sm"
                weight="medium"
                className="mb-4 text-muted-foreground"
              >
                Sécurité
              </Typography>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Typography variant="body-sm">Numéro de carte:</Typography>
                  <Typography
                    variant="body-sm"
                    weight="semibold"
                    className="font-mono tracking-wider"
                  >
                    •••• •••• •••• {generatedCardNumber.slice(-4)}
                  </Typography>
                </div>
                <div className="flex justify-between items-center">
                  <Typography variant="body-sm">Statut PIN:</Typography>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-primary"
                        />
                      ))}
                    </div>
                    <Typography
                      variant="body-sm"
                      weight="semibold"
                      className="text-green-600"
                    >
                      Configuré
                    </Typography>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avantages */}
          <div className="bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-xl p-6 border border-primary/10">
            <Typography
              variant="body-sm"
              weight="medium"
              className="mb-4 flex items-center gap-2 text-primary"
            >
              <Gift className="h-4 w-4" />
              Avantages Inclus
            </Typography>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feature: any, index: number) => {
                const FeatureIcon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="text-center space-y-2"
                  >
                    <div
                      className={cn(
                        "w-12 h-12 mx-auto rounded-xl flex items-center justify-center",
                        feature.bgColor
                      )}
                    >
                      <FeatureIcon className={cn("h-6 w-6", feature.color)} />
                    </div>
                    <Typography variant="caption1" weight="medium">
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="caption2"
                      theme="muted"
                      className="px-2"
                    >
                      {feature.description}
                    </Typography>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Bonus de bienvenue */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <Typography
                  variant="body-lg"
                  weight="bold"
                  className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300"
                >
                  <Coins className="h-5 w-5" />
                  Bonus de Bienvenue !
                </Typography>
                <Typography variant="body-sm" theme="muted" className="mt-1">
                  250 GTC seront crédités sur votre compte immédiatement après
                  création
                </Typography>
              </div>
              <Badge
                variant="default"
                className="text-lg px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500"
              >
                250 GTC
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant : Navigation Section
function NavigationSection({
  step,
  setStep,
  isCreating,
  formData,
  pinStrength,
}: any) {
  const isStep2Valid = () => {
    if (step !== 2) return true;
    return (
      formData.pin.length === 4 &&
      pinStrength.isValid &&
      formData.pin === formData.confirmPin &&
      formData.acceptTerms
    );
  };

  const getNextButtonText = () => {
    if (step === 3) {
      return isCreating ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
          />
          Création en cours...
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4" />
          Créer mon Wallet
        </>
      );
    }
    return (
      <>
        Suivant
        <ArrowRight className="h-4 w-4" />
      </>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
      <div className="flex-1">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => setStep(step - 1)}
            disabled={isCreating}
          >
            <ArrowLeft className="h-4 w-4" />
            Précédent
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Typography variant="body-sm" theme="muted" className="hidden sm:block">
          Étape {step} sur 3
        </Typography>

        <Button
          type={step === 3 ? "submit" : "button"}
          className={cn(
            "gap-2 min-w-[180px]",
            step === 3 &&
              "bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
          )}
          onClick={step < 3 ? () => setStep(step + 1) : undefined}
          disabled={isCreating || !isStep2Valid()}
          size="lg"
        >
          {getNextButtonText()}
        </Button>
      </div>
    </div>
  );
}

// Composant : Features Section
function FeaturesSection({ features }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-12"
    >
      <Typography variant="h3" weight="bold" className="text-center mb-10">
        Pourquoi choisir notre Wallet?
      </Typography>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature: any, index: number) => {
          const FeatureIcon = feature.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-b from-background to-muted/20">
                <CardContent className="p-6 text-center">
                  <div
                    className={cn(
                      "w-14 h-14 mx-auto mb-5 rounded-xl flex items-center justify-center",
                      feature.bgColor
                    )}
                  >
                    <FeatureIcon className={cn("h-7 w-7", feature.color)} />
                  </div>
                  <Typography variant="h5" weight="semibold" className="mb-3">
                    {feature.title}
                  </Typography>
                  <Typography
                    variant="body-sm"
                    theme="muted"
                    className="leading-relaxed"
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// Composant : Security Badge
function SecurityBadge() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
      className="mt-8 pt-8 border-t"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <Typography variant="body-sm" weight="medium">
              Sécurité Garantie
            </Typography>
            <Typography variant="caption2" theme="muted">
              Cryptage bancaire • Protection des données • Conformité RGPD
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <Typography variant="h4" weight="bold" className="text-primary">
              256-bit
            </Typography>
            <Typography variant="caption2" theme="muted">
              Encryption
            </Typography>
          </div>
          <div className="text-center">
            <Typography variant="h4" weight="bold" className="text-primary">
              99.9%
            </Typography>
            <Typography variant="caption2" theme="muted">
              Uptime
            </Typography>
          </div>
          <div className="text-center">
            <Typography variant="h4" weight="bold" className="text-primary">
              24/7
            </Typography>
            <Typography variant="caption2" theme="muted">
              Support
            </Typography>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Composant : Footer Section
function FooterSection() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
      className="text-center mt-12 pt-8 border-t"
    >
      <Typography variant="body-sm" theme="muted" className="mb-4">
        Vous avez des questions?{" "}
        <a href="/support" className="text-primary hover:underline font-medium">
          Contactez notre support
        </a>{" "}
        ou consultez notre{" "}
        <a href="/faq" className="text-primary hover:underline font-medium">
          FAQ
        </a>
      </Typography>

      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
        <a href="/privacy" className="hover:text-primary transition-colors">
          Confidentialité
        </a>
        <span>•</span>
        <a href="/terms" className="hover:text-primary transition-colors">
          Conditions
        </a>
        <span>•</span>
        <a href="/security" className="hover:text-primary transition-colors">
          Sécurité
        </a>
        <span>•</span>
        <a href="/legal" className="hover:text-primary transition-colors">
          Mentions légales
        </a>
      </div>

      <Typography variant="caption2" theme="muted" className="mt-6">
        © {new Date().getFullYear()} Games Trafics. Tous droits réservés. Ce
        service est fourni par Games Trafics Ltd, réglementé et supervisé.
      </Typography>
    </motion.div>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useSendTestNotification,
} from "@/hooks/use-notifications";
import { usePushNotifications } from "@/lib/optimized-pwa";

interface NotificationSettingsCardProps {
  userId: string;
}

export function NotificationSettingsCard({ userId }: NotificationSettingsCardProps) {
  const { data: prefs, isLoading } = useNotificationPreferences(userId);
  const { mutateAsync: updatePrefs, isPending: isUpdating } =
    useUpdateNotificationPreferences();
  const { mutateAsync: sendTest, isPending: isTesting } =
    useSendTestNotification();
  const push = usePushNotifications(userId);

  const [inApp, setInApp] = useState(true);
  const [email, setEmail] = useState(true);
  const [whatsapp, setWhatsapp] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [emailOverride, setEmailOverride] = useState("");
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

  useEffect(() => {
    if (prefs) {
      setInApp(prefs.in_app);
      setEmail(prefs.email);
      setWhatsapp(prefs.whatsapp);
      setPushEnabled(prefs.push);
      setWhatsappPhone(prefs.whatsappPhone || "");
      setEmailOverride(prefs.emailOverride || "");
    }
  }, [prefs]);

  const handleSave = async () => {
    try {
      await updatePrefs({
        userId,
        preferences: {
          in_app: inApp,
          email,
          whatsapp,
          push: pushEnabled,
          whatsappPhone: whatsappPhone.trim() || undefined,
          emailOverride: emailOverride.trim() || undefined,
        },
      });
      toast.success("Préférences de notification enregistrées !");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    }
  };

  const handleTestChannel = async (channel: "in_app" | "email" | "whatsapp" | "push") => {
    setTestingChannel(channel);
    try {
      const res = await sendTest({ userId, channel });
      if (res.success) {
        toast.success(`Notification de test envoyée avec succès via ${channel.toUpperCase()} !`);
      } else {
        toast.error(`Échec du test via ${channel.toUpperCase()}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du test");
    } finally {
      setTestingChannel(null);
    }
  };

  const handleTogglePush = async (checked: boolean) => {
    setPushEnabled(checked);
    if (checked && !push.isSubscribed && push.isSupported) {
      const ok = await push.subscribe();
      if (ok) {
        toast.success("Abonnement push activé sur cet appareil !");
      }
    } else if (!checked && push.isSubscribed) {
      await push.unsubscribe();
      toast.info("Abonnement push désactivé sur cet appareil");
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/60 backdrop-blur-md">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-md shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Bell className="h-5 w-5 text-primary" />
              Canaux de notifications
            </CardTitle>
            <CardDescription>
              Choisissez comment vous souhaitez être averti des matchs, tournois et paiements.
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary">
            Multi-canal
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 1. In-App */}
        <div className="flex items-center justify-between rounded-xl border border-border/40 p-4 transition-colors hover:border-border/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <Label className="font-semibold text-foreground">Notifications In-App</Label>
              <p className="text-xs text-muted-foreground">
                Affichées dans le centre de notifications de Games Trafics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={!inApp || testingChannel === "in_app"}
              onClick={() => handleTestChannel("in_app")}
              className="text-xs"
            >
              {testingChannel === "in_app" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 mr-1" />
              )}
              Tester
            </Button>
            <Switch checked={inApp} onCheckedChange={setInApp} />
          </div>
        </div>

        {/* 2. WhatsApp Cloud API */}
        <div className="rounded-xl border border-border/40 p-4 space-y-4 transition-colors hover:border-border/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label className="font-semibold text-foreground">WhatsApp Instantané</Label>
                  <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-1.5 py-0">
                    Cloud API
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recevez vos rappels de matchs et résultats directement sur WhatsApp
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={!whatsapp || !whatsappPhone || testingChannel === "whatsapp"}
                onClick={() => handleTestChannel("whatsapp")}
                className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                {testingChannel === "whatsapp" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1" />
                )}
                Tester
              </Button>
              <Switch checked={whatsapp} onCheckedChange={setWhatsapp} />
            </div>
          </div>

          {whatsapp && (
            <div className="pt-2 border-t border-border/30">
              <Label className="text-xs text-muted-foreground mb-1 block">
                Numéro WhatsApp (indicatif international inclus, ex: +228 90 12 34 56)
              </Label>
              <Input
                placeholder="+22890123456"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          )}
        </div>

        {/* 3. Email (Resend) */}
        <div className="rounded-xl border border-border/40 p-4 space-y-4 transition-colors hover:border-border/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <Label className="font-semibold text-foreground">Notifications par Email</Label>
                <p className="text-xs text-muted-foreground">
                  Confirmations de tournoi, reçus financiers et annonces
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={!email || testingChannel === "email"}
                onClick={() => handleTestChannel("email")}
                className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400"
              >
                {testingChannel === "email" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1" />
                )}
                Tester
              </Button>
              <Switch checked={email} onCheckedChange={setEmail} />
            </div>
          </div>

          {email && (
            <div className="pt-2 border-t border-border/30">
              <Label className="text-xs text-muted-foreground mb-1 block">
                Adresse email (laisser vide pour utiliser celle de votre compte)
              </Label>
              <Input
                type="email"
                placeholder="votre-email@exemple.com"
                value={emailOverride}
                onChange={(e) => setEmailOverride(e.target.value)}
                className="text-sm"
              />
            </div>
          )}
        </div>

        {/* 4. Web Push */}
        <div className="flex items-center justify-between rounded-xl border border-border/40 p-4 transition-colors hover:border-border/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label className="font-semibold text-foreground">Notifications Push Navigateur</Label>
                {push.isSubscribed && (
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-[10px] px-1.5 py-0">
                    Actif
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Alertes directes sur votre appareil mobile ou ordinateur
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={!pushEnabled || testingChannel === "push"}
              onClick={() => handleTestChannel("push")}
              className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400"
            >
              {testingChannel === "push" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 mr-1" />
              )}
              Tester
            </Button>
            <Switch
              checked={pushEnabled}
              onCheckedChange={handleTogglePush}
            />
          </div>
        </div>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="w-full sm:w-auto font-semibold"
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Enregistrer les préférences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// components/ui/result-dialog.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Trophy,
  Star,
  PartyPopper,
  Shield,
  Clock,
  LucideIcon,
  Loader2,
  ExternalLink,
  Copy,
  ChevronRight,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";
import {
  fireConfetti,
  fireConfettiPreset,
  type ConfettiOptions,
  type ConfettiPreset,
} from "@/utils/confetti";

export type ResultType = "success" | "error" | "warning" | "info" | "custom";
export type ConfettiType =
  | "success"
  | "celebration"
  | "fireworks"
  | "rain"
  | "sides"
  | "subtle"
  | "gold"
  | "heart"
  | "realistic"
  | "none";

export interface ResultDialogAction {
  label: string;
  onClick: () => void;
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  icon?: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  loading?: boolean;
}

export interface ResultDialogLink {
  label: string;
  href: string;
  external?: boolean;
  icon?: React.ReactNode;
}

export interface ResultDialogTimer {
  enabled: boolean;
  duration: number; // en millisecondes
  onComplete: () => void;
  showCountdown?: boolean;
  countdownFormat?: (seconds: number) => string;
}

export interface ResultDialogProps {
  // Contrôle de base
  open: boolean;
  onOpenChange?: (open: boolean) => void;

  // Type et contenu
  type: ResultType;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  customIcon?: {
    icon: LucideIcon;
    color: string;
    bgColor: string;
  };

  // Confettis
  confetti?: ConfettiType;
  confettiOptions?: ConfettiOptions;
  confettiDelay?: number; // Délai avant d'activer les confettis (ms)

  // Actions
  actions?: ResultDialogAction[];
  primaryAction?: ResultDialogAction;
  secondaryActions?: ResultDialogAction[];

  // Contenu additionnel
  content?: React.ReactNode;
  footerContent?: React.ReactNode;

  // Liens
  links?: ResultDialogLink[];

  // Timer
  timer?: ResultDialogTimer;

  // Affichage
  showCloseButton?: boolean;
  closeButtonText?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;

  // Personnalisation
  className?: string;
  contentClassName?: string;
  overlayClassName?: string;

  // État
  loading?: boolean;
  loadingText?: string;

  // Données additionnelles
  metadata?: Record<string, any>;
  showMetadata?: boolean;

  // Effets sonores
  soundEffect?: "success" | "error" | "warning" | "notification" | "none";

  // Animation
  animateIcon?: boolean;
  pulseEffect?: boolean;

  // Rétroaction
  showCopyButton?: boolean;
  copyText?: string;
  copyLabel?: string;

  // Navigation
  showContinueButton?: boolean;
  continueButtonText?: string;
  onContinue?: () => void;
}

const defaultIcons: Record<ResultType, React.ReactNode> = {
  success: (
    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30">
      <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
    </div>
  ),
  error: (
    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30">
      <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
    </div>
  ),
  warning: (
    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 dark:bg-amber-900/30">
      <AlertCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
    </div>
  ),
  info: (
    <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30">
      <Info className="h-10 w-10 text-blue-600 dark:text-blue-400" />
    </div>
  ),
  custom: null,
};

const confettiPresets: Record<ConfettiType, () => Promise<void>> = {
  success: async () => {
    await fireConfettiPreset("success");
  },
  celebration: async () => {
    await fireConfettiPreset("celebration");
  },
  fireworks: async () => {
    const { fireConfettiSequence } = await import("@/utils/confetti");
    await fireConfettiSequence(3, 200);
  },
  rain: async () => {
    await fireConfettiPreset("rain");
  },
  sides: async () => {
    const { fireConfettiFromSides } = await import("@/utils/confetti");
    await fireConfettiFromSides();
  },
  subtle: async () => {
    await fireConfettiPreset("subtle");
  },
  gold: async () => {
    await fireConfettiPreset("gold");
  },
  heart: async () => {
    const { fireHeartConfetti } = await import("@/utils/confetti");
    await fireHeartConfetti();
  },
  realistic: async () => {
    const { fireRealisticConfetti } = await import("@/utils/confetti");
    await fireRealisticConfetti();
  },
  none: async () => {},
};

const soundEffects = {
  success: new Audio("/sounds/success.mp3"),
  error: new Audio("/sounds/error.mp3"),
  warning: new Audio("/sounds/warning.mp3"),
  notification: new Audio("/sounds/notification.mp3"),
};

export function ResultDialog({
  open,
  onOpenChange,
  type = "success",
  title,
  description,
  icon,
  customIcon,
  confetti = "none",
  confettiOptions,
  confettiDelay = 100,
  actions = [],
  primaryAction,
  secondaryActions = [],
  content,
  footerContent,
  links = [],
  timer,
  showCloseButton = true,
  closeButtonText = "Fermer",
  autoClose = false,
  autoCloseDelay = 3000,
  className,
  contentClassName,
  overlayClassName,
  loading = false,
  loadingText = "Chargement...",
  metadata,
  showMetadata = false,
  soundEffect = "none",
  animateIcon = true,
  pulseEffect = true,
  showCopyButton = false,
  copyText,
  copyLabel = "Copier",
  showContinueButton = false,
  continueButtonText = "Continuer",
  onContinue,
}: ResultDialogProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hasPlayedConfetti, setHasPlayedConfetti] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  // Gestion des confettis
  useEffect(() => {
    if (open && confetti !== "none" && !hasPlayedConfetti) {
      const playConfetti = async () => {
        await new Promise((resolve) => setTimeout(resolve, confettiDelay));

        if (confettiOptions) {
          const { fireConfetti } = await import("@/utils/confetti");
          await fireConfetti(confettiOptions);
        } else {
          await confettiPresets[confetti]();
        }

        setHasPlayedConfetti(true);
      };

      playConfetti();
    }

    if (!open) {
      setHasPlayedConfetti(false);
    }
  }, [open, confetti, confettiOptions, confettiDelay, hasPlayedConfetti]);

  // Gestion du timer
  useEffect(() => {
    if (open && timer?.enabled) {
      const endTime = Date.now() + timer.duration;
      const updateCountdown = () => {
        const remaining = Math.max(0, endTime - Date.now());
        setCountdown(Math.ceil(remaining / 1000));

        if (remaining > 0) {
          requestAnimationFrame(updateCountdown);
        } else {
          timer.onComplete();
        }
      };

      updateCountdown();
    }

    return () => {
      setCountdown(null);
    };
  }, [open, timer]);

  // Fermeture automatique
  useEffect(() => {
    if (open && autoClose && !loading) {
      const timeout = setTimeout(() => {
        onOpenChange?.(false);
      }, autoCloseDelay);

      return () => clearTimeout(timeout);
    }
  }, [open, autoClose, autoCloseDelay, loading, onOpenChange]);

  // Effets sonores
  useEffect(() => {
    if (open && soundEffect !== "none") {
      const sound = soundEffects[soundEffect];
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(console.error);
      }
    }
  }, [open, soundEffect]);

  const handleCopy = async () => {
    if (!copyText) return;

    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(copyText);
      // Feedback visuel
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
    } finally {
      setTimeout(() => setIsCopying(false), 2000);
    }
  };

  const handleClose = () => {
    onOpenChange?.(false);
  };

  const allActions = [
    ...(primaryAction ? [primaryAction] : []),
    ...actions,
    ...secondaryActions,
  ];

  const displayedIcon =
    icon ||
    (customIcon ? (
      <div
        className={cn(
          "mx-auto flex items-center justify-center h-20 w-20 rounded-full",
          customIcon.bgColor
        )}
      >
        <customIcon.icon className={cn("h-10 w-10", customIcon.color)} />
      </div>
    ) : (
      defaultIcons[type]
    ));

  const formatCountdown = timer?.countdownFormat
    ? timer.countdownFormat
    : (seconds: number) => `${seconds}s`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-md md:max-w-lg lg:max-w-xl",
          "p-0 overflow-hidden",
          pulseEffect && "animate-in fade-in-0 zoom-in-95",
          className
        )}
      >
        {/* En-tête avec icône */}
        <div
          className={cn(
            "relative p-6 text-center border-b",
            type === "success" &&
              "bg-gradient-to-b from-green-50 to-background border-green-100 dark:from-green-950/20 dark:to-background dark:border-green-900",
            type === "error" &&
              "bg-gradient-to-b from-red-50 to-background border-red-100 dark:from-red-950/20 dark:to-background dark:border-red-900",
            type === "warning" &&
              "bg-gradient-to-b from-amber-50 to-background border-amber-100 dark:from-amber-950/20 dark:to-background dark:border-amber-900",
            type === "info" &&
              "bg-gradient-to-b from-blue-50 to-background border-blue-100 dark:from-blue-950/20 dark:to-background dark:border-blue-900",
            type === "custom" &&
              "bg-gradient-to-b from-muted/50 to-background border-border"
          )}
        >
          {/* Effet de particules subtiles */}
          {animateIcon && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
              <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
            </div>
          )}

          {/* Timer visuel */}
          {timer?.enabled && timer.showCountdown && countdown !== null && (
            <div className="absolute top-4 right-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 backdrop-blur-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium tabular-nums">
                  {formatCountdown(countdown)}
                </span>
              </div>
            </div>
          )}

          {/* Icone avec animation */}
          <div
            className={cn(
              "relative mb-4",
              animateIcon && "animate-in zoom-in-95 duration-300"
            )}
          >
            {displayedIcon}

            {/* Badge de statut */}
            {type === "success" && confetti !== "none" && (
              <div className="absolute -top-2 -right-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* Titre et description */}
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {title}
            </DialogTitle>

            {description && (
              <DialogDescription className="text-base text-muted-foreground">
                {description}
              </DialogDescription>
            )}
          </div>

          {/* Bouton de copie */}
          {showCopyButton && copyText && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={isCopying}
                className="gap-2"
              >
                {isCopying ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    {copyLabel}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Contenu principal */}
        <div className={cn("p-6 space-y-6", contentClassName)}>
          {/* État de chargement */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <Typography variant="body-lg" className="text-muted-foreground">
                {loadingText}
              </Typography>
            </div>
          ) : (
            <>
              {/* Contenu personnalisé */}
              {content}

              {/* Métadonnées */}
              {showMetadata && metadata && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <Typography
                    variant="body-sm"
                    weight="medium"
                    className="mb-3"
                  >
                    Détails supplémentaires
                  </Typography>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {Object.entries(metadata).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <Typography
                          variant="caption2"
                          theme="muted"
                          className="capitalize"
                        >
                          {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                        </Typography>
                        <Typography variant="body-sm" className="font-medium">
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </Typography>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Liens rapides */}
              {links.length > 0 && (
                <div className="space-y-2">
                  <Typography
                    variant="body-sm"
                    weight="medium"
                    className="text-muted-foreground"
                  >
                    Liens utiles
                  </Typography>
                  <div className="grid grid-cols-1 gap-2">
                    {links.map((link, index) => (
                      <a
                        key={index}
                        href={link.href}
                        target={link.external ? "_blank" : "_self"}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          {link.icon}
                          <Typography variant="body-sm">
                            {link.label}
                          </Typography>
                        </div>
                        {link.external ? (
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pied de page avec actions */}
        <DialogFooter className="flex flex-col sm:flex-row gap-3 p-6 pt-0 border-t bg-muted/20">
          {/* Actions secondaires */}
          {secondaryActions.length > 0 && (
            <div className="flex flex-wrap gap-2 sm:mr-auto">
              {secondaryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "outline"}
                  size={action.size || "sm"}
                  onClick={action.onClick}
                  disabled={action.disabled || loading}
                  className="gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Actions principales */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Bouton continuer */}
            {showContinueButton && onContinue && (
              <Button variant="default" onClick={onContinue} className="gap-2">
                {continueButtonText}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}

            {/* Actions */}
            {allActions.map((action, index) => (
              <Button
                key={index}
                variant={
                  action.variant || (action.primary ? "default" : "secondary")
                }
                size={action.size || "default"}
                onClick={action.onClick}
                disabled={action.disabled || loading}
                className={cn(
                  "gap-2",
                  action.primary && "shadow-lg shadow-primary/25"
                )}
              >
                {action.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  action.icon
                )}
                {action.label}
              </Button>
            ))}

            {/* Bouton fermer */}
            {showCloseButton && (
              <Button
                variant="ghost"
                onClick={handleClose}
                className="sm:ml-auto"
              >
                {closeButtonText}
              </Button>
            )}
          </div>

          {/* Contenu personnalisé du pied de page */}
          {footerContent}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Composants spécialisés pour des cas d'usage courants

interface SuccessDialogProps
  extends Omit<ResultDialogProps, "type" | "confetti" | "title"> {
  title?: string;
  description?: string;
  showConfetti?: boolean;
  confettiType?: ConfettiType;
}

export function SuccessDialog({
  title = "Succès !",
  description = "L'opération s'est déroulée avec succès.",
  showConfetti = true,
  confettiType = "success",
  ...props
}: SuccessDialogProps) {
  return (
    <ResultDialog
      type="success"
      title={title}
      description={description}
      confetti={showConfetti ? confettiType : "none"}
      {...props}
    />
  );
}

interface ErrorDialogProps extends Omit<ResultDialogProps, "type" | "title"> {
  title?: string;
  description?: string;
  error?: Error | string;
  showErrorDetails?: boolean;
}

export function ErrorDialog({
  title = "Erreur",
  description = "Une erreur s'est produite lors de l'opération.",
  error,
  showErrorDetails = false,
  ...props
}: ErrorDialogProps) {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  return (
    <ResultDialog
      type="error"
      title={title}
      description={description}
      content={
        showErrorDetails && errorMessage ? (
          <div className="space-y-3">
            <Typography
              variant="body-sm"
              className="text-destructive font-medium"
            >
              {errorMessage}
            </Typography>
            {errorStack && (
              <pre className="text-xs text-muted-foreground bg-muted/50 p-3 rounded overflow-auto max-h-32">
                {errorStack}
              </pre>
            )}
          </div>
        ) : undefined
      }
      {...props}
    />
  );
}

interface WarningDialogProps extends Omit<ResultDialogProps, "type" | "title"> {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function WarningDialog({
  title = "Attention",
  description = "Êtes-vous sûr de vouloir continuer ?",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  ...props
}: WarningDialogProps) {
  return (
    <ResultDialog
      type="warning"
      title={title}
      description={description}
      actions={[
        {
          label: confirmLabel,
          onClick: onConfirm || (() => {}),
          variant: "destructive",
          primary: true,
        },
        {
          label: cancelLabel,
          onClick: onCancel || (() => {}),
          variant: "outline",
        },
      ]}
      showCloseButton={false}
      {...props}
    />
  );
}

interface LoadingDialogProps
  extends Omit<ResultDialogProps, "type" | "loading" | "title"> {
  title?: string;
  description?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
}

export function LoadingDialog({
  title = "Chargement",
  description = "Veuillez patienter...",
  progress,
  showProgress = false,
  ...props
}: LoadingDialogProps) {
  return (
    <ResultDialog
      type="info"
      title={title}
      description={description}
      loading={true}
      loadingText={description}
      content={
        showProgress && progress !== undefined ? (
          <div className="space-y-2">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progression</span>
              <span className="font-medium">{progress}%</span>
            </div>
          </div>
        ) : undefined
      }
      showCloseButton={false}
      {...props}
    />
  );
}

interface CelebrationDialogProps
  extends Omit<ResultDialogProps, "type" | "confetti" | "icon" | "title"> {
  title?: string;
  description?: string;
  achievement?: string;
  reward?: string;
}

export function CelebrationDialog({
  title = "Félicitations !",
  description = "Vous avez accompli quelque chose d'incroyable !",
  achievement,
  reward,
  ...props
}: CelebrationDialogProps) {
  return (
    <ResultDialog
      type="success"
      title={title}
      description={description}
      confetti="celebration"
      icon={
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
          <Trophy className="h-10 w-10 text-white" />
        </div>
      }
      content={
        <div className="space-y-4">
          {achievement && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <Star className="h-6 w-6 text-amber-500 flex-shrink-0" />
              <div>
                <Typography
                  variant="body-sm"
                  weight="medium"
                  className="text-amber-700 dark:text-amber-300"
                >
                  Nouvelle réalisation
                </Typography>
                <Typography
                  variant="body-sm"
                  className="text-amber-600 dark:text-amber-400"
                >
                  {achievement}
                </Typography>
              </div>
            </div>
          )}

          {reward && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <PartyPopper className="h-6 w-6 text-green-500 flex-shrink-0" />
              <div>
                <Typography
                  variant="body-sm"
                  weight="medium"
                  className="text-green-700 dark:text-green-300"
                >
                  Récompense obtenue
                </Typography>
                <Typography
                  variant="body-sm"
                  className="text-green-600 dark:text-green-400"
                >
                  {reward}
                </Typography>
              </div>
            </div>
          )}
        </div>
      }
      {...props}
    />
  );
}

interface PurchaseSuccessDialogProps extends Omit<ResultDialogProps, "type"> {
  productName?: string;
  amount?: string;
  transactionId?: string;
  orderNumber?: string;
}

export function PurchaseSuccessDialog({
  title = "Achat réussi !",
  productName,
  amount,
  transactionId,
  orderNumber,
  ...props
}: PurchaseSuccessDialogProps) {
  return (
    <ResultDialog
      type="success"
      title={title}
      description="Votre transaction a été effectuée avec succès."
      confetti="gold"
      customIcon={{
        icon: Shield,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor:
          "bg-gradient-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30",
      }}
      content={
        <div className="space-y-4">
          {productName && (
            <div className="space-y-1">
              <Typography variant="caption2" theme="muted">
                Produit
              </Typography>
              <Typography variant="body-sm" weight="medium">
                {productName}
              </Typography>
            </div>
          )}

          {amount && (
            <div className="space-y-1">
              <Typography variant="caption2" theme="muted">
                Montant
              </Typography>
              <Typography
                variant="body-sm"
                weight="bold"
                className="text-green-600 dark:text-green-400"
              >
                {amount} GTC
              </Typography>
            </div>
          )}

          {(transactionId || orderNumber) && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              {orderNumber && (
                <div className="space-y-1">
                  <Typography variant="caption2" theme="muted">
                    N° de commande
                  </Typography>
                  <Typography variant="body-sm" className="font-mono">
                    {orderNumber}
                  </Typography>
                </div>
              )}

              {transactionId && (
                <div className="space-y-1">
                  <Typography variant="caption2" theme="muted">
                    Transaction ID
                  </Typography>
                  <Typography
                    variant="body-sm"
                    className="font-mono text-xs truncate"
                  >
                    {transactionId}
                  </Typography>
                </div>
              )}
            </div>
          )}
        </div>
      }
      showCopyButton={!!transactionId}
      copyText={transactionId}
      copyLabel="Copier l'ID"
      links={[
        {
          label: "Voir mes commandes",
          href: "/orders",
        },
        {
          label: "Voir la transaction",
          href: `/transactions/${transactionId}`,
        },
      ]}
      {...props}
    />
  );
}

// Hook pour utiliser facilement le ResultDialog

export function useResultDialog() {
  const [dialogProps, setDialogProps] = useState<ResultDialogProps>({
    open: false,
    type: "success",
    title: "",
  });

  const showDialog = (props: Omit<ResultDialogProps, "open">) => {
    setDialogProps({ ...props, open: true });
  };

  const hideDialog = () => {
    setDialogProps((prev) => ({ ...prev, open: false }));
  };

  const DialogComponent = (
    <ResultDialog
      {...dialogProps}
      onOpenChange={(open) => {
        if (!open) hideDialog();
        dialogProps.onOpenChange?.(open);
      }}
    />
  );

  return {
    showDialog,
    hideDialog,
    DialogComponent,
    isOpen: dialogProps.open,
  };
}

// Hook spécialisé pour les succès
export function useSuccessDialog() {
  const { showDialog, hideDialog, DialogComponent, isOpen } = useResultDialog();

  const showSuccess = (props: Omit<SuccessDialogProps, "open" | "type">) => {
    showDialog({
      type: "success",
      confetti: "success",
      title: props.title ?? "Succès !",
      ...props,
    });
  };

  return {
    showSuccess,
    hideDialog,
    DialogComponent,
    isOpen,
  };
}

// Hook spécialisé pour les erreurs
export function useErrorDialog() {
  const { showDialog, hideDialog, DialogComponent, isOpen } = useResultDialog();

  const showError = (props: Omit<ErrorDialogProps, "open" | "type">) => {
    showDialog({
      type: "error",
      title: props.title ?? "Succès !",
      ...props,
    });
  };

  return {
    showError,
    hideDialog,
    DialogComponent,
    isOpen,
  };
}

// @/components/pages/tournaments/edition-detail/edition-detail-header.tsx
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  Trophy,
  Share2,
  Clock,
  Award,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  MessageCircle,
  Gamepad2,
  Swords,
  GitBranch,
  LayoutGrid,
  Star,
  FileText,
  Zap,
  CheckCircle2,
  ExternalLink,
  QrCode,
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Tournament, TournamentEditionWithRelations } from "@/database/schema";
import { useScreenSize } from "@/hooks/use-screen";
import { useRouter } from "next/navigation";
import { useDeleteEdition } from "@/hooks/use-editions";
import { cn } from "@/lib/utils";
import { InteractionButton } from "@/components/shared/interaction-button";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { EditionQrDialog } from "./edition-qr-dialog";
import { toast } from "sonner";
import {
  DEFAULT_TOURNAMENT_COVER,
  resolveEditionCover,
} from "@/lib/tournaments/edition-cover";

export interface CompetitionTabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  highlight?: boolean;
}

interface EditionDetailHeaderProps {
  tournament: Tournament;
  edition: TournamentEditionWithRelations;
  isOrganizer: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onJoinClick?: () => void;
  onPaymentClick?: () => void;
  onCancelJoin?: () => void;
  onCancelPayment?: () => void;
  onConfirmPayment?: () => void;
  isRegistered?: boolean;
  /** @deprecated carousel removed — prop kept for backwards compat with callers */
  recentMatches?: any[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  tabCounts?: {
    matches?: number;
    participants?: number;
    phases?: number;
  };
}

export function EditionDetailHeader({
  tournament,
  edition,
  isOrganizer,
  onEdit,
  onDelete,
  onJoinClick,
  onPaymentClick,
  isRegistered,
  // recentMatches intentionally unused — carousel removed
  activeTab = "overview",
  onTabChange,
  tabCounts,
}: EditionDetailHeaderProps) {
  const { isMobile } = useScreenSize();
  const router = useRouter();
  const deleteMutation = useDeleteEdition();
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [showActions, setShowActions] = useState(false);
  // Couverture résolue édition → tournoi → visuel de secours, avec repli si
  // l'URL distante est cassée (aucune image brisée affichée).
  const resolvedCover = resolveEditionCover(
    edition as any,
    tournament as any,
    DEFAULT_TOURNAMENT_COVER,
  );
  const [coverSrc, setCoverSrc] = useState(resolvedCover);
  useEffect(() => {
    setCoverSrc(resolvedCover);
  }, [resolvedCover]);
  const hasCover = Boolean(coverSrc && coverSrc !== DEFAULT_TOURNAMENT_COVER);

  const handleDeleteEdition = async () => {
    try {
      await deleteMutation.mutateAsync(edition.id);
      setShowActions(false);
      toast.success("Édition supprimée");
      router.push(`/tournaments/${tournament.id}`);
    } catch (error: any) {
      toast.error(error?.message || "Impossible de supprimer l'édition");
    }
  };

  // ─── Compact sticky header detection ─────────────────────────────────────
  // When the hero banner scrolls out of view, we show a compact edition info
  // bar above the sticky tabs using an IntersectionObserver (no scroll events).
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsCompact(!entry.isIntersecting),
      {
        threshold: 0,
        // rootMargin accounts for the TopMiddle bar height (h-16 = 64px)
        // which hides on scroll (hideTopMiddleOnScroll: true), so we use 0
        // once it's gone; this gives a clean trigger right at hero bottom.
        rootMargin: "0px 0px 0px 0px",
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ─── Derived values ───────────────────────────────────────────────────────
  const currentParticipants = edition.registrations?.length || edition.currentParticipants || 0;
  const maxParticipants = edition.maxParticipants || 32;
  const fillPercentage = Math.min(100, Math.round((currentParticipants / maxParticipants) * 100));

  const entryFeeNumber = Number(edition.entryFee || 0);
  const isFree = entryFeeNumber === 0;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "LIVE":
        return {
          label: "EN DIRECT",
          className: "bg-red-500 text-white border-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]",
          dotColor: "bg-white",
        };
      case "UPCOMING":
        return {
          label: "INSCRIPTIONS OUVERTES",
          className: "bg-primary/20 text-primary border-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.3)]",
          dotColor: "bg-primary",
        };
      case "COMPLETED":
        return {
          label: "TERMINÉ",
          className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
          dotColor: "bg-amber-400",
        };
      case "CANCELLED":
        return {
          label: "ANNULÉ",
          className: "bg-muted text-muted-foreground border-white/10",
          dotColor: "bg-muted-foreground",
        };
      default:
        return {
          label: status,
          className: "bg-secondary text-secondary-foreground",
          dotColor: "bg-foreground",
        };
    }
  };

  const statusConfig = getStatusConfig(edition.status || "UPCOMING");

  const competitionTabs: CompetitionTabItem[] = useMemo(() => [
    { id: "overview", label: "Vue d'ensemble", icon: Trophy },
    { id: "brackets", label: "Arbre & Playoffs", icon: GitBranch, highlight: true },
    { id: "phases", label: "Phases & Poules", icon: LayoutGrid, count: tabCounts?.phases },
    { id: "matches", label: "Matchs", icon: Swords, count: tabCounts?.matches },
    { id: "standings", label: "Classement", icon: Award },
    { id: "participants", label: "Participants", icon: Users, count: tabCounts?.participants },
    { id: "calendar", label: "Calendrier", icon: Calendar },
    { id: "stats", label: "MVPs & Stats", icon: Star },
    { id: "rules", label: "Règlement", icon: FileText },
  ], [tabCounts]);

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Lien copié dans le presse-papiers !");
      } catch {
        toast.error("Impossible de copier le lien");
      }
    }
  };

  // console.log(tournament.coverImage);

  return (
    <div className="relative border-b border-white/10 bg-gradient-to-b from-background via-card/20 to-background">
      {/* 1. HERO BANNER ESPORTS */}
      <div className={cn(`relative w-full overflow-hidden flex flex-col justify-end`, hasCover ? "min-h-[220px] md:min-h-[300px] lg:min-h-[340px]" : "min-h-6")}>
        {/* Arrière-plan avec Image de Couverture & Mesh Gradient */}
        <div className="absolute inset-0 -z-10">
          {hasCover ? (
            <Image
              src={coverSrc}
              alt={tournament.name}
              fill
              sizes="100vw"
              className="object-cover object-center opacity-35 scale-105 filter blur-[1px]"
              priority
              onError={() => setCoverSrc(DEFAULT_TOURNAMENT_COVER)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-background to-card" />
          )}
          {/* Overlays Esports */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background/60" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        </div>

        {/* Champion Spotlight si tournoi terminé */}
        {edition.status === "COMPLETED" && Boolean(edition.winnerMetadata) && (
          <div className="container mx-auto px-4 md:px-6 mb-4 z-20">
            <div className="p-3.5 md:p-5 rounded-2xl bg-gradient-to-r from-yellow-500/15 via-amber-500/10 to-transparent border border-yellow-500/30 backdrop-blur-xl flex items-center justify-between shadow-[0_0_25px_rgba(234,179,8,0.1)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                    Champion de l&apos;Édition
                  </div>
                  <div className="text-base md:text-lg font-black italic tracking-tight text-foreground">
                    {(edition.winnerMetadata as any).username || "Vainqueur Officiel"}
                  </div>
                </div>
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/40 text-xs font-black uppercase">
                Vainqueur
              </Badge>
            </div>
          </div>
        )}

        {/* Sentinel: triggers compact header when hero exits viewport */}
        <div ref={sentinelRef} className="absolute bottom-0 left-0 w-full h-px pointer-events-none" />
      </div>

      {/* 2. MAIN TOURNAMENT CARD */}
      <div className="container mx-auto px-4 md:px-6 relative z-20 -mt-8 md:-mt-12 pb-4">
        <div className="bg-card/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 md:p-8 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6">
          {/* Logo / Badge et Informations Principales */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 w-full lg:w-auto">
            {/* Logo du Tournoi */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-2xl border-2 border-white/15 bg-card/80 overflow-hidden shadow-2xl relative flex items-center justify-center group">
                <Image
                  src={tournament.profileImage || DEFAULT_TOURNAMENT_COVER}
                  alt={edition.name || tournament.name}
                  fill
                  onError={(event) => {
                    const img = event.currentTarget as HTMLImageElement;
                    if (!img.src.endsWith(DEFAULT_TOURNAMENT_COVER)) {
                      img.src = DEFAULT_TOURNAMENT_COVER;
                    }
                  }}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              {/* Badge Numéro d'édition */}
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <Badge className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 border border-primary/40 shadow-lg">
                  Édition #{edition.editionNumber}
                </Badge>
              </div>
            </div>

            {/* Titre & Metadonnées */}
            <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0">
              {/* Badges de statut & métadonnées */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <Badge className={cn("text-[10px] font-black uppercase tracking-wider px-2.5 py-1 flex items-center gap-1.5", statusConfig.className)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dotColor)} />
                  {statusConfig.label}
                </Badge>

                <Badge variant="outline" className="border-white/10 bg-background/50 text-foreground gap-1.5 text-xs py-1">
                  <Gamepad2 className="w-3.5 h-3.5 text-primary" />
                  <span className="font-bold">{tournament.game}</span>
                </Badge>

                <Badge variant="outline" className="border-white/10 bg-background/50 text-muted-foreground text-xs py-1">
                  {edition.locationType === "ONLINE" ? "🌐 En ligne" : "📍 En présentiel"}
                </Badge>

                {isFree ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-black">
                    GRATUIT
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-black">
                    {edition.entryFee} {edition.prizeCurrency || "GTC"}
                  </Badge>
                )}
              </div>

              {/* Titre de l'édition */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black italic tracking-tighter text-foreground">
                  {edition.name || `Édition #${edition.editionNumber}`}
                </h1>
                <Link
                  href={`/tournaments/${tournament.id}`}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
                >
                  <span>Tournoi : {tournament.name}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </Link>
              </div>

              {/* Tagline si disponible */}
              {edition.tagline && (
                <p className="text-sm text-muted-foreground line-clamp-2 max-w-xl">
                  {edition.tagline}
                </p>
              )}

              {/* Quick Info Bar */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-muted-foreground font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>
                    Du {format(new Date(edition.startDate), "d MMM yyyy", { locale: fr })}
                    {edition.endDate && ` au ${format(new Date(edition.endDate), "d MMM yyyy", { locale: fr })}`}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <span>
                    <strong className="text-foreground">{currentParticipants}</strong> / {maxParticipants} participants
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Panneau d'Actions & Jauge de Remplissage */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-col items-stretch lg:items-end gap-3.5 shrink-0 pt-4 lg:pt-0 border-t border-white/10 lg:border-t-0">
            {/* Jauge de participants */}
            <div className="w-full sm:w-48 lg:w-56 bg-background/50 border border-white/5 rounded-xl p-2.5 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <span>Places</span>
                <span className="text-foreground font-black">{fillPercentage}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${fillPercentage}%` }}
                />
              </div>
            </div>

            {/* Actions : 2 actions principales visibles, le reste dans le Drawer « … » */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Action principale 1 — inscription */}
              {isRegistered ? (
                <div className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-black uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Inscrit
                </div>
              ) : (
                <Button
                  size="lg"
                  onClick={onJoinClick}
                  className="flex-1 sm:flex-initial font-black uppercase tracking-wider text-sm px-7 py-6 italic shadow-[0_0_20px_rgba(var(--primary),0.35)] hover:shadow-[0_0_30px_rgba(var(--primary),0.55)] transition-all hover:scale-105"
                >
                  <Zap className="w-4 h-4 mr-2 fill-current" />
                  S&apos;inscrire
                </Button>
              )}

              {/* Action principale 2 — tableau de bord organisateur */}
              {isOrganizer && (
                <Button
                  variant="outline"
                  size="lg"
                  asChild
                  className="font-bold border-white/15 bg-background/60 hover:bg-background/90 py-6"
                >
                  <Link href={`/tournaments/${tournament.id}/editions/${edition.id}/dashboard`}>
                    Tableau de bord
                  </Link>
                </Button>
              )}

              {/* Actions secondaires — Drawer / Sheet */}
              <Sheet open={showActions} onOpenChange={setShowActions}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Plus d'actions pour cette édition"
                    className="h-12 w-12 shrink-0 border-white/10 bg-background/50"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side={isMobile ? "bottom" : "right"}
                  className="flex flex-col p-0"
                >
                  <SheetHeader className="border-b border-white/10 text-left">
                    <SheetTitle>Actions de l&apos;édition</SheetTitle>
                    <SheetDescription>
                      {edition.name || `Édition #${edition.editionNumber}`}
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                    <Button
                      variant="ghost"
                      className="h-11 w-full justify-start gap-3 font-medium"
                      onClick={() => {
                        setShowActions(false);
                        void handleShare();
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                      Partager l&apos;édition
                    </Button>

                    <div className="flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium hover:bg-accent">
                      <InteractionButton
                        entityType="EDITION"
                        entityId={edition.id}
                        type="follow"
                        variant="ghost"
                        size="sm"
                        withCount
                        className="h-8 justify-start px-0 hover:bg-transparent"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      className="h-11 w-full justify-start gap-3 font-medium"
                      onClick={() => {
                        setShowActions(false);
                        setShowQrDialog(true);
                      }}
                    >
                      <QrCode className="h-4 w-4" />
                      QR code de l&apos;édition
                    </Button>

                    <Button
                      variant="ghost"
                      className="h-11 w-full justify-start gap-3 font-medium"
                      asChild
                    >
                      <Link
                        href={`/chats?entityType=tournament&entityId=${tournament.id}`}
                        onClick={() => setShowActions(false)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Discuter du tournoi
                      </Link>
                    </Button>

                    {isOrganizer && (
                      <>
                        <div className="my-1 h-px bg-border" />
                        <Button
                          variant="ghost"
                          className="h-11 w-full justify-start gap-3 font-medium"
                          onClick={() => {
                            setShowActions(false);
                            onEdit?.();
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          Modifier l&apos;édition
                        </Button>

                        <ConfirmationDialog
                          title="Supprimer cette édition ?"
                          description="Cette action est définitive : structures, matchs et inscriptions de cette édition seront supprimés."
                          confirmLabel="Supprimer"
                          onConfirm={handleDeleteEdition}
                        >
                          <Button
                            variant="ghost"
                            className="h-11 w-full justify-start gap-3 font-medium text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Supprimer l&apos;édition
                          </Button>
                        </ConfirmationDialog>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* 3. COMPETITION TABS NAVIGATION BAR — sticky avec compact header */}
      <div className="sticky top-0 z-30">
        {/* ── Compact edition info bar (visible seulement quand le hero est scrollé) */}
        <AnimatePresence>
          {isCompact && (
            <motion.div
              key="compact-header"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="bg-background/97 backdrop-blur-2xl border-b border-white/10 shadow-md"
            >
              <div className="container mx-auto px-4 md:px-6 flex items-center gap-3 py-2">
                {/* Mini logo */}
                <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/15 shrink-0">
                  <Image
                    src={tournament.profileImage || DEFAULT_TOURNAMENT_COVER}
                    alt={edition.name || tournament.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Edition name + status */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-black italic tracking-tight text-foreground truncate">
                    {edition.name || `Édition #${edition.editionNumber}`}
                  </span>
                  <Badge
                    className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 flex items-center gap-1 shrink-0",
                      statusConfig.className
                    )}
                  >
                    <span className={cn("w-1 h-1 rounded-full", statusConfig.dotColor)} />
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Participants count — secondary info */}
                <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium shrink-0">
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    <strong className="text-foreground">{currentParticipants}</strong>/{maxParticipants}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tabs navigation bar */}
        <div className="bg-background/95 backdrop-blur-2xl border-y border-white/10 shadow-lg">
          <div className="container mx-auto px-4 md:px-6">
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
              {competitionTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 relative",
                      isActive
                        ? "text-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.15)] font-black"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                      tab.highlight && !isActive && "text-cyan-400"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "opacity-70")} />
                    <span>{tab.label}</span>
                    {typeof tab.count === "number" && tab.count > 0 && (
                      <span
                        className={cn(
                          "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-white/10 text-muted-foreground"
                        )}
                      >
                        {tab.count}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.8)]"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <EditionQrDialog
        open={showQrDialog}
        onOpenChange={setShowQrDialog}
        tournamentId={tournament.id}
        editionId={edition.id}
        editionLabel={edition.name || `Édition #${edition.editionNumber}`}
      />
    </div>
  );
}

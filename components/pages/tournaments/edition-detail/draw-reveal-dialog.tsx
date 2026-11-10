"use client";

/**
 * DrawRevealDialog — révèle progressivement un tirage DÉJÀ persisté côté
 * serveur (drawPhaseGroupsAction / drawGroupMatchesAction).
 *
 * L'animation ne modifie jamais le résultat : l'étape « tirage » a lieu
 * côté serveur avant l'ouverture du dialog ; ici on révèle la vérité,
 * avec reprise propre à la fermeture (révélation complète disponible
 * immédiatement en cas de fermeture accidentelle).
 */

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Dices, Sparkles, User, Users, Swords, CheckCircle2, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface DrawRevealGroup {
  groupId: string;
  groupName: string;
  /** Ordre de révélation = ordre de tirage serveur (aplati). */
  participantIds: string[];
}

export interface DrawRevealNode {
  id: string;
  nodeCode: string;
  name: string;
  p1: string | null;
  p2: string | null;
  p1Name: string;
  p2Name: string;
}

export interface DrawRevealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "groups" | "nodes";
  title: string;
  description?: string;
  /** Labels d'affichage résolus serveur (registrationId → nom). */
  names: Record<string, string>;
  photos?: Record<string, string | null>;
  groups?: DrawRevealGroup[];
  nodes?: DrawRevealNode[];
  /** Membres exemptés (RR impair) — révélés à la fin. */
  byeParticipants?: { id: string; name: string }[];
  /** Appelée quand l'utilisateur ferme le dialog après révélation. */
  onFinish?: () => void;
  /** Rappel serveur pour refaire un tirage (force: true). */
  onRedraw?: () => void;
  isRedrawing?: boolean;
}

const REVEAL_INTERVAL_MS = 620;

export function DrawRevealDialog({
  open,
  onOpenChange,
  kind,
  title,
  description,
  names,
  photos = {},
  groups = [],
  nodes = [],
  byeParticipants = [],
  onFinish,
  onRedraw,
  isRedrawing = false,
}: DrawRevealDialogProps) {
  const [revealedCount, setRevealedCount] = React.useState(0);
  const isFinishedRef = React.useRef(false);

  //Ordre de révélation : participants par groupe (groupes) ou nœuds (confrontations).
  const totalRevealable =
    kind === "groups"
      ? groups.reduce((acc, g) => acc + g.participantIds.length, 0)
      : nodes.length;
  const allRevealed = revealedCount >= totalRevealable && totalRevealable > 0;

  React.useEffect(() => {
    if (!open) return;
    // Fermeture accidentelle : on repart de la vérité complète.
    setRevealedCount((prev) => (prev === 0 ? 0 : totalRevealable));
    isFinishedRef.current = false;
  }, [open, totalRevealable]);

  React.useEffect(() => {
    if (!open || allRevealed) return;
    const timer = setTimeout(() => {
      setRevealedCount((prev) => Math.min(prev + 1, totalRevealable));
    }, revealedCount === 0 ? 450 : REVEAL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [open, revealedCount, allRevealed, totalRevealable]);

  const handleOpenChange = (next: boolean) => {
    if (!next && isFinishedRef.current) {
      onFinish?.();
    }
    onOpenChange(next);
  };

  const handleSkip = () => {
    setRevealedCount(totalRevealable);
  };

  // Liste plate ordonnée des participants pour kind === "groups".
  const flatParticipants: { registrationId: string; groupName: string }[] =
    kind === "groups"
      ? groups.flatMap((g) =>
          g.participantIds.map((id) => ({
            registrationId: id,
            groupName: g.groupName,
          })),
        )
      : [];

  const currentlyRevealed = flatParticipants.slice(0, revealedCount);

  const displayName = (id: string | null) =>
    (id && names[id]) || "À déterminer";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] gap-0 p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 pb-3 border-b bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Dices className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[55vh]">
          <div className="p-4">
            {/* Progressaire */}
            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {allRevealed
                  ? "Tirage terminé"
                  : `Révélation… ${revealedCount}/${totalRevealable}`}
              </span>
              {isRedrawing && (
                <span className="flex items-center gap-1.5 text-primary">
                  <RefreshCcw className="h-3 w-3 animate-spin" /> Nouveau tirage
                  en cours…
                </span>
              )}
            </div>

            {/* RÉVÉLATION DES GROUPES */}
            {kind === "groups" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {groups.map((group) => {
                  const groupMembers = group.participantIds.map((id) => ({
                    id,
                    revealed: currentlyRevealed.some(
                      (r) => r.registrationId === id,
                    ),
                  }));
                  const isGroupActive = group.participantIds.some((id) =>
                    currentlyRevealed.some((r) => r.registrationId === id),
                  );
                  return (
                    <div
                      key={group.groupId}
                      className={cn(
                        "rounded-xl border p-3 transition-all",
                        isGroupActive
                          ? "border-primary/40 bg-primary/5"
                          : "border-border",
                      )}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-bold">{group.groupName}</span>
                        <Badge variant="secondary" className="ml-auto text-[10px]">
                          {groupMembers.length}
                        </Badge>
                      </div>
                      <div className="space-y-1.5 min-h-6">
                        {groupMembers.map(({ id, revealed }) => (
                          <AnimatePresence key={id} mode="wait">
                            {revealed ? (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="flex items-center gap-2 rounded-lg bg-background/80 px-2 py-1.5"
                              >
                                <Avatar className="h-6 w-6 border">
                                  <AvatarImage src={photos[id] ?? undefined} />
                                  <AvatarFallback className="text-[9px] bg-muted">
                                    {displayName(id).substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium truncate">
                                  {displayName(id)}
                                </span>
                              </motion.div>
                            ) : (
                              <motion.div
                                exit={{ opacity: 0 }}
                                className="h-8 rounded-lg bg-muted/50 border border-dashed"
                              />
                            )}
                          </AnimatePresence>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* RÉVÉLATION DES CONFRONTATIONS */}
            {kind === "nodes" && (
              <div className="space-y-2">
                {nodes.map((node, idx) => {
                  const revealed = idx < revealedCount;
                  return (
                    <AnimatePresence key={node.id} mode="wait">
                      {revealed ? (
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.32, ease: "easeOut" }}
                          className="rounded-xl border border-primary/30 bg-primary/[0.04] p-3"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Swords className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                              {node.nodeCode}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            <span className="truncate flex-1">
                              {node.p1Name}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-normal shrink-0">
                              vs
                            </span>
                            <span className="truncate flex-1 text-right">
                              {node.p2Name}
                            </span>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          exit={{ opacity: 0 }}
                          className="h-16 rounded-xl bg-muted/40 border border-dashed"
                        />
                      )}
                    </AnimatePresence>
                  );
                })}
              </div>
            )}

            {/* Exemptés (BYE) révélés en fin */}
            {byeParticipants.length > 0 && allRevealed && (
              <div className="mt-3 rounded-xl border border-dashed border-muted-foreground/30 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">
                  Exemptés de cette journée
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {byeParticipants.map((b) => (
                    <Badge key={b.id} variant="outline" className="gap-1">
                      <User className="h-3 w-3" /> {b.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t bg-muted/30 p-3">
          {!allRevealed ? (
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Tout révéler
            </Button>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Affectations enregistrées
            </span>
          )}
          {onRedraw && allRevealed && (
            <Button variant="outline" size="sm" onClick={onRedraw} disabled={isRedrawing}>
              <RefreshCcw className="h-3.5 w-3.5 mr-1.5" /> Refaire le tirage
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => handleOpenChange(false)}
            disabled={!allRevealed}
          >
            {allRevealed ? "Fermer" : "Tirage en cours…"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

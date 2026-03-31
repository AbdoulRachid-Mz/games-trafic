// components/pages/chats/join-group-dialog.tsx
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Lock, ChevronRight, Loader2 } from "lucide-react";
import { Group } from "@/database/schema";
import { useRequestJoinGroup } from "@/hooks/use-groupes";
import { toast } from "sonner";
import { getInitials } from "@/utils/chat-helpers";

interface JoinGroupDialogProps {
  group: Group;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function JoinGroupDialog({
  group,
  userId,
  isOpen,
  onClose,
}: JoinGroupDialogProps) {
  const { mutate: requestJoin, isPending } = useRequestJoinGroup();
  const [requestSent, setRequestSent] = useState(false);

  const handleRequestJoin = () => {
    requestJoin(
      { groupId: group.id, userId },
      {
        onSuccess: () => {
          setRequestSent(true);
          toast.success("Demande d'adhésion envoyée aux administrateurs");
        },
        onError: (error: any) => {
          toast.error(error.message || "Erreur lors de la demande");
        },
      }
    );
  };

  const initials = getInitials(group.name);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-[var(--chat-surface)] border-[var(--chat-border)]">
        <DialogHeader className="items-center text-center">
          <div className="relative mb-4">
            <Avatar className="h-20 w-20 border-4 border-primary/20">
              <AvatarImage src={group.image || undefined} alt={group.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-border">
              <Lock className="h-4 w-4 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-xl font-bold text-[var(--chat-text)]">
            Accès restreint
          </DialogTitle>
          <DialogDescription className="text-[var(--chat-textMuted)]">
            Vous devez être membre de <strong>{group.name}</strong> pour voir les messages et participer à la conversation.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--chat-text)]">Groupe privé</p>
                <p className="text-xs text-[var(--chat-textMuted)]">Les administrateurs doivent approuver votre demande.</p>
              </div>
            </div>
          </div>

          {group.description && (
            <div className="text-sm text-[var(--chat-textMuted)] italic text-center px-4">
              "{group.description}"
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          {requestSent ? (
            <div className="bg-green-500/10 text-green-500 p-3 rounded-lg text-center text-sm font-medium border border-green-500/20 w-full mb-2">
              Demande en attente d'approbation
            </div>
          ) : (
            <Button
              onClick={handleRequestJoin}
              disabled={isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-2" />
              )}
              Demander à rejoindre
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
            className="w-full text-[var(--chat-textMuted)] hover:text-[var(--chat-text)]"
          >
            Retour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

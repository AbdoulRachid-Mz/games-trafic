// app/chats/[entityType]/[entityId]/detail/page.tsx
"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChatThemeProvider } from "@/contexts/chat-theme-context";
import { getInitials } from "@/utils/chat-helpers";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Trash2,
  UserX,
  Image as ImageIcon,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserById } from "@/hooks/use-users";
import { useGroupById, useGroupMembers } from "@/hooks/use-groupes";
import { useAuthContext } from "@/contexts/auth-context";
import { useMessages } from "@/hooks/use-messages";
import type { ChatEntityType } from "@/types/chat";

function ChatDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuthContext();
  
  const entityType = params.entityType as ChatEntityType;
  const entityId = params.entityId as string;

  if (!entityType || !entityId) {
    router.push("/chats");
    return null;
  }

  const isGroup = entityType === "group";

  // Fetch entity data
  const { data: userData, isLoading: userLoading } = useUserById(
    !isGroup && entityType === "user" ? entityId : undefined
  );
  const { data: groupData, isLoading: groupLoading } = useGroupById(
    isGroup ? entityId : "",
    { populate: ["members"] }
  );
  const { data: membersData } = useGroupMembers(isGroup ? entityId : "", {
    pagination: { page: 1, limit: 1 },
  });

  // Fetch shared media
  const { data: mediaMessages } = useMessages(
    {
      filters: isGroup 
        ? { groupId: entityId } 
        : { 
            senderId: currentUser?.id || "",
            recipientId: entityId
          },
      pagination: { page: 1, limit: 50 }
    },
    !!entityId
  );

  const isLoading = isGroup ? groupLoading : userLoading;
  const entity = isGroup ? groupData : userData;
  const entityName = isGroup ? groupData?.name : (userData?.username || userData?.fullName) || "Inconnu";
  const entityAvatar = isGroup ? groupData?.image : userData?.profileImage;
  const initials = getInitials(entityName || "");
  const memberCount = isGroup ? (membersData?.pagination?.total || 0) : undefined;
  const isMuted = false;
  
  const sharedMedia = mediaMessages?.data?.filter((m: any) => m.images && m.images.length > 0) || [];

  const handleBack = () => {
    router.back();
  };

  const handleToggleMute = () => {
    toast.info("La sourdine arrive bientôt");
  };

  const handleBlock = () => {
    toast.info("Le blocage arrive bientôt");
  };

  const handleDelete = () => {
    toast.info("La suppression arrive bientôt");
  };

  const handleViewMedia = () => {
    toast.info("La galerie média arrive bientôt");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--chat-background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-6 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="min-h-screen bg-[var(--chat-background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-bold text-[var(--chat-text)]">Discussion non trouvée</h1>
          <Button onClick={() => router.push("/chats")}>Retour aux discussions</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--chat-background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--chat-surface)] border-b border-[var(--chat-border)] p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-[var(--chat-text)]">
            {isGroup ? "Infos du groupe" : "Infos du contact"}
          </h1>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-73px)]">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Profile Section */}
          <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)] p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={entityAvatar || undefined} alt={entityName} />
                <AvatarFallback className="bg-[var(--chat-primary)] text-[var(--chat-messageSentText)] text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-[var(--chat-text)]">
                  {entityName}
                </h2>
                {isGroup && memberCount !== undefined && (
                  <p className="text-sm text-[var(--chat-textMuted)] mt-1">
                    {memberCount} membres
                  </p>
                )}
              </div>
              {isGroup && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/chats/groups/${entityId}`)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Voir les détails du groupe
                </Button>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)] overflow-hidden">
            <div className="p-4 space-y-4">
              <h3 className="font-semibold text-[var(--chat-text)]">
                Paramètres
              </h3>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isMuted ? (
                    <BellOff className="h-5 w-5 text-[var(--chat-textMuted)]" />
                  ) : (
                    <Bell className="h-5 w-5 text-[var(--chat-textMuted)]" />
                  )}
                  <div>
                    <Label>Mode sourdine</Label>
                    <p className="text-sm text-[var(--chat-textMuted)]">
                      Ne plus recevoir de notifications
                    </p>
                  </div>
                </div>
                <Switch checked={isMuted} onCheckedChange={handleToggleMute} />
              </div>
            </div>
          </div>

          {/* Shared Media */}
          <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)] overflow-hidden">
            <button
              onClick={handleViewMedia}
              className="w-full p-4 flex items-center justify-between hover:bg-[var(--chat-surfaceHover)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-[var(--chat-textMuted)]" />
                <div className="text-left">
                  <p className="font-medium text-[var(--chat-text)]">
                    Médias partagés
                  </p>
                  <p className="text-sm text-[var(--chat-textMuted)]">
                    {sharedMedia.length} éléments
                  </p>
                </div>
              </div>
              <ArrowLeft className="h-5 w-5 rotate-180 text-[var(--chat-textMuted)]" />
            </button>
          </div>

          {/* Danger Zone */}
          <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-error)]/20 overflow-hidden">
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-[var(--chat-error)]">
                Zone de danger
              </h3>

              {!isGroup && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-[var(--chat-error)] hover:text-[var(--chat-error)] hover:bg-[var(--chat-error)]/10"
                  onClick={handleBlock}
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Bloquer l'utilisateur
                </Button>
              )}

              <Button
                variant="ghost"
                className="w-full justify-start text-[var(--chat-error)] hover:text-[var(--chat-error)] hover:bg-[var(--chat-error)]/10"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer la conversation
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default function ChatDetailPage() {
  return (
    <ChatThemeProvider>
      <ChatDetailContent />
    </ChatThemeProvider>
  );
}

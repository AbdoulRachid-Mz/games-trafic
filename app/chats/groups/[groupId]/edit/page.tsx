// app/chats/groups/[groupId]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthContext } from "@/contexts/auth-context";
import { ChatThemeProvider } from "@/contexts/chat-theme-context";
import { useGroupById, useUpdateGroup } from "@/hooks/use-groupes";
import { getInitials } from "@/utils/chat-helpers";
import { toast } from "sonner";
import { ArrowLeft, Upload, Users, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function EditGroupContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const groupId = params.groupId as string;

  const { data: group, isLoading } = useGroupById(groupId);
  const updateGroupMutation = useUpdateGroup();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [whoCanSend, setWhoCanSend] = useState('all');
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [groupImagePreview, setGroupImagePreview] = useState<string | null>(
    null
  );

  // Initialize form with group data
  useEffect(() => {
    if (group) {
      setGroupName(group.name);
      setDescription(group.description || "");
      setIsPrivate(group.isPrivate || false);
      setIsReadOnly((group as any).isReadOnly || false);
      setWhoCanSend(((group as any).permissions?.whoCanSend) || 'all');
      setGroupImagePreview(group.image || null);
    }
  }, [group]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setGroupImage(null);
    setGroupImagePreview(null);
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      toast.error("Veuillez entrer un nom de groupe");
      return;
    }

    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    try {
      // TODO: Upload group image if changed
      let imageUrl: string | undefined = group?.image || undefined;
      if (groupImage) {
        // Implement image upload
        // imageUrl = await uploadImage(groupImage);
      }

      await updateGroupMutation.mutateAsync({
        id: groupId,
        userId: user.id,
        data: {
          name: groupName,
          description: description || undefined,
          image: imageUrl,
          isPrivate,
          isReadOnly,
          permissions: { whoCanSend, whoCanSendMedia: 'all', whoCanAddMembers: 'admins', whoCanEditInfo: 'admins', whoCanPin: 'admins', whoCanDeleteMessages: 'admins' },
        },
      });

      toast.success("Groupe mis à jour avec succès");
      router.push(`/chats/groups/${groupId}`);
    } catch (error) {
      console.error("Failed to update group:", error);
      toast.error("Erreur lors de la mise à jour du groupe");
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--chat-background)]">
        <div className="sticky top-0 z-10 bg-[var(--chat-surface)] border-b border-[var(--chat-border)] p-4">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-[var(--chat-background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[var(--chat-text)]">
            Groupe non trouvé
          </h1>
          <Button onClick={() => router.push("/chats")}>Retour aux discussions</Button>
        </div>
      </div>
    );
  }

  const initials = getInitials(groupName || group.name);

  return (
    <div className="min-h-screen bg-[var(--chat-background)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--chat-surface)] border-b border-[var(--chat-border)] p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[var(--chat-text)]">
              Modifier le groupe
            </h1>
            <p className="text-sm text-[var(--chat-textMuted)]">
              Mettre à jour les informations du groupe
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={!groupName.trim() || updateGroupMutation.isPending}
            className="bg-[var(--chat-primary)] hover:bg-[var(--chat-accentHover)] text-[var(--chat-messageSentText)]"
          >
            {updateGroupMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-[var(--chat-surface)] rounded-lg border border-[var(--chat-border)] p-6 space-y-6">
          <h2 className="text-lg font-semibold text-[var(--chat-text)]">
            Informations du groupe
          </h2>

          {/* Group Image */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={groupImagePreview || undefined} />
                <AvatarFallback className="bg-[var(--chat-primary)] text-[var(--chat-messageSentText)]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {groupImagePreview && (
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-[var(--chat-error)] text-white rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div>
              <Label htmlFor="group-image" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--chat-surface)] border border-[var(--chat-border)] rounded-lg hover:bg-[var(--chat-surfaceHover)] transition-colors">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Changer l'image</span>
                </div>
              </Label>
              <input
                id="group-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
            </div>
          </div>

          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Nom du groupe *</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Entrez le nom du groupe"
              maxLength={50}
              className="bg-[var(--chat-background)] border-[var(--chat-border)]"
            />
            <p className="text-xs text-[var(--chat-textMuted)]">
              {groupName.length}/50 caractères
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="De quoi parle ce groupe ?"
              maxLength={200}
              rows={3}
              className="bg-[var(--chat-background)] border-[var(--chat-border)]"
            />
            <p className="text-xs text-[var(--chat-textMuted)]">
              {description.length}/200 caractères
            </p>
          </div>

          {/* Private Group */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Groupe privé</Label>
              <p className="text-sm text-[var(--chat-textMuted)]">
                Seuls les membres invités peuvent rejoindre
              </p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          <div className="space-y-3 pt-4 border-t border-[var(--chat-border)]">
            <Label className="text-base font-semibold">Permissions</Label>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Lecture seule</Label>
                <p className="text-sm text-[var(--chat-textMuted)]">
                  Seul le propriétaire peut envoyer des messages
                </p>
              </div>
              <Switch checked={isReadOnly} onCheckedChange={setIsReadOnly} />
            </div>
            <div className="space-y-1">
              <Label>Qui peut envoyer des messages</Label>
              <select
                value={whoCanSend}
                onChange={(e) => setWhoCanSend(e.target.value)}
                className="w-full rounded-md border border-[var(--chat-border)] bg-[var(--chat-surface)] px-3 py-2 text-sm"
              >
                <option value="all">Tous les membres</option>
                <option value="admins">Administrateurs</option>
                <option value="owner">Propriétaire uniquement</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditGroupPage() {
  return (
    <ChatThemeProvider>
      <EditGroupContent />
    </ChatThemeProvider>
  );
}

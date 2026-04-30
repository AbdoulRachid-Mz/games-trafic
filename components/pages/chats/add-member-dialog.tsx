"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { searchUsersForGroup, addGroupMember } from "@/actions/groups";
import type { User } from "@/database/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/utils/chat-helpers";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";
import { useGroupMembers } from "@/hooks/use-groupes";
import { Badge } from "@/components/ui/badge";

interface AddMemberDialogProps {
  groupId: string;
  trigger?: React.ReactNode;
}

export function AddMemberDialog({ groupId, trigger }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: membersData } = useGroupMembers(groupId);
  const existingMemberIds = React.useMemo(() => {
    return new Set((membersData?.data || []).map(m => m.userId));
  }, [membersData]);

  useEffect(() => {
    async function fetchUsers() {
      if (debouncedSearch.length < 2) {
        setUsers([]);
        return;
      }
      setIsLoading(true);
      try {
        const results = await searchUsersForGroup(debouncedSearch);
        setUsers(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, [debouncedSearch]);

  const handleAddMember = async (userId: string) => {
    setAddingId(userId);
    try {
      await addGroupMember(groupId, userId, "MEMBER");
      toast.success("Membre ajouté avec succès");
      setOpen(false);
      setSearch("");
      queryClient.invalidateQueries({ queryKey: ["groupMembers", groupId] });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'ajout");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Ajouter un membre
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un membre au groupe</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--chat-textMuted)]" />
            <Input
              placeholder="Nom, @username, email ou téléphone..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[300px] rounded-md border p-2">
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--chat-primary)]" />
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 hover:bg-[var(--chat-surface)] rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImage || undefined} />
                        <AvatarFallback>{getInitials(user.fullName || user.username || 'utilisateur')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                          {user.fullName || user.username}
                          {existingMemberIds.has(user.id) && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">
                              Déjà membre
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-[var(--chat-textMuted)]">@{user.username}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddMember(user.id)}
                      disabled={addingId === user.id || existingMemberIds.has(user.id)}
                    >
                      {addingId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : search.length >= 2 ? (
              <p className="text-center text-sm text-[var(--chat-textMuted)] p-4">
                Aucun utilisateur trouvé
              </p>
            ) : (
              <p className="text-center text-sm text-[var(--chat-textMuted)] p-4">
                Tapez au moins 2 caractères pour rechercher
              </p>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

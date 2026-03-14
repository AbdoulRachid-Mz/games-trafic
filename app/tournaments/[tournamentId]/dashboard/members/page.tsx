"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MembersInfiniteList } from "@/components/pages/tournaments/tournament-detail/members-infinite-list";
// import { addTournamentMember } from "@/actions/tournanents";
import { getUsers, getUserByUsername } from "@/actions/users";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Mail,
  Phone,
  Users2,
} from "lucide-react";
import { toast } from "sonner";
import { addTournamentMember } from "@/actions/tournaments";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TournamentDashboardMembersPage() {
  const params = useParams();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);

  // Guest Form State
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [isCoOrganizer, setIsCoOrganizer] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [search]);

  const loadUsers = async () => {
    if (!search || search.length < 2) {
      setUsers([]);
      return;
    }
    const res = await getUsers({
      filters: { search: search },
      pagination: { page: 1, limit: 10 },
    } as any);
    setUsers(res.data || []);
  };

  const handleAddUser = async (username: string) => {
    startTransition(async () => {
      try {
        const u = await getUserByUsername(username);
        if (!u?.id) return;

        await addTournamentMember({
          tournamentId: params.tournamentId as string,
          userId: u.id,
          role: isCoOrganizer ? "ORGANIZER" : "PARTICIPANT",
          isCoOrganizer,
          displayName: u.username || u.fullName || undefined,
        } as any);

        setSearch("");
        setUsers([]);
        setIsUserDialogOpen(false);
        toast.success("Membre ajouté avec succès");
        router.refresh(); // Refresh list
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de l'ajout");
      }
    });
  };

  const handleAddGuest = async () => {
    if (!guestName.trim()) return;

    startTransition(async () => {
      try {
        await addTournamentMember({
          tournamentId: params.tournamentId as string,
          role: "PARTICIPANT",
          isCoOrganizer: false,
          displayName: guestName.trim(),
          contactEmail: guestEmail.trim() || undefined,
          contactPhone: guestPhone.trim() || undefined,
        } as any);

        setGuestName("");
        setGuestEmail("");
        setGuestPhone("");
        setIsGuestDialogOpen(false);
        toast.success("Invité ajouté avec succès");
        router.refresh(); // Refresh list
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de l'ajout de l'invité");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Membres</h2>
          <p className="text-muted-foreground text-sm">
            Gestion des participants et du staff
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dialog for adding users */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 h-auto py-3 px-4">
              <Users2 className="h-4 w-4" />
              Ajouter un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un utilisateur</DialogTitle>
              <DialogDescription>
                Rechercher un utilisateur existant sur la plateforme
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Username ou Email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant={isCoOrganizer ? "secondary" : "outline"}
                    onClick={() => setIsCoOrganizer((v) => !v)}
                    className="gap-2 shrink-0"
                    size="icon"
                    title={
                      isCoOrganizer
                        ? "Rôle: Co-organisateur"
                        : "Rôle: Participant"
                    }
                  >
                    <ShieldCheck
                      className={`h-4 w-4 ${isCoOrganizer
                        ? "text-primary fill-primary/20"
                        : "text-muted-foreground"
                        }`}
                    />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 min-h-[100px] max-h-[200px] overflow-y-auto border rounded-md p-2 bg-muted/20">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold shrink-0">
                        {u.username?.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="font-medium text-sm truncate">
                          @{u.username}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {u.fullName}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-2 h-8"
                      onClick={() => handleAddUser(u.username)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {search && users.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
                    Aucun utilisateur trouvé
                  </div>
                )}
                {!search && (
                  <div className="flex items-center justify-center h-20 text-muted-foreground text-sm italic">
                    Commencez à taper pour rechercher...
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog for adding guests */}
        <Dialog open={isGuestDialogOpen} onOpenChange={setIsGuestDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 h-auto py-3 px-4">
              <UserPlus className="h-4 w-4" />
              Ajouter un invité
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ajouter un invité</DialogTitle>
              <DialogDescription>
                Créer un membre temporaire (Guest)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom affiché (Requis)</Label>
                <Input
                  placeholder="Nom du guest"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Email (Optionnel)
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="email@example.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Téléphone (Optionnel)
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="+1234567890"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsGuestDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleAddGuest}
                disabled={isPending || !guestName.trim()}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Ajouter l'invité
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des membres</CardTitle>
        </CardHeader>
        <CardContent>
          <MembersInfiniteList
            tournamentId={params.tournamentId as string}
            isDashboard={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}

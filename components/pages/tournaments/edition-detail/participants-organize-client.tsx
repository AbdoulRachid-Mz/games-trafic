"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Loader2,
  Settings2,
  RefreshCcw,
  Users,
  ChevronRight,
  UserCheck,
  Link2,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { autoGenerateGuestParticipantsAction, linkGuestToUserAction } from "@/actions/members";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { searchUsersAction } from "@/actions/users"; // Assume this exists or I'll create it

interface ParticipantsOrganizeClientProps {
  tournamentId: string;
  editionId: string;
  participants: any[];
}

export function ParticipantsOrganizeClient({
  tournamentId,
  editionId,
  participants,
}: ParticipantsOrganizeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  // Generation parameters
  const [count, setCount] = useState(8);
  const [teamPrefix, setTeamPrefix] = useState("Team");
  const [playerPrefix, setPlayerPrefix] = useState("Joueur");

  // Linking state
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleAutoGenerate = () => {
    startTransition(async () => {
      try {
        const result = await autoGenerateGuestParticipantsAction(editionId, count, {
          teamPrefix,
          playerPrefix
        });
        
        if (result.success) {
          toast.success(`${result.count} participants générés avec succès.`);
          router.refresh();
        }
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la génération automatique.");
      }
    });
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchUsersAction(searchQuery);
      setSearchResults(results);
    } catch (error) {
      toast.error("Erreur lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  };

  const handleLinkUser = (userId: string) => {
    startTransition(async () => {
      try {
        const result = await linkGuestToUserAction(selectedGuest.member.id, userId);
        if (result.success) {
          toast.success("Utilisateur lié avec succès !");
          setSelectedGuest(null);
          router.refresh();
        }
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la liaison");
      }
    });
  };

  const guests = participants.filter(p => p.member?.metadata?.isGuest);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Generator */}
        <div className="space-y-6">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" /> Auto-Génération Guest
              </CardTitle>
              <CardDescription className="text-xs">
                Générez des participants fictifs (guests) pour l'édition.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nombre de participants</label>
                <Input 
                  type="number"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Préfixe Joueur</label>
                  <Input 
                    value={playerPrefix}
                    onChange={(e) => setPlayerPrefix(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Préfixe Équipe</label>
                  <Input 
                    value={teamPrefix}
                    onChange={(e) => setTeamPrefix(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-4 border-t bg-muted/30">
              <Button 
                className="w-full gap-2 font-bold" 
                onClick={handleAutoGenerate}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                Générer les Participants
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Users className="h-4 w-4" /> Résumé Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-2xl font-black text-primary">{participants.length}</div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Inscrits</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-amber-500">{guests.length}</div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Membres Guests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Guests List & Linking */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl">
            <CardHeader className="border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" /> Membres Guests à lier
              </CardTitle>
              <CardDescription className="text-xs">
                Liez vos membres "guest" à de vrais comptes utilisateurs de la plateforme.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {guests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-muted-foreground opacity-40">
                  <UserCheck className="h-12 w-12 mb-3" />
                  <p className="text-sm font-medium">Aucun membre guest trouvé</p>
                </div>
              ) : (
                <div className="divide-y">
                  {guests.map((participant) => (
                    <div key={participant.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {participant.member.displayName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{participant.member.displayName}</div>
                          <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] h-4">GUEST</Badge>
                            <span>CODE: {participant.member.metadata?.guestCode}</span>
                          </div>
                        </div>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 text-xs"
                            onClick={() => setSelectedGuest(participant)}
                          >
                            <Link2 className="h-3.5 w-3.5" /> Lier Utilisateur
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Lier un utilisateur</DialogTitle>
                            <DialogDescription>
                              Recherchez l'utilisateur à lier à <strong>{participant.member.displayName}</strong>.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="flex gap-2">
                              <Input 
                                placeholder="Email, nom d'utilisateur..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                              />
                              <Button size="icon" onClick={handleSearchUsers} disabled={isSearching}>
                                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                              </Button>
                            </div>
                            
                            <div className="max-h-[200px] overflow-y-auto space-y-2">
                              {searchResults.length === 0 && searchQuery && !isSearching && (
                                <p className="text-center py-4 text-xs text-muted-foreground">Aucun utilisateur trouvé.</p>
                              )}
                              {searchResults.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-muted overflow-hidden">
                                      {user.image && <img src={user.image} alt="" className="h-full w-full object-cover" />}
                                    </div>
                                    <div className="text-xs">
                                      <div className="font-bold">{user.username || user.fullName}</div>
                                      <div className="text-muted-foreground">{user.email}</div>
                                    </div>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    className="h-7 text-[10px]"
                                    onClick={() => handleLinkUser(user.id)}
                                    disabled={isPending}
                                  >
                                    Lier
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Typography } from "@/components/ui/typography";
import { Calendar, Mail, MapPin, Phone } from "lucide-react";
import { CardContent, Card } from "@/components/ui/card";
import { User } from "@/database/schema";
import { Tabs2 } from "@/components/ui/tabs-2";

interface Props {
  profileUser: User;
  isOwnProfile: boolean;
}

export function ProfileTabs({ profileUser, isOwnProfile }: Props) {
  const tabs = [
    {
      title: "About",
      value: "A propos",
      content: (
        <Card className=" bg-gradient-to-br from-purple-700 to-violet-900 rounded-md">
          <CardContent className="p-4 space-y-4">
            <Typography variant="h4">Informations personnelles</Typography>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Typography variant="body-sm" theme="muted">
                  Nom d'utilisateur
                </Typography>
                <Typography variant="body-base">
                  @{profileUser.username}
                </Typography>
              </div>

              <div className="space-y-2">
                <Typography variant="body-sm" theme="muted">
                  Email
                </Typography>
                <Typography
                  variant="body-base"
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {profileUser.email}
                </Typography>
              </div>

              {profileUser.phoneNumber && (
                <div className="space-y-2">
                  <Typography variant="body-sm" theme="muted">
                    Téléphone
                  </Typography>
                  <Typography
                    variant="body-base"
                    className="flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    {profileUser.phoneNumber}
                  </Typography>
                </div>
              )}

              {profileUser.country && (
                <div className="space-y-2">
                  <Typography variant="body-sm" theme="muted">
                    Localisation
                  </Typography>
                  <Typography
                    variant="body-base"
                    className="flex items-center gap-2"
                  >
                    <MapPin className="w-4 h-4" />
                    {profileUser.country}
                  </Typography>
                </div>
              )}

              <div className="space-y-2">
                <Typography variant="body-sm" theme="muted">
                  Dernière connexion
                </Typography>
                <Typography
                  variant="body-base"
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  {profileUser.lastLogin
                    ? new Date(profileUser.lastLogin).toLocaleDateString(
                        "fr-FR"
                      )
                    : "Jamais"}
                </Typography>
              </div>

              <div className="space-y-2">
                <Typography variant="body-sm" theme="muted">
                  Membre depuis
                </Typography>
                <Typography
                  variant="body-base"
                  className="flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  {new Date(profileUser.createdAt).toLocaleDateString("fr-FR")}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      title: "Followers",
      value: "abonnes",
      content: (
        <Card className=" bg-gradient-to-br from-purple-700 to-violet-900 rounded-md">
          <CardContent className="p-4">
            <Typography
              variant="h4"
              className="text-center text-muted-foreground"
            >
              {isOwnProfile
                ? "Vos abonnés"
                : `Abonnés de ${profileUser.username}`}
            </Typography>
            {/* Ici vous ajouterez la liste des abonnés avec les données réelles */}
          </CardContent>
        </Card>
      ),
    },
    {
      title: "Following",
      value: "suivis",
      content: (
        <Card className=" bg-gradient-to-br from-purple-700 to-violet-900 rounded-md">
          <CardContent className="p-4">
            <Typography
              variant="h4"
              className="text-center text-muted-foreground"
            >
              {isOwnProfile
                ? "Vos abonnements"
                : `Abonnements de ${profileUser.username}`}
            </Typography>
            {/* Ici vous ajouterez la liste des abonnements avec les données réelles */}
          </CardContent>
        </Card>
      ),
    },
    {
      title: "Posts",
      value: "publications",
      content: (
        <Card className=" bg-gradient-to-br from-purple-700 to-violet-900 rounded-md">
          <CardContent className="p-4">
            <Typography
              variant="h4"
              className="text-center text-muted-foreground"
            >
              Publications de {isOwnProfile ? "vous" : profileUser.username}
            </Typography>
            {/* Ici vous ajouterez la liste des publications avec les données réelles */}
          </CardContent>
        </Card>
      ),
    },
    {
      title: "Tournaments",
      value: "tournois",
      content: (
        <Card className=" bg-gradient-to-br from-purple-700 to-violet-900 rounded-md">
          <CardContent className="p-4">
            <Typography
              variant="h4"
              className="text-center text-muted-foreground"
            >
              Tournois de {isOwnProfile ? "vous" : profileUser.username}
            </Typography>
            {/* Ici vous ajouterez la liste des tournois avec les données réelles */}
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <div className="[perspective:1000px] relative b flex flex-col max-w-5xl mx-auto w-full items-start justify-start mb-10 md:mb-20 lg:mb-26">
      <Tabs2  containerClassName="text-white" tabs={tabs} />
    </div>
  );
}

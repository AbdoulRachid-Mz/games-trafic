"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AutoSyncField } from "@/components/shared/auto-sync-field";
import { CountrySelect } from "@/components/shared/country-select";
import { PhoneInput } from "@/components/shared/phone-input";
import { updateUser } from "@/actions/users";
import { toast } from "sonner";
import type { UserWithAllRelations } from "@/actions/users";
import { countries, getDefaultCountry } from "@/lib/countries";

interface PersonalInfoFormProps {
  user: UserWithAllRelations;
  onUpdate: () => void;
}

export function PersonalInfoForm({ user, onUpdate }: PersonalInfoFormProps) {
  const handleUpdate = async (field: string, value: any) => {
    try {
      await updateUser(user.id, { [field]: value });
      toast.success("Informations mises à jour");
      onUpdate();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
      throw error;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations personnelles</CardTitle>
        <CardDescription>
          Gérez vos informations publiques
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <AutoSyncField
          label="Nom complet"
          value={user.fullName || ""}
          onChange={(value) => handleUpdate("fullName", value)}
          placeholder="Votre nom complet"
          mode="manual"
          debounceMs={1000}
        />

        <AutoSyncField
          label="Nom d'utilisateur"
          value={user.username || ""}
          onChange={(value) => handleUpdate("username", value)}
          placeholder="@username"
          mode="manual"
          validate={(value) => {
            if (value.length < 3) return "Minimum 3 caractères";
            if (!/^[a-zA-Z0-9_]+$/.test(value)) {
              return "Lettres, chiffres et _ uniquement";
            }
          }}
        />

        <AutoSyncField
          label="Bio"
          value={user.bio || ""}
          onChange={(value) => handleUpdate("bio", value)}
          type="textarea"
          placeholder="Parlez-nous de vous..."
          mode="manual"
          debounceMs={1500}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Country Select */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pays</label>
            <CountrySelect
              value={user.country || undefined}
              onChange={(value) => handleUpdate("country", value)}
              className="w-full"
            />
          </div>

          {/* Phone Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Téléphone</label>
            <PhoneInput
              value={user.phoneNumber || ""}
              onChange={(value) => handleUpdate("phoneNumber", value)}
              defaultCountryCode={
                user.country 
                  ? countries.find(c => c.name === user.country)?.code 
                  : "NE"
              }
            />
          </div>
        </div>

        <AutoSyncField
          label="Site web"
          value={user.website || ""}
          onChange={(value) => handleUpdate("website", value)}
          placeholder="https://example.com"
          mode="manual"
          debounceMs={1000}
          validate={(value) => {
            if (value && !value.startsWith("http")) {
              return "L'URL doit commencer par http:// ou https://";
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
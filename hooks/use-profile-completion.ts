import { useMemo } from "react";
import type { UserWithAllRelations } from "@/actions/users";

export function useProfileCompletion(user: UserWithAllRelations | null) {
  return useMemo(() => {
    if (!user) return 0;

    const fields = [
      { key: "fullName", weight: 15 },
      { key: "bio", weight: 10 },
      { key: "image", weight: 15 },
      { key: "coverImage", weight: 15 },
      { key: "website", weight: 5 },
      { key: "socialMedia", weight: 10, validator: (v: any) => v && v.length > 0 },
      { key: "country", weight: 10 },
      { key: "phoneNumber", weight: 10 },
      { key: "emailVerified", weight: 10 },
    ];

    const totalWeight = fields.reduce((acc, f) => acc + f.weight, 0);
    let completedWeight = 0;

    for (const field of fields) {
      const value = user[field.key as keyof UserWithAllRelations];
      const isValid = field.validator ? field.validator(value) : !!value;

      if (isValid) {
        completedWeight += field.weight;
      }
    }

    return Math.round((completedWeight / totalWeight) * 100);
  }, [user]);
}
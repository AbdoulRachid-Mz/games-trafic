import type { UserWithAllRelations } from "@/actions/users";

export function calculateProfileCompletion(user: UserWithAllRelations | null): number {
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
}

export function getProfileCompletionMessage(percentage: number): string {
  if (percentage === 100) return "Profil complet ! 🎉";
  if (percentage >= 75) return "Plus que quelques informations !";
  if (percentage >= 50) return "Bon début, continuez !";
  if (percentage >= 25) return "Commençons à remplir votre profil";
  return "Complétez votre profil pour apparaître dans les recherches";
}
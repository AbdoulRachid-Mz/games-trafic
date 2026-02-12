import { Suspense } from "react";
import { ClientGameClipsContent, ClientGameClipsContentSkeleton } from "./client-page";

// mise en cache
export const revalidate = 60; // 1 minute`

// generate metadata
export const metadata = {
  title: "Clips de Jeu",
  description: "Regardez et partagez des clips de vos jeux préférés",
  keywords: ["clips de jeu", "jeux", "partage", "regarder"],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Clips de Jeu",
    description: "Regardez et partagez des clips de vos jeux préférés",
    images: [
      {
        url: "https://gt-v3.vercel.app/api/og?title=Clips%20de%20Jeu",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clips de Jeu",
    description: "Regardez et partagez des clips de vos jeux préférés",
    images: [
      "https://gt-v3.vercel.app/api/og?title=Clips%20de%20Jeu",
    ],
  },
};

export default function GameClipsPage() {
  return (
    <Suspense fallback={
      <ClientGameClipsContentSkeleton />
    }>
      <ClientGameClipsContent />
    </Suspense>
  );
}
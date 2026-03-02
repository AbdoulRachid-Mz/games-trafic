import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil - Games-Trafics",
  description: "Gérez votre profil et votre communauté",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
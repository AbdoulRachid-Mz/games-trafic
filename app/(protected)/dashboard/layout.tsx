import { DashboardShell } from "./dashboard-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      user={{
        username: "Utilisateur", // Placeholder, updated by client
        profileImage: "/images/avatar.png",
        level: "C",
      }}
    >
      {children}
    </DashboardShell>
  );
}

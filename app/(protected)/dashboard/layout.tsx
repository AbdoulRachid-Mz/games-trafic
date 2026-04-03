"use client";

import { useAuthContext } from "@/contexts/auth-context";
import { DashboardShell } from "./dashboard-shell";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuthContext();
  const router = useRouter();
  if (!user) {
    router.push("/unauthorized?redirectTo=/sign-in&msg=Vous n'avez pas la permission d'accéder à cette page");
    return null;
  }
  return <DashboardShell>{children}</DashboardShell>;
}

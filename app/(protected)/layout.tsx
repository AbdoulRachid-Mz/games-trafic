import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import React from "react";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();

  if (!session?.id) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}

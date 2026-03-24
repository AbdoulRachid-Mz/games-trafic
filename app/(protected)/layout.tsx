import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import React from "react";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

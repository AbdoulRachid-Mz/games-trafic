// components/auth/sign-out-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

interface SignOutButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function SignOutButton({ children, className = "" }: SignOutButtonProps) {
  // const { signOut } = useAuth();
  const signOut = authClient.signOut;
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Déconnexion réussie");
      router.push("/");
    } catch (error: any) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  return (
    <button onClick={handleSignOut} className={className}>
      {children}
    </button>
  );
}
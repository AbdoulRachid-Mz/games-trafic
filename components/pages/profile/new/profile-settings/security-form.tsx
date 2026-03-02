"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Key, Mail, Lock } from "lucide-react";
import type { UserWithAllRelations } from "@/actions/users";
import { ChangePasswordDialog } from "@/components/auth/change-password-dialog";
import { authMethods } from "@/lib/auth/client";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PasskeyManagement } from "../../passkey-management";

interface SecurityFormProps {
  user: UserWithAllRelations;
}

export function SecurityForm({ user }: SecurityFormProps) {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);

  const handleSendVerificationEmail = async () => {
    setIsSendingVerification(true);
    try {
      const { error } = await authMethods.sendVerificationEmail(user.email);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Email de vérification envoyé");
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setIsSendingVerification(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Adresse email
          </CardTitle>
          <CardDescription>
            Votre adresse email est utilisée pour vous connecter
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-medium">{user.email}</p>
            {user.emailVerified ? (
              <p className="text-sm text-green-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                Vérifié
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-yellow-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" />
                  Non vérifié
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={handleSendVerificationEmail}
                  disabled={isSendingVerification}
                >
                  {isSendingVerification ? "Envoi en cours..." : "Renvoyer l'email de vérification"}
                </Button>
              </div>
            )}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                Changer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Changer d'adresse email</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette fonctionnalité sera bientôt disponible. Pour l'instant, contactez le support.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Fermer</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      {/* Mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Mot de passe
          </CardTitle>
          <CardDescription>
            Changez votre mot de passe régulièrement pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordDialog
            open={isChangePasswordOpen}
            onOpenChange={setIsChangePasswordOpen}
          >
            <Button variant="outline">
              Changer le mot de passe
            </Button>
          </ChangePasswordDialog>
        </CardContent>
      </Card>

      {/* Passkeys */}
      <PasskeyManagement />
    </div>
  );
}
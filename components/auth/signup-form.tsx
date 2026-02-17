"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Image from "next/image";

// Schéma Zod pour la validation
const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Le nom d'utilisateur doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    phoneNumber: z.string().optional(),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation avec Zod
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      setError(result.error.issues[0].message);
      setLoading(false);
      return;
    }

    const { data, error } = await authClient.signUp.email(
      {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        callbackURL: "/callback",
      },
      {
        onRequest: () => {
          setLoading(true);
        },
        onSuccess: () => {
          // redirect handled by callbackURL
          toast.success("Inscription réussie ! Bienvenue sur Games-Trafics.");
        },
        onError: (ctx) => {
          setError(ctx.error.message || "Erreur lors de l'inscription");
          setLoading(false);
        },
      }
    );
  };

  const handleSocialSignIn = async (
    provider: "google" | "facebook" | "tiktok"
  ) => {
    setError("");
    await authClient.signIn.social({
      provider,
      callbackURL: "/callback",
      errorCallbackURL: "/error",
      newUserCallbackURL: "/welcome",
    });
  };

  return (
    <>
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            <form className="p-6 md:p-8" onSubmit={handleSubmit}>
              <FieldGroup>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Créez votre compte</h1>
                  <p className="text-muted-foreground text-sm text-balance">
                    Rejoignez la communauté Games-Trafics
                  </p>
                </div>

                {error && (
                  <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                    {error}
                  </div>
                )}

                <Field>
                  <FieldLabel htmlFor="name">Nom d'utilisateur</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Votre nom d'utilisateur"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <FieldDescription>
                    Nous utiliserons cet email pour vous contacter. Nous ne
                    partagerons jamais votre email.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="phoneNumber">
                    Numéro de téléphone (optionnel)
                  </FieldLabel>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="+33 1 23 45 67 89"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </Field>

                <Field>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="confirmPassword">
                        Confirmer le mot de passe
                      </FieldLabel>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </Field>
                  </div>
                  <FieldDescription>
                    Le mot de passe doit contenir au moins 8 caractères.
                  </FieldDescription>
                </Field>

                <Field>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Inscription..." : "Créer un compte"}
                  </Button>
                </Field>

                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                  Ou s'inscrire avec
                </FieldSeparator>

                <Field className="grid grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => handleSocialSignIn("google")}
                    disabled={loading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                      <path
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                        fill="currentColor"
                      />
                    </svg>
                    <span className="sr-only">S'inscrire avec Google</span>
                  </Button>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => handleSocialSignIn("facebook")}
                    disabled={loading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="sr-only">S'inscrire avec Facebook</span>
                  </Button>

                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => handleSocialSignIn("tiktok")}
                    disabled={loading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                    <span className="sr-only">S'inscrire avec TikTok</span>
                  </Button>
                </Field>

                <FieldDescription className="text-center">
                  Vous avez déjà un compte ?{" "}
                  <a href="/sign-in" className="underline">
                    Se connecter
                  </a>
                </FieldDescription>
              </FieldGroup>
            </form>

            <div className="bg-muted relative relative hidden md:block">
              <Image
                src="/images/icons/pages/auth/sign-up.jpg"
                fill
                alt="Rejoignez Games-Trafics"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </CardContent>
        </Card>

        <FieldDescription className="px-6 text-center">
          En cliquant sur continuer, vous acceptez nos{" "}
          <a href="/terms" className="underline">
            Conditions d'utilisation
          </a>{" "}
          et notre{" "}
          <a href="/privacy" className="underline">
            Politique de confidentialité
          </a>
          .
        </FieldDescription>
      </div>
    </>
  );
}

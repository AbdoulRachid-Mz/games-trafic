import type { Metadata } from "next";
import { roboto, montserrat } from "./fonts";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import QueryProvider from "@/providers/query-provider";
import TrackingProviders from "@/providers/tracking-provider";
import PWAProvider from "../providers/pwa-provider";
import { AppProvider } from "@/contexts/app-context";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/providers/theme-provider";
import { DisableSWInDev } from "@/components/pwa/disable-sw-in-dev";
import { Toaster } from "sonner";
import { getAppUrlEnv } from "@/utils/app-url";
import { ExplanationManager } from "@/components/onboarding/explanation-manager";

export const metadata: Metadata = {
  title: {
    default: "Games-Trafics — Joue, échange, domine",
    template: "%s | Games-Trafics",
  },
  description:
    "Games-Trafics — Joue, échange, domine. La plateforme tout-en-un de tournois esport, marketplace de comptes & produits gaming et communauté.",
  metadataBase: new URL(
    getAppUrlEnv(),
  ),
  icons: {
    icon: "/icons/gt-primary.png",
  },
  viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${roboto.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <body
        className={`${roboto.variable} ${montserrat.variable} antialiased`}
      >
        <Toaster />
        <DisableSWInDev />
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <PWAProvider>
                <TrackingProviders>
                  <ExplanationManager />
                  <AppProvider>
                    <AppShell>{children}</AppShell>
                  </AppProvider>
                </TrackingProviders>
              </PWAProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

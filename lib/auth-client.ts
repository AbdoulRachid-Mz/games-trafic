import { anonymousClient, adminClient, lastLoginMethodClient, oneTapClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client"
import { createAuthClient } from "better-auth/react";
import { getAppUrlEnv } from "@/utils/app-url";

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: getAppUrlEnv(),
  plugins: [
    anonymousClient(),
    adminClient(),
    lastLoginMethodClient(),
    passkeyClient(),
    oneTapClient({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!, // Votre Google Client ID
      autoSelect: false,
      cancelOnTapOutside: true,
      context: "signin",
    })
  ]
})

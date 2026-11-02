// @/lib/auth-client.ts
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
      clientId: process.env.GOOGLE_CLIENT_ID!, // Votre Google Client ID
      autoSelect: false,
      cancelOnTapOutside: true,
      context: "signin",
      promptOptions: {
				baseDelay: 1000, // Base delay in ms (default: 1000)
				maxAttempts: 5 // Maximum number of attempts before triggering onPromptNotification (default: 5)
			}
    })
  ]
})

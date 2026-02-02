import { anonymousClient, adminClient, lastLoginMethodClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: process.env.NEXTAUTH_URL || "http://localhost:3000",
     plugins: [
        anonymousClient(),
        adminClient(),
        lastLoginMethodClient(),
        passkeyClient()
    ]
})

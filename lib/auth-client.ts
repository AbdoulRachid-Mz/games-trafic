import { anonymousClient, adminClient, lastLoginMethodClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";
import { getAppUrlEnv } from "@/utils/app-url";
// console.log(getAppUrlEnv());
export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: getAppUrlEnv(),
     plugins: [
        anonymousClient(),
        adminClient(),
        lastLoginMethodClient(),
        passkeyClient()
    ]
})

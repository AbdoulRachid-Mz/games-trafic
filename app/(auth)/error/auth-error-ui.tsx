// auth-error-ui.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { AuthErrorHandler } from "@/lib/auth/errors";

export default function AuthErrorUI() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const message = searchParams.get("message");

    const text =
        message ??
        AuthErrorHandler.handleAuthError(error, {
            operation: "auth",
            timestamp: new Date(),
        }).message;

    return <p>{text}</p>;
}

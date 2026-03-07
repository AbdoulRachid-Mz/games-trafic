"use client";

import { authClient } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { XIcon } from "../icons/x";
// import { XIcon } from "../icons/x";

export default function OnTapPopup() {
  const { resolvedTheme } = useTheme();
  const { data: session } = authClient.useSession();
  const buttonRef = useRef<HTMLDivElement>(null);

  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Prevent hydration mismatch (next-themes fix)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load visibility from sessionStorage
  useEffect(() => {
    if (!isMounted) return;

    const stored = sessionStorage.getItem("onTapPopupVisible");
    if (stored !== null) {
      setIsVisible(JSON.parse(stored));
    }

  }, [isMounted]);

  // Persist visibility
  useEffect(() => {
    if (!isMounted) return;
    sessionStorage.setItem("onTapPopupVisible", JSON.stringify(isVisible));
  }, [isVisible, isMounted]);

  // Initialize One Tap
  useEffect(() => {
    if (!isMounted) return;
    if (session?.user) return;

    const initOneTap = async () => {
      setIsLoading(true);
      try {
        await authClient.oneTap({
          button: {
            container: buttonRef.current!,
            config: {
              theme:
                resolvedTheme === "dark"
                  ? "filled_black"
                  : "outline",
              size: "large",
              type: "standard",
              text: "signin_with",
            },
          },
        });
      } catch (error) {
        console.error("One Tap init error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initOneTap();

  }, [resolvedTheme, session, isMounted]);

  // Do not render if logged in or not mounted
  if (!isMounted || session?.user) return null;

  return (
    <div
      className={`fixed top-20 right-3 z-100 w-[260px] rounded-lg border border-primary bg-background shadow-lg transition-transform duration-300 ${isVisible ? "" : ""
        }`}
    >
      <div className="relative">

        {/* Close button */}
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 z-10 text-primary hover:opacity-70"
        > <XIcon size={16} /> </button>

        {/* Loader overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <div className="p-1">
          <div ref={buttonRef} />
        </div>
      </div>
    </div>
  );
}

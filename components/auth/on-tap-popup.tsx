"use client";

import { authClient } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { XIcon } from "../icons/x";
import { useNetworkStatus } from "@/hooks/network-status";
import { useAuthContext } from "@/contexts/auth-context";
// import { XIcon } from "../icons/x";

export default function OnTapPopup() {
  const { resolvedTheme } = useTheme();
  const { user: session } = useAuthContext();
  const buttonRef = useRef<HTMLDivElement>(null);
  const { isOnline } = useNetworkStatus();

  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Prevent hydration mismatch (next-themes fix)
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Load visibility from sessionStorage
  useEffect(() => {
    if (!isMounted || !isOnline) return;
    
    const stored = sessionStorage.getItem("onTapPopupVisible");
    if (stored !== null) {
      setIsVisible(JSON.parse(stored));
    }
    
  }, [isMounted, isOnline]);
  
  // Persist visibility
  useEffect(() => {
    if (!isMounted || !isOnline) return;
    sessionStorage.setItem("onTapPopupVisible", JSON.stringify(isVisible));
  }, [isVisible, isMounted, isOnline]);
  
  // Initialize One Tap
  useEffect(() => {
    if (!isMounted || !isOnline) return;
    if (session) return;
    
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

  }, [resolvedTheme, session, isMounted, isOnline]);

  // Do not render if logged in or not mounted
  if (!isMounted || session || !isOnline) return null;

  return (
    <div
      className={`fixed top-20 right-3 z-100 w-[260px] rounded-lg border border-primary bg-background shadow-lg transition-transform duration-300 ${isVisible ? "" : "hidden"
        }`}
    >
      <div className="relative">

        {/* Close button */}
        <XIcon size={16} className="absolute top-2 right-2 z-10 text-primary hover:opacity-70" onClick={() => setIsVisible(false)} /> 
          

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

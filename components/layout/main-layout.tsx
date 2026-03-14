"use client";

import type React from "react";
import { Suspense, useState, useCallback } from "react";
import Footer from "./footer";
import { LeftBar } from "./left-bar";
import { RightBar } from "./right-bar";
import TopMiddle from "./top-middle";
import { cn } from "@/lib/utils";
import { FloatingActionButton } from "./FloatingActionButton";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AIAssistant } from "../shared/chatbot-assistant";
import type { NavItem, FabAction } from "@/types/routes";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { QrTransaction } from "@/components/transactions/qr-transaction";
import OnTapPopup from "../auth/on-tap-popup";

interface MainLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: boolean;
  footer?: boolean;
  topMiddle?: boolean;
  leftBar?: boolean;
  rightBar?: boolean;
  navigationLinks?: boolean;
  floatingActions?: FabAction[];
  floatingActiveActionId?: string;
  maintenanceMode?: boolean;
  hideTopMiddleOnScroll?: boolean;
  showAIAssistant?: boolean;
  breadcrumbItems?: Array<{ name: string; path: string }>;
  floatingDockLinks?: NavItem[];
  shouldExcludeContainer?: boolean;
  showOnTap?: boolean;
}

export function MainLayout({
  children,
  navigationLinks = true,
  footer = true,
  topMiddle = true,
  leftBar = true,
  rightBar = false,
  breadcrumbs = true,
  floatingActions = [],
  floatingActiveActionId,
  maintenanceMode = false,
  hideTopMiddleOnScroll = false,
  showAIAssistant = true,
  showOnTap = false,
  breadcrumbItems = [],
  floatingDockLinks = [],
  shouldExcludeContainer = false,
}: MainLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const topPadding =
    topMiddle && !shouldExcludeContainer && breadcrumbs
      ? "pt-20"
      : "";

  const closeLeft = useCallback(() => setLeftOpen(false), []);
  const closeRight = useCallback(() => setRightOpen(false), []);

  return (
    <div className="relative min-h-screen bg-background">

      {/* Show on tap popup */}
      {showOnTap && <OnTapPopup />}

      {/* Top bar */}
      {(topMiddle && !shouldExcludeContainer) && (
        <TopMiddle
          onToggleSidebar={() => setLeftOpen((v) => !v)}
          onToggleRightBar={() => setRightOpen((v) => !v)}
          withLeft={leftBar}
          navigationLinks={navigationLinks}
          isSideBarOpen={leftOpen}
          isRightBarOpen={rightOpen}
          hideOnScroll={hideTopMiddleOnScroll}
          breadcrumbItems={breadcrumbs ? breadcrumbItems : undefined}
        />
      )}

      {/* LEFT BAR — toujours Sheet */}
      {leftBar && !shouldExcludeContainer && (
        <Sheet open={leftOpen} onOpenChange={setLeftOpen}>
          <SheetTitle className="hidden" />
          <SheetContent side="left" className="w-80 p-0 border-r bg-background">
            <LeftBar
              isOpen={leftOpen}
              onClose={closeLeft}
              requireAuth={false}
              isUserOwnerPage={false}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* RIGHT BAR — toujours Sheet */}
      {rightBar && !shouldExcludeContainer && (
        <Sheet open={rightOpen} onOpenChange={setRightOpen}>
          <SheetContent
            side="right"
            className="w-80 p-0 border-l bg-background"
          >
            <RightBar isRightOpen={rightOpen} onClose={closeRight} />
          </SheetContent>
        </Sheet>
      )}

      {/* MAIN CONTENT */}

      <main className={cn("min-h-screen", topPadding)}>
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            </div>
          }
        >
          <div
            className={cn(
              "mx-auto px-3 lg:px-4",
              shouldExcludeContainer ? "py-4" : "py-2"
            )}
          >
            {maintenanceMode ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
                <h2 className="mb-2 text-2xl font-bold">Mode maintenance</h2>
                <p className="text-muted-foreground">
                  Veuillez réessayer plus tard.
                </p>
              </div>
            ) : (
              children
            )}
          </div>
        </Suspense>

        {footer && !shouldExcludeContainer && <Footer />}
      </main>


      {/* Floating Action Button avec dock */}
      {!shouldExcludeContainer && (floatingActions.length > 0 || floatingDockLinks.length > 0) && (
        <FloatingActionButton
          actions={floatingActions.map((a) =>
            a.id === "qr-scanner"
              ? { ...a, action: () => setQrOpen(true) }
              : a
          )}
          activeActionId={floatingActiveActionId}
          isFixed={true}
          navItems={floatingDockLinks}
        />
      )}

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="sm:max-w-2xl bg-background/95 backdrop-blur-2xl border-border/50 rounded-[2rem] p-0 overflow-hidden">
          <div className="p-6">
            <QrTransaction />
          </div>
        </DialogContent>
      </Dialog>

      {/* AI assistant */}
      {/* {!shouldExcludeContainer && showAIAssistant && <AIAssistant />} */}
    </div>
  );
}

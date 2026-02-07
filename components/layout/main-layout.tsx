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
}

export function MainLayout({
  children,
  navigationLinks = true,
  footer = true,
  topMiddle = true,
  leftBar = true,
  rightBar = false,
  floatingActions = [],
  floatingActiveActionId,
  maintenanceMode = false,
  hideTopMiddleOnScroll = false,
  showAIAssistant = true,
  breadcrumbItems = [],
  floatingDockLinks = [],
  shouldExcludeContainer = false,
}: MainLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const closeLeft = useCallback(() => setLeftOpen(false), []);
  const closeRight = useCallback(() => setRightOpen(false), []);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Top bar */}
      {topMiddle && !shouldExcludeContainer && (
        <TopMiddle
          onToggleSidebar={() => setLeftOpen((v) => !v)}
          onToggleRightBar={() => setRightOpen((v) => !v)}
          withLeft={leftBar}
          navigationLinks={navigationLinks}
          isSideBarOpen={leftOpen}
          isRightBarOpen={rightOpen}
          hideOnScroll={hideTopMiddleOnScroll}
          breadcrumbItems={breadcrumbItems}
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
      <main className={cn("min-h-screen", topMiddle && "pt-16")}>
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            </div>
          }
        >
          <div
            className={`${!shouldExcludeContainer && "container mx-auto px-4 lg:px-6 py-6"} ${topMiddle && "pt-16"}`}
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
      {!shouldExcludeContainer && (
        <FloatingActionButton
          actions={floatingActions}
          activeActionId={floatingActiveActionId}
          isFixed={true}
          navItems={floatingDockLinks}
        />
      )}

      {/* AI assistant */}
      {showAIAssistant && <AIAssistant />}
    </div>
  );
}
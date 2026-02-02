"use client";

import { ChatProvider } from "@/contexts/chat-context";
import { ViewTransition } from "react";

interface ChatsLayoutProps {
  children: React.ReactNode;
}



export default function ChatsLayout({ children }: ChatsLayoutProps) {
  return (
    // <ViewTransition >
      <ChatProvider>{children}</ChatProvider>
    // </ViewTransition>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Book, FileText, Lock, Shield, Database } from "lucide-react";

interface DocsSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    title: string;
    items: {
      title: string;
      href: string;
      icon?: React.ComponentType<{ className?: string }>;
    }[];
  }[];
}

export function DocsSidebar({ className, items, ...props }: DocsSidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("pb-12 h-screen border-r", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="mb-2 px-4 text-lg font-semibold tracking-tight text-primary flex items-center gap-2">
            <Book className="h-5 w-5" />
            Documentation
          </div>
          <div className="space-y-1">
            {items.map((section, i) => (
              <div key={i} className="py-2">
                <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-tight text-muted-foreground">
                  {section.title}
                </h2>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Button
                      key={item.href}
                      variant={pathname === item.href ? "secondary" : "ghost"}
                      size="sm"
                      className="w-full justify-start font-normal"
                      asChild
                    >
                      <Link href={item.href}>
                        {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                        {item.title}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export const defaultDocsNav = [
  {
    title: "Legal",
    items: [
      {
        title: "Privacy Policy",
        href: "/docs/legal/privacy",
        icon: Lock,
      },
      {
        title: "Terms of Service",
        href: "/docs/legal/terms",
        icon: FileText,
      },
    ],
  },
  {
    title: "Guides",
    items: [
      {
        title: "All Guides",
        href: "/docs/guides",
        icon: Book,
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        title: "Database Schema",
        href: "/docs/schema",
        icon: Database,
      },
    ],
  },
];

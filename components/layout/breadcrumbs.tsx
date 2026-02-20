"use client";

import React from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTE_CONFIG } from "@/config/routes-config";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useScreenSize } from "@/hooks/use-screen";

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

// Resolves breadcrumb segments by matching against ROUTE_CONFIG
function resolveBreadcrumbSegments(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const resolved: BreadcrumbItem[] = [];

  // Always start with home
  resolved.push({ name: "Accueil", path: "/" });

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    // Replace dynamic segments ([...]) with actual values from pathname
    const dynamicPath = currentPath.replace(/\[(.*?)\]/g, () => segment);
    const config = ROUTE_CONFIG.find((r) => {
      const paths = Array.isArray(r.path) ? r.path : [r.path];
      return paths.some((p) => dynamicPath.startsWith(p.replace(/\[(.*?)\]/g, segment)));
    });

    if (config && config.name) {
      resolved.push({ name: config.name, path: currentPath });
    } else {
      // Fallback: humanize segment
      const name = segment.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      resolved.push({ name, path: currentPath });
    }
  }

  return resolved;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const pathname = usePathname();
  const { isMobile } = useScreenSize(); // Hook to detect mobile screens
  const breadcrumbItems = items || resolveBreadcrumbSegments(pathname);

  const depth = breadcrumbItems.length;
  const first = breadcrumbItems[0];
  const last = breadcrumbItems[depth - 1];
  const second = breadcrumbItems[1];
  const middle = breadcrumbItems.slice(2, depth - 1);

  // Determine max visible depth: 3 for mobile, unlimited for larger screens
  const maxVisibleDepth = isMobile ? 3 : Infinity;

  return (
    <Breadcrumb className={cn("py-1", className)}>
      <BreadcrumbList>
        {first && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={first.path}>
                  <span className="inline-flex items-center gap-1">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    {first.name}
                  </span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {depth > 1 && <BreadcrumbSeparator />}
          </>
        )}

        {depth <= maxVisibleDepth ? (
          <>
            {breadcrumbItems.slice(1, depth - 1).map((item) => (
              <React.Fragment key={item.path}>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={item.path}>{item.name}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </React.Fragment>
            ))}
            {last && (
              <BreadcrumbItem>
                <BreadcrumbPage>{last.name}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </>
        ) : (
          <>
            {second && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href={second.path}>{second.name}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button">
                    <BreadcrumbEllipsis />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {middle.map((item) => (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link href={item.path}>{item.name}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {last && (
              <BreadcrumbItem>
                <BreadcrumbPage>{last.name}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

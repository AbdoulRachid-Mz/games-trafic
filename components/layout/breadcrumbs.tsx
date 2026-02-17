"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ROUTE_CONFIG } from "@/config/routes-config";
import { usePathname } from "next/navigation";

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
  const breadcrumbItems = items || resolveBreadcrumbSegments(pathname);

  return (
    <nav className={cn("py-1", className)} aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 overflow-x-auto">
        {breadcrumbItems.map((item, index) => (
          <motion.li
            key={item.path}
            className="flex items-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {index === 0 ? (
              <Link href={item.path}>
                <div className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <Typography variant="caption1" theme="muted">
                    {item.name}
                  </Typography>
                </div>
              </Link>
            ) : (
              <>
                <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                {index === breadcrumbItems.length - 1 ? (
                  <div className="flex items-center gap-2 p-1">
                    <Typography variant="caption1" weight="medium">
                      {item.name}
                    </Typography>
                  </div>
                ) : (
                  <Link href={item.path}>
                    <div className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors">
                      <Typography variant="caption1" theme="muted">
                        {item.name}
                      </Typography>
                    </div>
                  </Link>
                )}
              </>
            )}
          </motion.li>
        ))}
      </ol>
    </nav>
  );
}
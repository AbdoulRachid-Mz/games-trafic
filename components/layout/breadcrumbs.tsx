// components/layout/breadcrumbs.tsx
"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const defaultItems = [
    { name: "Accueil", path: "/" },
  ];

  const breadcrumbItems = items || defaultItems;

  return (
    <nav className={cn("py-2", className)} aria-label="Breadcrumb">
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
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
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
                  <div className="flex items-center gap-2 p-2">
                    <Typography variant="caption1" weight="medium">
                      {item.name}
                    </Typography>
                  </div>
                ) : (
                  <Link href={item.path}>
                    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors">
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
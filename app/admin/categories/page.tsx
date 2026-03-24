// app/admin/categories/page.tsx
"use client";

import React from "react";
import { CategoryManager } from "@/components/categories/category-manager";
import { Typography } from "@/components/ui/typography";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";

export default function AdminCategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Catégories</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Typography variant="h1" weight="bold" className="mt-2">
          Gestion des Catégories
        </Typography>
        <Typography variant="lead" theme="muted">
          Organisez les catégories pour toutes les entités de la plateforme (Produits, Boutiques, Tournois, Guides, etc.)
        </Typography>
      </div>

      <CategoryManager />
    </div>
  );
}

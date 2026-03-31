// @/app/admin/partners/page.tsx
"use client";

import { Metadata } from "next";
import type { Partner } from "@/database/schema";
import { Badge } from "@/components/ui/badge";
import { Building2, ExternalLink, CheckCircle2, XCircle, Award, Users } from "lucide-react";
import Image from "next/image";
import { EntityList } from "@/components/shared/entity-list";
import { useEntityList } from "@/hooks/use-entity-list";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/admin/stat-card";

export default function PartnersAdminPage() {
  const router = useRouter();

  const {
    data: partners,
    total,
    page,
    limit,
    searchTerm,
    filters,
    loading,
    setPage,
    setLimit,
    setSearchTerm,
    setFilters,
  } = useEntityList<Partner>({
    entityType: "partners",
    defaultLimit: 20,
  });

  const renderStats = () => (
    <>
      <StatCard
        title="Total Partners"
        value={total}
        icon={Building2}
        iconClassName="bg-primary/10 text-primary"
      />
      <StatCard
        title="Partenaires Actifs"
        value={partners.filter((p: Partner) => p.status === "ACTIVE").length}
        icon={CheckCircle2}
        iconClassName="bg-green-500/10 text-green-500"
      />
      <StatCard
        title="Niveau Premium"
        value={partners.filter((p: Partner) => (p.slug || "").includes("premium")).length}
        icon={Award}
        iconClassName="bg-amber-500/10 text-amber-500"
      />
    </>
  );

  return (
    <div className="container py-8">
      <EntityList<Partner>
        total={total}
        page={page}
        limit={limit}
        searchTerm={searchTerm}
        filters={filters}
        viewMode="table"
        onPageChange={setPage}
        onLimitChange={setLimit}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilters}
        renderCard={(partner) => <PartnerCard partner={partner} />}
        title="Partners"
        description="Manage platform partners and sponsorships"
        data={partners}
        entityType="partners"
        loading={loading}
        onAdd={() => router.push("/admin/partners/create")}
        renderStats={renderStats}
        renderTableHeader={() => (
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Partner</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Tier</th>
            <th className="px-4 py-3 text-left text-sm font-medium">
              Verified
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium">Views</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
          </tr>
        )}
        renderTableRow={(partner) => (
          <>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                {partner.logo ? (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <div className="font-medium">{partner.name}</div>
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <Badge variant="outline">{partner.type}</Badge>
            </td>
            <td className="px-4 py-3">
              <Badge
                variant={
                  partner.status === "ACTIVE"
                    ? "default"
                    : partner.status === "PENDING"
                      ? "secondary"
                      : "destructive"
                }
              >
                {partner.status}
              </Badge>
            </td>
            <td className="px-4 py-3">
              <Badge variant="outline">{partner.slug || "N/A"}</Badge>
            </td>
            <td className="px-4 py-3">
              {partner.verified ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-muted-foreground" />
              )}
            </td>
            <td className="px-4 py-3 text-sm text-muted-foreground">
              {partner.viewCount || 0}
            </td>
          </>
        )}
      />
    </div>
  );
}


const PartnerCard = ({ partner }: { partner: Partner }) => {
  return (
    <div className="flex items-center gap-3">
      {partner.logo ? (
        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted">
          <Image
            src={partner.logo}
            alt={partner.name}
            fill
            className="object-contain p-1"
          />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          <Building2 className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div>
        <div className="font-medium">{partner.name}</div>
        {partner.website && (
          <a
            href={partner.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Website
          </a>
        )}
      </div>
    </div>
  );
};

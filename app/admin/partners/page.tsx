// @/app/admin/partners/page.tsx
import { Metadata } from "next";
import { getPartners } from "@/actions/partners";
import type { Partner } from "@/database/schema";
import { Badge } from "@/components/ui/badge";
import { Building2, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import Image from "next/image";
import { EntityList } from "@/components/shared/entity-list";

export const metadata: Metadata = {
  title: "Partners Management | Admin",
  description: "Manage platform partners and sponsorships",
};

export default async function PartnersAdminPage() {
  const result = await getPartners({
    limit: 50,
    offset: 0,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const partners = result.data || [];

  return (
    <div className="container py-8">
      <EntityList<Partner>
        total={result.total || 0}
        page={1}
        limit={50}
        searchTerm=""
        filters={{}}
        viewMode="table"
        onPageChange={async () => {}}
        onLimitChange={async () => {}}
        onSearchChange={async () => {}}
        onFilterChange={async () => {}}
        renderCard={(partner) => <PartnerCard partner={partner} />}
        title="Partners"
        description="Manage platform partners and sponsorships"
        data={partners}
        entityType="partners"
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
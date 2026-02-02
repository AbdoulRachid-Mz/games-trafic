import { getGuides } from "@/actions/guides";
import { DocsSearch } from "@/components/pages/docs/docs-search";

export async function DocsSearchWrapper() {
  const { data: guides } = await getGuides({
    pagination: { page: 1, limit: 100 },
    options: { sortBy: "viewCount", sortOrder: "desc" },
  });

  const searchGuides =
    guides?.map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
    })) || [];

  return <DocsSearch guides={[]} />;
}

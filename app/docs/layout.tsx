import { getAllDocs } from "@/lib/docs";
import { DocsSidebar, NavItem } from "@/components/docs/sidebar";

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docsMeta = await getAllDocs();

  // Group MDX docs by category
  const groups = docsMeta.reduce((acc, doc) => {
    const category = doc.category || "Général";
    if (!acc[category]) acc[category] = [];
    acc[category].push({
      title: doc.title,
      href: `/docs/${doc.slug}`,
    });
    return acc;
  }, {} as Record<string, NavItem[]>);

  // Construct the dynamic navigation
  const dynamicNav: NavItem[] = [
    {
      title: "Bienvenue",
      href: "/docs",
      children: [
        { title: "Introduction", href: "/docs" },
        { title: "Démarrer", href: "/docs/getting-started" },
      ]
    },
    ...Object.entries(groups).map(([title, children]) => ({
      title,
      children,
      href: "#",
    })),
    {
      title: "Ressources",
      href: "#",
      children: [
        { title: "Guides CMS", href: "/docs/guides" },
        { title: "Signaler un Bug", href: "/signals" },
        { title: "Support Officiel", href: "/support" },
        { title: "Contact", href: "/contact" },
      ]
    },
    {
      title: "Légal",
      href: "/docs/legal",
      children: [
        { title: "Conditions d'utilisation", href: "/docs/legal/terms" },
        { title: "Confidentialité", href: "/docs/legal/privacy" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <DocsSidebar navItems={dynamicNav}>
        {children}
      </DocsSidebar>
    </div>
  );
}
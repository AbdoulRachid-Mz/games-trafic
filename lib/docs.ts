import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_DIR = path.join(process.cwd(), "docs/content");

export type DocMeta = {
  title: string;
  description?: string;
  slug: string;
  category?: string;
  order?: number;
};

export type DocContent = {
  meta: DocMeta;
  content: string;
};

export async function getDocBySlug(slugArray?: string[]): Promise<DocContent | null> {
  try {
    if (!slugArray || slugArray.length === 0) {
      return null;
    }

    const slug = slugArray.join("/");
    const fullPath = path.join(CONTENT_DIR, `${slug}.md`);
    
    if (!fs.existsSync(fullPath)) {
      // Try folder/overview.md pattern
      const overviewPath = path.join(CONTENT_DIR, slug, "overview.md");
      if (!fs.existsSync(overviewPath)) return null;
      
      const fileContents = fs.readFileSync(overviewPath, "utf8");
      const { data, content } = matter(fileContents);
      
      return {
        meta: {
          title: data.title || slug.split("/").pop() || "",
          description: data.description || "",
          slug,
          ...data,
        } as DocMeta,
        content,
      };
    }

    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    return {
      meta: {
        title: data.title || slug.split("/").pop() || "",
        description: data.description || "",
        slug,
        ...data,
      } as DocMeta,
      content,
    };
  } catch (error) {
    console.error("Error reading doc:", error);
    return null;
  }
}

export async function getAllDocs(): Promise<DocMeta[]> {
  const docs: DocMeta[] = [];

  function traverse(dir: string, currentSlug = "") {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath, path.join(currentSlug, file));
      } else if (file.endsWith(".md")) {
        const fileContents = fs.readFileSync(fullPath, "utf8");
        const { data } = matter(fileContents);
        const slug = path.join(currentSlug, file.replace(/\.md$/, "")).replace(/\\/g, "/");

        docs.push({
          title: data.title || file.replace(/\.md$/, ""),
          description: data.description || "",
          slug,
          category: data.category || currentSlug.split("/")[0] || "General",
          order: data.order || 99,
          ...data,
        });
      }
    }
  }

  if (fs.existsSync(CONTENT_DIR)) {
    traverse(CONTENT_DIR);
  }

  return docs.sort((a, b) => (a.order || 99) - (b.order || 99));
}

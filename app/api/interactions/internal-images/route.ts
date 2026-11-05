
import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import fs from "node:fs/promises";
import path from "node:path";


const DEFAULT_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".tiff",
  ".ico",
  ".avif",
  ".jfif",
];

const MAX_LIMIT = 1000;
const MAX_FOLDER_LENGTH = 300;

type SortBy = "name" | "size" | "date" | "count";
type SortOrder = "asc" | "desc";
type Action = "categories" | "all" | "folder" | "stats";

interface FilterOptions {
  withSubfolders: boolean;
  maxSize: number | null;
  minSize: number | null;
  extensions: string[];
  limit: number | null;
  sortBy: SortBy;
  sortOrder: SortOrder;
  search: string;
}

interface ImageInfo {
  url: string;
  name: string;
  size: number;
  extension: string;
  lastModified: number;
}

interface ImageCategory {
  name: string;
  path: string;
  displayName: string;
  images: ImageInfo[];
  hasSubfolders: boolean;
  totalImages: number;
  icon?: string;
}

interface FolderStats {
  totalImages: number;
  totalSize: number;
  averageSize: number;
  extensionCounts: Record<string, number>;
  largestImage: ImageInfo | null;
  smallestImage: ImageInfo | null;
}

interface ScanEntry {
  name: string;
  fullPath: string;
  relativePath: string;
  isDirectory: boolean;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/* -------------------------------------------------------------------------- */
/*                                   ROUTE                                    */
/* -------------------------------------------------------------------------- */

export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;

    const folder = validateFolder(params.get("folder") || "images");
    const action = validateAction(params.get("action") || "categories");
    const options = parseOptions(params);

    const publicPath = path.resolve(process.cwd(), "public");
    const baseFolderPath = resolveInside(publicPath, folder);

    switch (action) {
      case "categories": {
        const categories = await getImageCategories(
          publicPath,
          folder,
          options,
        );

        return NextResponse.json(categories);
      }

      case "all": {
        const images = await getAllImagesFromFolder(
          publicPath,
          folder,
          options,
        );

        return NextResponse.json(images);
      }

      case "folder": {
        const images = await getImagesFromFolder(
          baseFolderPath,
          `/${folder}`,
          options,
        );

        return NextResponse.json(images);
      }

      case "stats": {
        const stats = await getFolderStats(
          publicPath,
          folder,
          options,
        );

        return NextResponse.json(stats);
      }
    }
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    console.error("[Images API]", error);

    return NextResponse.json(
      { error: "Impossible de scanner le dossier." },
      { status: 500 },
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                VALIDATION                                  */
/* -------------------------------------------------------------------------- */

function validateFolder(value: string): string {
  const normalized = value.trim().replace(/\\/g, "/");

  if (
    !normalized ||
    normalized.length > MAX_FOLDER_LENGTH ||
    normalized.startsWith("/") ||
    /^[a-zA-Z]:/.test(normalized) ||
    normalized.split("/").some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === "..",
    )
  ) {
    throw new ApiError("Chemin de dossier invalide.");
  }

  return normalized;
}

function validateAction(value: string): Action {
  const actions: Action[] = [
    "categories",
    "all",
    "folder",
    "stats",
  ];

  if (!actions.includes(value as Action)) {
    throw new ApiError("Action non reconnue.");
  }

  return value as Action;
}

function parseInteger(
  value: string | null,
  name: string,
): number | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new ApiError(`Paramètre ${name} invalide.`);
  }

  return parsed;
}

function parseOptions(
  params: URLSearchParams,
): FilterOptions {
  const maxSize = parseInteger(params.get("maxSize"), "maxSize");
  const minSize = parseInteger(params.get("minSize"), "minSize");
  const rawLimit = parseInteger(params.get("limit"), "limit");

  if (maxSize !== null && minSize !== null && minSize > maxSize) {
    throw new ApiError("minSize ne peut pas dépasser maxSize.");
  }

  if (rawLimit !== null && rawLimit === 0) {
    throw new ApiError("limit doit être supérieur à zéro.");
  }

  const sortByValue = params.get("sortBy") || "name";
  const sortOrderValue = params.get("sortOrder") || "asc";

  const validSorts: SortBy[] = [
    "name",
    "size",
    "date",
    "count",
  ];

  if (!validSorts.includes(sortByValue as SortBy)) {
    throw new ApiError("Valeur sortBy invalide.");
  }

  if (sortOrderValue !== "asc" && sortOrderValue !== "desc") {
    throw new ApiError("Valeur sortOrder invalide.");
  }

  const extensionsParam = params.get("extensions");

  const extensions = extensionsParam
    ? extensionsParam
        .split(",")
        .map((extension) => {
          const normalized = extension.trim().toLowerCase();
          return normalized.startsWith(".")
            ? normalized
            : `.${normalized}`;
        })
        .filter(Boolean)
    : DEFAULT_EXTENSIONS;

  if (
    extensions.length === 0 ||
    extensions.some(
      (extension) =>
        !/^\.[a-z0-9]{1,10}$/.test(extension),
    )
  ) {
    throw new ApiError("Liste d'extensions invalide.");
  }

  return {
    withSubfolders: params.get("withSubfolders") !== "false",
    maxSize,
    minSize,
    extensions: [...new Set(extensions)],
    limit: rawLimit === null ? null : Math.min(rawLimit, MAX_LIMIT),
    sortBy: sortByValue as SortBy,
    sortOrder: sortOrderValue as SortOrder,
    search: (params.get("search") || "").trim().toLowerCase(),
  };
}

/* -------------------------------------------------------------------------- */
/*                              PATH SECURITY                                 */
/* -------------------------------------------------------------------------- */

function resolveInside(basePath: string, relativePath: string): string {
  const resolved = path.resolve(basePath, relativePath);
  const relative = path.relative(basePath, resolved);

  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new ApiError("Accès au dossier interdit.", 403);
  }

  return resolved;
}

async function isDirectory(target: string): Promise<boolean> {
  try {
    const stats = await fs.stat(target);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function readDirectory(dirPath: string): Promise<ScanEntry[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  return entries.map((entry) => ({
    name: entry.name,
    fullPath: path.join(dirPath, entry.name),
    relativePath: entry.name,
    isDirectory: entry.isDirectory(),
  }));
}

/* -------------------------------------------------------------------------- */
/*                                IMAGE SCAN                                  */
/* -------------------------------------------------------------------------- */

async function getImageCategories(
  publicPath: string,
  baseFolder: string,
  options: FilterOptions,
): Promise<ImageCategory[]> {
  const basePath = resolveInside(publicPath, baseFolder);

  if (!(await isDirectory(basePath))) {
    return [];
  }

  const categories: ImageCategory[] = [];

  const allImages = await getAllImagesFromFolder(
    publicPath,
    baseFolder,
    { ...options, limit: null },
  );

  if (allImages.length > 0) {
    const limitedImages = applyLimit(
      sortImages(allImages, options),
      options.limit,
    );

    categories.push({
      name: "all",
      path: "all",
      displayName: "Toutes les images",
      images: limitedImages,
      hasSubfolders: false,
      totalImages: allImages.length,
      icon: "🖼️",
    });
  }

  const entries = await readDirectory(basePath);

  for (const entry of entries) {
    if (!entry.isDirectory) continue;

    const categoryPath = path.join(baseFolder, entry.name)
      .replace(/\\/g, "/");

    const images = await getImagesFromFolder(
      entry.fullPath,
      `/${categoryPath}`,
      options,
    );

    if (images.length === 0) continue;

    const hasSubfolders = (
      await readDirectory(entry.fullPath)
    ).some((item) => item.isDirectory);

    categories.push({
      name: entry.name,
      path: categoryPath,
      displayName: formatDisplayName(entry.name),
      images,
      hasSubfolders,
      totalImages: images.length,
      icon: getFolderIcon(entry.name),
    });
  }

  return sortCategories(categories, options);
}

async function getAllImagesFromFolder(
  publicPath: string,
  folderName: string,
  options: FilterOptions,
): Promise<ImageInfo[]> {
  const folderPath = resolveInside(publicPath, folderName);

  if (!(await isDirectory(folderPath))) {
    return [];
  }

  return scanDirectory(
    folderPath,
    `/${folderName}`,
    options,
  );
}

async function getImagesFromFolder(
  folderPath: string,
  webPath: string,
  options: FilterOptions,
): Promise<ImageInfo[]> {
  if (!(await isDirectory(folderPath))) {
    return [];
  }

  return scanDirectory(folderPath, webPath, options);
}

async function scanDirectory(
  dirPath: string,
  webPath: string,
  options: FilterOptions,
): Promise<ImageInfo[]> {
  const images: ImageInfo[] = [];

  async function walk(currentPath: string, currentWebPath: string) {
    const entries = await readDirectory(currentPath);

    for (const entry of entries) {
      if (entry.isDirectory) {
        if (options.withSubfolders) {
          await walk(
            entry.fullPath,
            `${currentWebPath}/${entry.name}`,
          );
        }

        continue;
      }

      // Ne suivre ni les liens symboliques ni les fichiers non-images.
      if (!isImageFile(entry.name, options.extensions)) {
        continue;
      }

      try {
        const stats = await fs.lstat(entry.fullPath);

        if (!stats.isFile() || stats.isSymbolicLink()) continue;

        const image: ImageInfo = {
          url: `${currentWebPath}/${entry.name}`.replace(/\\/g, "/"),
          name: entry.name,
          size: stats.size,
          extension: path.extname(entry.name).toLowerCase(),
          lastModified: stats.mtime.getTime(),
        };

        if (passesFilters(image, options)) {
          images.push(image);
        }
      } catch {
        // Ignorer un fichier devenu inaccessible pendant le scan.
      }
    }
  }

  try {
    await walk(dirPath, webPath);

    return applyLimit(
      sortImages(images, options),
      options.limit,
    );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Impossible de lire le dossier.", 500);
  }
}

/* -------------------------------------------------------------------------- */
/*                                  FILTERS                                   */
/* -------------------------------------------------------------------------- */

function isImageFile(
  filename: string,
  extensions: string[],
): boolean {
  return extensions.includes(
    path.extname(filename).toLowerCase(),
  );
}

function passesFilters(
  image: ImageInfo,
  options: FilterOptions,
): boolean {
  if (options.minSize !== null && image.size < options.minSize) {
    return false;
  }

  if (options.maxSize !== null && image.size > options.maxSize) {
    return false;
  }

  if (
    options.search &&
    !image.name.toLowerCase().includes(options.search)
  ) {
    return false;
  }

  return true;
}

function sortImages(
  images: ImageInfo[],
  options: FilterOptions,
): ImageInfo[] {
  const sorted = [...images];

  sorted.sort((a, b) => {
    let result = 0;

    switch (options.sortBy) {
      case "size":
        result = a.size - b.size;
        break;

      case "date":
        result = a.lastModified - b.lastModified;
        break;

      case "name":
      default:
        result = a.name.localeCompare(b.name);
        break;
    }

    return options.sortOrder === "desc" ? -result : result;
  });

  return sorted;
}

function applyLimit<T>(
  items: T[],
  limit: number | null,
): T[] {
  return limit === null ? items : items.slice(0, limit);
}

function sortCategories(
  categories: ImageCategory[],
  options: FilterOptions,
): ImageCategory[] {
  const allCategory = categories.find((item) => item.name === "all");

  const others = categories.filter(
    (item) => item.name !== "all",
  );

  others.sort((a, b) => {
    const result =
      options.sortBy === "count"
        ? a.totalImages - b.totalImages
        : options.sortBy === "size"
          ? a.images.reduce((sum, img) => sum + img.size, 0) -
            b.images.reduce((sum, img) => sum + img.size, 0)
          : options.sortBy === "date"
            ? Math.max(...a.images.map((img) => img.lastModified)) -
              Math.max(...b.images.map((img) => img.lastModified))
            : a.displayName.localeCompare(b.displayName);

    return options.sortOrder === "desc" ? -result : result;
  });

  return allCategory ? [allCategory, ...others] : others;
}

/* -------------------------------------------------------------------------- */
/*                                  STATISTICS                                */
/* -------------------------------------------------------------------------- */

async function getFolderStats(
  publicPath: string,
  folderName: string,
  options: FilterOptions,
): Promise<FolderStats> {
  const images = await getAllImagesFromFolder(
    publicPath,
    folderName,
    { ...options, limit: null },
  );

  const totalImages = images.length;
  const totalSize = images.reduce(
    (sum, image) => sum + image.size,
    0,
  );

  const extensionCounts: Record<string, number> = {};

  for (const image of images) {
    extensionCounts[image.extension] =
      (extensionCounts[image.extension] || 0) + 1;
  }

  return {
    totalImages,
    totalSize,
    averageSize: totalImages > 0 ? totalSize / totalImages : 0,
    extensionCounts,
    largestImage: images.reduce<ImageInfo | null>(
      (largest, image) =>
        !largest || image.size > largest.size ? image : largest,
      null,
    ),
    smallestImage: images.reduce<ImageInfo | null>(
      (smallest, image) =>
        !smallest || image.size < smallest.size ? image : smallest,
      null,
    ),
  };
}

/* -------------------------------------------------------------------------- */
/*                                  DISPLAY                                   */
/* -------------------------------------------------------------------------- */

function formatDisplayName(folderName: string): string {
  const names: Record<string, string> = {
    emoji: "Émojis",
    emojis: "Émojis",
    avatar: "Avatars",
    avatars: "Avatars",
    produits: "Produits",
    products: "Produits",
    background: "Arrière-plans",
    backgrounds: "Arrière-plans",
    profile: "Profils",
    profiles: "Profils",
    cover: "Couvertures",
    covers: "Couvertures",
    icons: "Icônes",
    icon: "Icônes",
    logos: "Logos",
    logo: "Logos",
    banners: "Bannières",
    banner: "Bannières",
    thumbnails: "Miniatures",
    thumbnail: "Miniatures",
    ui: "Interface",
    buttons: "Boutons",
    illustrations: "Illustrations",
    photos: "Photos",
    vectors: "Vectoriels",
  };

  return (
    names[folderName.toLowerCase()] ||
    folderName.charAt(0).toUpperCase() + folderName.slice(1)
  );
}

function getFolderIcon(folderName: string): string {
  const icons: Record<string, string> = {
    emoji: "😀",
    emojis: "😀",
    avatar: "👤",
    avatars: "👤",
    produits: "📦",
    products: "📦",
    background: "🖼️",
    backgrounds: "🖼️",
    profile: "👤",
    profiles: "👤",
    cover: "📄",
    covers: "📄",
    icons: "⭐",
    icon: "⭐",
    logos: "🏷️",
    logo: "🏷️",
    banners: "🎌",
    banner: "🎌",
    thumbnails: "🖼️",
    thumbnail: "🖼️",
    ui: "🎨",
    buttons: "🔘",
    illustrations: "🎨",
    photos: "📸",
    vectors: "📐",
  };

  return icons[folderName.toLowerCase()] || "📁";
}

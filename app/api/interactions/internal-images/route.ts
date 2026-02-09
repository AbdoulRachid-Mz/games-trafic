import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Paramètres de base
  const folder = searchParams.get("folder") || "images";
  const action = searchParams.get("action") || "categories";
  
  // Paramètres de filtrage
  const withSubfolders = searchParams.get("withSubfolders") !== "false";
  const maxSize = searchParams.get("maxSize") ? parseInt(searchParams.get("maxSize")!) : null;
  const minSize = searchParams.get("minSize") ? parseInt(searchParams.get("minSize")!) : null;
  const extensions = searchParams.get("extensions")?.split(",") || null;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : null;
  const sortBy = searchParams.get("sortBy") || "name"; // name, size, date
  const sortOrder = searchParams.get("sortOrder") || "asc"; // asc, desc
  const search = searchParams.get("search") || "";

  try {
    const publicPath = path.join(process.cwd(), "public");

    // Action: récupérer la structure des dossiers avec leurs images
    if (action === "categories") {
      const categories = await getImageCategories(publicPath, folder, {
        withSubfolders,
        maxSize,
        minSize,
        extensions,
        limit,
        sortBy,
        sortOrder,
        search,
      });
      return NextResponse.json(categories, { status: 200 });
    }

    // Action: récupérer toutes les images de tous les dossiers
    if (action === "all") {
      const allImages = await getAllImagesFromFolder(publicPath, folder, {
        withSubfolders,
        maxSize,
        minSize,
        extensions,
        limit,
        sortBy,
        sortOrder,
        search,
      });
      return NextResponse.json(allImages, { status: 200 });
    }

    // Action: récupérer les images d'un dossier spécifique
    if (action === "folder") {
      const folderPath = path.join(publicPath, folder);
      const images = await getImagesFromFolder(folderPath, `/${folder}`, {
        withSubfolders,
        maxSize,
        minSize,
        extensions,
        limit,
        sortBy,
        sortOrder,
        search,
      });
      return NextResponse.json(images, { status: 200 });
    }

    // Action: obtenir les statistiques
    if (action === "stats") {
      const stats = await getFolderStats(publicPath, folder, { withSubfolders });
      return NextResponse.json(stats, { status: 200 });
    }

    // Par défaut, retourner les catégories
    const categories = await getImageCategories(publicPath, folder, {
      withSubfolders,
      maxSize,
      minSize,
      extensions,
      limit,
      sortBy,
      sortOrder,
      search,
    });
    return NextResponse.json(categories, { status: 200 });

  } catch (error) {
    console.error("Error scanning images folder:", error);
    return NextResponse.json(
      { 
        error: "Unable to scan directory", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}

/* === INTERFACES === */

interface FilterOptions {
  withSubfolders?: boolean;
  maxSize?: number | null;
  minSize?: number | null;
  extensions?: string[] | null;
  limit?: number | null;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
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

interface ImageInfo {
  url: string;
  name: string;
  size: number;
  extension: string;
  lastModified: number;
}

interface FolderStats {
  totalImages: number;
  totalSize: number;
  averageSize: number;
  extensionCounts: Record<string, number>;
  largestImage: ImageInfo | null;
  smallestImage: ImageInfo | null;
}

/* === UTILS === */

// Récupérer toutes les catégories d'images avec leurs contenus
async function getImageCategories(
  publicPath: string, 
  baseFolder: string = "images",
  options: FilterOptions = {}
): Promise<ImageCategory[]> {
  const categories: ImageCategory[] = [];
  const baseFolderPath = path.join(publicPath, baseFolder);

  if (!fs.existsSync(baseFolderPath)) {
    console.warn(`Base folder ${baseFolderPath} does not exist`);
    return categories;
  }

  try {
    // Ajouter la catégorie "Toutes les images"
    const allImages = await getAllImagesFromFolder(publicPath, baseFolder, options);
    if (allImages.length > 0) {
      categories.push({
        name: "all",
        path: "all",
        displayName: "Toutes les images",
        images: allImages,
        hasSubfolders: false,
        totalImages: allImages.length,
        icon: "🖼️",
      });
    }

    // Scanner les sous-dossiers
    const items = fs.readdirSync(baseFolderPath);
    
    for (const item of items) {
      const itemPath = path.join(baseFolderPath, item);
      const relativePath = path.join(baseFolder, item);
      
      if (fs.statSync(itemPath).isDirectory()) {
        const images = await getImagesFromFolder(itemPath, `/${relativePath}`, options);
        
        if (images.length > 0) {
          categories.push({
            name: item,
            path: relativePath,
            displayName: formatDisplayName(item),
            images: images,
            hasSubfolders: await hasSubdirectories(itemPath),
            totalImages: images.length,
            icon: getFolderIcon(item),
          });
        }
      }
    }

    // Trier les catégories
    return sortCategories(categories, options.sortBy, options.sortOrder);
  } catch (error) {
    console.error("Error getting image categories:", error);
    return categories;
  }
}

// Récupérer toutes les images d'un dossier et ses sous-dossiers (récursif)
async function getAllImagesFromFolder(
  publicPath: string, 
  folderName: string,
  options: FilterOptions = {}
): Promise<ImageInfo[]> {
  const folderPath = path.join(publicPath, folderName);

  if (!fs.existsSync(folderPath)) {
    return [];
  }

  try {
    const images = options.withSubfolders 
      ? await getImagesRecursive(folderPath, `/${folderName}`, options)
      : await getImagesFromFolder(folderPath, `/${folderName}`, options);
    
    return images;
  } catch (error) {
    console.error(`Error getting all images from ${folderName}:`, error);
    return [];
  }
}

// Récupérer les images d'un dossier de manière récursive
async function getImagesRecursive(
  dirPath: string, 
  webPath: string,
  options: FilterOptions = {}
): Promise<ImageInfo[]> {
  const images: ImageInfo[] = [];
  
  if (!fs.existsSync(dirPath)) {
    return images;
  }

  try {
    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativePath = path.join(webPath, item).replace(/\\/g, "/");

      if (fs.statSync(fullPath).isDirectory() && options.withSubfolders) {
        const subImages = await getImagesRecursive(fullPath, relativePath, options);
        images.push(...subImages);
      } else if (fs.statSync(fullPath).isFile() && isImageFile(item, options.extensions)) {
        const imageInfo = await getImageInfo(fullPath, relativePath);
        if (imageInfo && passesFilters(imageInfo, options)) {
          images.push(imageInfo);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return sortImages(images, options.sortBy, options.sortOrder, options.limit);
}

// Récupérer les images d'un dossier spécifique
async function getImagesFromFolder(
  folderPath: string, 
  webPath: string,
  options: FilterOptions = {}
): Promise<ImageInfo[]> {
  const images: ImageInfo[] = [];
  
  if (!fs.existsSync(folderPath)) {
    return images;
  }

  try {
    const items = fs.readdirSync(folderPath);

    for (const item of items) {
      const fullPath = path.join(folderPath, item);
      const relativePath = path.join(webPath, item).replace(/\\/g, "/");
      
      if (fs.statSync(fullPath).isFile() && isImageFile(item, options.extensions)) {
        const imageInfo = await getImageInfo(fullPath, relativePath);
        if (imageInfo && passesFilters(imageInfo, options)) {
          images.push(imageInfo);
        }
      } else if (fs.statSync(fullPath).isDirectory() && options.withSubfolders) {
        const subImages = await getImagesFromFolder(fullPath, relativePath, options);
        images.push(...subImages);
      }
    }
  } catch (error) {
    console.error(`Error reading folder ${folderPath}:`, error);
  }

  return sortImages(images, options.sortBy, options.sortOrder, options.limit);
}

// Obtenir les informations d'une image
async function getImageInfo(filePath: string, webPath: string): Promise<ImageInfo | null> {
  try {
    const stats = fs.statSync(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const name = path.basename(filePath);

    return {
      url: webPath,
      name,
      size: stats.size,
      extension,
      lastModified: stats.mtime.getTime(),
    };
  } catch (error) {
    console.error(`Error getting image info for ${filePath}:`, error);
    return null;
  }
}

// Obtenir les statistiques d'un dossier
async function getFolderStats(
  publicPath: string, 
  folderName: string,
  options: FilterOptions = {}
): Promise<FolderStats> {
  const images = await getAllImagesFromFolder(publicPath, folderName, options);
  
  const totalImages = images.length;
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  const averageSize = totalImages > 0 ? totalSize / totalImages : 0;
  
  const extensionCounts: Record<string, number> = {};
  images.forEach(img => {
    extensionCounts[img.extension] = (extensionCounts[img.extension] || 0) + 1;
  });

  const largestImage = images.reduce((largest, img) => 
    !largest || img.size > largest.size ? img : largest, null as ImageInfo | null);
  
  const smallestImage = images.reduce((smallest, img) => 
    !smallest || img.size < smallest.size ? img : smallest, null as ImageInfo | null);

  return {
    totalImages,
    totalSize,
    averageSize,
    extensionCounts,
    largestImage,
    smallestImage,
  };
}

// Vérifier si un fichier est une image
function isImageFile(filename: string, allowedExtensions?: string[] | null): boolean {
  const defaultExtensions = [
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", 
    ".bmp", ".tiff", ".ico", ".avif", ".jfif"
  ];
  
  const extensions = allowedExtensions || defaultExtensions;
  const fileExtension = path.extname(filename).toLowerCase();
  
  return extensions.includes(fileExtension);
}

// Vérifier si une image passe les filtres
function passesFilters(image: ImageInfo, options: FilterOptions): boolean {
  // Filtre par taille
  if (options.minSize && image.size < options.minSize) return false;
  if (options.maxSize && image.size > options.maxSize) return false;
  
  // Filtre par recherche
  if (options.search && !image.name.toLowerCase().includes(options.search.toLowerCase())) {
    return false;
  }
  
  return true;
}

// Trier les images
function sortImages(
  images: ImageInfo[], 
  sortBy?: string, 
  sortOrder?: string, 
  limit?: number | null
): ImageInfo[] {
  let sorted = [...images];
  
  // Tri
  switch (sortBy) {
    case "size":
      sorted.sort((a, b) => a.size - b.size);
      break;
    case "date":
      sorted.sort((a, b) => a.lastModified - b.lastModified);
      break;
    case "name":
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }
  
  // Ordre
  if (sortOrder === "desc") {
    sorted.reverse();
  }
  
  // Limite
  if (limit && limit > 0) {
    sorted = sorted.slice(0, limit);
  }
  
  return sorted;
}

// Trier les catégories
function sortCategories(
  categories: ImageCategory[], 
  sortBy?: string, 
  sortOrder?: string
): ImageCategory[] {
  const sorted = [...categories];
  
  // Garder "Toutes les images" en premier
  const allCategory = sorted.find(cat => cat.name === "all");
  const otherCategories = sorted.filter(cat => cat.name !== "all");
  
  // Trier les autres catégories
  switch (sortBy) {
    case "count":
      otherCategories.sort((a, b) => a.totalImages - b.totalImages);
      break;
    case "name":
    default:
      otherCategories.sort((a, b) => a.displayName.localeCompare(b.displayName));
      break;
  }
  
  if (sortOrder === "desc") {
    otherCategories.reverse();
  }
  
  return allCategory ? [allCategory, ...otherCategories] : otherCategories;
}

// Vérifier si un dossier a des sous-dossiers
async function hasSubdirectories(dirPath: string): Promise<boolean> {
  if (!fs.existsSync(dirPath)) {
    return false;
  }

  try {
    const items = fs.readdirSync(dirPath);
    return items.some(item => {
      const fullPath = path.join(dirPath, item);
      return fs.statSync(fullPath).isDirectory();
    });
  } catch (error) {
    return false;
  }
}

// Formater le nom d'affichage des catégories
function formatDisplayName(folderName: string): string {
  const displayNames: Record<string, string> = {
    'emoji': 'Émojis',
    'emojis': 'Émojis',
    'avatar': 'Avatars',
    'avatars': 'Avatars',
    'produits': 'Produits',
    'products': 'Produits',
    'background': 'Arrière-plans',
    'backgrounds': 'Arrière-plans',
    'profile': 'Profils',
    'profiles': 'Profils',
    'cover': 'Couvertures',
    'covers': 'Couvertures',
    'icons': 'Icônes',
    'icon': 'Icônes',
    'logos': 'Logos',
    'logo': 'Logos',
    'banners': 'Bannières',
    'banner': 'Bannières',
    'thumbnails': 'Miniatures',
    'thumbnail': 'Miniatures',
    'ui': 'Interface',
    'buttons': 'Boutons',
    'illustrations': 'Illustrations',
    'photos': 'Photos',
    'vectors': 'Vectoriels',
  };

  return displayNames[folderName.toLowerCase()] || 
         folderName.charAt(0).toUpperCase() + folderName.slice(1);
}

// Obtenir l'icône d'un dossier
function getFolderIcon(folderName: string): string {
  const icons: Record<string, string> = {
    'emoji': '😀',
    'emojis': '😀',
    'avatar': '👤',
    'avatars': '👤',
    'produits': '📦',
    'products': '📦',
    'background': '🖼️',
    'backgrounds': '🖼️',
    'profile': '👤',
    'profiles': '👤',
    'cover': '📄',
    'covers': '📄',
    'icons': '⭐',
    'icon': '⭐',
    'logos': '🏷️',
    'logo': '🏷️',
    'banners': '🎌',
    'banner': '🎌',
    'thumbnails': '🖼️',
    'thumbnail': '🖼️',
    'ui': '🎨',
    'buttons': '🔘',
    'illustrations': '🎨',
    'photos': '📸',
    'vectors': '📐',
  };

  return icons[folderName.toLowerCase()] || '📁';
}
// utils/image-upload-utils.ts
import imageCompression from "browser-image-compression";

export interface UploadOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  uploadPath?: string;
  uploadPreset?: string;
  cloudName?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  originalSize?: number;
  compressedSize?: number;
}

export interface UploadProgress {
  progress: number;
  status: "compressing" | "uploading" | "complete" | "error";
}

export interface ImageCategory {
  name: string;
  path: string;
  displayName: string;
  images: ImageInfo[];
  hasSubfolders: boolean;
  totalImages: number;
  icon?: string;
}

export interface ImageInfo {
  url: string;
  name: string;
  size: number;
  extension: string;
  lastModified: number;
}

export interface ImageFilters {
  withSubfolders?: boolean;
  maxSize?: number;
  minSize?: number;
  extensions?: string[];
  limit?: number;
  sortBy?: "name" | "size" | "date";
  sortOrder?: "asc" | "desc";
  search?: string;
  folder?: string; // Ajout du paramètre folder
}

export const compressImage = async (
  file: File,
  options: {
    maxSizeMB: number;
    maxWidthOrHeight: number;
    onProgress?: (progress: number) => void;
  }
): Promise<File> => {
  const compressionOptions = {
    maxSizeMB: options.maxSizeMB,
    maxWidthOrHeight: options.maxWidthOrHeight,
    useWebWorker: true,
    onProgress: options.onProgress,
  };

  return await imageCompression(file, compressionOptions);
};

export const uploadToCloudinary = async (
  file: File,
  options: UploadOptions
): Promise<UploadResult> => {
  const {
    uploadPath = "images",
    uploadPreset = "games_trafics",
    cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "duathyzaj",
  } = options;

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", uploadPath);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      url: data.secure_url,
      originalSize: file.size,
      compressedSize: file.size,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown upload error",
    };
  }
};

export const getInternalImages = async (
  folderPath: string = "images",
  filters: ImageFilters = {}
): Promise<ImageInfo[]> => {
  try {
    const params = new URLSearchParams({
      folder: folderPath,
      action: "folder",
      ...(filters.withSubfolders !== undefined && { withSubfolders: filters.withSubfolders.toString() }),
      ...(filters.maxSize && { maxSize: filters.maxSize.toString() }),
      ...(filters.minSize && { minSize: filters.minSize.toString() }),
      ...(filters.extensions && { extensions: filters.extensions.join(",") }),
      ...(filters.limit && { limit: filters.limit.toString() }),
      ...(filters.sortBy && { sortBy: filters.sortBy }),
      ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      ...(filters.search && { search: filters.search }),
    });

    const response = await fetch(
      `/api/interactions/internal-images?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const images = await response.json();
    // return console.log(Array.isArray(images) ? images : [])
    return Array.isArray(images) ? images : [];
  } catch (error) {
    console.error("Error fetching internal images:", error);
    return [];
  }
};

// utils/image-upload-utils.ts
// ... autres imports et code ...

export const getImageCategories = async (
  filters: ImageFilters = {}
): Promise<ImageCategory[]> => {
  try {
    const params = new URLSearchParams({
      action: "categories",
      ...(filters.withSubfolders !== undefined && { withSubfolders: filters.withSubfolders.toString() }),
      ...(filters.maxSize && { maxSize: filters.maxSize.toString() }),
      ...(filters.minSize && { minSize: filters.minSize.toString() }),
      ...(filters.extensions && { extensions: filters.extensions.join(",") }),
      ...(filters.limit && { limit: filters.limit.toString() }),
      ...(filters.sortBy && { sortBy: filters.sortBy }),
      ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      ...(filters.search && { search: filters.search }),
      ...(filters.folder && { folder: filters.folder }), // Ajout du paramètre folder
    });

    const response = await fetch(`/api/interactions/internal-images?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const categories = await response.json();
    return Array.isArray(categories) ? categories : [];
  } catch (error) {
    console.error("Error fetching image categories:", error);
    return [];
  }
};

export const getImageStats = async (
  folderPath: string = "images",
  withSubfolders: boolean = true
): Promise<any> => {
  try {
    const params = new URLSearchParams({
      folder: folderPath,
      action: "stats",
      withSubfolders: withSubfolders.toString(),
    });

    const response = await fetch(`/api/interactions/internal-images?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const stats = await response.json();
    return stats;
  } catch (error) {
    console.error("Error fetching image stats:", error);
    return null;
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
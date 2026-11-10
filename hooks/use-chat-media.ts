// hooks/use-chat-media.ts
'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import type { User } from '@/database/schema';
import { 
  canUploadMedia, 
  getMediaUploadLimits, 
  formatBytes 
} from '@/lib/chat-utils';

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'compressing' | 'completed' | 'error';
  error?: string;
  url?: string;
}

/**
 * Hook for handling media uploads with compression and user limits
 */
export function useChatMedia(user: User | null) {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const urlCache = useRef<Map<string, string>>(new Map()); // dedup par signature fichier

  const limits = getMediaUploadLimits(user);

  /**
   * Validate file before upload
   */
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!limits.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${limits.allowedTypes.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > limits.maxFileSize) {
      return {
        valid: false,
        error: `File size (${formatBytes(file.size)}) exceeds maximum allowed (${formatBytes(limits.maxFileSize)})`,
      };
    }

    return { valid: true };
  }, [limits]);

  /**
   * Compress image file
   */
  const compressImage = useCallback(async (file: File): Promise<File> => {
    try {
      const options = {
        maxSizeMB: limits.maxFileSizeCompressed / (1024 * 1024), // Convert to MB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type as any,
      };

      const compressedFile = await imageCompression(file, options);
      
      // Create a new File object with the original name
      return new File([compressedFile], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error('Image compression failed:', error);
      throw new Error('Failed to compress image');
    }
  }, [limits]);

  /**
   * Upload file to server
   * Note: This is a placeholder - implement actual upload logic
   */
  const uploadToServer = useCallback(async (
    file: File,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      if (signal) {
        if (signal.aborted) {
          reject(new Error('Upload annulé'));
          return;
        }
        signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload annulé'));
        });
      }

      if (onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.url) {
              resolve(data.url);
            } else {
              reject(new Error('Réponse invalide du serveur (URL manquante)'));
            }
          } catch {
            reject(new Error('Erreur de parsing de la réponse'));
          }
        } else {
          try {
            const errData = JSON.parse(xhr.responseText);
            reject(new Error(errData.error || `Erreur d'upload: ${xhr.status}`));
          } catch {
            reject(new Error(`Erreur d'upload: ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Erreur réseau lors de l\'upload'));
      };

      xhr.open('POST', '/api/upload', true);
      xhr.send(formData);
    });
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    // Dedup : si ce fichier a déjà été uploadé, renvoyer l'URL cachée
    const signature = `${file.name}:${file.size}:${file.lastModified}`;
    const cachedUrl = urlCache.current.get(signature);
    if (cachedUrl) {
      return cachedUrl;
    }

    const fileId = `${Date.now()}-${file.name}`;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      throw new Error(validation.error);
    }

    // AbortController pour l'annulation
    const controller = new AbortController();
    abortControllers.current.set(fileId, controller);

    // Initialize upload progress
    setUploads((prev) => {
      const next = new Map(prev);
      next.set(fileId, {
        file,
        progress: 0,
        status: 'pending',
      });
      return next;
    });

    try {
      setIsUploading(true);

      // Compress image if it's an image file
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        setUploads((prev) => {
          const next = new Map(prev);
          const current = next.get(fileId)!;
          next.set(fileId, { ...current, status: 'compressing' });
          return next;
        });

        fileToUpload = await compressImage(file);
      }

      // Upload to server
      setUploads((prev) => {
        const next = new Map(prev);
        const current = next.get(fileId)!;
        next.set(fileId, { ...current, status: 'uploading', progress: 0 });
        return next;
      });

      const url = await uploadToServer(fileToUpload, (progress) => {
        setUploads((prev) => {
          const next = new Map(prev);
          const current = next.get(fileId);
          if (current) {
            next.set(fileId, { ...current, progress });
          }
          return next;
        });
      }, controller.signal);

      // Mark as completed
      setUploads((prev) => {
        const next = new Map(prev);
        const current = next.get(fileId)!;
        next.set(fileId, {
          ...current,
          status: 'completed',
          progress: 100,
          url,
        });
        return next;
      });

      // Cache l'URL pour éviter les re-uploads identiques
      urlCache.current.set(signature, url);
      abortControllers.current.delete(fileId);

      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploads((prev) => {
        const next = new Map(prev);
        const current = next.get(fileId)!;
        next.set(fileId, {
          ...current,
          status: 'error',
          error: errorMessage,
        });
        return next;
      });

      toast.error(errorMessage);
      abortControllers.current.delete(fileId);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, compressImage, uploadToServer]);

  /**
   * Upload multiple files
   */
  const uploadFiles = useCallback(async (files: File[]): Promise<string[]> => {
    // Check file count limit
    if (files.length > limits.maxImagesPerMessage) {
      toast.error(
        `You can only upload ${limits.maxImagesPerMessage} images per message`
      );
      throw new Error('Too many files');
    }

    try {
      setIsUploading(true);
      const urls = await Promise.all(files.map(uploadFile));
      toast.success(`${files.length} file(s) uploaded successfully`);
      return urls;
    } catch (error) {
      toast.error('Some files failed to upload');
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [limits, uploadFile]);

  /**
   * Annule un upload en cours (Lot D)
   */
  const cancelUpload = useCallback((fileId: string) => {
    const controller = abortControllers.current.get(fileId);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(fileId);
    }
    setUploads((prev) => {
      const next = new Map(prev);
      const current = next.get(fileId);
      if (current) {
        next.set(fileId, { ...current, status: 'error', error: 'Upload annulé' });
      }
      return next;
    });
  }, []);

  /**
   * Nettoie les uploads terminés/erronés (libération des ressources)
   */
  const clearCompleted = useCallback(() => {
    setUploads((prev) => {
      const next = new Map(prev);
      for (const [id, up] of next.entries()) {
        if (up.status === 'completed' || up.status === 'error') {
          next.delete(id);
        }
      }
      return next;
    });
  }, []);

  /**
   * Clear upload history
   */
  const clearUploads = useCallback(() => {
    setUploads(new Map());
  }, []);

  /**
   * Remove a specific upload
   */
  const removeUpload = useCallback((fileId: string) => {
    setUploads((prev) => {
      const next = new Map(prev);
      next.delete(fileId);
      return next;
    });
  }, []);

  return {
    // State
    uploads: Array.from(uploads.values()),
    isUploading,
    limits,

    // Actions
    uploadFile,
    uploadFiles,
    validateFile,
    clearUploads,
    clearCompleted,
    cancelUpload,
    removeUpload,
  };
}

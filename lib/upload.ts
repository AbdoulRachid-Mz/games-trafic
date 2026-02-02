import { compressImage } from "./media-compression"
import { toast } from "sonner"

interface UploadOptions {
  path?: string
  prefix?: string
  maxSizeMB?: number
  acceptedTypes?: string[]
  onProgress?: (progress: number) => void
}

export async function uploadFile(file: File, options: UploadOptions = {}) {
  const {
    path = "uploads",
    prefix = "",
    maxSizeMB = 5,
    acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
    onProgress,
  } = options

  // Vérifier le type de fichier
  if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
    return {
      error: `Type de fichier non pris en charge. Types acceptés: ${acceptedTypes
        .map((type) => type.replace("image/", ""))
        .join(", ")}`,
    }
  }

  // Vérifier la taille du fichier
  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      error: `La taille du fichier dépasse la limite de ${maxSizeMB}MB`,
    }
  }

  try {
    // Compresser l'image si c'est une image
    let fileToUpload = file
    if (file.type.startsWith("image/")) {
      fileToUpload = await compressImage(file, {
        maxWidthOrHeight: 1920,
        quality: 80,
      })
    }

    // Créer un nom de fichier unique
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const fileExtension = file.name.split(".").pop()
    const fileName = `${prefix ? prefix + "_" : ""}${timestamp}_${randomString}.${fileExtension}`
    const fullPath = `${path}/${fileName}`

    // Créer les données du formulaire
    const formData = new FormData()
    formData.append("file", fileToUpload)
    formData.append("path", fullPath)

    // Télécharger vers le serveur avec suivi de progression
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText)
            resolve({
              url: response.url,
              fileName: fileName,
              fileSize: fileToUpload.size,
            })
          } catch (error) {
            reject(new Error("Réponse invalide du serveur"))
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText)
            reject(new Error(error.message || "Échec du téléchargement"))
          } catch {
            reject(new Error(`Échec du téléchargement: ${xhr.status}`))
          }
        }
      }

      xhr.onerror = () => {
        reject(new Error("Erreur réseau lors du téléchargement"))
      }

      xhr.open("POST", "/api/upload", true)
      xhr.send(formData)
    })
  } catch (error) {
    console.error("Erreur lors du téléchargement du fichier:", error)
    return {
      error: error instanceof Error ? error.message : "Échec du téléchargement du fichier",
    }
  }
}

/**
 * Télécharger plusieurs fichiers avec gestion des erreurs
 */
export async function uploadMultipleFiles(files: File[], options: UploadOptions = {}) {
  const results = []
  const errors = []

  for (const file of files) {
    try {
      const result = await uploadFile(file, options)
      if (typeof result === "object" && result !== null && "error" in result) {
        errors.push({ file: file.name, error: (result as { error: string }).error })
      } else if (typeof result === "object" && result !== null && "url" in result) {
        results.push(result as { url: string; fileName: string; fileSize: number })
      }
    } catch (error) {
      errors.push({
        file: file.name,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      })
    }
  }

  // Afficher les erreurs s'il y en a
  if (errors.length > 0) {
    if (errors.length === 1) {
      toast.error(`Erreur: ${errors[0].error}`, {
        description: `Fichier: ${errors[0].file}`,
      })
    } else {
      toast.error(`${errors.length} fichiers n'ont pas pu être téléchargés`, {
        description: "Vérifiez la taille et le format des fichiers",
      })
    }
  }

  return {
    successful: results,
    failed: errors,
    allSuccessful: errors.length === 0,
  }
}

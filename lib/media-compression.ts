// media-compression.ts
export const compressImage = async (
  file: File,
  options: { maxWidthOrHeight?: number; quality?: number },
): Promise<File> => {
  return new Promise((resolve) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return resolve(file) // Pas de compression pour les formats non supportés
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string

      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!

        // Calcul des nouvelles dimensions
        let width = img.width
        let height = img.height

        if (options.maxWidthOrHeight) {
          if (width > height) {
            if (width > options.maxWidthOrHeight) {
              height *= options.maxWidthOrHeight / width
              width = options.maxWidthOrHeight
            }
          } else {
            if (height > options.maxWidthOrHeight) {
              width *= options.maxWidthOrHeight / height
              height = options.maxWidthOrHeight
            }
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file)

            const compressedFile = new File([blob], file.name, {
              type: "image/webp", // Convertit toujours en WebP pour meilleure compression
              lastModified: Date.now(),
            })

            resolve(compressedFile)
          },
          "image/webp",
          options.quality ? options.quality / 100 : 0.8,
        )
      }
    }
    reader.readAsDataURL(file)
  })
}

export const compressVideo = async (file: File, options: { bitrate?: number }): Promise<File> => {
  // Solution simplifiée - en production utiliser FFmpeg.wasm
  return file // Retourne le fichier original dans cet exemple
}

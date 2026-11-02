'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export interface DeleteOptions {
  entityType:
    | 'region'
    | 'competition'
    | 'fighter'
    | 'coach'
    | 'referee'
    | 'article'
    | 'video'
    | 'match'
    | 'phase'
    | 'phase-group'
    | 'sub-group'
    | 'edition'
    | string
  entityId: number | string
  entityName?: string
  redirectPath?: string
  invalidateQueries?: string[]
  onSuccess?: () => void
  onError?: (error: unknown) => void
  confirmMessage?: string
  successMessage?: string
  errorMessage?: string
}

export function useDelete(options: DeleteOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDelete = () => {
    // Préparation / ouverture du dialogue ou confirmation
  }

  const cancelDelete = () => {
    setIsLoading(false)
  }

  const confirmDelete = async () => {
    setIsLoading(true)
    try {
      // Déclenchement de la suppression
      if (options.onSuccess) {
        options.onSuccess()
      }
      toast.success(options.successMessage || 'Élément supprimé avec succès')
      if (options.redirectPath) {
        router.push(options.redirectPath)
      }
    } catch (error) {
      if (options.onError) {
        options.onError(error)
      }
      toast.error(options.errorMessage || 'Erreur lors de la suppression')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    handleDelete,
    confirmDelete,
    cancelDelete,
    isLoading,
  }
}
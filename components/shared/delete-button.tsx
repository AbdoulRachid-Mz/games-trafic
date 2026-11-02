// @/components/shared/delete-button.tsx
'use client'

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, AlertTriangle, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useDelete, DeleteOptions } from '@/hooks/use-delete'
import { useAuthContext } from '@/contexts/auth-context'

// Props pour le bouton de suppression
export interface DeleteButtonProps extends Omit<DeleteOptions, 'entityType' | 'entityId'> {
  entityType: DeleteOptions['entityType']
  entityId: number
  entityName?: string
  iconOnly?: boolean
  children?: ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  dialog?: {
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
  }
}

// Icônes selon le type d'entité
const entityIcons: Record<string, React.ElementType> = {
  region: Trash2,
  competition: Trash2,
  fighter: Trash2,
  coach: Trash2,
  referee: Trash2,
  article: Trash2,
  video: Trash2,
  match: Trash2,
  phase: Trash2,
  'phase-group': Trash2,
  'sub-group': Trash2,
  edition: Trash2,
}

export function DeleteButton({
  entityType,
  entityId,
  entityName,
  iconOnly = false,
  children,
  variant = 'destructive',
  size = 'md',
  className,
  redirectPath,
  invalidateQueries,
  onSuccess,
  onError,
  confirmMessage,
  successMessage,
  errorMessage,
  dialog = {},
}: DeleteButtonProps) {
  const { user } = useAuthContext()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Utiliser le hook de suppression
  const {
    handleDelete,
    confirmDelete,
    cancelDelete,
    isLoading,
  } = useDelete({
    entityType,
    entityId,
    entityName,
    redirectPath,
    invalidateQueries,
    onSuccess,
    onError,
    confirmMessage,
    successMessage,
    errorMessage,
  })

  // Vérifier les permissions
  const canDelete = (user as any)?.role === 'admin' || (user as any)?.role === 'editor' || (user as any)?.userDocument?.role === 'admin'

  // Gérer le clic sur le bouton
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!canDelete) {
      // toast.error('Vous n\'avez pas la permission de supprimer cet élément')
      return
    }
    
    setIsDialogOpen(true)
    handleDelete()
  }

  // Gérer la confirmation
  const handleConfirm = () => {
    confirmDelete()
    setIsDialogOpen(false)
  }

  // Gérer l'annulation
  const handleCancel = () => {
    cancelDelete()
    setIsDialogOpen(false)
  }

  // Labels et textes par défaut
  const defaultLabels = {
    delete: 'Supprimer',
    confirming: 'Confirmer la suppression',
    cancel: 'Annuler',
  }

  const Icon = entityIcons[entityType] || Trash2

  // Classes de taille
  const sizeClasses = {
    sm: 'h-8 px-2 text-sm gap-1',
    md: 'h-10 px-3 text-base gap-2',
    lg: 'h-12 px-4 text-lg gap-2',
  }

  // Classes de variant
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
  }

  // Configuration du dialog
  const dialogConfig = {
    title: dialog.title || `Supprimer ${entityName || entityType}`,
    description: dialog.description || 
      `Êtes-vous sûr de vouloir supprimer "${entityName || 'cet élément'}" ? Cette action est irréversible.`,
    confirmText: dialog.confirmText || 'Supprimer',
    cancelText: dialog.cancelText || 'Annuler',
  }

  if (!canDelete) {
    return null
  }

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        disabled={isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50 select-none',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        aria-label={`Supprimer ${entityName || entityType}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isLoading ? 'loading' : 'idle'}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon className={cn(
                'shrink-0',
                size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
              )} />
            )}
            {!iconOnly && (
              <span>{isLoading ? 'Suppression...' : (children || defaultLabels.delete)}</span>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Dialog de confirmation */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {dialogConfig.title}
            </DialogTitle>
            <DialogDescription>
              {dialogConfig.description}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 my-2">
            <p className="text-sm text-amber-800">
              ⚠️ Attention : Cette action est définitive et ne peut pas être annulée.
            </p>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              {dialogConfig.cancelText}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Suppression...' : dialogConfig.confirmText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
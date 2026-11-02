// @/components/ui/delete-dropdown.tsx
'use client'

import * as React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Trash2, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDelete, DeleteOptions } from '@/hooks/use-delete'

export interface DeleteDropdownProps extends DeleteOptions {
  triggerIcon?: React.ReactNode
  triggerClassName?: string
  menuAlign?: 'start' | 'center' | 'end'
  showDialog?: boolean
}

export function DeleteDropdown({
  triggerIcon = <MoreVertical className="w-4 h-4" />,
  triggerClassName,
  menuAlign = 'end',
  showDialog = true,
  ...deleteOptions
}: DeleteDropdownProps) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const { handleDelete, confirmDelete, cancelDelete, isLoading } = useDelete(deleteOptions)

  const handleItemClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (showDialog) {
      setIsDialogOpen(true)
      handleDelete()
    } else {
      confirmDelete()
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-8 w-8 p-0', triggerClassName)}
            onClick={(e) => e.stopPropagation()}
          >
            {triggerIcon}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={menuAlign} className="w-40">
          <DropdownMenuItem
            onClick={handleItemClick}
            className="text-destructive focus:text-destructive"
            disabled={isLoading}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isLoading ? 'Suppression...' : 'Supprimer'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de confirmation (optionnel) */}
      {showDialog && isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Confirmer la suppression
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Êtes-vous sûr de vouloir supprimer "{(deleteOptions as any).entityName || 'cet élément'}" ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  cancelDelete()
                  setIsDialogOpen(false)
                }}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  confirmDelete()
                  setIsDialogOpen(false)
                }}
                disabled={isLoading}
              >
                {isLoading ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
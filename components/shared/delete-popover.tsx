// @/components/ui/delete-popover.tsx
'use client'

import * as React from 'react'
import { DeleteButton, DeleteButtonProps } from './delete-button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Trash2, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DeletePopoverProps extends DeleteButtonProps {
  showTrigger?: boolean
  triggerIcon?: React.ReactNode
  triggerClassName?: string
  popoverAlign?: 'start' | 'center' | 'end'
}

export function DeletePopover({
  showTrigger = true,
  triggerIcon = <MoreVertical className="w-4 h-4" />,
  triggerClassName,
  popoverAlign = 'end',
  children,
  ...deleteProps
}: DeletePopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {showTrigger ? (
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-8 w-8 p-0', triggerClassName)}
          >
            {triggerIcon}
          </Button>
        ) : (
          children
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align={popoverAlign}>
        <div className="flex flex-col gap-1">
          <DeleteButton
            {...deleteProps}
            iconOnly={false}
            variant="ghost"
            size="sm"
            className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            dialog={{
              title: 'Confirmer la suppression',
              description: `Êtes-vous sûr de vouloir supprimer "${deleteProps.entityName || 'cet élément'}" ?`,
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </DeleteButton>
        </div>
      </PopoverContent>
    </Popover>
  )
}
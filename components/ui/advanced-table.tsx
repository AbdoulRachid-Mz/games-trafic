// components/ui/advanced-table.tsx
"use client"

import React, { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface TableColumn<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string
}

export interface TableTheme {
  header: {
    bgColor: string
    textColor: string
    borderColor: string
  }
  body: {
    bgColor: string
    textColor: string
    borderColor: string
    hoverColor: string
    stripedColor?: string
  }
  footer: {
    bgColor: string
    textColor: string
    borderColor: string
  }
  pagination: {
    bgColor: string
    textColor: string
    activeBgColor: string
    activeTextColor: string
    hoverBgColor: string
  }
}

export const tableThemes = {
  default: {
    header: {
      bgColor: "bg-muted/50",
      textColor: "text-muted-foreground",
      borderColor: "border-border",
    },
    body: {
      bgColor: "bg-background",
      textColor: "text-foreground",
      borderColor: "border-border",
      hoverColor: "bg-muted/50",
      stripedColor: "bg-muted/20",
    },
    footer: {
      bgColor: "bg-muted/30",
      textColor: "text-muted-foreground",
      borderColor: "border-border",
    },
    pagination: {
      bgColor: "bg-background",
      textColor: "text-foreground",
      activeBgColor: "bg-primary",
      activeTextColor: "text-primary-foreground",
      hoverBgColor: "bg-accent",
    },
  },
  dark: {
    header: {
      bgColor: "bg-slate-800",
      textColor: "text-slate-200",
      borderColor: "border-slate-700",
    },
    body: {
      bgColor: "bg-slate-900",
      textColor: "text-slate-100",
      borderColor: "border-slate-700",
      hoverColor: "bg-slate-800",
      stripedColor: "bg-slate-800/50",
    },
    footer: {
      bgColor: "bg-slate-800",
      textColor: "text-slate-200",
      borderColor: "border-slate-700",
    },
    pagination: {
      bgColor: "bg-slate-800",
      textColor: "text-slate-200",
      activeBgColor: "bg-slate-700",
      activeTextColor: "text-slate-100",
      hoverBgColor: "bg-slate-700",
    },
  },
  glass: {
    header: {
      bgColor: "bg-white/10 backdrop-blur-md",
      textColor: "text-white",
      borderColor: "border-white/20",
    },
    body: {
      bgColor: "bg-white/5 backdrop-blur-sm",
      textColor: "text-white",
      borderColor: "border-white/10",
      hoverColor: "bg-white/10",
      stripedColor: "bg-white/5",
    },
    footer: {
      bgColor: "bg-white/10 backdrop-blur-md",
      textColor: "text-white",
      borderColor: "border-white/20",
    },
    pagination: {
      bgColor: "bg-white/10",
      textColor: "text-white",
      activeBgColor: "bg-white/20",
      activeTextColor: "text-white",
      hoverBgColor: "bg-white/20",
    },
  },
  premium: {
    header: {
      bgColor: "bg-gradient-to-r from-amber-500 to-orange-500",
      textColor: "text-white",
      borderColor: "border-amber-600",
    },
    body: {
      bgColor: "bg-amber-50",
      textColor: "text-amber-900",
      borderColor: "border-amber-200",
      hoverColor: "bg-amber-100",
      stripedColor: "bg-amber-50/50",
    },
    footer: {
      bgColor: "bg-amber-100",
      textColor: "text-amber-900",
      borderColor: "border-amber-200",
    },
    pagination: {
      bgColor: "bg-amber-100",
      textColor: "text-amber-900",
      activeBgColor: "bg-amber-500",
      activeTextColor: "text-white",
      hoverBgColor: "bg-amber-200",
    },
  },
} satisfies Record<string, TableTheme>

export interface AdvancedTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  keyExtractor: (item: T) => string
  title?: string
  description?: string
  enableSearch?: boolean
  enableFilters?: boolean
  enablePagination?: boolean
  enableSelection?: boolean
  enableExport?: boolean
  pageSize?: number
  theme?: keyof typeof tableThemes | TableTheme
  striped?: boolean
  onRowClick?: (item: T) => void
  onSelectionChange?: (selectedIds: string[]) => void
  onExport?: (format: 'csv' | 'pdf' | 'excel') => void
  actions?: React.ReactNode
  emptyState?: React.ReactNode
  isLoading?: boolean
}

export function AdvancedTable<T>({
  data,
  columns,
  keyExtractor,
  title,
  description,
  enableSearch = true,
  enableFilters = true,
  enablePagination = true,
  enableSelection = false,
  enableExport = true,
  pageSize = 10,
  theme = "default",
  striped = false,
  onRowClick,
  onSelectionChange,
  onExport,
  actions,
  emptyState,
  isLoading = false,
}: AdvancedTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const currentTheme = typeof theme === 'string' ? tableThemes[theme] : theme

  // Filter and sort data
  const filteredData = data.filter(item => {
    // Apply search term
    if (searchTerm) {
      const searchableText = columns
        .map(col => {
          const cellValue = col.cell(item)
          return typeof cellValue === 'string' ? cellValue : ''
        })
        .join(' ')
        .toLowerCase()
      
      if (!searchableText.includes(searchTerm.toLowerCase())) {
        return false
      }
    }

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      if (value && value !== 'all') {
        const column = columns.find(col => col.key === key)
        if (column) {
          const cellValue = column.cell(item)
          const stringValue = typeof cellValue === 'string' ? cellValue : String(cellValue)
          if (!stringValue.toLowerCase().includes(value.toLowerCase())) {
            return false
          }
        }
      }
    }

    return true
  })

  // Sort data
  const sortedData = [...filteredData]
  if (sortConfig) {
    sortedData.sort((a, b) => {
      const column = columns.find(col => col.key === sortConfig.key)
      if (!column) return 0

      const aValue = column.cell(a)
      const bValue = column.cell(b)

      // Convert to string for comparison if not already
      const aString = typeof aValue === 'string' ? aValue : String(aValue)
      const bString = typeof bValue === 'string' ? bValue : String(bValue)

      if (aString < bString) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aString > bString) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = enablePagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData

  // Handle selection
  const toggleRowSelection = (id: string) => {
    const newSelection = selectedRows.includes(id)
      ? selectedRows.filter(rowId => rowId !== id)
      : [...selectedRows, id]
    
    setSelectedRows(newSelection)
    onSelectionChange?.(newSelection)
  }

  const toggleAllSelection = () => {
    const allIdsOnPage = paginatedData.map(keyExtractor)
    const newSelection = selectedRows.length === allIdsOnPage.length
      ? []
      : allIdsOnPage
    
    setSelectedRows(newSelection)
    onSelectionChange?.(newSelection)
  }

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters, sortConfig])

  // Handle export
  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    if (onExport) {
      onExport(format)
    } else {
      // Default export behavior
      console.log(`Exporting data as ${format}`, sortedData)
    }
  }

  return (
    <Card className="w-full">
      {(title || description || enableSearch || enableFilters || actions) && (
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              {title && <CardTitle>{title}</CardTitle>}
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            
            <div className="flex items-center gap-2">
              {actions}
              
              {enableExport && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport('csv')}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>Excel</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>PDF</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              <Button variant="outline" size="sm" onClick={() => {
                setSearchTerm('')
                setFilters({})
                setSortConfig(null)
                setCurrentPage(1)
              }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        {/* Search and Filters */}
        {(enableSearch || enableFilters) && (
          <div className="flex flex-col gap-4 mb-4">
            {enableSearch && (
              <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Rechercher..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            
            {enableFilters && (
              <div className="flex flex-wrap gap-2">
                {columns
                  .filter(col => col.filterable)
                  .map(column => (
                    <Select
                      key={column.key}
                      value={filters[column.key] || 'all'}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, [column.key]: value }))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={`Filtrer par ${column.header}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        {/* In a real implementation, you would get unique values from data */}
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="inactive">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  ))}
              </div>
            )}
          </div>
        )}
        
        {/* Table */}
        <div className="rounded-md border" style={{ borderColor: currentTheme.header.borderColor }}>
          <Table>
            <TableHeader style={{ 
              backgroundColor: currentTheme.header.bgColor,
              color: currentTheme.header.textColor,
            }}>
              <TableRow style={{ borderColor: currentTheme.header.borderColor }}>
                {enableSelection && (
                  <TableHead style={{ width: '50px', borderColor: currentTheme.header.borderColor }}>
                    <Checkbox
                      checked={selectedRows.length > 0 && selectedRows.length === paginatedData.length}
                      onCheckedChange={toggleAllSelection}
                    />
                  </TableHead>
                )}
                
                {columns.map(column => (
                  <TableHead 
                    key={column.key}
                    style={{ 
                      width: column.width,
                      borderColor: currentTheme.header.borderColor,
                      cursor: column.sortable ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                      if (column.sortable) {
                        setSortConfig(prev => ({
                          key: column.key,
                          direction: prev?.key === column.key && prev.direction === 'asc' ? 'desc' : 'asc'
                        }))
                      }
                    }}
                  >
                    <div className="flex items-center">
                      {column.header}
                      {column.sortable && (
                        <span className="ml-1">
                          {sortConfig?.key === column.key && (
                            sortConfig.direction === 'asc' ? '↑' : '↓'
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            
            <TableBody style={{ backgroundColor: currentTheme.body.bgColor }}>
              {isLoading ? (
                <TableRow style={{ borderColor: currentTheme.body.borderColor }}>
                  <TableCell 
                    colSpan={columns.length + (enableSelection ? 1 : 0)} 
                    className="h-24 text-center"
                    style={{ color: currentTheme.body.textColor }}
                  >
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow style={{ borderColor: currentTheme.body.borderColor }}>
                  <TableCell 
                    colSpan={columns.length + (enableSelection ? 1 : 0)} 
                    className="h-24 text-center"
                    style={{ color: currentTheme.body.textColor }}
                  >
                    {emptyState || "Aucun résultat trouvé."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, index) => {
                  const rowId = keyExtractor(row)
                  const isSelected = selectedRows.includes(rowId)
                  
                  return (
                    <TableRow
                      key={rowId}
                      data-state={isSelected ? "selected" : ""}
                      style={{ 
                        borderColor: currentTheme.body.borderColor,
                        backgroundColor: striped && index % 2 === 0 
                          ? currentTheme.body.stripedColor || currentTheme.body.bgColor
                          : currentTheme.body.bgColor,
                      }}
                      className={cn(
                        onRowClick && "cursor-pointer",
                        !isLoading && "transition-colors hover:bg-opacity-80"
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {enableSelection && (
                        <TableCell style={{ borderColor: currentTheme.body.borderColor }}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRowSelection(rowId)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                      )}
                      
                      {columns.map(column => (
                        <TableCell 
                          key={column.key} 
                          style={{ 
                            color: currentTheme.body.textColor,
                            borderColor: currentTheme.body.borderColor
                          }}
                        >
                          {column.cell(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination & Info */}
        {(enablePagination || selectedRows.length > 0) && (
          <div 
            className="flex items-center justify-between px-2 py-4 border-t"
            style={{ 
              backgroundColor: currentTheme.footer.bgColor,
              color: currentTheme.footer.textColor,
              borderColor: currentTheme.footer.borderColor
            }}
          >
            <div className="text-sm text-muted-foreground">
              {selectedRows.length > 0 ? (
                <>{selectedRows.length} élément(s) sélectionné(s)</>
              ) : (
                <>
                  {sortedData.length} résultat(s) {enablePagination && `- Page ${currentPage} sur ${totalPages}`}
                </>
              )}
            </div>
            
            {enablePagination && totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    backgroundColor: currentTheme.pagination.bgColor,
                    color: currentTheme.pagination.textColor,
                  }}
                  className="hover:opacity-90"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Show pages around current page
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        backgroundColor: currentPage === pageNum 
                          ? currentTheme.pagination.activeBgColor 
                          : currentTheme.pagination.bgColor,
                        color: currentPage === pageNum 
                          ? currentTheme.pagination.activeTextColor 
                          : currentTheme.pagination.textColor,
                      }}
                      className="hover:opacity-90"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    backgroundColor: currentTheme.pagination.bgColor,
                    color: currentTheme.pagination.textColor,
                  }}
                  className="hover:opacity-90"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
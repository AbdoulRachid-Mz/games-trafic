// utils/export-utils.ts
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export type ExportFormat = 'pdf' | 'excel' | 'csv' | 'json' | 'text'

export interface ExportConfig {
  filename: string
  title?: string
  subtitle?: string
  author?: string
  subject?: string
  orientation?: 'portrait' | 'landscape'
  includeHeaders?: boolean
  dateFormat?: string
  
  // En-tête personnalisé
  header?: {
    logo?: string
    title?: string
    subtitle?: string
    contactInfo?: {
      email?: string
      phone?: string
      address?: string
      website?: string
    }
  }
  
  // Pied de page personnalisé
  footer?: {
    text?: string
    contactInfo?: {
      email?: string
      phone?: string
      address?: string
    }
    pageNumbers?: boolean
  }
  
  // Métadonnées de l'application
  appInfo?: {
    name?: string
    logo?: string
    version?: string
    contact?: {
      email: string
      phone: string
      address: string
    }
  }
}

export interface ColumnConfig {
  key: string
  label: string
  width?: number
  format?: (value: any) => string
  type?: 'text' | 'number' | 'date' | 'currency' | 'boolean' | 'percentage'
  hidden?: boolean
}

export interface ExportData {
  columns: ColumnConfig[]
  data: any[]
  summary?: {
    title: string
    data: Array<{ label: string; value: any; type?: 'text' | 'number' | 'currency' | 'percentage' }>
  }
  metadata?: {
    generatedAt: Date
    generatedBy?: string
    filters?: any
    totalRecords: number
  }
}

// Configuration par défaut de l'application
export const DEFAULT_APP_INFO = {
  name: "Game Trafics",
  logo: "/icons/gt-primary.png",
  version: "2.0.0",
  contact: {
    email: "[EMAIL_ADDRESS]",
    phone: "+221 78 274 40 23",
    address: "Tahoua, Niger"
  }
}

// Formateurs prédéfinis pour tous les types de données
export const Formatters = {
  date: (value: any) => {
    if (!value) return ''
    const date = new Date(value)
    return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('fr-FR')
  },
  
  datetime: (value: any) => {
    if (!value) return ''
    const date = new Date(value)
    return isNaN(date.getTime()) ? String(value) : date.toLocaleString('fr-FR')
  },
  
  currency: (value: any, currency: string = 'EUR') => {
    const num = Number(value) || 0
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(num)
  },
  
  number: (value: any) => {
    return new Intl.NumberFormat('fr-FR').format(Number(value) || 0)
  },
  
  percentage: (value: any) => {
    return `${Number(value) || 0}%`
  },
  
  boolean: (value: any) => {
    return value ? 'Oui' : 'Non'
  },
  
  status: (value: any, mappings: Record<string, string> = {}) => {
    return mappings[value] || String(value || '')
  },
  
  array: (value: any, separator: string = ', ') => {
    if (Array.isArray(value)) {
      return value.join(separator)
    }
    return String(value || '')
  }
}

// Presets de colonnes pour tous les modèles de l'application
export const ColumnPresets = {
  // Utilisateurs
  users: [
    { key: 'username', label: 'Nom d\'utilisateur', type: 'text', width: 25 },
    { key: 'email', label: 'Email', type: 'text', width: 35 },
    { key: 'fullName', label: 'Nom complet', type: 'text', width: 30 },
    { key: 'accountType', label: 'Type de compte', type: 'text', width: 20 },
    { key: 'isVerified', label: 'Vérifié', type: 'boolean', width: 15 },
    { key: 'balance', label: 'Solde', type: 'currency', width: 20 },
    { key: 'createdAt', label: 'Date de création', type: 'date', width: 25 }
  ] as ColumnConfig[],

  // Transactions
  transactions: [
    { key: 'id', label: 'ID Transaction', type: 'text', width: 20 },
    { key: 'amount', label: 'Montant', type: 'currency', width: 20 },
    { key: 'currency', label: 'Devise', type: 'text', width: 15 },
    { key: 'type', label: 'Type', type: 'text', width: 25 },
    { key: 'status', label: 'Statut', type: 'text', width: 20 },
    { key: 'fromUser.username', label: 'Expéditeur', type: 'text', width: 25 },
    { key: 'toUser.username', label: 'Destinataire', type: 'text', width: 25 },
    { key: 'createdAt', label: 'Date', type: 'datetime', width: 25 },
    { key: 'description', label: 'Description', type: 'text', width: 40 }
  ] as ColumnConfig[],

  // Tournois
  tournaments: [
    { key: 'title', label: 'Titre', type: 'text', width: 30 },
    { key: 'game', label: 'Jeu', type: 'text', width: 20 },
    { key: 'status', label: 'Statut', type: 'text', width: 20 },
    { key: 'format', label: 'Format', type: 'text', width: 25 },
    { key: 'currentParticipants', label: 'Participants', type: 'number', width: 15 },
    { key: 'maxParticipants', label: 'Max Participants', type: 'number', width: 15 },
    { key: 'prizePool', label: 'Prize Pool', type: 'currency', width: 20 },
    { key: 'startDate', label: 'Date de début', type: 'date', width: 25 },
    { key: 'organizer.username', label: 'Organisateur', type: 'text', width: 25 }
  ] as ColumnConfig[],

  // Produits
  products: [
    { key: 'title', label: 'Titre', type: 'text', width: 30 },
    { key: 'price', label: 'Prix', type: 'currency', width: 20 },
    { key: 'status', label: 'Statut', type: 'text', width: 20 },
    { key: 'game', label: 'Jeu', type: 'text', width: 20 },
    { key: 'shop.name', label: 'Boutique', type: 'text', width: 25 },
    { key: 'viewCount', label: 'Vues', type: 'number', width: 15 },
    { key: 'likeCount', label: 'Likes', type: 'number', width: 15 },
    { key: 'createdAt', label: 'Date de création', type: 'date', width: 25 }
  ] as ColumnConfig[],

  // Boutiques
  shops: [
    { key: 'name', label: 'Nom', type: 'text', width: 30 },
    { key: 'verified', label: 'Vérifiée', type: 'boolean', width: 15 },
    { key: 'productCount', label: 'Produits', type: 'number', width: 15 },
    { key: 'followerCount', label: 'Abonnés', type: 'number', width: 15 },
    { key: 'balance', label: 'Solde', type: 'currency', width: 20 },
    { key: 'country', label: 'Pays', type: 'text', width: 20 },
    { key: 'createdAt', label: 'Date de création', type: 'date', width: 25 }
  ] as ColumnConfig[],

  // Reçus
  receipts: [
    { key: 'id', label: 'N° Reçu', type: 'text', width: 20 },
    { key: 'amount', label: 'Montant', type: 'currency', width: 20 },
    { key: 'currency', label: 'Devise', type: 'text', width: 15 },
    { key: 'description', label: 'Description', type: 'text', width: 40 },
    { key: 'user.username', label: 'Client', type: 'text', width: 25 },
    { key: 'product.title', label: 'Produit', type: 'text', width: 30 },
    { key: 'createdAt', label: 'Date', type: 'datetime', width: 25 }
  ] as ColumnConfig[],

  // Matchs
  matches: [
    { key: 'matchNumber', label: 'Match #', type: 'text', width: 15 },
    { key: 'participant1.username', label: 'Participant 1', type: 'text', width: 25 },
    { key: 'participant2.username', label: 'Participant 2', type: 'text', width: 25 },
    { key: 'status', label: 'Statut', type: 'text', width: 20 },
    { key: 'result.score1', label: 'Score 1', type: 'number', width: 15 },
    { key: 'result.score2', label: 'Score 2', type: 'number', width: 15 },
    { key: 'winner.username', label: 'Vainqueur', type: 'text', width: 25 },
    { key: 'scheduledTime', label: 'Date prévue', type: 'datetime', width: 25 }
  ] as ColumnConfig[],

  // Demandes de dépôt
  depositRequests: [
    { key: 'id', label: 'ID Demande', type: 'text', width: 20 },
    { key: 'amountReal', label: 'Montant Réel', type: 'currency', width: 20 },
    { key: 'currencyReal', label: 'Devise Réelle', type: 'text', width: 15 },
    { key: 'amountGTC', label: 'Montant GTC', type: 'currency', width: 20 },
    { key: 'status', label: 'Statut', type: 'text', width: 20 },
    { key: 'user.username', label: 'Utilisateur', type: 'text', width: 25 },
    { key: 'createdAt', label: 'Date de demande', type: 'datetime', width: 25 },
    { key: 'justification', label: 'Justification', type: 'text', width: 40 }
  ] as ColumnConfig[],

  // Game Coins
  gameCoins: [
    { key: 'coinName', label: 'Nom des Coins', type: 'text', width: 25 },
    { key: 'game.name', label: 'Jeu', type: 'text', width: 25 },
    { key: 'exchangeRate', label: 'Taux de change', type: 'number', width: 20 },
    { key: 'minOrder', label: 'Commande min', type: 'number', width: 15 },
    { key: 'maxOrder', label: 'Commande max', type: 'number', width: 15 },
    { key: 'availability', label: 'Disponibilité', type: 'text', width: 20 },
    { key: 'popularity', label: 'Popularité', type: 'number', width: 15 }
  ] as ColumnConfig[],

  // Thèmes
  themes: [
    { key: 'name', label: 'Nom', type: 'text', width: 25 },
    { key: 'isPremium', label: 'Premium', type: 'boolean', width: 15 },
    { key: 'price', label: 'Prix', type: 'currency', width: 20 },
    { key: 'category', label: 'Catégorie', type: 'text', width: 20 },
    { key: 'downloads', label: 'Téléchargements', type: 'number', width: 20 },
    { key: 'likes', label: 'Likes', type: 'number', width: 15 },
    { key: 'isPublic', label: 'Public', type: 'boolean', width: 15 }
  ] as ColumnConfig[],

  // Membres de tournoi
  tournamentMembers: [
    { key: 'user.username', label: 'Username', type: 'text', width: 20 },
    { key: 'user.email', label: 'Email', type: 'text', width: 25 },
    { key: 'role', label: 'Rôle', type: 'text', width: 15 },
    { key: 'team.name', label: 'Équipe', type: 'text', width: 20 },
    { key: 'status', label: 'Statut', type: 'text', width: 15 },
    { key: 'createdAt', label: 'Date d\'inscription', type: 'date', width: 20 },
    { key: 'user.fullName', label: 'Nom complet', type: 'text', width: 25, hidden: true }
  ] as ColumnConfig[],

  // Équipes
  teams: [
    { key: 'name', label: 'Nom de l\'équipe', type: 'text', width: 30 },
    { key: 'captain.username', label: 'Capitaine', type: 'text', width: 25 },
    { key: 'createdAt', label: 'Date de création', type: 'date', width: 20 },
    { key: '_count.members', label: 'Membres', type: 'number', width: 15 }
  ] as ColumnConfig[]
}

// Helper pour accéder aux données nested (user.profile.name)
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj)
}

// Formatter une valeur selon sa configuration
const formatValue = (value: any, column: ColumnConfig) => {
  if (column.format) {
    return column.format(value)
  }
  
  switch (column.type) {
    case 'date':
      return Formatters.date(value)
    case 'currency':
      return Formatters.currency(value)
    case 'number':
      return Formatters.number(value)
    case 'percentage':
      return Formatters.percentage(value)
    case 'boolean':
      return Formatters.boolean(value)
    default:
      return String(value || '')
  }
}

// Export PDF avec en-tête et pied de page personnalisés
export const exportToPDF = async (
  exportData: ExportData,
  config: ExportConfig
): Promise<Blob> => {
  return new Promise((resolve) => {
    const doc = new jsPDF({
      orientation: config.orientation || 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 14
    let yPosition = margin

    // ===== EN-TÊTE =====
    if (config.header) {
      // Logo (si fourni)
      if (config.header.logo) {
        // Ici vous pourriez ajouter le logo - pour l'instant on laisse l'espace
        doc.addImage(config.header.logo, 'PNG', margin, yPosition, 30, 30)
        yPosition += 15
      }

      // Titre principal
      if (config.header.title) {
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text(config.header.title, margin, yPosition)
        yPosition += 8
      }

      // Sous-titre
      if (config.header.subtitle) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        doc.text(config.header.subtitle, margin, yPosition)
        yPosition += 6
      }

      // Informations de contact
      if (config.header.contactInfo) {
        doc.setFontSize(8)
        const contactLines = []
        if (config.header.contactInfo.email) contactLines.push(`Email: ${config.header.contactInfo.email}`)
        if (config.header.contactInfo.phone) contactLines.push(`Tél: ${config.header.contactInfo.phone}`)
        if (config.header.contactInfo.address) contactLines.push(`Adresse: ${config.header.contactInfo.address}`)
        
        contactLines.forEach((line, index) => {
          doc.text(line, margin, yPosition + (index * 3))
        })
        yPosition += contactLines.length * 3 + 5
      }

      // Ligne de séparation
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 10
    }

    // Titre du document
    if (config.title) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(config.title, margin, yPosition)
      yPosition += 8
    }

    // Date d'export
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Exporté le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, margin, yPosition)
    yPosition += 15

    // ===== DONNÉES PRINCIPALES =====
    const headers = exportData.columns.map(col => col.label)
    const body = exportData.data.map(row =>
      exportData.columns.map(col => {
        const value = getNestedValue(row, col.key)
        return formatValue(value, col)
      })
    ) as string[][]

    // Génération du tableau
    (doc as any).autoTable({
      startY: yPosition,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 3,
        font: 'helvetica'
      },
      columnStyles: exportData.columns.reduce((styles, col, index) => {
        if (col.width) {
          styles[index] = { cellWidth: col.width }
        }
        return styles
      }, {} as any),
      // Pied de page personnalisé
      didDrawPage: (data: any) => {
        // Pied de page sur chaque page
        const pageCount = doc.getNumberOfPages()
        const currentPage = data.pageNumber
        
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        
        // Informations de contact en bas de page
        const footerY = doc.internal.pageSize.getHeight() - 10
        
        if (config.footer?.contactInfo) {
          const footerText = [
            config.footer.contactInfo.email || DEFAULT_APP_INFO.contact.email,
            config.footer.contactInfo.phone || DEFAULT_APP_INFO.contact.phone,
            config.footer.contactInfo.address || DEFAULT_APP_INFO.contact.address
          ].filter(Boolean).join(' • ')
          
          doc.text(footerText, margin, footerY - 10, { align: 'left' })
        }

        // Numéro de page
        if (config.footer?.pageNumbers !== false) {
          doc.text(`Page ${currentPage}/${pageCount}`, pageWidth - margin, footerY, { align: 'right' })
        }

        // Texte personnalisé du pied de page
        if (config.footer?.text) {
          doc.text(config.footer.text, pageWidth / 2, footerY, { align: 'center' })
        }
      }
    })

    // ===== RÉSUMÉ =====
    if (exportData.summary && (doc as any).lastAutoTable) {
      const finalY = (doc as any).lastAutoTable.finalY + 15
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(exportData.summary.title, margin, finalY)
      
      exportData.summary.data.forEach((item, index) => {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        
        const value = formatValue(item.value, { type: item.type } as ColumnConfig)
        doc.text(`${item.label}: ${value}`, margin, finalY + 10 + (index * 5))
      })
    }

    // Génération du blob
    const blob = doc.output('blob')
    resolve(blob)
  })
}

// Export Excel avec mise en forme
export const exportToExcel = async (
  exportData: ExportData,
  config: ExportConfig
): Promise<Blob> => {
  const workbook = XLSX.utils.book_new()
  
  // Préparation des données
  const headers = exportData.columns.map(col => col.label)
  const data = exportData.data.map(row =>
    exportData.columns.map(col => {
      const value = getNestedValue(row, col.key)
      return formatValue(value, col)
    })
  )

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data])
  
  // Style des colonnes
  if (!worksheet['!cols']) worksheet['!cols'] = []
  exportData.columns.forEach((col, index) => {
    worksheet['!cols']![index] = { width: col.width ? col.width / 5 : 15 }
  })

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Données')

  // Feuille de métadonnées
  const metadataSheet = XLSX.utils.aoa_to_sheet([
    ['MÉTADONNÉES DE L\'EXPORT'],
    ['Titre', config.title],
    ['Fichier', config.filename],
    ['Date d\'export', new Date().toLocaleString('fr-FR')],
    ['Nombre d\'enregistrements', exportData.data.length],
    ['Généré par', config.author || 'Système'],
    [''],
    ['INFORMATIONS DE L\'APPLICATION'],
    ['Nom', DEFAULT_APP_INFO.name],
    ['Version', DEFAULT_APP_INFO.version],
    ['Email', DEFAULT_APP_INFO.contact.email],
    ['Téléphone', DEFAULT_APP_INFO.contact.phone],
    ['Adresse', DEFAULT_APP_INFO.contact.address]
  ])

  XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Métadonnées')

  // Génération du blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
}

// Export CSV
export const exportToCSV = async (
  exportData: ExportData,
  config: ExportConfig
): Promise<Blob> => {
  const headers = exportData.columns.map(col => col.label)
  const rows = exportData.data.map(row =>
    exportData.columns.map(col => {
      const value = getNestedValue(row, col.key)
      const formattedValue = formatValue(value, col)
      
      // Échapper les caractères spéciaux CSV
      const stringValue = String(formattedValue || '')
      if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }).join(';')
  ).join('\n')

  const csvContent = [headers.join(';'), rows].join('\n')
  return new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
}

// Export JSON
export const exportToJSON = async (
  exportData: ExportData,
  config: ExportConfig
): Promise<Blob> => {
  const jsonData = {
    metadata: {
      title: config.title,
      exportDate: new Date().toISOString(),
      author: config.author,
      totalRecords: exportData.data.length,
      appInfo: DEFAULT_APP_INFO
    },
    columns: exportData.columns,
    data: exportData.data,
    summary: exportData.summary
  }

  const jsonContent = JSON.stringify(jsonData, null, 2)
  return new Blob([jsonContent], { type: 'application/json' })
}

// Export Texte
export const exportToText = async (
  exportData: ExportData,
  config: ExportConfig
): Promise<Blob> => {
  let textContent = ''
  
  // En-tête
  textContent += `EXPORT DE DONNÉES - ${DEFAULT_APP_INFO.name}\n`
  textContent += '='.repeat(50) + '\n\n'
  
  if (config.title) {
    textContent += `${config.title}\n`
    textContent += '-'.repeat(config.title.length) + '\n\n'
  }

  textContent += `Exporté le: ${new Date().toLocaleString('fr-FR')}\n`
  textContent += `Nombre d'enregistrements: ${exportData.data.length}\n\n`

  // En-têtes
  const headers = exportData.columns.map(col => col.label.padEnd(20)).join(' | ')
  textContent += headers + '\n'
  textContent += '-'.repeat(headers.length) + '\n'

  // Données
  exportData.data.forEach(row => {
    const rowText = exportData.columns.map(col => {
      const value = getNestedValue(row, col.key)
      const formattedValue = formatValue(value, col)
      return String(formattedValue || '').padEnd(20)
    }).join(' | ')
    
    textContent += rowText + '\n'
  })

  // Pied de page
  textContent += '\n' + '='.repeat(50) + '\n'
  textContent += `${DEFAULT_APP_INFO.contact.email} | ${DEFAULT_APP_INFO.contact.phone} | ${DEFAULT_APP_INFO.contact.address}\n`

  return new Blob([textContent], { type: 'text/plain;charset=utf-8' })
}

// Fonction d'export principale
export const exportData = async (
  format: ExportFormat,
  exportData: ExportData,
  config: ExportConfig
): Promise<void> => {
  // Appliquer les informations par défaut de l'application
  const finalConfig: ExportConfig = {
    ...config,
    appInfo: { ...DEFAULT_APP_INFO, ...config.appInfo },
    header: config.header ? {
      contactInfo: { ...DEFAULT_APP_INFO.contact, ...config.header.contactInfo },
      ...config.header
    } : undefined,
    footer: config.footer ? {
      contactInfo: { ...DEFAULT_APP_INFO.contact, ...config.footer.contactInfo },
      ...config.footer
    } : undefined
  }

  let blob: Blob

  switch (format) {
    case 'pdf':
      blob = await exportToPDF(exportData, finalConfig)
      break
    case 'excel':
      blob = await exportToExcel(exportData, finalConfig)
      break
    case 'csv':
      blob = await exportToCSV(exportData, finalConfig)
      break
    case 'json':
      blob = await exportToJSON(exportData, finalConfig)
      break
    case 'text':
      blob = await exportToText(exportData, finalConfig)
      break
    default:
      throw new Error(`Format non supporté: ${format}`)
  }

  const filename = `${finalConfig.filename}.${getFileExtension(format)}`
  saveAs(blob, filename)
}

// Helper functions
const getFileExtension = (format: ExportFormat): string => {
  const extensions = {
    pdf: 'pdf',
    excel: 'xlsx',
    csv: 'csv',
    json: 'json',
    text: 'txt'
  }
  return extensions[format]
}

// Fonction utilitaire pour créer des données d'export à partir de n'importe quel modèle
export const createExportData = (
  data: any[],
  preset: keyof typeof ColumnPresets | ColumnConfig[],
  customConfig?: {
    summary?: ExportData['summary']
    metadata?: ExportData['metadata']
  }
): ExportData => {
  const columns = Array.isArray(preset) ? preset : ColumnPresets[preset]
  
  return {
    columns,
    data,
    summary: customConfig?.summary,
    metadata: {
      generatedAt: new Date(),
      totalRecords: data.length,
      ...customConfig?.metadata
    }
  }
}

// Presets de configuration pour différents types d'export
export const ExportPresets = {
  receipt: (data: any[]): ExportData => createExportData(data, 'receipts', {
    summary: {
      title: 'Résumé des reçus',
      data: [
        { label: 'Total reçus', value: data.length, type: 'number' },
        { label: 'Montant total', value: data.reduce((sum, r) => sum + (r.amount || 0), 0), type: 'currency' },
        { label: 'Moyenne par reçu', value: data.length > 0 ? data.reduce((sum, r) => sum + (r.amount || 0), 0) / data.length : 0, type: 'currency' }
      ]
    }
  }),

  financialReport: (data: any[]): ExportData => createExportData(data, 'transactions', {
    summary: {
      title: 'Rapport financier',
      data: [
        { label: 'Transactions totales', value: data.length, type: 'number' },
        { label: 'Volume total', value: data.reduce((sum, t) => sum + (t.amount || 0), 0), type: 'currency' },
        { label: 'Transactions réussies', value: data.filter(t => t.status === 'COMPLETED').length, type: 'number' },
        { label: 'Taux de réussite', value: data.length > 0 ? (data.filter(t => t.status === 'COMPLETED').length / data.length) * 100 : 0, type: 'percentage' }
      ]
    }
  }),

  tournamentReport: (data: any[]): ExportData => createExportData(data, 'tournaments', {
    summary: {
      title: 'Rapport des tournois',
      data: [
        { label: 'Total tournois', value: data.length, type: 'number' },
        { label: 'Tournois actifs', value: data.filter(t => t.status === 'LIVE').length, type: 'number' },
        { label: 'Participants totaux', value: data.reduce((sum, t) => sum + (t.currentParticipants || 0), 0), type: 'number' },
        { label: 'Prize Pool total', value: data.reduce((sum, t) => sum + (t.prizePool || 0), 0), type: 'currency' }
      ]
    }
  }),

  salesReport: (data: any[]): ExportData => createExportData(data, 'products', {
    summary: {
      title: 'Rapport des ventes',
      data: [
        { label: 'Produits totales', value: data.length, type: 'number' },
        { label: 'Produits vendus', value: data.filter(p => p.status === 'VENDU').length, type: 'number' },
        { label: 'Valeur totale', value: data.reduce((sum, p) => sum + (p.price || 0), 0), type: 'currency' },
        { label: 'Taux de vente', value: data.length > 0 ? (data.filter(p => p.status === 'VENDU').length / data.length) * 100 : 0, type: 'percentage' }
      ]
    }
  })
}
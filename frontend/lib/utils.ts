// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000)
  const ms = milliseconds % 1000
  
  if (seconds === 0) return `${ms}ms`
  if (seconds < 60) return `${seconds}s ${ms}ms`
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

export function csvExport(data: Record<string, unknown>[] | Record<string, unknown>, title: string): void {
  let csv = ''
  
  if (Array.isArray(data)) {
    if (data.length === 0) return
    
    const keys = Object.keys(data[0])
    csv = keys.map(k => `"${k}"`).join(',') + '\n'
    
    for (const row of data) {
      csv += keys.map(k => {
        const value = row[k]
        if (value === null || value === undefined) return '""'
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',') + '\n'
    }
  } else {
    const entries = Object.entries(data)
    csv = entries.map(([k, v]) => `"${k}","${String(v).replace(/"/g, '""')}"`).join('\n')
  }
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title}-${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getErrorMessage(errorCode: string, language: 'fr' | 'en'): string {
  const messages: Record<string, Record<string, string>> = {
    network: {
      en: 'Network error. Please check your connection.',
      fr: 'Erreur réseau. Veuillez vérifier votre connexion.',
    },
    rate_limit: {
      en: 'Rate limit exceeded. Please wait before trying again.',
      fr: 'Limite de débit dépassée. Veuillez attendre avant de réessayer.',
    },
    auth: {
      en: 'Authentication error. Please refresh the page.',
      fr: 'Erreur d\'authentification. Veuillez rafraîchir la page.',
    },
    upstream: {
      en: 'Service error. Please try again later.',
      fr: 'Erreur de service. Veuillez réessayer plus tard.',
    },
  }
  
  return messages[errorCode]?.[language] || 'An error occurred. Please try again.'
}

export function formatRelativeTime(timestamp: number, language: 'fr' | 'en'): string {
  const locale = language === 'fr' ? fr : enUS
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale })
}

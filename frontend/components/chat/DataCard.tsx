// components/chat/DataCard.tsx
'use client'

import { DataCard as DataCardType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { csvExport } from '@/lib/utils'
import { Copy } from 'lucide-react'
import { useState } from 'react'

interface DataCardProps {
  dataCard: DataCardType
}

export function DataCard({ dataCard }: DataCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyCSV = () => {
    csvExport(dataCard.data, dataCard.title)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '—'
    if (typeof value === 'number') {
      return new Intl.NumberFormat('fr-CM', {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(value)
    }
    return String(value)
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-4 animate-message-enter">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-display font-semibold text-foreground">{dataCard.title}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyCSV}
          className="text-xs"
        >
          <Copy className="w-3 h-3 mr-1" />
          {copied ? 'Copied!' : 'Copy CSV'}
        </Button>
      </div>

      {dataCard.type === 'table' && Array.isArray(dataCard.data) && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {Object.keys(dataCard.data[0] || {}).map((key) => (
                  <th
                    key={key}
                    className="px-3 py-2 text-left font-semibold text-foreground bg-muted/50"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataCard.data.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-muted/20' : ''}>
                  {Object.entries(row).map(([key, value]) => (
                    <td key={`${idx}-${key}`} className="px-3 py-2 text-foreground">
                      {formatValue(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dataCard.type === 'stats' && !Array.isArray(dataCard.data) && (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(dataCard.data).map(([key, value]) => (
            <div key={key} className="p-3 bg-muted/20 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">{key}</p>
              <p className="text-xl font-semibold text-foreground">{formatValue(value)}</p>
            </div>
          ))}
        </div>
      )}

      {dataCard.source && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
          Source: {dataCard.source}
        </p>
      )}
    </div>
  )
}

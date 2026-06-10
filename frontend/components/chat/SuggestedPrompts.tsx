'use client'

import { Button } from '@/components/ui/button'
import { Language } from '@/lib/types'

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void
  language: Language
}

const prompts: Record<Language, string[]> = {
  en: [
    'Show me the latest economic indicators for Cameroon',
    'What are the current education statistics?',
    'Tell me about healthcare accessibility',
    'Compare budget allocations across regions',
  ],
  fr: [
    'Montrez-moi les derniers indicateurs économiques du Cameroun',
    'Quelles sont les statistiques actuelles en matière d\'éducation?',
    'Parlez-moi de l\'accessibilité des soins de santé',
    'Comparez les allocations budgétaires entre les régions',
  ],
}

export function SuggestedPrompts({ onSelect, language }: SuggestedPromptsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {prompts[language].map((prompt, index) => (
        <Button
          key={index}
          variant="outline"
          className="text-xs h-auto py-3 px-2 text-left whitespace-normal hover:bg-primary/5"
          onClick={() => onSelect(prompt)}
        >
          {prompt}
        </Button>
      ))}
    </div>
  )
}

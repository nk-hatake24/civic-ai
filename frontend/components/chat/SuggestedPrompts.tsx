'use client'

import { Button } from '@/components/ui/button'
import { Language } from '@/lib/types'

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void
  language: Language
}

const prompts: Record<Language, string[]> = {

  en: [
    // Déclenche : get_country_info (CM)
    'What is the capital city, region, and income level of Cameroon?',
    
    // Déclenche : get_development_indicator (indicator="Literacy Rate", country_code="CM")
    'What is the adult literacy rate in Cameroon?',
    
    // Déclenche : get_development_indicator (indicator="GDP", country_code="CM")
    'Show me the GDP statistics for Cameroon over the last decade',
    
    // Déclenche : get_development_indicator (indicator="Education Expenditure", country_code="CM")
    'How much does Cameroon spend on education as a percentage of GDP?',
    
    // Déclenche : get_development_indicator (indicator="Primary Enrollment", country_code="CM")
    'What are the primary school net enrollment statistics for Cameroon?'
  ],
  fr: [
    // Déclenche : get_country_info (CM)
    'Quelle est la capitale, la région et le niveau de revenu du Cameroun ?',
    
    // Déclenche : get_development_indicator (indicator="Literacy Rate", country_code="CM")
    'Quel est le taux d’alphabétisation des adultes au Cameroun ?',
    
    // Déclenche : get_development_indicator (indicator="GDP", country_code="CM")
    'Montre-moi l’évolution du PIB du Cameroun ces dix dernières années',
    
    // Déclenche : get_development_indicator (indicator="Education Expenditure", country_code="CM")
    'Quelle est la part du PIB consacrée aux dépenses d’éducation au Cameroun ?',
    
    // Déclenche : get_development_indicator (indicator="Primary Enrollment", country_code="CM")
    'Quelles sont les statistiques de scolarisation au primaire pour le Cameroun ?'
  ]
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

import { Language } from './types'

export type I18nKey =
  | 'new_conversation'
  | 'powered_by'
  | 'last_tool'
  | 'response_time'
  | 'data_source'
  | 'model'
  | 'chat_input_placeholder'
  | 'send'
  | 'copy_csv'
  | 'loading'
  | 'error_sending'
  | 'error_network'
  | 'error_rate_limit'
  | 'error_auth'
  | 'civicai_tagline'
  | 'suggested_prompts'

const translations: Record<Language, Record<I18nKey, string>> = {
  en: {
    new_conversation: 'New Conversation',
    powered_by: 'Powered by Claude',
    last_tool: 'Last Tool Call',
    response_time: 'Response Time',
    data_source: 'Data Source',
    model: 'Model',
    chat_input_placeholder: 'Ask about civic data, policies, or governance...',
    send: 'Send',
    copy_csv: 'Copy CSV',
    loading: 'Loading...',
    error_sending: 'Failed to send message. Please try again.',
    error_network: 'Network error. Please check your connection.',
    error_rate_limit: 'Rate limit exceeded. Please wait before trying again.',
    error_auth: 'Authentication error. Please refresh the page.',
    civicai_tagline: 'Civic Data at Your Fingertips',
    suggested_prompts: 'Suggested prompts',
  },
  fr: {
    new_conversation: 'Nouvelle Conversation',
    powered_by: 'Alimenté par Claude',
    last_tool: 'Dernier Appel d\'Outil',
    response_time: 'Temps de Réponse',
    data_source: 'Source de Données',
    model: 'Modèle',
    chat_input_placeholder: 'Demandez à propos des données civiques, des politiques ou de la gouvernance...',
    send: 'Envoyer',
    copy_csv: 'Copier CSV',
    loading: 'Chargement...',
    error_sending: 'Impossible d\'envoyer le message. Veuillez réessayer.',
    error_network: 'Erreur réseau. Veuillez vérifier votre connexion.',
    error_rate_limit: 'Limite de débit dépassée. Veuillez attendre avant de réessayer.',
    error_auth: 'Erreur d\'authentification. Veuillez rafraîchir la page.',
    civicai_tagline: 'Les Données Civiques à Votre Portée',
    suggested_prompts: 'Suggestions proposées',
  },
}

export function t(key: I18nKey, language: Language): string {
  return translations[language]?.[key] || translations.en[key] || key
}

'use client'

import { TooltipProvider as TooltipProviderBase } from '@/components/ui/tooltip'

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipProviderBase>{children}</TooltipProviderBase>
}

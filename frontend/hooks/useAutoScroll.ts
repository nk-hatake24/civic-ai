'use client'

import { useEffect, useRef } from 'react'

export function useAutoScroll(dependency?: unknown) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [dependency])

  return ref
}

import { createContext, useContext, useState, type ReactNode } from 'react'

type CampusContextValue = {
  campus: string
  setCampus: (campus: string) => void
}

const CampusContext = createContext<CampusContextValue | undefined>(undefined)

export function CampusProvider({ children }: { children: ReactNode }) {
  const [campus, setCampus] = useState<string>('MIT')

  return (
    <CampusContext.Provider value={{ campus, setCampus }}>
      {children}
    </CampusContext.Provider>
  )
}

export function useCampus() {
  const ctx = useContext(CampusContext)
  if (!ctx) {
    throw new Error('useCampus must be used within a CampusProvider')
  }
  return ctx
}


'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface BalanceUpdateContextType {
  lastBalanceUpdate: number
  triggerBalanceUpdate: () => void
}

const BalanceUpdateContext = createContext<BalanceUpdateContextType | undefined>(undefined)

export function BalanceUpdateProvider({ children }: { children: ReactNode }) {
  const [lastBalanceUpdate, setLastBalanceUpdate] = useState(0)

  const triggerBalanceUpdate = () => {
    setLastBalanceUpdate(Date.now())
  }

  return (
    <BalanceUpdateContext.Provider value={{ lastBalanceUpdate, triggerBalanceUpdate }}>
      {children}
    </BalanceUpdateContext.Provider>
  )
}

export function useBalanceUpdate() {
  const context = useContext(BalanceUpdateContext)
  if (context === undefined) {
    throw new Error('useBalanceUpdate must be used within a BalanceUpdateProvider')
  }
  return context
}
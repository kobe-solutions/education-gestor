import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface FinancialVisibilityContextValue {
  hideFinancialData: boolean
  toggleFinancialVisibility: () => void
  setFinancialVisibility: (v: boolean) => void
}

const STORAGE_KEY = 'iris-hide-financial'

function getInitialValue(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'true') return true
  if (stored === 'false') return false
  return false
}

const FinancialVisibilityContext = createContext<FinancialVisibilityContextValue | null>(null)

export function FinancialVisibilityProvider({ children }: { children: ReactNode }) {
  const [hideFinancialData, setHideFinancialData] = useState<boolean>(getInitialValue)

  const setFinancialVisibility = useCallback((v: boolean) => {
    setHideFinancialData(v)
    localStorage.setItem(STORAGE_KEY, String(v))
  }, [])

  const toggleFinancialVisibility = useCallback(() => {
    setFinancialVisibility(!hideFinancialData)
  }, [hideFinancialData, setFinancialVisibility])

  return (
    <FinancialVisibilityContext.Provider value={{ hideFinancialData, toggleFinancialVisibility, setFinancialVisibility }}>
      {children}
    </FinancialVisibilityContext.Provider>
  )
}

export function useFinancialVisibility() {
  const ctx = useContext(FinancialVisibilityContext)
  if (!ctx) throw new Error('useFinancialVisibility must be used inside FinancialVisibilityProvider')
  return ctx
}

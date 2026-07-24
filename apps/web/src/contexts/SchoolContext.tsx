import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface SchoolContextValue {
  activeSchoolId: string | null
  activeSchoolName: string | null
  setActiveSchool: (id: string, name: string) => void
  clearActiveSchool: () => void
}

const SchoolContext = createContext<SchoolContextValue | null>(null)

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(
    () => sessionStorage.getItem('activeSchoolId'),
  )
  const [activeSchoolName, setActiveSchoolName] = useState<string | null>(
    () => sessionStorage.getItem('activeSchoolName'),
  )

  const setActiveSchool = useCallback((id: string, name: string) => {
    sessionStorage.setItem('activeSchoolId', id)
    sessionStorage.setItem('activeSchoolName', name)
    setActiveSchoolId(id)
    setActiveSchoolName(name)
  }, [])

  const clearActiveSchool = useCallback(() => {
    sessionStorage.removeItem('activeSchoolId')
    sessionStorage.removeItem('activeSchoolName')
    setActiveSchoolId(null)
    setActiveSchoolName(null)
  }, [])

  return (
    <SchoolContext.Provider value={{ activeSchoolId, activeSchoolName, setActiveSchool, clearActiveSchool }}>
      {children}
    </SchoolContext.Provider>
  )
}

export function useSchoolContext() {
  const ctx = useContext(SchoolContext)
  if (!ctx) throw new Error('useSchoolContext must be used inside SchoolProvider')
  return ctx
}

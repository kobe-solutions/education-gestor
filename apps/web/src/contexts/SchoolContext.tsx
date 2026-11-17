import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface SchoolContextValue {
  activeSchoolId: string | null
  activeSchoolName: string | null
  setActiveSchool: (id: string, name: string) => void
  clearActiveSchool: () => void
}

const SchoolContext = createContext<SchoolContextValue | null>(null)

export { SchoolContext }

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const previousToken = useRef(token)
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

  useEffect(() => {
    if (previousToken.current === token) return
    previousToken.current = token
    clearActiveSchool()
  }, [token, clearActiveSchool])

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

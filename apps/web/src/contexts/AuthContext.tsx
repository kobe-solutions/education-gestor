import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import type { JwtPayload } from '@education-gestor/types'

interface AuthContextValue {
  token: string | null
  payload: JwtPayload | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parseToken(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem('token')
    if (t && !parseToken(t)) {
      localStorage.removeItem('token')
      return null
    }
    return t
  })
  const [payload, setPayload] = useState<JwtPayload | null>(() => {
    const t = localStorage.getItem('token')
    return t ? parseToken(t) : null
  })

  const login = useCallback((newToken: string) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
    setPayload(parseToken(newToken))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    sessionStorage.clear()
    setToken(null)
    setPayload(null)
  }, [])

  return <AuthContext.Provider value={{ token, payload, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

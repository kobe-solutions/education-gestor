import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import { queryClient } from '../lib/queryClient'
import type { JwtPayload } from '@education-gestor/types'

interface AuthContextValue {
  token: string | null
  payload: JwtPayload | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export { AuthContext }
type DecodedPayload = JwtPayload & { exp?: number }

function parseToken(token: string): DecodedPayload | null {
  try {
    const payload = jwtDecode<DecodedPayload>(token)
    if (payload.exp && payload.exp * 1000 <= Date.now()) return null
    return payload
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
    queryClient.clear()
    sessionStorage.clear()
    setToken(newToken)
    setPayload(parseToken(newToken))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    sessionStorage.clear()
    queryClient.clear()
    setToken(null)
    setPayload(null)
  }, [])

  useEffect(() => {
    if (!token) return
    const decoded = jwtDecode<DecodedPayload>(token)
    if (!decoded.exp) return
    const timeout = window.setTimeout(logout, Math.max(0, decoded.exp * 1000 - Date.now()))
    return () => window.clearTimeout(timeout)
  }, [token, logout])

  return <AuthContext.Provider value={{ token, payload, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

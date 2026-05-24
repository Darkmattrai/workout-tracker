import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  getSession,
  saveSession,
  clearSession,
  createUser,
  verifyCredentials,
  emailExists,
  migrateLegacyData,
  type AuthSession,
} from '../lib/auth'

interface AuthContextValue {
  session: AuthSession | null
  isLoading: boolean
  signup: (name: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const existing = getSession()
    setSession(existing)
    setIsLoading(false)
  }, [])

  const signup = async (name: string, email: string, password: string) => {
    if (emailExists(email)) throw new Error('An account with this email already exists.')
    const user = await createUser(name, email, password)
    // Migrate any legacy localStorage data to this account
    migrateLegacyData(user.id)
    const s = saveSession(user)
    setSession(s)
  }

  const login = async (email: string, password: string) => {
    const user = await verifyCredentials(email, password)
    if (!user) throw new Error('Incorrect email or password.')
    const s = saveSession(user)
    setSession(s)
  }

  const logout = () => {
    clearSession()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, isLoading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api, getAccessToken, setTokens, clearTokens } from './api'
import { signInWithGoogle } from './firebase'
import type { Tone } from './theme'

export interface AuthUser {
  id: string
  name: string
  email: string
  handle?: string
  avatarUrl?: string
  tone: Tone
  plan: string
  role: string
  storageUsed: number
  storageTotal: number
  initials: string
  emailVerified?: boolean
}

function toUser(raw: any): AuthUser {
  const name: string = raw?.name ?? 'Người dùng'
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .join('') || 'U'
  return {
    id: raw.id,
    name,
    email: raw.email,
    handle: raw.handle,
    avatarUrl: raw.avatarUrl,
    tone: (raw.tone as Tone) ?? 'indigo',
    plan: raw.plan ?? 'Free',
    role: raw.role ?? 'customer',
    storageUsed: raw.storageUsed ?? 0,
    storageTotal: raw.storageTotal ?? 15 * 1024 ** 3,
    initials,
    emailVerified: raw.emailVerified,
  }
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  googleLogin: () => Promise<void>
  register: (b: { email: string; password: string; name: string }) => Promise<{ requiresVerification: true; email: string; devOtp?: string }>
  verifyEmail: (email: string, code: string) => Promise<void>
  resendOtp: (email: string) => Promise<void>
  forgotPassword: (email: string) => Promise<{ devOtp?: string }>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      if (!getAccessToken()) { setLoading(false); return }
      try {
        const me = await api.me()
        if (active) setUser(toUser(me))
      } catch {
        if (active) clearTokens()
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  async function login(email: string, password: string) {
    const res = await api.login({ email, password })
    setTokens(res.accessToken, res.refreshToken)
    setUser(toUser(res.user))
  }

  async function googleLogin() {
    const idToken = await signInWithGoogle()
    const res = await api.google(idToken)
    setTokens(res.accessToken, res.refreshToken)
    setUser(toUser(res.user))
  }

  async function register(b: { email: string; password: string; name: string }) {
    return api.register(b) as Promise<{ requiresVerification: true; email: string; devOtp?: string }>
  }

  async function verifyEmail(email: string, code: string) {
    const res = await api.verifyEmail({ email, code })
    setTokens(res.accessToken, res.refreshToken)
    setUser(toUser(res.user))
  }

  async function resendOtp(email: string) {
    await api.resendOtp(email)
  }
  async function forgotPassword(email: string) {
    return api.forgotPassword(email) as Promise<{ devOtp?: string }>
  }
  async function resetPassword(email: string, code: string, newPassword: string) {
    await api.resetPassword({ email, code, newPassword })
  }

  async function logout() {
    try { await api.logout() } catch { /* ignore */ }
    clearTokens()
    setUser(null)
  }

  async function refreshUser() {
    try { setUser(toUser(await api.me())) } catch { /* ignore */ }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, verifyEmail, resendOtp, forgotPassword, resetPassword, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải nằm trong <AuthProvider>')
  return ctx
}

/** Bảo vệ route /app — chuyển về /login nếu chưa đăng nhập. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}

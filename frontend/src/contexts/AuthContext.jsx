import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch } from '../api'

const AuthContext = createContext(null)
const storageKey = 'ksd-auth-token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(storageKey))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    apiFetch('/auth/me', { token })
      .then(setUser)
      .catch(() => {
        setToken(null)
        localStorage.removeItem(storageKey)
      })
      .finally(() => setLoading(false))
  }, [token])

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAdmin: user?.role === 'admin',
      isAuthenticated: Boolean(user),
      async login(email, password) {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })
        localStorage.setItem(storageKey, data.token)
        setToken(data.token)
        setUser(data.user)
      },
      logout() {
        setToken(null)
        setUser(null)
        localStorage.removeItem(storageKey)
      },
      async refreshMe() {
        if (!token) return null
        const me = await apiFetch('/auth/me', { token })
        setUser(me)
        return me
      },
      async register(payload) {
        return apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      },
    }),
    [loading, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

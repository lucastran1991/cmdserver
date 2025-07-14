import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  user: any | null
  isAuthenticated: boolean
  setToken: (token: string) => void
  setUser: (user: any) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setToken: (token: string) => {
        set({ token, isAuthenticated: true })
        // Store token in localStorage as well
        localStorage.setItem('access_token', token)
      },
      setUser: (user: any) => {
        set({ user })
      },
      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
        localStorage.removeItem('access_token')
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
)

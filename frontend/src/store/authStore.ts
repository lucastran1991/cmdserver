import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: string;
  [key: string]: unknown;
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  setToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setToken: (token: string) => {
        set({ token, isAuthenticated: true })
        // Store token in localStorage as well
        localStorage.setItem('access_token', token)
      },
      setUser: (user: User) => {
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

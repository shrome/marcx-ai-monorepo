"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { trpc } from "@/trpc/client"

interface User {
  id: string
  email: string
  name: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, name: string, password: string) => Promise<{ message: string }>
  sendOtp: (email: string) => Promise<void>
  verifyOtp: (email: string, code: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loginMutation = trpc.auth.login.useMutation()
  const registerMutation = trpc.auth.register.useMutation()
  const sendOtpMutation = trpc.auth.sendOtp.useMutation()
  const verifyOtpMutation = trpc.auth.verifyOtp.useMutation()
  const logoutMutation = trpc.auth.logout.useMutation()

  useEffect(() => {
    // Check for stored user in localStorage (demo only)
    const stored = localStorage.getItem("demo_user")
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const result = await loginMutation.mutateAsync({ email, password })
    setUser(result.user)
    localStorage.setItem("demo_user", JSON.stringify(result.user))
  }

  const register = async (email: string, name: string, password: string) => {
    const result = await registerMutation.mutateAsync({ email, name, password })
    return { message: result.message }
  }

  const sendOtp = async (email: string) => {
    await sendOtpMutation.mutateAsync({ email })
  }

  const verifyOtp = async (email: string, code: string) => {
    const result = await verifyOtpMutation.mutateAsync({ email, code })
    setUser(result.user)
    localStorage.setItem("demo_user", JSON.stringify(result.user))
  }

  const logout = async () => {
    await logoutMutation.mutateAsync()
    setUser(null)
    localStorage.removeItem("demo_user")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        sendOtp,
        verifyOtp,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

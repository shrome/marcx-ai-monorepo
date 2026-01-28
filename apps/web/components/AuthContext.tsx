"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import {
  useLogin,
  useRegister,
  useSendOtp,
  useLogout,
  useCurrentUser,
} from "@/hooks/useAuthQueries"
import type { AuthResponse } from "@/lib/backend/types"

interface User {
  id: string
  email: string
  name?: string | null
  image?: string | null
  role: string
  emailVerified: boolean
  companyId?: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string) => Promise<void>
  register: (email: string, name: string) => Promise<{ message: string }>
  sendOtp: (email: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const loginMutation = useLogin()
  const registerMutation = useRegister()
  const sendOtpMutation = useSendOtp()
  const logoutMutation = useLogout()
  const { data: currentUserData, isLoading: isLoadingUser } = useCurrentUser()

  useEffect(() => {
    // Sync user state with current user query
    if (currentUserData?.user) {
      setUser(currentUserData.user)
    } else {
      setUser(null)
    }
  }, [currentUserData])

  const login = async (email: string) => {
    // Login now sends OTP, doesn't return user immediately
    await loginMutation.mutateAsync({ email })
  }

  const register = async (email: string, name: string) => {
    const result = await registerMutation.mutateAsync({ email, name })
    return { message: result.message || "Registration successful! Please verify your email." }
  }

  const sendOtp = async (email: string) => {
    await sendOtpMutation.mutateAsync({ email })
  }

  const logout = async () => {
    await logoutMutation.mutateAsync()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoadingUser,
        login,
        register,
        sendOtp,
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

"use client"

import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useCurrentUser, useLogout } from "@/hooks/useAuthQueries"
import { Loader2 } from "lucide-react"

interface AuthGuardContextType {
  user: any
  isLoading: boolean
  isAuthenticated: boolean
  hasCompany: boolean
}

const AuthGuardContext = createContext<AuthGuardContextType | undefined>(undefined)

interface AuthGuardProviderProps {
  children: ReactNode
  requireAuth?: boolean
  requireCompany?: boolean
}

/**
 * Provider that handles authentication checks and redirects
 * - If requireAuth is true: redirects to /login if no session
 * - If requireCompany is true: redirects to /register/company if no company
 */
export function AuthGuardProvider({ 
  children, 
  requireAuth = true,
  requireCompany = true 
}: AuthGuardProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { data: currentUser, isLoading } = useCurrentUser()
  const logoutMutation = useLogout()

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return

    // Check if auth is required
    if (requireAuth) {
      // No user session - logout and redirect to login
      if (!currentUser?.user) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
        return
      }

      // Check if company is required
      if (requireCompany && !currentUser.user.companyId) {
        router.push("/register/company")
        return
      }
    }
  }, [currentUser, isLoading, router, pathname, requireAuth, requireCompany, logoutMutation])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If require auth and no user, show nothing (will redirect)
  if (requireAuth && !currentUser?.user) {
    return null
  }

  // If require company and no company, show nothing (will redirect)
  if (requireCompany && !currentUser?.user?.companyId) {
    return null
  }

  const value: AuthGuardContextType = {
    user: currentUser?.user,
    isLoading,
    isAuthenticated: !!currentUser?.user,
    hasCompany: !!currentUser?.user?.companyId,
  }

  return (
    <AuthGuardContext.Provider value={value}>
      {children}
    </AuthGuardContext.Provider>
  )
}

/**
 * Hook to access auth guard context
 */
export function useAuthGuard() {
  const context = useContext(AuthGuardContext)
  if (context === undefined) {
    throw new Error("useAuthGuard must be used within an AuthGuardProvider")
  }
  return context
}

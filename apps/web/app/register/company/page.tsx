"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CompanyForm } from "@/components/auth/CompanyForm"
import { useCurrentUser } from "@/hooks/useAuthQueries"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/components/AuthContext"

export default function CompanySetupPage() {
  const router = useRouter()
  const { data: currentUser, isLoading } = useCurrentUser()
  const { logout } = useAuth()

  useEffect(() => {
    if (isLoading) return

    // No session at all - logout and redirect to login
    if (!currentUser?.user) {
      logout().then(() => {
        router.push("/login")
      })
      return
    }

    // Already has company - redirect to chat
    if (currentUser.user.companyId) {
      router.push("/chat")
      return
    }

    // Has session but no company - stay on this page (correct state)
  }, [currentUser, isLoading, router, logout])

  const handleCompanySetupComplete = () => {
    router.push("/chat")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentUser?.user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <CompanyForm onSuccess={handleCompanySetupComplete} />
    </div>
  )
}

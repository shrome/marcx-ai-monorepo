import type React from "react"
import { AuthGuardProvider } from "@/components/AuthGuard"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuardProvider requireAuth={true} requireCompany={true}>
      {children}
    </AuthGuardProvider>
  )
}

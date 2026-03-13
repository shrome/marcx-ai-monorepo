import type React from "react"
import { AuthGuardProvider } from "@/components/AuthGuard"
import { AppLayout } from "@/components/layout/AppLayout"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuardProvider requireAuth={true} requireCompany={true}>
      <AppLayout>{children}</AppLayout>
    </AuthGuardProvider>
  )
}

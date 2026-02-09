"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { trpc } from "@/trpc/client"
import { CompanyForm } from "./CompanyForm"
import { toast } from "sonner"
import { Loader2, Mail } from "lucide-react"
import Link from "next/link"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export function LoginForm() {
  const router = useRouter()
  const loginMutation = trpc.auth.login.useMutation()
  const verifyOtpMutation = trpc.auth.verifyLoginOtp.useMutation()
  const { data: currentUser } = trpc.user.getCurrentUser.useQuery(undefined, { retry: false })

  const [step, setStep] = useState<"email" | "verify">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")

  // Redirect if already logged in AND has company
  useEffect(() => {
    if (currentUser?.user && currentUser.user.companyId) {
      router.push("/chat")
    } else if (currentUser?.user && !currentUser.user.companyId) {
      router.push("/register/company");
    }
  }, [currentUser, router])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await loginMutation.mutateAsync({ email })
      toast.success("OTP sent! Check console for demo code")
      setStep("verify")
    } catch (error: any) {
      toast.error(error?.message || "Failed to send OTP")
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) return
    try {
      const result = await verifyOtpMutation.mutateAsync({ email, code: otp })
      toast.success("Welcome back!")
      
      // Check if user needs company setup
      if (result.requiresCompanySetup) {
        router.push("/register/company")
      } else {
        router.push("/chat")
      }
    } catch (error: any) {
      toast.error(error?.message || "Invalid OTP")
    }
  }

  const isLoading = loginMutation.isPending || verifyOtpMutation.isPending

  if (step === "verify") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verify your email</CardTitle>
          <CardDescription>We sent a verification code to {email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="flex justify-center py-4">
              <InputOTP value={otp} onChange={setOtp} maxLength={6}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="text-center text-sm text-muted-foreground">Check browser console for demo OTP code</p>
            <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
              {verifyOtpMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Sign In
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("email")}>
              Use different email
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send OTP
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          {"Don't have an account? "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

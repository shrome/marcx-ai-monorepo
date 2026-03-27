"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRegister, useVerifyRegistrationOtp, useCurrentUser, useSendOtp } from "@/hooks/useAuthQueries"
import { toast } from "sonner"
import { Loader2, Mail, User } from "lucide-react"
import Link from "next/link"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

const RESEND_COOLDOWN = 60

export function RegisterForm() {
  const router = useRouter()
  const registerMutation = useRegister()
  const verifyOtpMutation = useVerifyRegistrationOtp()
  const sendOtpMutation = useSendOtp()
  const { data: currentUser } = useCurrentUser()

  const [step, setStep] = useState<"register" | "verify">("register")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [otp, setOtp] = useState("")
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (currentUser?.user && currentUser.user.companyId) {
      router.push("/chat")
    } else if (currentUser?.user && !currentUser.user.companyId) {
      router.push("/register/company")
    }
  }, [currentUser, router])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await registerMutation.mutateAsync({ email, name })
      toast.success("Account created! Check your email for the verification code.")
      setStep("verify")
      setCooldown(RESEND_COOLDOWN)
    } catch (error: any) {
      toast.error(error?.message || "Registration failed. Please try again.")
    }
  }

  const handleResendOtp = useCallback(async () => {
    try {
      await sendOtpMutation.mutateAsync({ email })
      toast.success("A new OTP has been sent to your email.")
      setCooldown(RESEND_COOLDOWN)
    } catch (error: any) {
      toast.error(error?.message || "Failed to resend OTP. Please try again.")
    }
  }, [email, sendOtpMutation])

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) return
    try {
      const result = await verifyOtpMutation.mutateAsync({ email, code: otp })
      toast.success("Email verified! Setting up your account...")
      if (result.requiresCompanySetup) {
        router.push("/register/company")
      } else {
        router.push("/chat")
      }
    } catch (error: any) {
      toast.error(error?.message || "Invalid or expired OTP. Please try again.")
    }
  }

  const isLoading = registerMutation.isPending || verifyOtpMutation.isPending

  if (step === "verify") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
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
            <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
              {verifyOtpMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Continue
            </Button>
            <div className="flex items-center justify-between text-sm">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setStep("register"); setOtp("") }}>
                Use different email
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendOtp}
                disabled={cooldown > 0 || sendOtpMutation.isPending}
              >
                {sendOtpMutation.isPending
                  ? "Sending..."
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend OTP"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Start your AI accounting journey</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
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
            {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

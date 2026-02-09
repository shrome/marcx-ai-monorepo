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
import { Loader2, Mail, User } from "lucide-react"
import Link from "next/link"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

export function RegisterForm() {
  const router = useRouter()
  const registerMutation = trpc.auth.register.useMutation()
  const verifyOtpMutation = trpc.auth.verifyRegistrationOtp.useMutation()
  const { data: currentUser } = trpc.user.getCurrentUser.useQuery(undefined, { retry: false })

  const [step, setStep] = useState<"register" | "verify">("register")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [otp, setOtp] = useState("")

  // Redirect if already logged in AND has company
  useEffect(() => {
    if (currentUser?.user && currentUser.user.companyId) {
      router.push("/chat")
    } else if (currentUser?.user && !currentUser.user.companyId) {
      router.push("/register/company");
    }
  }, [currentUser, router])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await registerMutation.mutateAsync({ email, name })
      toast.success("Registration successful! Please verify your email.")
      setStep("verify")
    } catch (error: any) {
      toast.error(error?.message || "Registration failed")
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) return
    try {
      const result = await verifyOtpMutation.mutateAsync({ email, code: otp })
      toast.success("Email verified! Welcome!")
      
      // Check if user needs company setup
      if (result.requiresCompanySetup) {
        router.push("/register/company")
      } else {
        router.push("/chat")
      }
    } catch (error: any) {
      toast.error(error?.message || "Invalid verification code")
    }
  }

  const isLoading = registerMutation.isPending || verifyOtpMutation.isPending

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
              Verify Email
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Start chatting with AI in seconds</CardDescription>
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

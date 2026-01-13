import { RegisterForm } from "@/components/auth/RegisterForm"
import { MessageSquare } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary-foreground">
          <MessageSquare className="h-8 w-8" />
          <span className="text-xl font-bold">AI Chat</span>
        </Link>
        <div>
          <h1 className="text-4xl font-bold text-primary-foreground mb-4 text-balance">Start your AI journey today</h1>
          <p className="text-primary-foreground/80 text-lg">
            Create an account to save your conversations and access your files from anywhere.
          </p>
        </div>
        <p className="text-primary-foreground/60 text-sm">Free to start, no credit card required</p>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <RegisterForm />
      </div>
    </div>
  )
}

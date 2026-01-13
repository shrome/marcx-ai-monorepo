import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, HardDrive, Sparkles, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">AI Chat</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-balance">Chat with AI, Store Your Files</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          A powerful AI assistant combined with secure file storage. Upload documents, images, and more to get
          intelligent insights.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              <Sparkles className="h-5 w-5" />
              Start for Free
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Chat Sessions</h3>
            <p className="text-muted-foreground">
              Create multiple chat sessions, upload files, and get intelligent responses powered by advanced AI.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <HardDrive className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">File Storage</h3>
            <p className="text-muted-foreground">
              Organize your files in folders, preview images, and access your documents from anywhere.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Secure Auth</h3>
            <p className="text-muted-foreground">
              Sign in with email and password, OTP verification, or Google OAuth for seamless access.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-5 w-5" />
              <span>AI Chat</span>
            </div>
            <p className="text-sm text-muted-foreground">Built with Next.js, tRPC, and Vercel Blob</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

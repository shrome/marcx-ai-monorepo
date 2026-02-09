import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { TRPCProvider } from "@/trpc/client"
import { AuthProvider } from "@/components/AuthContext"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"
import { getReactQueryHelper } from "@/trpc/server"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Chat | Your Intelligent Assistant",
  description: "Chat with AI, upload files, and manage your documents in one place",
    generator: 'v0.app'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const helper = await getReactQueryHelper();

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <TRPCProvider>
          <HydrationBoundary
            state={dehydrate(helper.queryClient)}
            options={{
              defaultOptions: {
                queries: {
                  gcTime: Infinity,
                },
              },
            }}
          >
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </HydrationBoundary>
        </TRPCProvider>
      </body>
    </html>
  );
}

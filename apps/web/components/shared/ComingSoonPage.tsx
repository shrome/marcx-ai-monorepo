"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

interface ComingSoonPageProps {
  title: string
  description: string
  icon: React.ReactNode
}

export function ComingSoonPage({ title, description, icon }: ComingSoonPageProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="h-20 w-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-6 text-gray-400">
        {icon}
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0f1b2e]/8 text-[#0f1b2e] text-xs font-semibold mb-4 border border-[#0f1b2e]/10">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
        Coming Soon
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>
      <p className="text-sm text-gray-500 max-w-sm leading-relaxed">{description}</p>
      <button
        onClick={() => router.back()}
        className="mt-8 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Go back
      </button>
    </div>
  )
}

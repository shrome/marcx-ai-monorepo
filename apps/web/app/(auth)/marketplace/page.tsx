"use client"

import { Store } from "lucide-react"
import { ComingSoonPage } from "@/components/shared/ComingSoonPage"

export default function MarketplacePage() {
  return (
    <ComingSoonPage
      title="Marketplace"
      description="Discover and integrate third-party apps, plugins, and extensions to supercharge your PIO{AI} workspace."
      icon={<Store className="h-9 w-9" />}
    />
  )
}

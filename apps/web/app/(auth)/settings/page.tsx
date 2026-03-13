"use client"

import { Settings } from "lucide-react"
import { ComingSoonPage } from "@/components/shared/ComingSoonPage"

export default function SettingsPage() {
  return (
    <ComingSoonPage
      title="Settings"
      description="Customise your workspace, manage team permissions, and configure integrations — all in one place."
      icon={<Settings className="h-9 w-9" />}
    />
  )
}

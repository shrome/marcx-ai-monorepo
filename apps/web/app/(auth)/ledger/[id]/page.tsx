"use client"

import { useParams } from "next/navigation"
import { LedgerPage } from "@/components/ledger/LedgerPage"

export default function LedgerDetailRoute() {
  const params = useParams()
  return <LedgerPage id={params.id as string} />
}

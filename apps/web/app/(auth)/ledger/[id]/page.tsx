import { LedgerPage } from "@/components/ledger/LedgerPage"

interface Props {
  params: Promise<{ id: string }>
}

export default async function LedgerDetailRoute({ params }: Props) {
  const { id } = await params
  return <LedgerPage ledgerId={id} />
}

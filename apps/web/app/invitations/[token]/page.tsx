import { AcceptInvitationPage } from "@/components/auth/AcceptInvitationPage"

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitationPage({ params }: Props) {
  const { token } = await params
  return <AcceptInvitationPage token={token} />
}

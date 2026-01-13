import { streamText } from "ai"

export async function POST(req: Request) {
  const { messages, attachments } = await req.json()

  // Build context from attachments if any
  let systemContext = "You are a helpful AI assistant."
  if (attachments && attachments.length > 0) {
    systemContext +=
      "\n\nThe user has attached the following files: " +
      attachments.map((a: { name: string; type: string }) => `${a.name} (${a.type})`).join(", ")
  }

  const result = streamText({
    model: "openai/gpt-4o-mini",
    system: systemContext,
    messages,
  })

  return result.toUIMessageStreamResponse()
}

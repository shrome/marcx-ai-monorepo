import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "@/trpc/routers"
import { createTRPCContext } from "@/trpc/init"
import { NextRequest, NextResponse } from "next/server"

const handler = async (req: NextRequest) => {
  // Create context
  const context = await createTRPCContext({ headers: req.headers })
  
  // Handle the tRPC request
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => context,
  })
  
  // Get response headers from context (cookies set during mutations)
  const responseHeaders = context.responseHeaders.getAll()
  
  // Create NextResponse from the tRPC response
  const nextResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
  
  console.log("Response Headers to set:", responseHeaders, response);
  console.log("Original Response Headers:", nextResponse, nextResponse.headers);
  // Add custom headers (cookies) if any were set during mutations
  if (Object.keys(responseHeaders).length > 0) {
    Object.entries(responseHeaders).forEach(([key, value]) => {
      nextResponse.headers.set(key, value)
    })
  }
  
  return nextResponse
}

export { handler as GET, handler as POST }

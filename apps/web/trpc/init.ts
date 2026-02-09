import { initTRPC, TRPCError } from "@trpc/server"
import superjson from "superjson"
import { getUserServerSession } from "@/lib/server/auth"

/**
 * Response headers storage for setting cookies
 * This allows mutations to set cookies that will be sent to the client
 */
class ResponseHeaders {
  private headers: Map<string, string> = new Map()

  set(name: string, value: string) {
    this.headers.set(name, value)
  }

  getAll(): Record<string, string> {
    return Object.fromEntries(this.headers)
  }

  setCookie(name: string, value: string, options: {
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'lax' | 'strict' | 'none'
    maxAge?: number
    path?: string
  } = {}) {
    const {
      httpOnly = true,
      secure = process.env.NODE_ENV === 'production',
      sameSite = 'lax',
      maxAge,
      path = '/',
    } = options

    const cookieParts = [
      `${name}=${value}`,
      `Path=${path}`,
      `SameSite=${sameSite}`,
    ]

    if (httpOnly) cookieParts.push('HttpOnly')
    if (secure) cookieParts.push('Secure')
    if (maxAge !== undefined) cookieParts.push(`Max-Age=${maxAge}`)

    const existingCookies = this.headers.get('Set-Cookie') || ''
    const newCookie = cookieParts.join('; ')
    
    // Append to existing Set-Cookie header (multiple cookies)
    this.headers.set('Set-Cookie', existingCookies ? `${existingCookies}, ${newCookie}` : newCookie)
  }

  deleteCookie(name: string, options: { path?: string } = {}) {
    // To delete a cookie, set it with Max-Age=0
    this.setCookie(name, '', {
      maxAge: 0,
      path: options.path || '/',
    })
  }
}

/**
 * Create tRPC context with user session and response headers
 * This runs for every tRPC request and provides authentication context
 */
export const createTRPCContext = async (opts?: { headers?: Headers }) => {
  const session = await getUserServerSession()
  const responseHeaders = new ResponseHeaders()
  
  return {
    session,
    headers: opts?.headers,
    responseHeaders,
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Include more detailed error info in development
        message: error.message,
      },
    }
  },
})

export const { createCallerFactory, router } = t;

/**
 * Public procedure - no authentication required
 * Session is still available if user is logged in
 */
export const publicProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user){
    return next({
      ctx: {
        session: null,
        user: null,
        responseHeaders: ctx.responseHeaders,
      },
    });
  }
  
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
      responseHeaders: ctx.responseHeaders,
    },
  })
})

/**
 * Protected procedure - requires valid authentication
 * Ensures user session exists before proceeding
 * Automatically handles token refresh via getUserServerSession
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  console.log(ctx)
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ 
      code: "UNAUTHORIZED", 
      message: "Authentication required. Please log in." 
    })
  }
  
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
      responseHeaders: ctx.responseHeaders,
    },
  })
})

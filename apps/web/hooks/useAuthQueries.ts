import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createBackendClient } from "@/lib/backend"
import type { LoginDto, RegisterDto, SendOtpDto, VerifyOtpDto, AuthResponse, VerifyOtpResponse } from "@/lib/backend/types"

// Create backend client instance with auth error handling
const backend = createBackendClient({
  onAuthError: () => {
    // Handle auth errors - this will be called when refresh token expires
    // The query cache will be invalidated by the useCurrentUser query
    // returning null, which will trigger the AuthContext to clear the user state
  },
})

// Query keys for caching
export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "currentUser"] as const,
}

/**
 * Check if a cookie exists
 */
function hasCookie(name: string): boolean {
  if (typeof document === 'undefined') {
    return false; // Server-side, can't check cookies
  }
  const cookies = document.cookie.split(';');
  return cookies.some(cookie => cookie.trim().startsWith(`${name}=`));
}

/**
 * Hook to get the current authenticated user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async () => {
      try {
        return await backend.user.getCurrentUser();
      } catch (error) {
        // If not authenticated, return null instead of throwing
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook to login with email and password
 */
export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: LoginDto) => {
      return await backend.auth.login(data)
    },
    onSuccess: (data) => {
      // Update the current user cache
      queryClient.setQueryData(authKeys.currentUser(), data)
      // Store user in localStorage for demo
      if (typeof window !== "undefined") {
        localStorage.setItem("demo_user", JSON.stringify(data.user))
      }
    },
  })
}

/**
 * Hook to register a new user
 */
export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterDto) => {
      return await backend.auth.register(data)
    },
  })
}

/**
 * Hook to send OTP to email
 */
export function useSendOtp() {
  return useMutation({
    mutationFn: async (data: SendOtpDto) => {
      return await backend.auth.sendOtp(data)
    },
  })
}

/**
 * Hook to verify registration OTP (email verification)
 */
export function useVerifyRegistrationOtp() {
  const queryClient = useQueryClient()

  return useMutation<VerifyOtpResponse, Error, VerifyOtpDto>({
    mutationFn: async (data: VerifyOtpDto) => {
      return await backend.auth.verifyRegistrationOtp(data)
    },
    onSuccess: (data) => {
      // Update the current user cache since user is now logged in
      queryClient.setQueryData(authKeys.currentUser(), { user: data.user })
    },
  })
}

/**
 * Hook to verify login OTP
 */
export function useVerifyLoginOtp() {
  const queryClient = useQueryClient()

  return useMutation<VerifyOtpResponse, Error, VerifyOtpDto>({
    mutationFn: async (data: VerifyOtpDto) => {
      return await backend.auth.verifyLoginOtp(data)
    },
    onSuccess: (data) => {
      // Update the current user cache
      queryClient.setQueryData(authKeys.currentUser(), { user: data.user })
    },
  })
}

/**
 * Hook to logout
 */
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return await backend.auth.logout()
    },
    onSuccess: () => {
      // Clear the current user cache
      queryClient.setQueryData(authKeys.currentUser(), null)
      // Invalidate all queries
      queryClient.invalidateQueries({ queryKey: authKeys.all })
    },
  })
}

/**
 * Hook to refresh access token
 */
export function useRefreshToken() {
  return useMutation({
    mutationFn: async () => {
      return await backend.auth.refreshToken()
    },
  })
}

/**
 * Hook to revoke current token
 */
export function useRevokeToken() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return await backend.auth.revokeToken()
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.currentUser(), null)
    },
  })
}

/**
 * Hook to revoke all tokens
 */
export function useRevokeAllTokens() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      return await backend.auth.revokeAllTokens()
    },
    onSuccess: () => {
      queryClient.setQueryData(authKeys.currentUser(), null)
      queryClient.invalidateQueries({ queryKey: authKeys.all })
    },
  })
}

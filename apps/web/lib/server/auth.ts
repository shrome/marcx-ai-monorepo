import { cookies, headers } from 'next/headers';
import { cache } from 'react';
import { createBackendClient } from '@/lib/backend';

/**
 * Get user session from server-side
 * This function checks for access and refresh tokens, and handles token refresh automatically
 * 
 * Flow:
 * 1. Check for accessToken and refreshToken in cookies or Authorization header
 * 2. If both exist or only accessToken exists -> validate and return user
 * 3. If only refreshToken exists -> refresh access token -> validate and return user
 * 4. If neither exist -> return null (unauthenticated)
 */
export const getUserServerSession = cache(async () => {
  try {
    const cookieStore = await cookies();
    const headersList = await headers();
    
    // Check Authorization header first (for API calls)
    const authHeader = headersList.get('Authorization');
    let accessToken = authHeader?.replace('Bearer ', '');
    
    // Fallback to cookies
    if (!accessToken) {
      accessToken = cookieStore.get('accessToken')?.value;
    }
    
    const refreshToken = cookieStore.get('refreshToken')?.value;

    // Case 1: No tokens at all -> unauthenticated
    if (!accessToken && !refreshToken) {
      console.log('[Auth] No tokens found - unauthenticated');
      return null;
    }

    // Case 2: Only refreshToken exists -> refresh access token first
    if (!accessToken && refreshToken) {
      console.log('[Auth] Access token missing, attempting refresh...');
      try {
        const backend = createBackendClient();
        const refreshResponse = await backend.auth.refreshToken();
        
        // Check if refresh was successful
        if (!refreshResponse || !refreshResponse.accessToken) {
          console.error('[Auth] Refresh failed - no access token returned');
          // Clear invalid refresh token
          cookieStore.delete('refreshToken');
          cookieStore.delete('accessToken');
          return null;
        }
        
        // Set new access token in cookie
        cookieStore.set('accessToken', refreshResponse.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60, // 15 minutes
        });
        
        accessToken = refreshResponse.accessToken;
        console.log('[Auth] Access token refreshed successfully');
      } catch (error) {
        console.error('[Auth] Token refresh failed:', error);
        // Refresh token is invalid or expired - clear cookies
        cookieStore.delete('refreshToken');
        cookieStore.delete('accessToken');
        return null;
      }
    }

    // Case 3: AccessToken exists (either original or refreshed) -> get user data
    if (accessToken) {
      try {
        const backend = createBackendClient();
        const response = await backend.user.getCurrentUser();
        
        console.log('[Auth] User authenticated:', response.user.id);
        return {
          user: response.user,
          accessToken,
        };
      } catch (error: any) {
        console.error('[Auth] Failed to get current user:', error?.message);
        
        // If 401, token might be expired - try refresh if we have refreshToken
        if (error?.statusCode === 401 && refreshToken) {
          console.log('[Auth] Access token expired, attempting refresh...');
          try {
            const backend = createBackendClient();
            const refreshResponse = await backend.auth.refreshToken();
            
            // Check if refresh was successful
            if (!refreshResponse || !refreshResponse.accessToken) {
              console.error('[Auth] Refresh failed - no access token returned');
              // Clear invalid refresh token
              cookieStore.delete('refreshToken');
              cookieStore.delete('accessToken');
              return null;
            }
            
            // Set new access token in cookie
            cookieStore.set('accessToken', refreshResponse.accessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 15 * 60, // 15 minutes
            });
            
            // Retry getting user with new token
            const response = await backend.user.getCurrentUser();
            console.log('[Auth] User authenticated after refresh:', response.user.id);
            
            return {
              user: response.user,
              accessToken: refreshResponse.accessToken,
            };
          } catch (refreshError) {
            console.error('[Auth] Token refresh failed:', refreshError);
            // Clear invalid refresh token
            cookieStore.delete('refreshToken');
            cookieStore.delete('accessToken');
            return null;
          }
        }
        
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('[Auth] Session check error:', error);
    return null;
  }
});

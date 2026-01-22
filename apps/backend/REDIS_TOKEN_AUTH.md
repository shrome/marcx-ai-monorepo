# Token Authentication with Redis

## Overview

The authentication system uses a dual-token approach with **access tokens** and **refresh tokens**. Refresh tokens are stored in **Redis** (or in-memory cache for development) for fast access and automatic expiration.

## Token Types

### Access Token (JWT)
- **Lifespan**: 15 minutes
- **Purpose**: Used to authenticate API requests
- **Storage Client-side**: Memory or sessionStorage (not localStorage)
- **Storage Server-side**: Not stored, validated via signature
- **Format**: JWT signed with HS256

### Refresh Token
- **Lifespan**: 7 days  
- **Purpose**: Used to obtain new access tokens
- **Storage Client-side**: httpOnly cookie (recommended) or secure storage
- **Storage Server-side**: Redis with automatic TTL
- **Format**: Random 64-byte hex string (stored as bcrypt hash)
- **Redis Key Pattern**: `refresh_token:{userId}:{tokenValue}`

## Architecture Benefits

### Why Redis?
1. **Performance**: In-memory storage for ultra-fast token lookup
2. **TTL Support**: Automatic expiration without manual cleanup
3. **Scalability**: Easy horizontal scaling for distributed systems
4. **No DB Overhead**: Keeps temporary tokens out of PostgreSQL
5. **Simple Revocation**: Delete keys instantly, no database queries

## Security Features

1. **Short-lived access tokens** (15 min): Limits exposure if compromised
2. **Redis-based refresh tokens**: Fast lookup with auto-expiration
3. **bcrypt hashing**: Tokens hashed before storage
4. **Automatic cleanup**: Redis TTL handles expiration
5. **Instant revocation**: Delete Redis keys immediately
6. **User verification**: Validates user still exists on refresh

## API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "companyId": "uuid"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "a1b2c3d4e5f6...",
  "expiresIn": 900,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "COMPANY_USER"
  }
}
```

### Token Management

#### Refresh Access Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}
```

#### Revoke Single Refresh Token
```http
POST /api/auth/revoke
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

#### Revoke All Refresh Tokens (Logout All Devices)
```http
POST /api/auth/revoke-all
Authorization: Bearer <access_token>
```

## Redis Configuration

### Development (In-Memory)
Currently using NestJS `cache-manager` with in-memory store for development:

```typescript
CacheModule.register({
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  max: 1000, // Max items in cache
})
```

### Production (Redis)
To use Redis in production:

1. **Install Redis dependencies:**
```bash
pnpm add cache-manager-redis-store redis
```

2. **Update auth.module.ts:**
```typescript
import * as redisStore from 'cache-manager-redis-store';

CacheModule.register({
  store: redisStore,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  ttl: 7 * 24 * 60 * 60, // 7 days in seconds
  max: 10000,
})
```

3. **Add to .env:**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
```

### Redis Key Structure

```
refresh_token:{userId}:{tokenValue}
```

**Value stored:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "COMPANY_USER",
  "tokenHash": "$2b$10$..."
}
```

**TTL**: Automatically expires after 7 days

## Client Implementation

### Login Flow
```typescript
const { accessToken, refreshToken, user } = await login(email, password);

// Store access token in memory
sessionStorage.setItem('accessToken', accessToken);

// Store refresh token in httpOnly cookie (backend sets it)
// OR secure client storage (less secure)
localStorage.setItem('refreshToken', refreshToken);
```

### Auto-Refresh Before Expiration
```typescript
async function setupAutoRefresh() {
  // Refresh 1 minute before expiration (14 minutes)
  setTimeout(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const { accessToken } = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    }).then(r => r.json());
    
    sessionStorage.setItem('accessToken', accessToken);
    setupAutoRefresh(); // Schedule next refresh
  }, 14 * 60 * 1000); // 14 minutes
}
```

### Handle 401 Errors
```typescript
async function apiRequest(url, options = {}) {
  const accessToken = sessionStorage.getItem('accessToken');
  
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  // If access token expired, try to refresh
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    const refreshResponse = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (refreshResponse.ok) {
      const { accessToken } = await refreshResponse.json();
      sessionStorage.setItem('accessToken', accessToken);
      
      // Retry original request
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`
        }
      });
    } else {
      // Refresh failed - redirect to login
      window.location.href = '/login';
    }
  }
  
  return response;
}
```

### Logout
```typescript
async function logout() {
  const refreshToken = localStorage.getItem('refreshToken');
  const accessToken = sessionStorage.getItem('accessToken');
  
  // Revoke refresh token
  await fetch('/api/auth/revoke', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });
  
  // Clear local storage
  sessionStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  window.location.href = '/login';
}
```

## Monitoring & Operations

### Check Active Tokens (Redis CLI)
```bash
# Count all refresh tokens
redis-cli KEYS "refresh_token:*" | wc -l

# List tokens for specific user
redis-cli KEYS "refresh_token:USER_ID:*"

# Get token data
redis-cli GET "refresh_token:USER_ID:TOKEN"

# Check TTL
redis-cli TTL "refresh_token:USER_ID:TOKEN"

# Force revoke token
redis-cli DEL "refresh_token:USER_ID:TOKEN"

# Revoke all tokens for user
redis-cli KEYS "refresh_token:USER_ID:*" | xargs redis-cli DEL
```

### Redis Memory Usage
```bash
# Check memory stats
redis-cli INFO memory

# Monitor real-time commands
redis-cli MONITOR
```

## Best Practices

1. **Use httpOnly cookies** for refresh tokens (prevents XSS)
2. **Never log refresh tokens** in application logs
3. **Implement rate limiting** on refresh endpoint
4. **Monitor suspicious patterns** (multiple refreshes from different IPs)
5. **Rotate refresh tokens** on each use (optional enhancement)
6. **Set up Redis persistence** (AOF or RDB) for production
7. **Use Redis Sentinel/Cluster** for high availability

## Migration from Database Storage

If you previously stored refresh tokens in PostgreSQL:

1. **Remove old database table** and migrations
2. **Update auth service** to use Redis (already done)
3. **Clear old tokens** from database
4. **Users must re-login** to get Redis-based tokens

## Troubleshooting

### Token Not Found Error
- Check Redis connection
- Verify TTL hasn't expired
- Ensure correct Redis key pattern

### Performance Issues
- Monitor Redis memory usage
- Implement connection pooling
- Consider Redis clustering

### Token Replay Attacks
- Implement token rotation (generate new refresh token on each use)
- Monitor for multiple refreshes from different IPs
- Add device fingerprinting

## Security Considerations

- Access tokens: 15 minutes (minimal exposure window)
- Refresh tokens: 7 days (balance between security and UX)
- Redis hashing: bcrypt with 10 rounds (secure but performant)
- Automatic expiration: No manual cleanup needed
- Instant revocation: DELETE command is atomic
- User validation: Checks user still exists on refresh

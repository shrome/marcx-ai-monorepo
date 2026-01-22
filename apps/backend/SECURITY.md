# Environment Configuration

## Required Environment Variables

### JWT Secret (CRITICAL - MUST CHANGE IN PRODUCTION)

Add the following to your `.env` file:

```env
# JWT Secret - MUST be a strong, random string in production
# Generate a secure secret using: openssl rand -base64 64
JWT_SECRET=your-super-secure-secret-key-change-this-immediately-in-production
```

## Security Recommendations

1. **Generate a Secure JWT Secret:**
   ```bash
   openssl rand -base64 64
   ```

2. **Never commit the actual JWT_SECRET to version control**

3. **Use different secrets for development, staging, and production**

4. **Rotate secrets periodically** (e.g., every 90 days)

5. **Store production secrets in a secure vault** (AWS Secrets Manager, HashiCorp Vault, etc.)

## JWT Configuration

Current settings in `auth.module.ts`:
- **Algorithm:** HS256 (HMAC with SHA-256)
- **Expiration:** 7 days
- **Strategy:** Bearer token in Authorization header

## Token Usage

Frontend should send tokens in the Authorization header:
```
Authorization: Bearer <jwt-token>
```

# Authentication Flow Documentation

## Overview
The authentication system uses JWT-based tokens with Access Token + Refresh Token pattern:
- **Access Token**: Short-lived JWT (15 minutes by default, configurable via `ACCESS_TOKEN_EXPIRY`)
- **Refresh Token**: Long-lived random token (no built-in expiry, managed server-side)

## Key Features
✅ No email verification required - users can login immediately after registration
✅ Token Rotation - new refresh tokens are issued on each refresh
✅ Token Reuse Detection - invalidates all tokens if old refresh token is reused
✅ Stateless - tokens can be verified without database (access token)
✅ Stateful - refresh token stored as SHA256 hash for security

## Database Schema Changes
Removed fields:
- `emailVerified` (boolean)
- `emailVerificationToken` (string)

Added fields:
- `refreshTokenHash` (string) - SHA256 hash of current refresh token
- `refreshTokenIssuedAt` (Date) - when current refresh token was issued

## API Endpoints

### 1. Register (POST `/api/auth/register`)
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "age": 25,
  "gender": "male"
}
```

**Response (201):**
```json
{
  "message": "Registered successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "a1b2c3d4..."
}
```

### 2. Login (POST `/api/auth/login`)
**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGc...",
  "refreshToken": "a1b2c3d4...",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### 3. Refresh Token (POST `/api/auth/refresh`)
**Purpose:** Get a new access token and refresh token (implements token rotation)

**Request:**
```json
{
  "refreshToken": "a1b2c3d4..."
}
```

**Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGc...",
  "refreshToken": "x9y8z7w6..."
}
```

**Note:** The old refresh token is invalidated. Client must use the new refresh token for future refreshes.

### 4. Logout (POST `/api/auth/logout`)
**Purpose:** Invalidate the refresh token (prevent future token refreshes)

**Request:**
```json
{
  "refreshToken": "a1b2c3d4..."
}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

## Token Security Features

### Access Token
- ✅ JWT format, signed with `JWT_SECRET`
- ✅ Contains: user ID, role, email
- ✅ Expires in 15 minutes (default, configurable)
- ✅ Cannot be revoked (stateless)
- ✅ Decoded on every protected request

### Refresh Token
- ✅ Random 32-byte hex string
- ✅ Hashed with SHA256 before storing in database
- ✅ No expiry set (stays valid until user logs out or token is rotated)
- ✅ Can be revoked by clearing from database

### Token Rotation
When `/refresh` is called:
1. Old refresh token is validated against database hash
2. New access token is generated
3. New refresh token is generated
4. Old refresh token is **invalidated** by replacing it with the new hash
5. Client must use new refresh token for future requests

### Token Reuse Detection
If a user tries to use an old/already-used refresh token:
1. Token hash is checked against stored hash
2. If no match found (token already rotated or logged out)
3. System clears all tokens for user as security measure
4. User must login again

## Client Implementation Example

### JavaScript/React
```javascript
// 1. Register
const registerRes = await fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({ name, email, password, age, gender })
});
const { accessToken, refreshToken } = await registerRes.json();

// Store tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// 2. Make authenticated requests
const apiRes = await fetch('/api/posts', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
  }
});

// 3. If access token expires (401), refresh it
if (apiRes.status === 401) {
  const refreshRes = await fetch('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ 
      refreshToken: localStorage.getItem('refreshToken') 
    })
  });
  const { accessToken, refreshToken } = await refreshRes.json();
  
  // Update tokens
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  
  // Retry original request
  const retryRes = await fetch('/api/posts', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
}

// 4. Logout
await fetch('/api/auth/logout', {
  method: 'POST',
  body: JSON.stringify({ 
    refreshToken: localStorage.getItem('refreshToken') 
  })
});
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

## Environment Variables
```env
JWT_SECRET=your_secret_key                    # Used to sign access tokens
ACCESS_TOKEN_EXPIRY=15m                        # Access token lifetime (default: 15m)
```

## Error Handling

### Register
- 400: User already exists
- 500: Server error

### Login
- 404: User not found
- 400: Invalid credentials
- 500: Server error

### Refresh
- 400: Missing refresh token
- 401: Invalid/expired refresh token
- 500: Server error

### Logout
- 400: Missing refresh token
- 404: User not found
- 500: Server error

## Migration from Old Auth System
If you're migrating from the old email verification system:
1. Run database migration to remove `emailVerified` and `emailVerificationToken` fields
2. Initialize `refreshTokenHash` and `refreshTokenIssuedAt` to null for all existing users
3. Existing users can login directly (no email verification needed)
4. They will receive new tokens on first login/refresh

## Security Best Practices
✅ Never store refresh token in cookies (use httpOnly cookies if needed)
✅ Always use HTTPS in production
✅ Rotate refresh tokens on every use (already implemented)
✅ Implement rate limiting on auth endpoints
✅ Clear tokens on logout
✅ Use strong JWT_SECRET (minimum 32 characters)
✅ Implement token expiry monitoring on client

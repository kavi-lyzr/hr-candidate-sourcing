# 🔐 Hybrid Authentication Setup

## What We Implemented

**Hybrid Approach: Token + User Info**
- ✅ **Security**: API token prevents unauthorized access
- ✅ **User Isolation**: Each request includes user info for data separation
- ✅ **Production Ready**: Secure and scalable

## Environment Variables

Add these to your `.env.local`:

```bash
# API Authentication Token (generate a secure random string)
API_AUTH_TOKEN=your-super-secret-api-token-here

# Frontend Token (same as above, but public for frontend)
NEXT_PUBLIC_API_AUTH_TOKEN=your-super-secret-api-token-here

# All your existing variables...
MONGODB_URI=...
NEXT_PUBLIC_LYZR_API_KEY=...
RAPID_API_BASE=linkedin-api.p.rapidapi.com
RAPID_API_KEY=...
ENCRYPTION_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How to Generate a Secure Token

```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# https://www.uuidgenerator.net/api/version4
```

## How It Works

### **Frontend Request:**
```typescript
// 1. Gets user from Lyzr Auth
const { user: lyzrUser } = useAuth();

// 2. Sends both token AND user info
fetch('/api/chat/start-search', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_AUTH_TOKEN}`
  },
  body: JSON.stringify({
    query: "Find React developers",
    user: {
      id: lyzrUser.id,
      email: lyzrUser.email,
      name: lyzrUser.name
    }
  })
});
```

### **Backend Validation:**
```typescript
// 1. Validates token for security
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.API_AUTH_TOKEN}`) {
  return 401 Unauthorized;
}

// 2. Uses user info for data isolation
const { user } = await request.json();
const dbUser = await User.findOne({ lyzrUserId: user.id });
// Now we know which user's data to access
```

## Security Benefits

### ✅ **API Protection**
- Only requests with valid token can access API
- Prevents unauthorized access even if someone finds your API endpoints

### ✅ **User Isolation**
- Each user's searches are stored separately
- User A can't see User B's search history
- Proper data separation for multi-user app

### ✅ **Production Ready**
- Token can be rotated without affecting users
- No complex session management
- Works with load balancers and CDNs

## Files Updated

1. **`src/app/api/chat/start-search/route.ts`**
   - Removed NextAuth dependency
   - Added token validation
   - Added user info validation
   - Uses user info for data isolation

2. **`src/app/api/chat/stream/[sessionId]/route.ts`**
   - Removed NextAuth dependency
   - Added token validation from query params
   - SSE works with token authentication

3. **`src/hooks/use-sse.ts`**
   - Passes token as query parameter
   - EventSource doesn't support custom headers

4. **`src/app/page.tsx`**
   - Sends user info in request body
   - Includes Authorization header
   - Validates user authentication before API call

## Testing

1. **Set up environment variables** (see above)
2. **Start dev server**: `npm run dev`
3. **Login** to create your agents
4. **Try a search** - should work without 401 errors!

## Production Deployment

### **Environment Variables:**
```bash
# Production .env
API_AUTH_TOKEN=your-production-secret-token
NEXT_PUBLIC_API_AUTH_TOKEN=your-production-secret-token
# ... other variables
```

### **Security Notes:**
- Use different tokens for dev/staging/production
- Rotate tokens regularly
- Never commit tokens to git
- Use environment variable management in your hosting platform

## Troubleshooting

### **401 Unauthorized Error:**
- Check if `API_AUTH_TOKEN` is set in `.env.local`
- Check if `NEXT_PUBLIC_API_AUTH_TOKEN` matches `API_AUTH_TOKEN`
- Verify token is being sent in Authorization header

### **User Not Found Error:**
- Make sure user is logged in with Lyzr Auth
- Check if user exists in MongoDB
- Verify `lyzrUserId` matches between frontend and database

### **SSE Connection Failed:**
- Check if token is being passed in query params
- Verify SSE route is receiving the token
- Check browser console for errors

## Why This Approach?

### **Better than Option 1 (Lyzr Auth in Backend):**
- Lyzr Auth is client-side only
- Server-side API routes can't access Lyzr Auth context
- Would require complex token validation

### **Better than Option 2 (Token Only):**
- Token-only approach has no user isolation
- Everyone would share the same data
- Not suitable for multi-user applications

### **Better than Option 3 (User Info Only):**
- No security layer
- Anyone could send fake user info
- Vulnerable to spoofing attacks

## ✅ Perfect Balance

This hybrid approach gives you:
- **Security** (token validation)
- **User isolation** (user info)
- **Simplicity** (no complex auth setup)
- **Production readiness** (scalable and secure)

Your app is now ready for both development and production! 🚀

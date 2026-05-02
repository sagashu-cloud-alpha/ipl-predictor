# Supabase Authentication Setup

## Overview
This project uses Supabase for email/password authentication with protected routes. The middleware protects the `/app` route and redirects unauthenticated users to `/login`.

---

## File Structure

### Core Auth Files
```
├── .env.local                          # Supabase credentials
├── middleware.ts                       # Next.js middleware for route protection
├── lib/supabase/
│   ├── client.ts                       # Browser client
│   ├── server.ts                       # Server client (Server Components)
│   ├── middleware.ts                   # Session management for middleware
│   └── auth-context.tsx                # React context for auth state
├── app/
│   ├── layout.tsx                      # Root layout with AuthProvider
│   ├── login/page.tsx                  # Login/Sign-up + Forgot Password page
│   ├── app/page.tsx                    # Protected app page
│   ├── reset-password/page.tsx         # Set new password page (after recovery link)
│   └── auth/callback/route.ts          # Auth callback handler (email + recovery)
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Get these from your Supabase project:
# 1. Go to https://app.supabase.com
# 2. Select your project
# 3. Go to Project Settings (gear) > API
# 4. Copy the values

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

> **Note:** This project uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not `ANON_KEY`).

---

## Supabase Dashboard Configuration

### 1. Enable Email Authentication
1. Go to **Authentication > Providers**
2. Enable **Email** provider
3. Configure settings:
   - Enable email signup: **ON**
   - Confirm email: **Optional** (turn OFF for local testing)

### 2. Configure Auth Callback URL
1. Go to **Authentication > URL Configuration**
2. Add redirect URLs:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/auth/callback?type=recovery
   http://localhost:3000/app
   http://localhost:3000/reset-password
   ```

### 3. Set Site URL
1. Go to **Authentication > URL Configuration**
2. Set Site URL: `http://localhost:3000`

---

## How Authentication Works

### 1. Route Protection (middleware.ts)
```
User requests /app
    ↓
Middleware checks session via Supabase cookies
    ↓
User authenticated? → Allow request
    ↓
User NOT authenticated? → Redirect to /login?redirectedFrom=/app
```

### 2. Login Flow (app/login/page.tsx)
```
User enters email/password
    ↓
Call supabase.auth.signInWithPassword()
    ↓
Success → router.replace('/app') (replaces history)
    ↓
Error → Show error message
```

### 3. Auth Callback (app/auth/callback/route.ts)
```
Email confirmation / magic link clicked
    ↓
Supabase redirects to /auth/callback?code=XXX[&type=recovery]
    ↓
Exchange code for session
    ↓
type=recovery? → Redirect to /reset-password
Otherwise    → Redirect to /app (or ?next= param)
```

### 4. Forgot Password / Password Reset Flow
```
User clicks "Forgot password?" on login page
    ↓
Enter email → supabase.auth.resetPasswordForEmail()
    ↓
Supabase emails a recovery link →
  /auth/callback?code=XXX&type=recovery
    ↓
Callback exchanges code, detects type=recovery
    ↓
Redirect to /reset-password
    ↓
User enters new password → supabase.auth.updateUser()
    ↓
Success → Redirect to /app
```

### 5. Client-Side Auth (auth-context.tsx)
```
AuthProvider wraps app
    ↓
Gets session on mount via getSession()
    ↓
Listens for auth state changes
    ↓
Provides user, loading, signOut() via context
```

---

## Features

### Protected Routes
- `/app` - Requires authentication
- Unauthenticated users are redirected to `/login`

### Back Button Protection
- Sign out uses `window.location.href` (full reload)
- Login uses `router.replace()` (no history entry)
- Cache-Control headers prevent page caching

### Sign Out
- Located in app header (logout icon)
- Clears Supabase session
- Redirects to login page

### User Display
- Shows user email in header (desktop)
- Sign out button visible when authenticated

### Forgot Password
- "Forgot password?" link appears next to the Password label on the sign-in form
- Switches the form to a single-field email-only view
- Calls `resetPasswordForEmail()` with `redirectTo` pointing to `/auth/callback?type=recovery`
- Displays a success banner; user is emailed a one-time recovery link
- "Remember your password? Sign in" link returns to the normal sign-in view

### Reset Password Page (`/reset-password`)
- Accessible only after clicking the recovery link in the email (session must exist)
- Validates that new password ≥ 6 characters and both fields match
- Calls `supabase.auth.updateUser({ password })` to persist the change
- Shows success banner and auto-redirects to `/app` after 2 seconds

---

## Usage

### In Client Components
```tsx
import { useAuth } from "@/lib/supabase/auth-context";

function MyComponent() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={() => signOut("/login")}>Sign Out</button>
    </div>
  );
}
```

### In Server Components
```tsx
import { createClient } from "@/lib/supabase/server";

async function MyServerComponent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>Not logged in</div>;

  return <div>Welcome, {user.email}</div>;
}
```

---

## Testing the Setup

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Route Protection
1. Navigate to `http://localhost:3000/app`
2. Should redirect to `/login?redirectedFrom=/app`

### 3. Test Sign Up
1. Go to `/login`
2. Click "Sign up" link
3. Enter email and password (min 6 chars)
4. If email confirmation disabled → redirects to app
5. If enabled → check email for confirmation

### 4. Test Sign In
1. Enter registered email and password
2. Click "Sign in"
3. Should redirect to `/app`

### 5. Test Page Refresh
1. While logged in, refresh the page
2. Should stay logged in (session persists)

### 6. Test Back Button
1. Sign out from header
2. Click browser back button
3. Should NOT return to app page

### 7. Test Direct URL Access
1. Copy `/app` URL
2. Sign out
3. Paste URL in new tab
4. Should redirect to login

### 8. Test Forgot Password Flow
1. Go to `/login`
2. Click **"Forgot password?"** next to the Password label
3. Enter your registered email and click **"Send reset link"**
4. Check your email for the reset link
5. Click the link — should redirect to `/reset-password`
6. Enter and confirm a new password, click **"Update password"**
7. Should show success message then redirect to `/app`

### 9. Test Reset Password Validation
1. On `/reset-password`, enter mismatched passwords → should show "Passwords do not match"
2. Enter a password shorter than 6 characters → should show "Password must be at least 6 characters"

---

## Troubleshooting

### Issue: Redirects to login after refresh
**Cause:** Session cookies not persisting
**Fix:** 
- Verify `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is correct
- Check middleware is running (see console logs)
- Ensure cookies are being set (DevTools > Application > Cookies)

### Issue: Can't sign up
**Cause:** Email provider not enabled
**Fix:** Enable Email provider in Supabase dashboard

### Issue: "Invalid API key" error
**Cause:** Wrong publishable key
**Fix:** Get correct key from Supabase > Project Settings > API

### Issue: Email confirmation stuck
**Cause:** Confirm email is enabled but no email received
**Fix:** 
- Check spam folder
- Or disable email confirmation in Supabase for testing

---

## Security Notes

1. **Never commit `.env.local`** - It's in `.gitignore`
2. **Use Row Level Security (RLS)** in Supabase for database tables
3. **Publishable key is safe** for client-side use (it's public by design)
4. **Service role key** should NEVER be in `.env.local` (server-only)

---

## Additional Resources

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [@supabase/ssr Package](https://github.com/supabase/supabase/tree/master/packages/ssr)

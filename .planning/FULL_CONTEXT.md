# Mencia — Full Project Context

> This document contains complete architecture, functionality, and source code context for the Mencia project.
> Hand this to any AI to give it full project understanding.

---

## 1. WHAT IS THIS PROJECT?

Mencia is a **SaaS platform** that lets any website owner embed a fully configurable,
voice-enabled AI assistant (powered by Google Gemini) into their site using a single `<script>` tag.

**The core loop:**
1. User signs up (Google OAuth) and lands on a dashboard
2. User configures their assistant: name, business info, tone, theme, Gemini API key, navigation pages
3. User copies a generated `<script>` embed tag and pastes it on their own website
4. Visitors of THAT website can now type or speak to the AI assistant
5. The assistant answers questions (via Gemini) or navigates the visitor to pages using keyword detection

**Business Model:**
- Free Plan: 200 lifetime AI messages
- Pro Plan: INR 699 for 90 days of unlimited messages (via Razorpay)

---

## 2. TECH STACK

### Client (Frontend)
- React 19
- Vite 8
- TailwindCSS v4 (via @tailwindcss/vite plugin)
- React Router DOM v7
- Firebase 12 (Google OAuth only — client-side handshake)
- Axios (HTTP)
- React Hot Toast (notifications)
- React Icons v5
- Razorpay frontend SDK (loaded via window.Razorpay in Billing.jsx)

### Server (Backend)
- Node.js with ES Modules (type: module)
- Express 5
- Mongoose 9 + MongoDB
- jsonwebtoken (JWT)
- cookie-parser (httpOnly cookies)
- dotenv
- cors
- Razorpay Node SDK
- crypto (built-in, payment signature verification)
- nodemon (dev)

---

## 3. REPOSITORY STRUCTURE

```
d:\DEV\Mencia\
├── Client/
│   ├── .env                          # VITE_FIREBASE_API_KEY, VITE_RAZORPAY_KEY_ID
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx                  # Entry — wraps App in BrowserRouter
│       ├── App.jsx                   # Root — auth state, routes, ServerUrl/CLIENT_URL
│       ├── App.css / index.css
│       ├── assets/
│       │   └── logo.png
│       ├── utils/
│       │   └── firebase.js           # Firebase init, auth, GoogleAuthProvider
│       ├── pages/
│       │   ├── Home.jsx              # Landing/marketing page
│       │   ├── Login.jsx             # Google sign-in page
│       │   ├── Builder.jsx           # Assistant config UI
│       │   └── Billing.jsx           # Plan upgrade UI
│       └── Components/
│           ├── Navbar.jsx            # Sticky navbar with user info + logout
│           ├── ProtectedRoute.jsx    # Auth guard (spinner → redirect → children)
│           └── AssistantPreview.jsx  # Interactive widget preview on landing page
│
└── Server/
    ├── .env                          # PORT, MONGODB_URL, JWT_SECRET, RAZORPAY_KEY_ID/SECRET
    ├── index.js                      # App entry — CORS setup, middleware, route mounting
    ├── package.json
    ├── Configs/
    │   ├── ConnectDB.js              # mongoose.connect()
    │   ├── gemini.js                 # generateGeminiResponse() — Gemini REST fetch
    │   ├── razorpay.js               # Razorpay SDK init
    │   └── token.js                  # genToken() — JWT sign
    ├── Middleware/
    │   └── isAuth.js                 # JWT cookie verify → req.userId
    ├── Models/
    │   ├── user.model.js             # User schema (see Section 6)
    │   └── billing.model.js          # Billing/order schema
    ├── Routes/
    │   ├── auth.route.js             # POST /google, GET /logout
    │   ├── user.route.js             # GET /current-user, POST /save-assistant
    │   ├── assistant.route.js        # GET /config/:userId, POST /ask
    │   └── billing.route.js          # POST /order, POST /verify
    └── Controllers/
        ├── auth.controller.js
        ├── user.controller.js
        ├── assistant.controller.js
        └── billing.controller.js
```

---

## 4. ENVIRONMENT VARIABLES

### Client/.env
```
VITE_FIREBASE_API_KEY=...
VITE_RAZORPAY_KEY_ID=...
```

### Server/.env
```
PORT=8000
MONGODB_URL=...
JWT_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

---

## 5. AUTHENTICATION FLOW

1. User visits /login → clicks "Continue with Google"
2. Firebase `signInWithPopup(auth, provider)` → Google popup → returns `displayName` + `email`
3. Client POSTs `{ name, email }` to `POST /api/auth/google`
4. Server upserts User by email (creates if new), calls `genToken(user._id)` → JWT signed with JWT_SECRET, 7d expiry
5. Server sets httpOnly cookie: `token=<jwt>; httpOnly; secure=false; sameSite=strict; maxAge=7d`
6. Server returns full user object → client sets `user` state in App.jsx
7. On every page load: App.jsx fetches `GET /api/user/current-user` (withCredentials) to rehydrate session
8. `isAuth` middleware reads `req.cookies.token`, verifies JWT, attaches `req.userId`
9. Logout: `GET /api/auth/logout` → clears cookie → client sets user=null → redirect to /login

---

## 6. DATA MODELS

### User (user.model.js)
```js
{
  name: String,                // required
  email: String,               // required, unique
  assistantName: String,       // default: "Mencia"
  businessName: String,        // default: ""
  businessType: String,        // default: ""
  businessDescription: String, // default: ""
  tone: enum["friendly","professional","sales"],  // default: "friendly"
  theme: enum["light","dark","glass","neon"],      // default: "dark"
  enableVoice: Boolean,        // default: true
  pages: [pageSchema],         // [ { name, path, keywords: [String] } ], no _id
  enableNavigation: Boolean,   // default: true
  geminiApiKey: String,        // user-supplied Gemini key
  geminiStatus: enum["active","quota_exceeded","invalid"],  // default: "active"
  totalMessages: Number,       // default: 0 (free plan counter)
  plan: enum["free","pro"],    // default: "free"
  requestLimit: Number,        // default: 200
  proExpiresAt: Date,          // default: null
  isSetupComplete: Boolean,    // default: false
  timestamps: true
}
```

### Billing (billing.model.js)
```js
{
  userId: ObjectId (ref User),
  amount: Number,
  plan: String,
  paymentId: String,
  orderId: String,
  status: enum["created","paid","failed"],  // default: "created"
  timestamps: true
}
```

---

## 7. COMPLETE API REFERENCE

### Server base URL (dev): http://localhost:8000

#### AUTH ROUTES — /api/auth (privateCors: only localhost:5173)

POST /api/auth/google
  Body: { name: string, email: string }
  Action: findOne({email}) or create user, genToken, set cookie
  Returns: 200 user object | 400 | 500

GET /api/auth/logout
  Action: clearCookie("token")
  Returns: 200 { message: "LogOut Sucessfully" } | 500

---

#### USER ROUTES — /api/user (privateCors, all require isAuth middleware)

GET /api/user/current-user
  Headers: cookie token
  Action: User.findById(req.userId)
  Returns: 200 user | 404 | 500

POST /api/user/save-assistant
  Headers: cookie token
  Body: { assistantName, businessName, businessType, businessDescription, tone, theme, geminiApiKey, pages }
  Action: findById → update fields → isSetupComplete=true → save
  Note: only updates geminiApiKey if non-empty; always resets geminiStatus to "active"
  Returns: 200 { message, user } | 404 | 500

---

#### ASSISTANT ROUTES — /api/assistant (publicCors: origin: "*")
No auth middleware — intentionally public for embedded widget use

GET /api/assistant/config/:userId
  Params: userId (MongoDB ObjectId)
  Action: User.findById(userId).select("-geminiApiKey")
  Returns: 200 { message, user (no geminiApiKey) } | 404 | 500

POST /api/assistant/ask
  Body: { message: string, userId: string, currentPath: string (optional) }
  
  Logic flow:
  1. Validate message + userId present
  2. Find user by userId
  3. Check geminiApiKey exists
  4. Check free plan limit: if plan=="free" && totalMessages >= requestLimit → 400 "Free limit reached"
  5. Check pro expiry: if plan=="pro" && proExpiresAt < now → 400 "Pro plan expired"
     NOTE: BUG HERE — line 45 uses === instead of = so plan never actually gets set to "free"
  6. Navigation intent detection (if enableNavigation):
     - Check if message starts with: "open","go","start","show","navigate","take me"
     - If navigation intent: find matching page where any keyword is in message
     - If page found and already on that path: return { success:true, response: "X already open" }
     - If page found: return { success:true, action:"navigate", path, response:"Opening X" }
  7. Build Gemini prompt with business context, tone, 15-word limit rule
  8. Call generateGeminiResponse({ prompt, apikey, user })
  9. If free plan: increment totalMessages + save
  10. Return { success:true, aiResponse }

  Returns:
    { success:true, aiResponse: string }                          — normal response
    { success:true, action:"navigate", path: string, response }   — navigation command
    { success:false, message } on error

---

#### BILLING ROUTES — /api/billing (privateCors, all require isAuth middleware)

POST /api/billing/order
  Headers: cookie token
  Body: { plan: "pro" }
  Action: amount=699 for pro → razorpay.orders.create({ amount*100, currency:"INR", receipt }) → Billing.create(...)
  Returns: 200 { success:true, order } | 500

POST /api/billing/verify
  Headers: cookie token
  Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
  Action:
    - HMAC SHA256 sign: (razorpay_order_id + "|" + razorpay_payment_id) with RAZORPAY_KEY_SECRET
    - If signature mismatch: return { success:false, "Payment verification failed" }
    - Billing.findOneAndUpdate({ orderId }) → status:"paid", paymentId
    - User.findByIdAndUpdate → plan:"pro", proExpiresAt: now + 90 days
  Returns: 200 { success:true, user } | 500

---

## 8. FRONTEND PAGES AND COMPONENTS

### App.jsx — Root
- State: user (null | User object), loading (bool)
- On mount: fetchMe() → GET /api/user/current-user
- Constants exported: ServerUrl = "http://localhost:8000", CLIENT_URL = "http://localhost:5173"
- Route structure:
  - /login → <Login setUser={setUser} />
  - /* → <ProtectedRoute user loading> wraps Navbar + nested routes
    - / → <Home user />
    - /builder → <Builder user setUser />
    - /billing → <Billing user setUser />
    - * → Navigate to /

### ProtectedRoute.jsx
- If loading: full-screen spinner (purple border-t-transparent animate-spin)
- If !user: Navigate to /login
- Else: render children

### Login.jsx
- Google sign-in via Firebase signInWithPopup → POST /api/auth/google → setUser → navigate("/")
- UI: two-column layout — left: headline + CTA; right: feature cards panel
- Features shown: Voice AI, Smart Navigation, Easy Embed, Fast Responses

### Home.jsx (Landing)
- Hero section with gradient background + purple/emerald blobs
- "Build Your Assistant" CTA → navigate("/builder")
- Steps section: 01 Sign up free → 02 Customize → 03 Train → 04 Embed
- Footer with Mencia branding + copyright
- Includes <AssistantPreview /> widget demo

### AssistantPreview.jsx
- Interactive demo widget with 4 theme swatches (dark/light/glass/neon)
- Each theme has: bg, overlay, orb gradient, card border, text colors, listening color, wave bar color, button gradient, mic glow
- Shows animated pulse orb, "Listening..." text with wave bars, mic button
- Purely presentational — no real AI calls

### Builder.jsx — Core Dashboard
State: editAssistant, assistantName, businessName, businessType, businessDescription, theme, tone, geminiApiKey, pages[], pageName, pagePath, pageKeywords, loading

Two modes:
A. Setup complete + not editing → shows summary card:
   - Assistant name, plan, geminiStatus (color-coded), messages left / days remaining
   - Embed code instructions (amber callout showing where to paste in HTML)
   - Embed code textarea (read-only) + copy button
   - "Edit Assistant" button

B. editAssistant=true → config form:
   - Basic Info: assistantName, businessName, businessType, businessDescription (textarea)
   - Appearance: Theme selector (4 buttons), Tone selector (3 buttons)
   - Gemini API Key: password input + "Get API KEY" link to aistudio.google.com
   - Navigation Pages: add (name+path+keywords CSV) / remove pages list
   - Save button (disabled unless all required fields filled)

Embed code format:
  `<script src="${CLIENT_URL}/assistant.js" data-user-id="${user._id}"></script>`

### Billing.jsx
- Redirects to /builder if !user.isSetupComplete
- Shows 3 stat cards: Current Plan, Gemini Status, Messages Left / Days Remaining
- Free plan card (₹0): 200 AI messages, voice assistant, navigation, basic customization
- Pro plan card (₹699 gradient): unlimited messages, 3 months, upgrade button
- handlePay(): POST /api/billing/order → window.Razorpay(options).open()
  → on success handler: POST /api/billing/verify → setUser(updatedUser)

### Navbar.jsx
- Sticky top, backdrop-blur-xl
- Logo + "Mencia" brand
- Desktop: Builder button, Billing button, user avatar (initials), email, logout
- Mobile: hamburger menu → drawer with same actions
- handleLogout(): GET /api/auth/logout → setUser(null) → navigate("/login")

---

## 9. ASSISTANT AI LOGIC (Gemini Integration)

File: Server/Configs/gemini.js

Model URL: https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent
(NOTE: verify model name — likely should be gemini-1.5-flash or gemini-2.0-flash)

Function: generateGeminiResponse({ prompt, apikey, user })
- POSTs to Gemini with user-supplied API key
- Error handling by status code:
  - 400/401 → user.geminiStatus = "invalid"; user.save()
  - 429 → user.geminiStatus = "quota_exceeded"; user.save()
- On success: user.geminiStatus = "active"; user.save()
- Extracts: data.candidates[0].content.parts[0].text
- Returns trimmed text string

Prompt template (built in assistant.controller.js):
```
You are ${user.assistantName}.

Business Name: ${user.businessName}
Business Type: ${user.businessType}
Business Description: ${user.businessDescription}
Assistant Tone: ${user.tone}

Rules:
- Keep replies under 15 words
- Give fast direct responses
- Talk naturally
- Behave like smart voice assistant
- Avoid long explanations
- Keep responses short for quick voice playback

User Question: ${message}
```

---

## 10. NAVIGATION INTENT SYSTEM

Trigger words (message must START with one):
  "open", "go", "start", "show", "navigate", "take me"

Page matching:
  For each page in user.pages, check if ANY keyword (case-insensitive) is included in the message

Response shapes:
  Already on page: { success:true, response: "X already open" }
  Navigate:        { success:true, action:"navigate", path:"/some-path", response:"Opening X" }

Example: user has page { name:"Pricing", path:"/pricing", keywords:["pricing","plan","cost"] }
  Message "show pricing" → matches "pricing" keyword → returns action:"navigate", path:"/pricing"

The embedded widget JS (assistant.js, not yet found in repo) should handle the "action":"navigate"
response to do window.location changes.

---

## 11. CORS CONFIGURATION

privateCors: origin: ["http://localhost:5173"], credentials: true
  Applied to: /api/auth, /api/user, /api/billing

publicCors: origin: "*"
  Applied to: /api/assistant
  Reason: embedded widgets on third-party domains need to call this endpoint

---

## 12. KNOWN BUGS AND ISSUES

### 1. Pro Plan Downgrade Bug (CRITICAL)
File: Server/Controllers/assistant.controller.js, line 45
Bug: `user.plan === "free"` is a comparison, not assignment
Fix needed: `user.plan = "free"`
Impact: Pro users whose plan expires are never downgraded back to free

### 2. Hardcoded CLIENT_URL (CRITICAL for production)
File: Client/src/App.jsx, line 12
Bug: `export const CLIENT_URL = "http://localhost:5173"`
Impact: The generated embed code will contain localhost URL — broken for real deployments
Fix: use import.meta.env.VITE_CLIENT_URL

### 3. Gemini Model Name (NEEDS VERIFICATION)
File: Server/Configs/gemini.js, line 1
Value: "gemini-3.5-flash" — this model may not exist
Valid models: gemini-1.5-flash, gemini-2.0-flash, gemini-1.5-pro

### 4. Missing Embed Widget File
The embed code references `${CLIENT_URL}/assistant.js` but assistant.js is NOT present in Client/public/
This file needs to be created — it is the actual widget that gets embedded on third-party websites

### 5. No Rate Limiting on Public Endpoint
/api/assistant has no rate limiting beyond per-user quota
Any caller with a valid userId can probe the endpoint; need express-rate-limit

### 6. No Input Validation Middleware
Controllers do ad-hoc checks only (if !message || !userId)
No express-validator or Zod for schema validation

### 7. geminiStatus Reset on Save
user.controller.js line 45: `user.geminiStatus = "active"` runs on every save-assistant call
If key is invalid, saving any other field resets status to "active" prematurely

---

## 13. FIREBASE CONFIGURATION

Project ID: shifraai
Auth Domain: shifraai.firebaseapp.com
Firebase is only used CLIENT-SIDE for Google OAuth popup
Server does NOT use Firebase Admin SDK
After Firebase auth, server issues its own JWT — Firebase token is never sent to server

---

## 14. DEV SETUP

### Start Client (port 5173)
cd Client && npm run dev

### Start Server (port 8000)
cd Server && npm run dev
(uses nodemon index.js)

Both must run simultaneously during development.


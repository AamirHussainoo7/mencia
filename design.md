# MENCIA — MASTER UI/UX REDESIGN SPECIFICATION (V2)
> **Comprehensive Visual & Technical UI Design Blueprint for Next-Generation AI Web Assistant Platform**
> 
> *Target Aesthetic: Modern Obsidian Glassmorphism (Linear + Vercel + Stripe inspired)*  
> *Primary Tech Stack: React (Vite) + Tailwind CSS + Lucide / React Icons + CSS Animations*

---

## TABLE OF CONTENTS
1. [Executive Vision & Design Philosophy](#1-executive-vision--design-philosophy)
2. [Global Design System & Tokens](#2-global-design-system--tokens)
   - 2.1 Color Palette & Theme Tokens
   - 2.2 Typography Scale & Hierarchy
   - 2.3 Glassmorphism, Elevation & Surface Tokens
   - 2.4 Border Radii & Layout Grids
   - 2.5 Motion, Keyframes & Animation Tokens
3. [Global Components](#3-global-components)
   - 3.1 Application Shell & Navigation Bar (`Navbar.jsx`)
   - 3.2 Floating Ambient Orbs & Background Architecture
   - 3.3 Status Badges & Interactive Chips
4. [Page 1: Landing Page (`Home.jsx`)](#4-page-1-landing-page-homejsx)
   - 4.1 Hero Section with Ambient Glow
   - 4.2 Live Interactive Widget Simulator (`AssistantPreview.jsx`)
   - 4.3 High-Density Bento Grid Features
   - 4.4 4-Step Interactive Implementation Flow
   - 4.5 Conversion CTA Banner & Modern Dark Footer
5. [Page 2: Authentication & Onboarding (`Login.jsx`)](#5-page-2-authentication--onboarding-loginjsx)
   - 5.1 Split Showcase & Brand Value Canvas
   - 5.2 Google OAuth Glass Card & Security Highlights
6. [Page 3: Assistant Builder & Configuration (`Builder.jsx`)](#6-page-3-assistant-builder--configuration-builderjsx)
   - 6.1 Top Status Banner & 1-Click Embed Snippet Dock
   - 6.2 Tab 1: Assistant Identity & Tone Studio
   - 6.3 Tab 2: AI Engine Provider (Groq / Gemini BYOK Matrix)
   - 6.4 Tab 3: Site Navigation & Voice Command Mapper
   - 6.5 Tab 4: Table Reservation & Slot Matrix Engine
   - 6.6 Embedded Real-Time Live Preview Simulator
7. [Page 4: Table Reservations Dashboard (`Bookings.jsx`)](#7-page-4-table-reservations-dashboard-bookingsjsx)
   - 7.1 Analytics Metric Cards with Gradient Accent
   - 7.2 Filter Bar (Quick Date Chips, Status Pills, Search)
   - 7.3 Data Grid (Desktop Table & Mobile Responsive Cards)
   - 7.4 Action Modals (Status Change, Cancellation, Capacity Release)
8. [Page 5: Billing & Subscription Studio (`Billing.jsx`)](#8-page-5-billing--subscription-studio-billingjsx)
   - 8.1 Active Plan Usage Progress & Renewal Telemetry
   - 8.2 Tier Pricing Cards (Free vs Pro)
   - 8.3 "Coming Soon" Interactive Modal & Waitlist Experience
9. [Component 6: Floating Embeddable Assistant Widget (`assistant.js` / `assistant.css`)](#9-component-6-floating-embeddable-assistant-widget)
   - 9.1 Floating Launcher Button with Audio Wave Ping
   - 9.2 Collapsible Header with Pulsing Holographic Orb
   - 9.3 Stream Scroll Container with Chat Bubbles & Thinking Animation
   - 9.4 Rich Interactive Tool Cards (Available Slots & Reservation Pass)
   - 9.5 Bottom Control Dock with Mic Waveform & Pill Input
10. [Master Prompt for AI Coding Agent](#10-master-prompt-for-ai-coding-agent)

---

## 1. EXECUTIVE VISION & DESIGN PHILOSOPHY

### Core Theme: "Obsidian Neon & Hyper-Clean Glass"
Mencia is not just a chatbot—it is an **autonomous conversational concierge** that speaks, books reservations, and guides visitors. The UI must feel like a state-of-the-art developer and enterprise tool:
- **Depth and Atmosphere**: Dark obsidian backdrops (`#050816`, `#0B0F19`), subtle radial ambient light bursts (purple `#8B5CF6`, emerald `#10B981`, electric blue `#3B82F6`), layered with ultra-thin frosted borders (`rgba(255, 255, 255, 0.08)`).
- **Tactile Micro-Interactions**: Subtle scale transitions on hover (`scale-102` or `scale-105`), smooth spring physics, luminous glow indicators, and zero layout shift.
- **Data Clarity**: High contrast typography, monospaced tokens for booking references and API keys, and glanceable dashboard metrics with clear status colors.
- **Zero Generic Aesthetics**: Avoid standard plain white boxes and Bootstrap-like tables. Every card must have soft backdrop blur, gentle inner border highlights, and refined gradients.

---

## 2. GLOBAL DESIGN SYSTEM & TOKENS

### 2.1 Color Palette & Theme Tokens

```css
:root {
  /* Surface Layers (Dark Theme) */
  --bg-primary: #050816;           /* Deep space background */
  --bg-secondary: #0b1022;         /* Card & panel background */
  --bg-tertiary: #11182e;          /* Elevated hover surfaces */
  --bg-glass: rgba(11, 16, 34, 0.72); /* Glassmorphic containers */

  /* Surface Layers (Light Theme for Assistant / Dashboard Toggle) */
  --bg-light-primary: #f8fafc;     /* Soft slate white */
  --bg-light-surface: #ffffff;     /* Pure card white */
  --bg-light-glass: rgba(255, 255, 255, 0.85);

  /* Primary Brand Gradients */
  --grad-primary: linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #10b981 100%);
  --grad-purple: linear-gradient(135deg, #9333ea, #4f46e5);
  --grad-emerald: linear-gradient(135deg, #10b981, #059669);
  --grad-orb: linear-gradient(135deg, #4cc9ff, #7c3aed, #ec4899);

  /* Borders & Dividers */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-light: rgba(255, 255, 255, 0.15);
  --border-focus: rgba(168, 85, 247, 0.5);

  /* Typography Colors */
  --text-heading: #ffffff;
  --text-body: #94a3b8;
  --text-muted: #64748b;
  --text-accent: #a855f7;
  --text-emerald: #34d399;

  /* Functional Status Colors */
  --status-confirmed: #10b981;
  --status-completed: #3b82f6;
  --status-cancelled: #ef4444;
  --status-noshow: #f59e0b;
}
```

### 2.2 Typography Scale & Hierarchy
- **Font Families**:
  - Headings & Primary UI: `Plus Jakarta Sans`, `Inter`, sans-serif
  - Monospace (Keys, Tokens, References): `JetBrains Mono`, `Fira Code`, monospace
- **Hierarchy**:
  - `Display 1`: `text-5xl sm:text-7xl font-black tracking-tight leading-[1.08]`
  - `Heading 1`: `text-3xl sm:text-4xl font-bold tracking-tight text-white`
  - `Heading 2`: `text-xl sm:text-2xl font-bold text-white`
  - `Subheading`: `text-sm sm:text-base font-medium text-slate-400`
  - `Body`: `text-sm text-slate-300 leading-relaxed`
  - `Caption / Badge`: `text-xs font-semibold uppercase tracking-wider`
  - `Code / Token`: `text-xs font-mono tracking-wide`

### 2.3 Glassmorphism, Elevation & Surface Tokens
- **Glass Panel Standard**:
  ```css
  background: rgba(11, 16, 34, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  ```
- **Luminous Hover Glow**:
  ```css
  box-shadow: 0 0 30px rgba(168, 85, 247, 0.25), 0 0 60px rgba(16, 185, 129, 0.15);
  ```

### 2.4 Border Radii
- Modals, Popups & Cards: `rounded-3xl` (`24px`) or `rounded-[32px]`
- Inputs, Buttons & Tabs: `rounded-2xl` (`16px`)
- Chips, Badges & Pills: `rounded-full` (`9999px`)
- Micro badges & code containers: `rounded-lg` (`8px`)

### 2.5 Motion & Animation Tokens
- **Hover Transitions**: `transition-all duration-200 cubic-bezier(0.4, 0, 0.2, 1)`
- **Pulsing Orb Keyframe**:
  ```css
  @keyframes orbGlow {
    0%, 100% { transform: scale(1); opacity: 0.6; filter: blur(50px); }
    50% { transform: scale(1.15); opacity: 0.85; filter: blur(65px); }
  }
  ```
- **Voice Waveform Keyframe**:
  ```css
  @keyframes waveBar {
    0%, 100% { transform: scaleY(0.4); }
    50% { transform: scaleY(1.3); }
  }
  ```

---

## 3. GLOBAL COMPONENTS

### 3.1 Application Shell & Navigation Bar (`Navbar.jsx`)
- **Structure**:
  - Sticky glass header with `backdrop-blur-xl bg-[#050816]/80 border-b border-white/8`.
  - Left: Logo icon (36x36px with subtle radial backlight glow) + brand name `"Mencia"` with gradient text badge `"v2.0"`.
  - Center: Nav link pills with animated active indicator:
    - `Builder` (Icon: Sliders)
    - `Bookings` (Icon: Calendar, with live active counter badge e.g. `"12"`)
    - `Billing` (Icon: CreditCard)
    - `Live Demo` (External link to live widget)
  - Right:
    - User Profile Pill: User initials circle avatar (gradient background), user name and email, and a hover dropdown for logout (`FiLogOut`).
    - Mobile Hamburger toggle (`FiMenu` / `FiX`) that opens an ultra-sleek full-screen frosted drawer.

### 3.2 Floating Ambient Orbs & Background Architecture
- Every page incorporates two subtle ambient glow circles:
  - Top-left: `w-[400px] h-[400px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none`
  - Bottom-right: `w-[400px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none`

---

## 4. PAGE 1: LANDING PAGE (`Home.jsx`)

### 4.1 Hero Section with Ambient Glow
- **Eyebrow Pill**:
  - Centered badge with pulsing green dot: `"● Next-Gen Voice AI & Table Reservation Assistant"`.
  - Border: `border border-purple-500/30 bg-purple-500/10 text-purple-300`.
- **Hero Title**:
  - `"Turn Website Visitors Into Confirmed Customers With "`
  - Followed by multi-color animated gradient text: `Voice AI & Instant Reservations`.
- **Subtitle**:
  - `"An autonomous AI concierge embedded with one script tag. Talks naturally with guests, answers menu FAQs, checks live table capacity, and books reservations directly into your dashboard."`
- **Call-to-Action Buttons**:
  - Primary Button: `"Get Started Free →"` (Large 56px height, rounded-2xl, gradient background `#a855f7` to `#10b981`, shadow glow, spring hover).
  - Secondary Button: `"View Live Demo 🎙️"` (Outline button, glass background, opens interactive widget preview).
- **Trust Indicators**:
  - 3 avatars of verified users, rating stars `★★★★★`, and text `"Zero overbooking guaranteed · Sub-300ms Groq response time"`.

### 4.2 Live Interactive Widget Simulator (`AssistantPreview.jsx`)
- Interactive mockup card centered in the hero section:
  - Theme switcher bar (Dark, Light, Glass, Neon) with glowing radio rings.
  - Floating 3D holographic orb pulsing in rhythm.
  - Real-time speech wave bars reacting dynamically.
  - Interactive chip buttons: `"🍽️ Book Table"`, `"📅 Check Times"`, `"❌ Cancel Booking"`.

### 4.3 High-Density Bento Grid Features (3x2 Matrix)
1. **Card 1 (Sub-300ms Voice Intelligence)**:
   - Visual: Voice waveform sound bars with real-time latency indicator `~240ms`.
   - Text: Natural conversational turn-taking powered by Groq ultra-low-latency models.
2. **Card 2 (Autonomous Table Reservations)**:
   - Visual: Mini booking pass ticket graphic showing party size, time slot, and reference code.
   - Text: 2-phase customer confirmation with zero double-booking concurrency lock.
3. **Card 3 (1-Line JavaScript Embed)**:
   - Visual: Syntax-highlighted code block with 1-click copy button.
   - Text: Compatible with WordPress, Shopify, Next.js, Webflow, or static HTML.
4. **Card 4 (Owner Live Dashboard)**:
   - Visual: Mini sparkline metrics chart showing reservations today.
   - Text: Filter by date, change reservation status, and release table capacity in real time.
5. **Card 5 (Cryptographic Cancellations)**:
   - Visual: Security shield badge with SHA-256 token illustration.
   - Text: Secure customer self-service cancellations without requiring account login.
6. **Card 6 (BYOK Flexible Models)**:
   - Visual: Provider toggle chips showing Groq & Gemini with instant fallback protection.
   - Text: Use built-in provider or bring your own API key with complete privacy.

### 4.4 4-Step Interactive Implementation Flow
- Step 01: **Connect & Configure** (Define restaurant name, tone, and opening hours).
- Step 02: **Set Table Slots** (Specify capacity, table size, and reservation limits).
- Step 03: **Paste 1-Line Script** (Embed widget before the `</body>` tag).
- Step 04: **Watch Reservations Flow** (Manage live customer bookings in real time).

### 4.5 Conversion CTA Banner & Modern Dark Footer
- Full-width obsidian glass card with gradient border:
  - `"Ready to give your restaurant a 24/7 AI host?"`
  - Instant signup button with no credit card required.
- Footer with logo, system status badge (`All systems operational`), links to docs, privacy, and copyright.

---

## 5. PAGE 2: AUTHENTICATION & ONBOARDING (`Login.jsx`)

### 5.1 Layout & Visual Architecture
- **Two-Column Split Layout (1:1 Ratio on Desktop)**:
  - **Left Column (Product Showcase & Live Demo Canvas)**:
    - Deep gradient background with floating glowing orb.
    - Large typography: `"The Intelligent Voice Host for Modern Dining."`
    - Vertical feature bullet cards with glass icons (`HiOutlineMicrophone`, `HiOutlineSparkles`, `HiOutlineCodeBracket`).
    - Testimonial pill: *"Mencia handled 45 table bookings on our opening weekend with zero errors."*
  - **Right Column (Authentication Card)**:
    - Floating frosted glass card (`bg-[#0b1022]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 sm:p-12`).
    - Top: Brand logo with radial glow.
    - Title: `"Welcome to Mencia"` / `"Sign in to manage your assistant & reservations"`.
    - **Google Single Sign-On Button**:
      - Full-width 56px height, rounded-2xl.
      - White background with Google colored logo (`FcGoogle`).
      - Bold dark typography `"Continue with Google"`.
      - Hover: slight scale `1.02` with subtle shadow.
    - Security footer notice: `🔒 Secure OAuth 2.0 authentication. Your API keys are encrypted.`

---

## 6. PAGE 3: ASSISTANT BUILDER & CONFIGURATION (`Builder.jsx`)

### 6.1 Top Status Banner & 1-Click Embed Snippet Dock
- **Header Section**:
  - Page title: `"Assistant Builder & Reservation Studio"`.
  - Status Pill: `"Assistant Live & Ready"` with glowing green radar dot.
  - Stats Bar: Current Plan (`Free / Pro`), AI Provider Status (`Active`), Messages Remaining (`85 / 100`).
- **Embed Code Dock**:
  - Dark terminal-style container with copy button:
    ```html
    <script src="https://mencia.ai/assistant.js" data-user-id="YOUR_ID"></script>
    ```
  - Instruction callout: `"Paste this tag right before the closing </body> tag of your website."`

### 6.2 Tabbed Configuration Studio (4 Pillars)
Replace long scrolling forms with an intuitive **segmented tab navigation**:
- `[ Identity & Personality ]`
- `[ AI Provider & BYOK ]`
- `[ Navigation Pages ]`
- `[ Table Reservations & Capacity ]`

#### Tab 1: Identity & Personality
- Assistant Name input (e.g. `"Mencia"`, `"Sofia"`).
- Business Name input (e.g. `"Bhilai Bistro & Cafe"`).
- Business Type dropdown (Restaurant, Cafe, Bakery, Bar, Lounge).
- Business Description rich textarea (used as system prompt grounding).
- Tone Selection: 3 interactive cards with icons and preview quotes:
  - **Friendly & Warm** (Default, hospitable and conversational).
  - **Professional & Crisp** (Formal dining and executive reservations).
  - **Energetic & Casual** (Fast-casual, youth cafes, and pubs).
- Widget Theme Preview Chips:
  - 4 clickable color swatch circles: `Dark Obsidian`, `Clean Light`, `Frosted Glass`, `Neon Emerald`.

#### Tab 2: AI Provider & BYOK (Bring-Your-Own-Key)
- Provider Toggle Switch: **Groq (Recommended - Sub-300ms)** vs **Google Gemini**.
- API Key Input Field:
  - Masked password input with eye toggle (`Show / Hide`).
  - Validation test button: `"Verify Key"` which triggers a live 200ms latency check.
  - Status indicator: Green badge `Valid Key` / Amber `Using Server Default Key`.
- Advanced Model Dropdown:
  - Primary: `openai/gpt-oss-120b` (Deep instruction adherence).
  - Fallback: `openai/gpt-oss-20b` (Instant backup if rate limit reached).

#### Tab 3: Navigation Pages & Voice Commands
- Interactive Route Matrix:
  - Table of configured pages: Name, URL path, and trigger voice keywords.
  - Inline input bar:
    - Page Name (`"Menu"`) | Path (`"/menu"`) | Keywords (`"food, dishes, price, menu"`)
    - Button: `"+ Add Page"`
  - Voice action preview chip showing: *"When user says 'show food', assistant navigates to /menu."*

#### Tab 4: Table Reservations & Capacity Engine
- Master Toggle: **Enable Online Table Reservations** (Large emerald toggle switch).
- Operating Details:
  - Timezone selector dropdown (`Asia/Kolkata (IST)`, `America/New_York (EST)`, `UTC`, etc.).
  - Restaurant Location address input.
  - Working Days selector: 7 interactive circular day pills (`Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`) with active fill states.
- Rules & Constraints:
  - Seats per Table (e.g. `4`).
  - Maximum Party Size (e.g. `12 guests`).
  - Minimum Advance Notice (minutes, e.g. `60 min`).
  - Advance Booking Window (days, e.g. `30 days`).
  - Cancellation Policy text input (e.g. *"Free cancellation up to 1 hour before slot."*).
- **Interactive Time Slot Matrix**:
  - List of existing slots with time badges (e.g. `20:00 - 21:00`), table capacity badges (`5 Tables (20 seats)`), and delete button (`FiTrash2`).
  - Inline New Slot Builder:
    - Start Time input (`HH:mm`)
    - End Time input (`HH:mm`)
    - Table Capacity input (number of tables available)
    - Button: `"+ Add Slot"`

### 6.3 Embedded Live Widget Simulator (Right Column or Floating Drawer)
- Live interactive smartphone or popup preview rendering the actual assistant widget in real time as the user edits settings.

---

## 7. PAGE 4: TABLE RESERVATIONS DASHBOARD (`Bookings.jsx`)

### 7.1 Analytics Metric Cards (5-Column Grid)
- **Total Bookings**: Big number with icon `FiCalendar` and subtle trend badge.
- **Today's Bookings**: Purple accent glow card with bold count.
- **Confirmed**: Emerald status card with checkmark.
- **Completed**: Ocean blue status card with user icon.
- **Cancelled / No-Show**: Rose/amber status card indicating freed capacity.

### 7.2 Filter Bar & Controls Dock
- **Status Filter Tabs**: Horizontal pill bar:
  - `All` | `Confirmed (Active)` | `Completed` | `Cancelled` | `No-Show`
- **Date Filter Pill**:
  - Date input with calendar icon + `"Today"` quick filter button + `"Clear"` button.
- **Search Bar**:
  - Input with magnifying glass icon: Search by Customer Name, Phone Number, or Booking Reference (`BK-XXXXXX`).
- **Refresh Button**:
  - Top right glass button with spinning icon on click.

### 7.3 Data Grid (Desktop Table & Mobile Responsive Cards)
- **Table Columns**:
  1. **Booking Ref**: Monospace purple pill badge (e.g. `BK-97DFED17`) with 1-click clipboard copy.
  2. **Date & Time**: Bold date (e.g. `2026-10-26`) + clock icon with slot range (`20:00 - 21:00`).
  3. **Customer Details**: Bold customer name (`Birju Panda`) + clickable phone link (`+91 9876543210`).
  4. **Party & Capacity**: Guest count pill (`👥 2 guests`) + allocated table count (`1 table`).
  5. **Status Pill**:
     - Confirmed: Emerald border, emerald background tint, green dot.
     - Completed: Blue border, blue tint.
     - Cancelled: Red border, red tint, strike-through styling.
     - No-Show: Amber border, amber tint.
  6. **Quick Actions**:
     - Button `Complete` (Emerald hover)
     - Button `Cancel` (Rose hover, prompts confirmation to release capacity)
     - Button `No-Show` (Amber hover)
- **Mobile Card View**: Automatically collapses into individual stacked booking passes with clear dividers and touch-friendly action buttons.
- **Empty State**:
  - Illustration of a dining table with calendar icon.
  - Title: `"No reservations found"`.
  - Subtitle: *"Customer reservations made through the assistant widget will appear here in real time."*

---

## 8. PAGE 5: BILLING & SUBSCRIPTION STUDIO (`Billing.jsx`)

### 8.1 Active Plan Usage Progress & Telemetry
- 3 Stat Cards across the top:
  - **Plan Type**: `Free Tier` vs `Pro Plan` (with gradient crown icon).
  - **AI Provider Health**: `Active · Low Latency (Groq)`.
  - **Usage Counter**: Visual radial or linear progress bar showing `45 / 100 Messages Used`.

### 8.2 Tier Pricing Cards (Free vs Pro)
- **Free Plan Card**:
  - Price: `₹0` / Free Forever.
  - Features list with checkmarks:
    - ✓ 100 AI conversational responses
    - ✓ Voice-enabled speech synthesis & mic input
    - ✓ Table reservation engine (up to 3 slots)
    - ✓ Single script tag embed
  - Button: `"Current Plan"` (disabled, muted glass button).
- **Pro Plan Card (Featured Glowing Glass Card)**:
  - Glowing gradient border (`#a855f7` to `#10b981`).
  - Badge on top: `"MOST POPULAR"`.
  - Price: `₹699` / 3 Months Access (`~₹233/mo`).
  - Features list with emerald checkmarks:
    - ✓ **Unlimited** AI conversational responses
    - ✓ **Unlimited** table reservation slots & capacity
    - ✓ Priority Groq model response time (<300ms)
    - ✓ Custom branding & assistant theme styling
    - ✓ Complete booking analytics & CSV export
    - ✓ 24/7 Priority developer support
  - Action Button:
    - Currently: `"Coming Soon · Join Waitlist"` (with waitlist notification modal).
    - Future-ready Razorpay checkout integration trigger.

---

## 9. COMPONENT 6: FLOATING EMBEDDABLE ASSISTANT WIDGET

### 9.1 Floating Launcher Button
- Position: Fixed at `bottom: 24px; right: 24px; z-index: 999999;`.
- Dimensions: `64px x 64px`, circular, with gradient fill (`#7c3aed` to `#10b981`).
- Ambient Glow: Deep pulsing drop shadow `0 8px 32px rgba(124, 58, 237, 0.45)`.
- Icon: High-resolution brand logo with subtle hover rotation (`transform: scale(1.08)`).
- Unread Ping Dot: Small emerald dot at top-right indicating the assistant is active.

### 9.2 Collapsible Popup Container
- Position: Fixed at `bottom: 96px; right: 24px;`.
- Dimensions: `width: 380px; height: 600px; max-width: calc(100vw - 32px); max-height: calc(100vh - 120px);`.
- Corner Radius: `rounded-[32px]`.
- Backdrop: `backdrop-filter: blur(28px); background: rgba(5, 8, 22, 0.92); border: 1px solid rgba(255, 255, 255, 0.12);`.

### 9.3 Adaptive Header
- Top right: Minimal circular close button (`✕`).
- Center:
  - Holographic pulsing Orb: Starts at `80px x 80px`. When chat begins, smoothly shrinks to `44px x 44px`.
  - Assistant title: `"Hello! I'm Mencia"`.
  - Subtitle: `"Your dining concierge · Ask about menu or book a table"`.
  - Interactive Action Chips:
    - `[ 🍽️ Book Table ]`
    - `[ 📅 Check Times ]`
    - `[ ❌ Cancel Booking ]`

### 9.4 Middle Scrollable Message Stream
- `flex: 1 1 auto; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin;`.
- `flex-shrink: 0` on all children to guarantee that chat bubbles never compress or collapse.
- User Bubble:
  - Aligned right, gradient background (`#a855f7` to `#7c3aed`), crisp white text, rounded corners (`18px 18px 4px 18px`).
- AI Bubble:
  - Aligned left, frosted dark background (`rgba(255, 255, 255, 0.08)`), subtle border, rich markdown formatting (bolding, lists, linebreaks).
- Thinking Indicator:
  - 3 pulsing dots bouncing sequentially with gradient colors.

### 9.5 Interactive Rich Tool Result Cards
- **Available Slots Card**:
  - Title: `Available Times for YYYY-MM-DD`.
  - Clickable slot pills: e.g. `[ 20:00 - 21:00 (5 tables left) ]`.
  - Clicking a slot automatically prompts for customer name & phone.
- **Reservation Confirmed Pass (Boarding Pass Style)**:
  - Green header with confetti: `"🎉 Reservation Confirmed!"`.
  - Reference Code Badge: e.g. `BK-97DFED17` (bold monospace with copy icon).
  - Details: Date, Time Range, Guest Count, Customer Name.
  - Cancellation Token: Boxed monospace token with note: *"Save this token to cancel anytime."*

### 9.6 Pinned Bottom Dock
- Input dock pinned to bottom with `backdrop-filter: blur(16px); background: rgba(5, 8, 22, 0.95);`.
- Left: Circular voice microphone button (`44px x 44px` with pulsing glow when listening).
- Center: Pill text input (`Ask a question or book a table...`).
- Right: Circular send button with paper airplane / arrow icon.

---

## 10. MASTER PROMPT FOR AI CODING AGENT

> **How to use this prompt**: Copy and paste the block below into Claude 3.7 Sonnet, GPT-4o, or any advanced coding agent along with this `design.md` file to implement the redesign with 100% precision.

```markdown
You are a World-Class Senior Frontend Architect & Principal UI/UX Designer.
Your task is to completely redesign the web application Mencia according to the architectural blueprints in `design.md`.

### Core Requirements:
1. Tech Stack: React (Vite) + Tailwind CSS + Lucide Icons / React Icons.
2. Aesthetic: High-end Obsidian Glassmorphism (deep dark slate backgrounds #050816, frosted blur layers, thin white/10 borders, vibrant purple & emerald radial glows, clean typography).
3. Preserve Functionality:
   - Preserve all existing React router endpoints (`/`, `/login`, `/builder`, `/bookings`, `/billing`).
   - Preserve existing backend API bindings (`/api/assistant/*`, `/api/business/bookings/*`, `/api/user/*`, `/api/auth/*`).
   - Preserve real-time table reservation creation, slot capacity checks, status updates, and speech recognition/synthesis.
4. Elevate Every Component:
   - Redesign `Navbar.jsx` with glassmorphic floating pill layout and profile avatar drawer.
   - Redesign `Home.jsx` with the 6-card bento grid, glowing hero section, and interactive AssistantPreview simulator.
   - Redesign `Login.jsx` into the split showcase canvas with Google OAuth.
   - Redesign `Builder.jsx` into the 4-pill segmented tab studio with real-time slot matrix editor.
   - Redesign `Bookings.jsx` with the 5-metric KPI cards, quick date chips, and desktop/mobile data grid.
   - Redesign `Billing.jsx` with usage meters and luxury pricing cards.
   - Refine `assistant.css` and `assistant.js` ensuring silky-smooth scrolling, flex-shrink protections, and boarding-pass booking cards.

Execute the redesign cleanly, ensure all files pass ESLint and Vite build with 0 errors, and make the UI look visually stunning, polished, and production-ready.
```

# Mencia UI/UX Redesign Implementation Plan (v2.0)

## Executive Summary
This document outlines the systematic, page-by-page transformation of **Mencia** from a generic purple-gradient AI interface into an authentic, warm, restaurant-inspired SaaS platform matching the reference moodboard.

The design embodies:
- **Warm Cream & Ivory Surfaces**: `#F8F3EB`, `#FFFCF7`, `#F2EDE4`
- **Espresso & Dark Chocolate Navigation**: `#26160F`, `#382017`, `#1A0F0A`
- **Terracotta & Burnt Orange Accents**: `#A34720`, `#823719`, `#C85A2B`
- **Peach & Warm Neutral Interactive Elements**: `#F5E2D1`, `#EAD6C3`
- **Editorial Typography**: `Playfair Display` / `DM Serif Display` for headings; `DM Sans` / `Plus Jakarta Sans` for application UI; `JetBrains Mono` for codes & tokens.
- **Authentic Restaurant Imagery**: Warm ambient lighting, wood finishes, terracotta ceramics, and inviting interior scenes.

---

## 1. Existing Pages & Component Audit

| Route | Purpose | Current State | Target Redesign (Moodboard-aligned) |
|---|---|---|---|
| `/` (signed-out) | Public Landing Page | Purple-gradient hero, dark preview, basic 4-step list | Editorial split hero (warm serif typography, terracotta highlight), authentic restaurant interior backdrop, floating warm assistant preview, 4 feature pills, how it works, and footer |
| `/` (signed-in) or `/dashboard` | Authenticated Overview | Reused landing page under protected route | Dedicated SaaS Dashboard: Greeting header, View Website action, 4 metric cards (Total, Today, Completed, Cancelled), Restaurant Business Card ("Kitchen Home") with Edit, 4 Quick Action cards |
| `/login` | Authentication (Google OAuth) | Purple split screen with generic AI bullets | Warm cream split canvas with restaurant backdrop, Google OAuth button, privacy note, and brand highlights |
| `/builder` | Assistant Builder | Monolithic long form with dark input boxes | 6-Step guided wizard (Basic Info, Business Details, FAQs & Menu, Booking Settings, Appearance, Review & Publish) with real-time live preview on the right |
| `/bookings` | Table Reservation Management | Functional table with basic gray/purple badges | Moodboard Table Reservations screen: Date picker, Search bar, Status tabs (All, Confirmed, Pending, Completed, Cancelled), elegant table with status pills, and owner actions |
| `/billing` | Subscription & Limits | Purple/emerald gradient pro card, disabled button | Warm cream pricing cards, Free tier vs Pro (₹699/3mo), message telemetry bar, and clean waitlist modal |
| Global Widget | Embedded Assistant (`assistant.js`, `assistant.css`) | Dark obsidian popup with pulsing gradient orb | Warm cream/espresso aesthetic with peach quick action buttons (`Book a Table`, `View Menu`, `Our Location`, `Opening Hours`), circular mic badge, and clear conversation flow |

---

## 2. Proposed Shared Design System & Token Mechanism

### 2.1 CSS Variables & Palette Tokens
Defined in `Client/src/index.css`:
- `--mencia-bg`: `#F8F3EB` (Warm background)
- `--mencia-surface`: `#FFFCF7` (Card white)
- `--mencia-surface-subtle`: `#F2EDE4` (Elevated neutral surface)
- `--mencia-espresso`: `#382017` (Deep navigation and primary headings)
- `--mencia-espresso-dark`: `#24140D` (Sidebar and active background)
- `--mencia-terracotta`: `#A34720` (Primary button and active indicator)
- `--mencia-terracotta-hover`: `#853717` (Button hover state)
- `--mencia-peach`: `#F5E2D1` (Secondary action and quick chips)
- `--mencia-peach-hover`: `#EBD2BD` (Chip hover state)
- `--mencia-text-primary`: `#201A17` (Body primary text)
- `--mencia-text-secondary`: `#6B5E57` (Secondary muted text)
- `--mencia-text-muted`: `#968880` (Muted labels and helper text)
- `--mencia-border`: `#E6DDD1` (Delicate card and input borders)
- `--mencia-border-subtle`: `#EFE9DF` (Row dividers)
- `--mencia-status-green`: `#2E7D32` / `#E8F5E9` (Confirmed / Available)
- `--mencia-status-amber`: `#C77700` / `#FFF8E1` (Pending / Notice)
- `--mencia-status-red`: `#C62828` / `#FFEBEE` (Cancelled)
- `--mencia-status-blue`: `#1565C0` / `#E3F2FD` (Completed)

### 2.2 Typography
- Headings: `'Playfair Display', Georgia, serif`
- UI Text: `'Plus Jakarta Sans', 'DM Sans', -apple-system, sans-serif`
- Codes & Tokens: `'JetBrains Mono', 'Fira Code', monospace`

---

## 3. Component Architecture & Reuse Strategy

1. **`AppLayout.jsx`**: Shared authenticated application shell containing:
   - Left Sidebar (Fixed desktop / mobile drawer) with Mencia logo, navigation routes, user profile, and plan badge.
   - Top Bar with greeting, quick links, notifications, and user dropdown.
   - Content container with responsive padding and maximum width constraint.
2. **`PublicNavbar.jsx`**: Clean public header for marketing visitors with brand logo, nav links (`Product`, `Pricing`, `Restaurants`, `Blog`, `Support`), `Sign in` and `Get Started` terracotta button.
3. **`DashboardOverview.jsx`**: Rich overview screen displaying live business stats, Kitchen Home cover photo, settings overview, and 4 quick action cards.
4. **`BuilderStepper.jsx`**: Multi-step wizard wrapper with active terracotta step indicators and live assistant preview sync.
5. **`BookingsTable.jsx`**: Clean reservation grid with status filters, customer contact actions, search, and date picker.
6. **`UiControls`**: Standardized inputs, buttons, toggles, badges, and modal dialogs following the warm palette.

---

## 4. Image Asset Generation Plan
Using Gemini image generation:
1. `hero_restaurant_interior.png` (Warm dining room with wood tables, amber pendant lighting, cozy atmosphere).
2. `restaurant_dining_experience.png` (Contemporary restaurant dining table with natural sunlight and terracotta accents).
3. `kitchen_home_thumbnail.png` (Cozy bistro and cafe entrance with warm lighting for business card preview).

---

## 5. Verification & Acceptance Criteria
- Full responsive support (Desktop ~1440px, Laptop ~1280px, Tablet ~768px, Mobile ~390px).
- Zero regression in Firebase Google OAuth, Groq AI conversational booking, slot capacity checking, cancellation, or Razorpay billing logic.
- Both `Client` and `Server` build and lint without errors.
- Live test on local dev server.

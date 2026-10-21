# Comprehensive Travel Booking System - Global Tailwind UI/UX Specification

## 1. Global Visual Direction & Brand Vibe

- **Core Style:** Premium SaaS-infused Travel Platform (Inspired by Linear, Stripe, and Airbnb). Clean, ultra-modern, high-contrast, and deeply trustworthy.
- **Whitespace Principle:** Enforce high-breathing layouts. Use generous vertical/horizontal padding (`py-12` to `py-20`, `gap-8` to `gap-12`) to prevent data clutter.
- **Surface Elevation:**
  - Base: `bg-slate-50` (Light) | `bg-slate-950` (Dark)
  - Surface/Card: `bg-white` (Light) | `bg-slate-900` (Dark)
- **Borders & Radii:**
  - Controls (Inputs, Buttons): `rounded-xl` (12px)
  - Containers (Cards, Sections, Modals): `rounded-2xl` (16px) or `rounded-3xl` (24px)
  - Line Borders: Micro thin 1px lines using `border-slate-200/60` (Light) or `border-slate-800/80` (Dark).

## 2. Global Design Tokens (Tailwind System)

- **Primary / Action:** `emerald-600` (Hover: `emerald-700`, Light tint: `emerald-50`, Text: `text-emerald-600`).
- **Secondary / Trust / Ocean:** `sky-600` (Hover: `sky-700`).
- **Urgency / Alerts / Badges:** `rose-500` (Deals), `amber-500` (Ratings/Stars), `blue-500` (Info).
- **Typography Continuum:**
  - Headings / Titles: `text-slate-900` | Font-weight: `font-bold` or `font-extrabold` | Tracking: `tracking-tight`
  - Body Text / Paragraphs: `text-slate-600` | Font-weight: `font-normal` | Leading: `leading-relaxed`
  - Metadata / Captions: `text-slate-400` | Font-weight: `font-medium`

---

## 3. Core Component Layout Architectures

### A. Global Navigation & Footer

- **Navbar:** Sticky blur effect (`sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100`). High-craft links with custom hover interactions (`hover:text-emerald-600 transition-colors`).
- **Footer:** Deep structured layout (`bg-slate-900 text-slate-400 py-16`). Section headers must be crisp (`text-white font-semibold mb-4`).

### B. Hero Section & Immersive Search Bar (Home Page)

- **Hero Grid:** Minimal text layout paired with a rich, lazy-loaded background image or modern background grid pattern.
- **Floating Search Widget:** Must overlap the hero image border.
  - Class config: `bg-white rounded-2xl shadow-2xl border border-slate-100/80 p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end max-w-5xl mx-auto -mt-16 relative z-20`.
  - Field design: Soft backgrounds (`bg-slate-50`), custom focus rings (`focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500`).

### C. Master Tour Card Component (Listings Grid)

- **Structure:** Vertical flex container (`flex flex-col h-full bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300`).
- **Media Box:** Rigid aspect ratio (`aspect-[4/3] w-full overflow-hidden relative`). Inner image must zoom smoothly on card hover (`group-hover:scale-105 transition-transform duration-700 ease-out`).
- **Card Content:** Split layout. Title must use `line-clamp-2 text-base font-bold text-slate-900`. Footer pricing must look striking (`text-xl font-extrabold text-slate-900`).

### D. Booking Panel & Sticky Calculator (Tour Detail Page)

- **Layout Behavior:** Right column component configured with `sticky top-24`.
- **UI Shell:** `bg-white rounded-3xl border border-slate-100 p-6 shadow-md shadow-slate-100/50`.
- **Dynamic Breakdown:** Flat line items (`flex justify-between py-3 border-b border-slate-50 text-sm text-slate-600`). Final summary row features `text-2xl font-black text-emerald-600`.

### E. Itinerary Timeline Block (Tour Detail Page)

- **Structure:** Vertical timeline with left indicator rail (`relative border-l-2 border-slate-100 ml-4 pl-8 space-y-8`).
- **Day Markers:** Floating roundels using active tokens (`absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center ring-4 ring-emerald-50`).

### F. Multi-Step Checkout & Payment UI

- **Form Groups:** Grid-based layout (`grid grid-cols-1 md:grid-cols-2 gap-6`). Inputs must match standard token wrappers.
- **Payment Method Cards:** Interactive borders. Unselected: `border-slate-200 bg-white`. Selected: `border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600`.

---

## 4. Internal Admin & Operator Dashboard System (Backoffice UI)

### A. Shell Master Layout

- **Sidebar Navigation:** Fixed width layout (`w-64 bg-slate-900 h-screen text-slate-300 fixed left-0 top-0 flex flex-col justify-between p-4`). Active item tokens: `bg-emerald-600 text-white font-medium rounded-xl`.
- **Main Topbar:** Breadcrumbs layout paired with an avatar profile widget (`h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white`).

### B. Metric Summary Cards (Data Widgets)

- **Container:** `bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between`.
- **Trends:** Positive indicators (`text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-semibold`), Negative indicators (`text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-xs font-semibold`).

### C. Advanced Data Table Component

- **Wrapper:** `bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden`.
- **Table Cells:** Header row (`bg-slate-50/80 border-b border-slate-100 text-left text-xs font-bold text-slate-400 uppercase tracking-wider p-4`). Body rows (`border-b border-slate-100 text-sm text-slate-700 p-4 hover:bg-slate-50/50 transition-colors`).

---

## 5. Global Micro-Interactions & Quality Checks

- **Transitions:** Every interactive node (`<a>`, `<button>`, `<input>`, `<select>`) must possess `transition-all duration-200 ease-in-out`.
- **Shadow Cleanliness:** Strict ban on harsh drop-shadows. Utilize only layered web shadows (`shadow-sm`, `shadow-md`, `shadow-xl`).
- **Responsive Standard:** Mobile structures must be responsive (`grid-cols-1 md:grid-cols-N`). Use clean padding scales (`p-4` on mobile scaled up to `p-8` on desktop).

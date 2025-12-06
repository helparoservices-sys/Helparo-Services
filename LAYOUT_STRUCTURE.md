# Modular Layout Structure - Guardian Teal Design System

This document outlines the clean, modular layout architecture for Helparo using the Guardian Teal design system.

---

## Architecture Overview

```
src/
├── app/
│   ├── layout.tsx                 # Root layout (global providers, fonts)
│   ├── (public)/
│   │   ├── layout.tsx            # Public layout (header, footer)
│   │   └── page.tsx              # Homepage
│   ├── (auth)/
│   │   ├── layout.tsx            # Auth layout (centered, minimal)
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── (customer)/
│   │   ├── layout.tsx            # Customer dashboard layout
│   │   ├── dashboard/
│   │   ├── requests/
│   │   └── profile/
│   ├── (helper)/
│   │   ├── layout.tsx            # Helper dashboard layout
│   │   ├── dashboard/
│   │   ├── requests/
│   │   └── profile/
│   └── (admin)/
│       ├── layout.tsx            # Admin panel layout
│       ├── dashboard/
│       └── users/
└── components/
    └── layouts/
        ├── RootLayout.tsx
        ├── PublicLayout.tsx
        ├── AuthLayout.tsx
        ├── CustomerLayout.tsx
        ├── HelperLayout.tsx
        ├── AdminLayout.tsx
        └── shared/
            ├── Header.tsx
            ├── Footer.tsx
            ├── Sidebar.tsx
            └── MobileNav.tsx
```

---

## 1. Root Layout (`src/app/layout.tsx`)

**Purpose:** Global providers, font loading, metadata, theme configuration

```typescript
import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Helparo - Get Instant Help, Anytime',
  description: 'Connect with verified helpers for any task in minutes',
  keywords: ['help services', 'task assistance', 'instant help'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-body antialiased bg-white text-deep-navy">
        {/* Global Providers */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

**Features:**
- Font variables for Poppins (headings) and Inter (body)
- Global CSS reset and Guardian Teal variables
- Metadata for SEO
- Provider wrapper for context/state management

---

## 2. Public Layout (`src/app/(public)/layout.tsx`)

**Purpose:** Landing pages, marketing content with header and footer

```typescript
import Header from '@/components/layouts/shared/Header'
import Footer from '@/components/layouts/shared/Footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header variant="public" />
      
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  )
}
```

**Layout Structure:**
- **Header:** Glass-morphic, fixed top, Guardian Teal accents
- **Main:** Flex-1 to push footer down, no max-width (sections control their own)
- **Footer:** Deep Navy background, 4-column grid

**Pages Using This Layout:**
- Homepage (`/`)
- Services (`/services`)
- About (`/about`)
- Pricing (`/pricing`)

---

## 3. Auth Layout (`src/app/(auth)/layout.tsx`)

**Purpose:** Login, signup, password reset - minimal, centered

```typescript
import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.NodeNode
}) {
  return (
    <div className="min-h-screen bg-gradient-navy-teal flex items-center justify-center px-4 py-12">
      {/* Logo Header */}
      <div className="absolute top-8 left-8">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logo.jpg" alt="Helparo" width={40} height={40} className="rounded-full" />
          <span className="text-white font-heading font-bold text-xl">Helparo</span>
        </Link>
      </div>

      {/* Centered Card */}
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl shadow-teal-lg p-8 animate-scale-in">
          {children}
        </div>
      </div>

      {/* Floating Background Elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-aqua-glow rounded-full blur-3xl opacity-20 animate-float" />
      <div className="absolute bottom-20 left-20 w-48 h-48 bg-guardian-teal rounded-full blur-3xl opacity-30 animate-float" style={{ animationDelay: '1s' }} />
    </div>
  )
}
```

**Layout Features:**
- Full-screen gradient background (Deep Navy → Guardian Teal)
- Centered card with glass-morphic effect
- Logo in top-left corner (absolute positioned)
- Floating Aqua Glow blobs for visual interest
- Max-width 28rem (448px) for form container
- Scale-in animation on mount

**Pages Using This Layout:**
- Login (`/auth/login`)
- Signup (`/auth/signup`)
- Forgot Password (`/auth/forgot-password`)
- Reset Password (`/auth/reset-password`)

---

## 4. Customer Dashboard Layout (`src/app/(customer)/layout.tsx`)

**Purpose:** Customer-facing dashboard with sidebar navigation

```typescript
import CustomerSidebar from '@/components/layouts/shared/Sidebar/CustomerSidebar'
import DashboardHeader from '@/components/layouts/shared/Header/DashboardHeader'
import MobileNav from '@/components/layouts/shared/MobileNav'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop: Sidebar + Main */}
      <div className="hidden md:flex">
        <CustomerSidebar />
        
        <div className="flex-1 ml-64">
          <DashboardHeader role="customer" />
          
          <main className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile: Top Nav + Main */}
      <div className="md:hidden">
        <DashboardHeader role="customer" />
        
        <main className="p-4">
          {children}
        </main>
        
        <MobileNav role="customer" />
      </div>
    </div>
  )
}
```

**Layout Structure:**

**Desktop (≥768px):**
- Fixed sidebar (256px width): Guardian Teal gradient background, white icons/text
- Main content: ml-64 (margin-left), max-w-7xl container
- Dashboard header: Breadcrumbs, user profile, notifications
- Padding: p-6 lg:p-8

**Mobile (<768px):**
- Top header: Logo, page title, hamburger menu
- Full-width content: p-4
- Bottom navigation: Fixed bar with 4-5 main actions (Guardian Teal icons)

**Sidebar Navigation:**
```
Dashboard
My Requests
Browse Helpers
Messages
Payments
Profile
Settings
```

**Pages Using This Layout:**
- Dashboard (`/customer/dashboard`)
- Requests (`/customer/requests`)
- Messages (`/customer/messages`)
- Profile (`/customer/profile`)

---

## 5. Helper Dashboard Layout (`src/app/(helper)/layout.tsx`)

**Purpose:** Helper-facing dashboard with sidebar navigation

```typescript
import HelperSidebar from '@/components/layouts/shared/Sidebar/HelperSidebar'
import DashboardHeader from '@/components/layouts/shared/Header/DashboardHeader'
import MobileNav from '@/components/layouts/shared/MobileNav'

export default function HelperLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop */}
      <div className="hidden md:flex">
        <HelperSidebar />
        
        <div className="flex-1 ml-64">
          <DashboardHeader role="helper" />
          
          <main className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <DashboardHeader role="helper" />
        
        <main className="p-4">
          {children}
        </main>
        
        <MobileNav role="helper" />
      </div>
    </div>
  )
}
```

**Sidebar Navigation:**
```
Dashboard
Browse Requests
My Bids
Active Jobs
Earnings
Messages
Profile
Settings
```

**Unique Features:**
- Earnings widget in sidebar (today's earnings, Guardian Teal highlight)
- Active job counter badge
- Quick bid button (Aqua Glow CTA)

---

## 6. Admin Panel Layout (`src/app/(admin)/layout.tsx`)

**Purpose:** Admin dashboard with expanded sidebar and data tables

```typescript
import AdminSidebar from '@/components/layouts/shared/Sidebar/AdminSidebar'
import DashboardHeader from '@/components/layouts/shared/Header/DashboardHeader'

export default function AdminLayout({
  children,
}: {
  children: React.NodeNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar />
        
        <div className="flex-1 ml-72">
          <DashboardHeader role="admin" />
          
          <main className="p-8">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
```

**Unique Features:**
- Wider sidebar (288px) for more navigation options
- Wider max-width (1600px) for data tables
- Deep Navy sidebar background (more professional)
- Red badge for pending verifications

**Sidebar Navigation:**
```
Dashboard
Users
  - Customers
  - Helpers
  - Pending Verifications
Requests
Payments
Reports
Settings
Security
Logs
```

---

## Shared Components

### Header (`src/components/layouts/shared/Header.tsx`)

**Variants:**
1. **Public Header** (Marketing pages)
   - Glass-morphic background
   - Logo + Nav links + CTA buttons
   - Fixed top, z-50
   - Aqua Glow "Sign Up" button

2. **Dashboard Header** (All dashboards)
   - White background, shadow-sm
   - Breadcrumbs + Search + Notifications + Profile dropdown
   - Role-specific actions

**Props:**
```typescript
interface HeaderProps {
  variant: 'public' | 'dashboard'
  role?: 'customer' | 'helper' | 'admin'
}
```

---

### Footer (`src/components/layouts/shared/Footer.tsx`)

**Structure:**
- Deep Navy background
- 4-column grid (desktop), 1 column (mobile)
- Columns: Company, Services, Support, Legal
- Social icons: Guardian Teal, hover:Aqua Glow
- Copyright: Inter Regular 14px, white/70

**Included On:**
- All public pages
- NOT included on dashboards (use sticky footer pattern if needed)

---

### Sidebar (`src/components/layouts/shared/Sidebar/`)

**Common Props:**
```typescript
interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}
```

**Desktop Structure:**
- Fixed left, full height
- Gradient background (customer/helper: Guardian Teal, admin: Deep Navy)
- Logo at top (40px)
- Navigation links: Icons + text, hover:bg-white/10
- Active state: bg-white/20, border-left-4 border-aqua-glow
- User profile at bottom

**Mobile:**
- Hidden on mobile
- Use MobileNav component instead

---

### MobileNav (`src/components/layouts/shared/MobileNav.tsx`)

**Structure:**
- Fixed bottom bar
- Height: 64px
- Background: White, shadow-lg
- 4-5 icon buttons
- Active state: Guardian Teal color, scale-110

**Navigation Items:**
```typescript
// Customer
Home, Requests, Messages, Profile

// Helper
Dashboard, Browse, Bids, Messages, Profile
```

---

## Responsive Behavior

### Breakpoints
```typescript
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
}
```

### Layout Shifts
- **< 768px:** Sidebar → MobileNav, full-width content
- **≥ 768px:** Sidebar visible, content with margin-left
- **≥ 1024px:** Larger padding, wider containers
- **≥ 1280px:** Max-width containers expand

---

## Animation Consistency

All layouts use consistent animations from `src/lib/animations.ts`:

```typescript
import { fadeInVariants, pageTransitions } from '@/lib/animations'

// Page transitions
<motion.div
  initial={pageTransitions.initial}
  animate={pageTransitions.animate}
  exit={pageTransitions.exit}
  transition={pageTransitions.transition}
>
  {children}
</motion.div>
```

---

## Accessibility

- **Skip to Content:** Hidden link at top, visible on focus
- **Keyboard Navigation:** Tab order follows visual hierarchy
- **ARIA Landmarks:** `<header>`, `<main>`, `<nav>`, `<footer>`
- **Focus Indicators:** Guardian Teal ring, 2px offset
- **Screen Reader Labels:** All icons have aria-label

---

## File Structure Summary

```
src/
├── app/
│   ├── layout.tsx                      # Root (fonts, providers)
│   ├── (public)/layout.tsx            # Marketing pages
│   ├── (auth)/layout.tsx              # Auth pages
│   ├── (customer)/layout.tsx          # Customer dashboard
│   ├── (helper)/layout.tsx            # Helper dashboard
│   └── (admin)/layout.tsx             # Admin panel
└── components/
    └── layouts/
        ├── shared/
        │   ├── Header/
        │   │   ├── PublicHeader.tsx
        │   │   └── DashboardHeader.tsx
        │   ├── Footer/
        │   │   └── Footer.tsx
        │   ├── Sidebar/
        │   │   ├── CustomerSidebar.tsx
        │   │   ├── HelperSidebar.tsx
        │   │   └── AdminSidebar.tsx
        │   └── MobileNav/
        │       └── MobileNav.tsx
        └── Providers.tsx
```

---

## Usage Example

**Creating a new customer page:**

```typescript
// src/app/(customer)/new-page/page.tsx
export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold text-deep-navy">
        Page Title
      </h1>
      
      {/* Content automatically inherits customer layout */}
    </div>
  )
}
```

The layout is automatically applied via route groups - no need to import!

---

## Guardian Teal Theme Tokens

All layouts use these consistent design tokens:

```css
/* Primary Colors */
--guardian-teal: #00C3B4
--deep-navy: #0A1A2F
--aqua-glow: #35F1CD

/* Shadows */
--shadow-teal-sm: 0 2px 4px rgba(0, 195, 180, 0.1)
--shadow-teal-lg: 0 8px 16px rgba(0, 195, 180, 0.2)

/* Border Radius */
--radius: 0.5rem
--radius-lg: 1rem
--radius-xl: 1.5rem

/* Spacing */
--spacing-unit: 4px (0-96px scale)
```

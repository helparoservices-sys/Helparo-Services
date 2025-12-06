# Helparo Homepage Wireframe - Guardian Teal Design

## Overview
This wireframe details the complete homepage structure using the Guardian Teal design system. All measurements, colors, spacing, and animations follow the design tokens defined in `tailwind.config.ts` and `DESIGN_SYSTEM.md`.

---

## Header (Fixed, Glass Morphic)
**Height:** 80px  
**Background:** `rgba(255, 255, 255, 0.8)` with `backdrop-blur-md`  
**Border Bottom:** `1px solid rgba(0, 195, 180, 0.1)`  
**Shadow:** `shadow-teal-sm`  
**Z-Index:** 50  

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Logo.jpg 40x40]  Helparo                Services▾  How It Works  About     │
│                                                                              │
│                                        [Sign Up - Aqua Glow]  [Login - Outline]│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Container: `max-w-7xl mx-auto px-6`
- Logo: 40px × 40px, rounded-full, Guardian Teal border (2px)
- Brand Name: Poppins Bold 24px, Deep Navy (#0A1A2F)
- Nav Links: Inter Medium 16px, spacing 32px, hover:text-guardian-teal
- CTA Buttons:
  - Sign Up: Aqua Glow (#35F1CD), shadow-glow, hover:shadow-glow-lg
  - Login: Outline (border-guardian-teal), hover:bg-guardian-teal/10

**Animations:**
- Header: `animate-fade-in-down` on load
- Buttons: `hover:scale-105 transition-transform duration-300`

---

## Hero Section
**Height:** 600px (desktop), 500px (mobile)  
**Background:** `bg-gradient-navy-teal` (linear-gradient from Deep Navy to Guardian Teal)  
**Padding:** `py-20 px-6`  

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   ╔════════════════════════════════════════╗                │
│                   ║                                        ║                │
│                   ║    Get Instant Help, Anytime          ║ (Poppins 56px) │
│                   ║                                        ║                │
│                   ║    Connect with verified helpers      ║ (Inter 20px)   │
│                   ║    for any task in minutes            ║                │
│                   ║                                        ║                │
│                   ║  [Post a Request - Aqua Glow CTA]     ║                │
│                   ║  [Browse Helpers - Outline White]     ║                │
│                   ║                                        ║                │
│                   ╚════════════════════════════════════════╝                │
│                                                                              │
│   [Blob 1: Aqua Glow]          [Blob 2: Guardian Teal]                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Container: `max-w-7xl mx-auto text-center`
- Headline: Poppins Bold 56px (mobile: 36px), white, `text-gradient-teal` effect
- Subtitle: Inter Regular 20px (mobile: 16px), white/90, max-width 600px
- Button Spacing: 16px gap
- Floating Blobs: `animate-float`, position absolute, blur-3xl, opacity-30

**Animations:**
- Headline: `animate-fade-in-up` with 0.2s delay
- Subtitle: `animate-fade-in-up` with 0.4s delay
- CTAs: `animate-scale-in` with 0.6s delay
- Blobs: `animate-float` infinite

**Colors:**
- Background Gradient: `#0A1A2F → #00C3B4`
- Text: White (#FFFFFF)
- Primary CTA: Aqua Glow (#35F1CD)
- Secondary CTA: White outline, hover:bg-white/10

---

## Trust Badges Section
**Height:** 100px  
**Background:** White  
**Padding:** `py-8`  

```
┌─────────────────────────────────────────────────────────────────────────────┐
│        [Shield Icon]         [Check Icon]          [Star Icon]             │
│      Verified Helpers      Secure Payments      4.9/5 Rating               │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Container: `max-w-6xl mx-auto`
- Grid: 3 columns (mobile: 1 column stack)
- Icons: 32px, Guardian Teal (#00C3B4)
- Text: Inter Medium 16px, Deep Navy
- Spacing: gap-8

**Animations:**
- Each badge: `animate-fade-in` with stagger (0.1s, 0.2s, 0.3s delay)

---

## Services Section
**Height:** Auto  
**Background:** `bg-guardian-teal-50`  
**Padding:** `py-20 px-6`  

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Popular Service Categories                           │
│                     Browse helpers across all services                      │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ [Icon]       │  │ [Icon]       │  │ [Icon]       │  │ [Icon]       │   │
│  │              │  │              │  │              │  │              │   │
│  │ Home Care    │  │ Tech Support │  │ Tutoring     │  │ Delivery     │   │
│  │ 120+ Helpers │  │ 85+ Helpers  │  │ 95+ Helpers  │  │ 110+ Helpers │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                                              │
│                    [View All Services - Outline]                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Container: `max-w-7xl mx-auto`
- Heading: Poppins Bold 40px, Deep Navy, text-center
- Subtitle: Inter Regular 18px, gray-600
- Grid: 4 columns (tablet: 2, mobile: 1)
- Card Size: 280px width, 200px height
- Card Style:
  - Background: White
  - Border Radius: 16px
  - Shadow: `shadow-teal-md`
  - Hover: `shadow-teal-lg hover:-translate-y-2`
  - Padding: 32px

**Card Structure:**
- Icon: 48px, Guardian Teal
- Title: Poppins Semibold 20px, Deep Navy
- Helper Count: Inter Regular 14px, gray-500
- Border: 1px solid guardian-teal/20

**Animations:**
- Heading: `animate-fade-in`
- Cards: `animate-fade-in-up` with stagger (0.1s per card)
- Card Hover: `hover:scale-[1.02] transition-transform duration-300`

---

## How It Works Section
**Height:** Auto  
**Background:** White  
**Padding:** `py-20 px-6`  

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          How Helparo Works                                  │
│                    Get help in three simple steps                           │
│                                                                              │
│   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐        │
│   │ [1 Circle]  │   ───→   │ [2 Circle]  │   ───→   │ [3 Circle]  │        │
│   │             │          │             │          │             │        │
│   │ Post Your   │          │ Choose a    │          │ Get Help    │        │
│   │ Request     │          │ Helper      │          │ Done        │        │
│   │             │          │             │          │             │        │
│   │ Describe... │          │ Review bids │          │ Pay secure  │        │
│   └─────────────┘          └─────────────┘          └─────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Container: `max-w-6xl mx-auto text-center`
- Heading: Poppins Bold 40px, Deep Navy
- Grid: 3 columns (mobile: 1 column stack)
- Step Card:
  - Width: 300px
  - Padding: 24px
  - Border Radius: 16px
  - Border: 2px solid guardian-teal/20
  - Background: White

**Step Number Circle:**
- Size: 64px diameter
- Background: `gradient-teal` (Guardian Teal to Aqua Glow)
- Text: Poppins Bold 32px, White
- Shadow: `shadow-teal-md`
- Position: Center top

**Arrows:**
- Hidden on mobile
- Color: Guardian Teal/40
- Size: 32px

**Animations:**
- Steps: `animate-slide-in-right` with stagger (0.2s per step)
- Number Circles: `animate-glow` on hover

---

## Features Section
**Height:** Auto  
**Background:** `gradient-soft` (Guardian Teal 50 to White)  
**Padding:** `py-20 px-6`  

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Why Choose Helparo?                                  │
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐│
│  │ [Icon]              │  │ [Icon]              │  │ [Icon]              ││
│  │                     │  │                     │  │                     ││
│  │ Verified Helpers    │  │ Instant Booking     │  │ Secure Payments     ││
│  │ All helpers are     │  │ Get help within     │  │ Pay only when       ││
│  │ background-checked  │  │ minutes, not days   │  │ satisfied           ││
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘│
│                                                                              │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐│
│  │ [Icon]              │  │ [Icon]              │  │ [Icon]              ││
│  │                     │  │                     │  │                     ││
│  │ Real-Time Tracking  │  │ 24/7 Support        │  │ Money-Back          ││
│  │ Track helper        │  │ We're here to       │  │ Guaranteed          ││
│  │ location live       │  │ help anytime        │  │ satisfaction        ││
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Container: `max-w-7xl mx-auto`
- Grid: 3 columns (tablet: 2, mobile: 1)
- Card Size: 350px width, auto height
- Card Style:
  - Background: White
  - Border Radius: 16px
  - Border: 1px solid guardian-teal/20
  - Padding: 32px
  - Shadow: `shadow-card`
  - Hover: `shadow-teal-lg hover:-translate-y-1`

**Card Content:**
- Icon: 40px, gradient-teal background circle
- Title: Poppins Semibold 20px, Deep Navy
- Description: Inter Regular 16px, gray-600, line-height 1.6

**Animations:**
- Grid: `staggerContainerVariants` (0.1s stagger)
- Each Card: `fadeInUpVariants`
- Hover: `card-hover-lift` effect

---

## Social Proof Section
**Height:** 200px  
**Background:** Deep Navy (#0A1A2F)  
**Padding:** `py-12 px-6`  

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Join 10,000+ Happy Customers                            │
│                                                                              │
│         "Amazing service!"       "Quick and reliable"      "Highly recommend"│
│         ⭐⭐⭐⭐⭐              ⭐⭐⭐⭐⭐               ⭐⭐⭐⭐⭐          │
│         - Sarah K.               - John D.                 - Emily R.       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Container: `max-w-6xl mx-auto text-center`
- Heading: Poppins Bold 32px, White
- Reviews: 3 columns (mobile: 1 carousel)
- Text Color: White/90
- Stars: Aqua Glow (#35F1CD)

**Animations:**
- Heading: `animate-fade-in`
- Reviews: Horizontal scroll on mobile with shimmer effect

---

## CTA Section
**Height:** 300px  
**Background:** `gradient-teal`  
**Padding:** `py-16 px-6`  

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                     Ready to Get Started?                                   │
│              Post your first request in less than 2 minutes                 │
│                                                                              │
│                  [Post a Request Now - White BG, Deep Navy Text]            │
│                        [Learn More - Outline White]                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Container: `max-w-4xl mx-auto text-center`
- Heading: Poppins Bold 48px, White
- Subtitle: Inter Regular 20px, White/90
- Button Spacing: 16px gap

**Buttons:**
- Primary: White background, Deep Navy text, shadow-lg
- Secondary: Outline white, hover:bg-white/20

**Animations:**
- Section: `animate-fade-in-up`
- Buttons: `hover:scale-105`

---

## Footer
**Height:** Auto  
**Background:** Deep Navy (#0A1A2F)  
**Padding:** `py-12 px-6`  
**Border Top:** 1px solid guardian-teal/20  

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo] Helparo                                                             │
│                                                                              │
│  Company          Services          Support          Legal                 │
│  - About Us       - Home Care       - Help Center    - Privacy             │
│  - Careers        - Tech Support    - Contact        - Terms               │
│  - Press          - Tutoring        - FAQs           - Cookies             │
│  - Blog           - Delivery        - Safety                               │
│                                                                              │
│  ──────────────────────────────────────────────────────────────────────────│
│                                                                              │
│  © 2024 Helparo. All rights reserved.     [Social Icons: Twitter, FB, IG]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- Container: `max-w-7xl mx-auto`
- Grid: 4 columns (mobile: 1 column stack)
- Text Color: White/80, hover:text-aqua-glow
- Link Hover: Transition 300ms smooth
- Social Icons: Guardian Teal, hover:Aqua Glow

---

## Responsive Breakpoints

### Desktop (1280px+)
- Container: max-w-7xl
- Grid: 4 columns (services), 3 columns (features)
- Hero height: 600px
- Font sizes: As specified

### Tablet (768px - 1279px)
- Container: max-w-4xl
- Grid: 2 columns
- Hero height: 500px
- Font sizes: -4px reduction

### Mobile (< 768px)
- Container: px-4
- Grid: 1 column stack
- Hero height: 450px
- Font sizes: 
  - H1: 36px (from 56px)
  - H2: 28px (from 40px)
  - Body: 14px (from 16px)
- Button: Full width
- Cards: Full width with 16px margin

---

## Color Palette Reference

| Element | Color | Hex Code |
|---------|-------|----------|
| Primary | Guardian Teal | #00C3B4 |
| Secondary | Deep Navy | #0A1A2F |
| CTA/Accent | Aqua Glow | #35F1CD |
| Background Light | Teal 50 | #E6FAF8 |
| Text Primary | Deep Navy | #0A1A2F |
| Text Secondary | Gray 600 | #4B5563 |
| Border | Teal 20% | rgba(0, 195, 180, 0.2) |

---

## Animation Timeline

**On Page Load:**
1. Header: Fade in down (0s)
2. Hero headline: Fade in up (0.2s)
3. Hero subtitle: Fade in up (0.4s)
4. Hero CTAs: Scale in (0.6s)
5. Trust badges: Fade in stagger (0.8s, 0.9s, 1.0s)

**On Scroll (Viewport):**
1. Services cards: Fade in up stagger (0.1s per card)
2. How it works steps: Slide in right stagger (0.2s per step)
3. Features cards: Fade in up stagger (0.1s per card)
4. Social proof: Fade in (once in viewport)
5. Footer: Fade in (once in viewport)

---

## Accessibility Notes

- All interactive elements: Focus ring (guardian-teal-500)
- Minimum contrast ratio: 4.5:1 for body text
- Heading contrast: 7:1
- Keyboard navigation: Tab order follows visual hierarchy
- ARIA labels: All icons and interactive elements
- Alt text: All images including logo
- Skip to content link: Hidden until focused

---

## Performance Optimization

- Images: Next.js Image component with lazy loading
- Animations: CSS animations (GPU-accelerated)
- Fonts: Preloaded Poppins and Inter
- Critical CSS: Inlined for above-the-fold content
- Defer non-critical scripts
- Minimize layout shifts: Fixed dimensions for images/cards

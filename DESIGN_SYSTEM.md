# Helparo Guardian Teal Design System

## Brand Identity

### Mission
Create a calm, trustworthy, and frictionless platform that connects customers with verified helpers instantly.

### Visual Principles
- **Trust**: Clean, professional, structured layouts
- **Speed**: Smooth animations, instant feedback, fast loading states
- **Simplicity**: Minimal clutter, clear hierarchy, focused CTAs
- **Premium**: Subtle depth, polished interactions, refined typography

---

## Color Palette

### Primary Colors
```css
--guardian-teal: #00C3B4      /* Primary brand color */
--deep-navy: #0A1A2F          /* Premium depth, text */
--aqua-glow: #35F1CD          /* High-impact CTAs only */
```

### Neutral Palette
```css
--white: #FFFFFF
--gray-50: #F8FFFE
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-300: #D1D5DB
--gray-400: #9CA3AF
--gray-500: #6B7280
--gray-600: #4B5563
--gray-700: #374151
--gray-800: #1F2937
--gray-900: #111827
```

### Semantic Colors
```css
--success: #10B981
--warning: #F59E0B
--error: #EF4444
--info: #3B82F6
```

### Background Gradients
```css
--gradient-light: linear-gradient(135deg, #F8FFFE 0%, #FFFFFF 100%)
--gradient-teal-soft: linear-gradient(135deg, #E6FAF8 0%, #FFFFFF 100%)
--gradient-navy-teal: linear-gradient(135deg, #0A1A2F 0%, #00C3B4 100%)
--gradient-cta: linear-gradient(135deg, #35F1CD 0%, #00C3B4 100%)
```

---

## Typography

### Font Families
```css
--font-heading: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif
--font-mono: 'JetBrains Mono', Consolas, monospace
```

### Type Scale
```css
--text-xs: 0.75rem      /* 12px */
--text-sm: 0.875rem     /* 14px */
--text-base: 1rem       /* 16px */
--text-lg: 1.125rem     /* 18px */
--text-xl: 1.25rem      /* 20px */
--text-2xl: 1.5rem      /* 24px */
--text-3xl: 1.875rem    /* 30px */
--text-4xl: 2.25rem     /* 36px */
--text-5xl: 3rem        /* 48px */
--text-6xl: 3.75rem     /* 60px */
```

### Font Weights
```css
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
--font-black: 900
```

### Line Heights
```css
--leading-tight: 1.25
--leading-snug: 1.375
--leading-normal: 1.5
--leading-relaxed: 1.625
--leading-loose: 2
```

---

## Spacing System

### Consistent Scale (4px base)
```css
--space-0: 0
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-5: 1.25rem   /* 20px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
--space-10: 2.5rem   /* 40px */
--space-12: 3rem     /* 48px */
--space-16: 4rem     /* 64px */
--space-20: 5rem     /* 80px */
--space-24: 6rem     /* 96px */
```

---

## Border Radius

### Consistent Rounding
```css
--radius-sm: 0.5rem    /* 8px */
--radius-md: 0.75rem   /* 12px */
--radius-lg: 1rem      /* 16px */
--radius-xl: 1.5rem    /* 24px */
--radius-2xl: 2rem     /* 32px */
--radius-full: 9999px
```

---

## Shadows & Elevation

### Shadow Layers
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

/* Teal-specific shadows */
--shadow-teal-sm: 0 2px 4px rgba(0, 195, 180, 0.1)
--shadow-teal-md: 0 4px 8px rgba(0, 195, 180, 0.15)
--shadow-teal-lg: 0 8px 16px rgba(0, 195, 180, 0.2)

/* Glow effect */
--glow-aqua: 0 0 20px rgba(53, 241, 205, 0.4)
```

---

## Animation System

### Timing Functions
```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)
--ease-in: cubic-bezier(0.4, 0, 1, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)
--ease-in-out: cubic-bezier(0.4, 0, 0.6, 1)
```

### Duration Scale
```css
--duration-fast: 150ms
--duration-base: 200ms
--duration-medium: 300ms
--duration-slow: 400ms
--duration-slower: 600ms
```

### Keyframe Animations
- `fadeIn`: Soft opacity fade with subtle upward motion
- `slideInRight`: Smooth slide from right
- `slideInLeft`: Smooth slide from left
- `scaleIn`: Gentle scale-up effect
- `shimmer`: Loading skeleton effect
- `pulse`: Subtle breathing animation
- `float`: Gentle vertical floating
- `glow`: Aqua glow breathing effect

---

## Component Guidelines

### Buttons

#### Primary (Aqua Glow CTA)
```css
background: var(--aqua-glow)
color: var(--deep-navy)
padding: 12px 24px
border-radius: var(--radius-lg)
font-weight: var(--font-bold)
transition: all 200ms ease-smooth
box-shadow: var(--shadow-teal-sm)

hover: scale(1.05), shadow-teal-md
active: scale(0.98)
disabled: opacity-50, cursor-not-allowed
```

#### Secondary (Guardian Teal)
```css
background: var(--guardian-teal)
color: white
border-radius: var(--radius-lg)
box-shadow: var(--shadow-teal-sm)
```

#### Outline
```css
border: 2px solid var(--guardian-teal)
color: var(--guardian-teal)
background: transparent
hover: background(var(--guardian-teal)), color(white)
```

#### Ghost
```css
background: transparent
color: var(--deep-navy)
hover: background(gray-100)
```

### Cards
```css
background: white
border-radius: var(--radius-xl)
padding: var(--space-6)
box-shadow: var(--shadow-base)
border: 1px solid var(--gray-200)

hover: shadow-md, translateY(-2px)
transition: all 300ms ease-smooth
```

### Forms

#### Input Fields
```css
border: 2px solid var(--gray-200)
border-radius: var(--radius-md)
padding: 12px 16px
font-size: var(--text-base)
transition: all 200ms ease-smooth

focus: border-color(var(--guardian-teal)), shadow-teal-sm
error: border-color(var(--error))
success: border-color(var(--success))
```

#### Labels
```css
font-size: var(--text-sm)
font-weight: var(--font-medium)
color: var(--deep-navy)
margin-bottom: var(--space-2)
```

### Modals & Drawers
```css
backdrop: rgba(10, 26, 47, 0.5)
backdrop-filter: blur(4px)
animation: fadeIn 300ms ease-smooth

content: 
  background: white
  border-radius: var(--radius-2xl)
  padding: var(--space-8)
  max-width: 600px
  box-shadow: var(--shadow-2xl)
  animation: scaleIn 300ms ease-bounce
```

### Navigation
```css
height: 80px
background: rgba(255, 255, 255, 0.8)
backdrop-filter: blur(12px)
border-bottom: 1px solid rgba(0, 195, 180, 0.1)
position: sticky
top: 0
z-index: 50
```

---

## Layout Structure

### Grid System
- Container max-width: 1280px
- Gutter: 24px
- Columns: 12 (desktop), 4 (tablet), 1 (mobile)

### Breakpoints
```css
--screen-sm: 640px
--screen-md: 768px
--screen-lg: 1024px
--screen-xl: 1280px
--screen-2xl: 1536px
```

### Section Spacing
```css
padding-y: var(--space-24)  /* Desktop */
padding-y: var(--space-16)  /* Tablet */
padding-y: var(--space-12)  /* Mobile */
```

---

## Iconography

### Icon Size Scale
```css
--icon-xs: 16px
--icon-sm: 20px
--icon-base: 24px
--icon-lg: 32px
--icon-xl: 48px
```

### Icon Style
- Outline style (not filled)
- 2px stroke width
- Rounded line caps
- Consistent with lucide-react library

---

## Loading States

### Skeleton
```css
background: linear-gradient(90deg, #F3F4F6 0%, #E5E7EB 50%, #F3F4F6 100%)
background-size: 200% 100%
animation: shimmer 2s infinite
border-radius: inherit
```

### Spinner
```css
color: var(--guardian-teal)
size: 24px (small), 48px (large)
animation: spin 1s linear infinite
```

---

## Responsive Behavior

### Mobile-First Approach
1. Design for mobile (320px+)
2. Enhance for tablet (768px+)
3. Optimize for desktop (1024px+)

### Touch Targets
- Minimum: 44x44px
- Recommended: 48x48px
- Spacing between: 8px minimum

---

## Accessibility

### Color Contrast
- Body text: Minimum 4.5:1
- Large text: Minimum 3:1
- Interactive elements: Minimum 3:1

### Focus States
```css
outline: 2px solid var(--guardian-teal)
outline-offset: 2px
border-radius: inherit
```

### Screen Reader Support
- Semantic HTML
- ARIA labels where needed
- Alt text for images
- Proper heading hierarchy

---

## Usage Examples

### Hero Section
```
- Glass-morphic header
- Trust badge (top left)
- Bold headline (Poppins, 60px, Deep Navy)
- Subtext (Inter, 20px, Navy 70% opacity)
- Single Aqua Glow CTA button
- Grid of 4-6 service category cards
- Social proof row (centered, equal spacing)
```

### Dashboard Card
```
- White background
- 16px border radius
- Base shadow
- 24px padding
- Clear heading (Poppins, 24px, Deep Navy)
- Body text (Inter, 16px, Navy 70%)
- Hover: lift 2px, medium shadow
```

### Form Layout
```
- Vertical stack, 16px gap
- Labels above inputs
- Inputs: 12px padding, medium radius
- Primary CTA at bottom (Aqua Glow)
- Error messages: small, red, below field
```

---

## Do's and Don'ts

### ✅ Do
- Use Guardian Teal for primary brand elements
- Use Aqua Glow ONLY for main CTAs
- Keep layouts grid-based and aligned
- Maintain consistent spacing (multiples of 4px)
- Use soft, subtle animations
- Provide clear visual feedback
- Keep backgrounds clean (white or soft gradients)

### ❌ Don't
- Don't use random gradients everywhere
- Don't float icons chaotically
- Don't use heavy shadows
- Don't overcrowd the interface
- Don't use inconsistent spacing
- Don't mix multiple animation styles
- Don't create visual noise

---

## Component Inventory (Next Phase)

See COMPONENT_LIST.md for complete platform component library.

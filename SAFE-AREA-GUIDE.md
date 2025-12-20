# Safe-Area Usage Guide for Fixed Headers

## Quick Reference

For any fixed headers in your app, apply the safe-area utility:

### Before (Headers overlap status bar)
```tsx
<header className="fixed top-0 left-0 right-0 z-50 bg-white">
```

### After (Headers respect status bar)
```tsx
<header className="fixed top-0 left-0 right-0 z-50 bg-white pt-safe-header">
```

## Available Safe-Area Classes

### Padding Classes
- `pt-safe` - Safe padding top (for body, main containers)
- `pb-safe` - Safe padding bottom (for body, navigation)
- `pl-safe` - Safe padding left (for notched screens)
- `pr-safe` - Safe padding right (for notched screens)
- `pt-safe-header` - Padding top for fixed headers

### Position Classes
- `fixed-top-safe` - Positions fixed element below status bar

### Margin Classes  
- `mt-safe` - Safe margin top
- `mb-safe` - Safe margin bottom

## When to Use

### ✅ Use Safe-Area Classes For:
1. **Fixed Headers** - Add `pt-safe-header` or use `fixed-top-safe`
2. **Body/Root Container** - Already applied in layout.tsx
3. **Modals/Dialogs** - Add `pt-safe` to modal content
4. **Fixed Bottom Navigation** - Add `pb-safe`
5. **Full-screen overlays** - Add both `pt-safe` and `pb-safe`

### ❌ Don't Use For:
1. **Regular scrollable content** - Inherits from body padding
2. **Static headers** - Body padding handles it
3. **Inline elements** - Not needed

## Example: Fixed Header

```tsx
export default function MyPage() {
  return (
    <div>
      {/* Fixed header with safe-area */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white pt-safe-header">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            <Logo />
            <Menu />
          </nav>
        </div>
      </header>

      {/* Main content - body padding handles spacing */}
      <main className="mt-20">
        <h1>Content</h1>
      </main>
    </div>
  )
}
```

## Example: Modal

```tsx
export function Modal({ children }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl pt-safe pb-safe">
        {children}
      </div>
    </div>
  )
}
```

## Example: Bottom Navigation

```tsx
export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t pb-safe">
      <div className="flex justify-around py-2">
        <NavItem icon="home" />
        <NavItem icon="search" />
        <NavItem icon="profile" />
      </div>
    </nav>
  )
}
```

## Testing Your Changes

After adding safe-area classes:

1. Build the app: `npm run build`
2. Sync with Capacitor: `npx cap sync android`
3. Open in Android Studio: `npx cap open android`
4. Run on physical device
5. Check that:
   - Fixed headers don't overlap status bar
   - Content is fully visible
   - No layout shifts when scrolling

## Common Issues

### Header still overlaps
- Make sure you added `pt-safe-header` class
- Verify the header has `fixed` positioning
- Check if parent container has conflicting styles

### Too much spacing
- Don't combine `pt-safe` with manual padding-top
- Use either `pt-safe-header` OR `fixed-top-safe`, not both

### Not working on some devices
- Clear app data and reinstall
- Check that Android theme is configured correctly
- Verify StatusBar plugin is initialized

## Pages That May Need Updates

If you have fixed headers on these pages, consider adding `pt-safe-header`:

- [pricing/page.tsx](../src/app/pricing/page.tsx) - Line 50
- [services/page.tsx](../src/app/services/page.tsx) - Line 261
- [page.tsx](../src/app/page.tsx) - Line 240
- [careers/page.tsx](../src/app/careers/page.tsx) - Line 724
- [contact/page.tsx](../src/app/contact/page.tsx) - Line 168
- [auth/complete-signup/page.tsx](../src/app/auth/complete-signup/page.tsx) - Line 584
- [about/page.tsx](../src/app/about/page.tsx) - Line 105

### Optional: Update All Fixed Headers

You can optionally add `pt-safe-header` to all fixed headers for extra safety:

```tsx
// Find: className="fixed top-0
// Consider adding: pt-safe-header
```

**Note**: This is optional because:
1. Body already has `pt-safe` padding
2. Content naturally starts below status bar
3. Only needed if header content goes under status bar

---

**Remember**: The global fix in layout.tsx handles most cases. Only add safe-area classes to fixed/absolute positioned elements that overlap the status bar.

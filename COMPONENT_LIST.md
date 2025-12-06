# Helparo Component Library

Complete component inventory for the Guardian Teal design system.

---

## Navigation Components

### 1. **MainHeader**
- **Location**: All pages
- **Elements**: Logo, Navigation links, Auth buttons
- **Style**: Glass-morphic, sticky, 80px height
- **Responsive**: Hamburger menu on mobile

### 2. **CustomerNavbar**
- **Location**: Customer dashboard
- **Elements**: Dashboard, My Requests, Messages, Profile
- **Style**: Horizontal tabs with Guardian Teal active state

### 3. **HelperNavbar**  
- **Location**: Helper dashboard
- **Elements**: Dashboard, Browse Requests, My Jobs, Earnings, Profile
- **Style**: Sidebar on desktop, bottom nav on mobile

### 4. **AdminNavbar**
- **Location**: Admin panel
- **Elements**: Dashboard, Users, Helpers, Services, Payments, Settings
- **Style**: Left sidebar, collapsible

### 5. **Breadcrumbs**
- **Location**: Sub-pages
- **Style**: Gray links with Guardian Teal active

---

## Hero & Landing Components

### 6. **HeroSection**
- **Elements**: Trust badge, Headline, Subtext, CTA, Background animation
- **Layout**: Centered, max-width 1280px
- **Animation**: Fade-in on load

### 7. **TrustBadge**
- **Style**: Glass card, Aqua Glow icon, white text
- **Position**: Top of hero

### 8. **ServiceCategoryGrid**
- **Layout**: 4 columns desktop, 2 tablet, 1 mobile
- **Card**: Icon, title, white bg, hover lift
- **Spacing**: 24px gap

### 9. **SocialProofBar**
- **Elements**: Stats (Helpers count, Jobs done, Rating)
- **Layout**: Horizontal row, equal spacing
- **Style**: Large numbers (Aqua Glow), small labels

### 10. **FeatureShowcase**
- **Layout**: 3-column grid
- **Card**: Icon gradient circle, heading, description
- **Animation**: Stagger fade-in

---

## Form Components

### 11. **FormInput**
- **States**: Default, Focus, Error, Success, Disabled
- **Style**: 12px padding, medium radius, 2px border
- **Validation**: Real-time, inline error messages

### 12. **FormTextarea**
- **Height**: Auto-expanding
- **Max height**: 200px
- **Style**: Same as FormInput

### 13. **FormSelect**
- **Style**: Native select with custom arrow
- **Dropdown**: Guardian Teal highlight

### 14. **FormCheckbox**
- **Style**: Guardian Teal check, medium radius
- **Label**: Right-aligned, clickable

### 15. **FormRadio**
- **Style**: Circular, Guardian Teal fill
- **Label**: Right-aligned, clickable

### 16. **FormToggle**
- **Style**: Pill switch, Aqua Glow when active
- **Size**: 48x28px

### 17. **FormDatePicker**
- **Calendar**: Guardian Teal accents
- **Format**: MM/DD/YYYY
- **Responsive**: Full-screen modal on mobile

### 18. **FormTimePicker**
- **Format**: 12-hour with AM/PM
- **Style**: Dropdown select

### 19. **FormFileUpload**
- **Style**: Dashed border, drag-drop area
- **Preview**: Thumbnail grid
- **Progress**: Guardian Teal bar

### 20. **FormPhoneInput**
- **Country code**: Dropdown with flags
- **Validation**: Format check

---

## Button Components

### 21. **PrimaryButton**
- **Style**: Aqua Glow bg, Deep Navy text, bold
- **States**: Hover (scale 1.05), Active (scale 0.98), Disabled
- **Usage**: Main CTAs only

### 22. **SecondaryButton**
- **Style**: Guardian Teal bg, white text
- **Usage**: Secondary actions

### 23. **OutlineButton**
- **Style**: 2px Guardian Teal border, transparent bg
- **Hover**: Fill with Guardian Teal

### 24. **GhostButton**
- **Style**: Transparent, Deep Navy text
- **Hover**: Gray background

### 25. **IconButton**
- **Size**: 40x40px square
- **Style**: Rounded, ghost style
- **Usage**: Actions, close buttons

### 26. **ButtonGroup**
- **Layout**: Horizontal, connected borders
- **Style**: Segmented control appearance

---

## Card Components

### 27. **BasicCard**
- **Style**: White bg, base shadow, xl radius
- **Padding**: 24px
- **Hover**: Lift 2px, md shadow

### 28. **ServiceCard**
- **Elements**: Icon, title, description, price hint, CTA
- **Style**: Grid layout, hover lift
- **Badge**: Category tag (top-right)

### 29. **HelperCard**
- **Elements**: Avatar, name, rating, skills, hourly rate, availability
- **Layout**: Horizontal on desktop, vertical on mobile
- **Action**: "View Profile" button

### 30. **RequestCard**
- **Elements**: Title, category, budget, location, time, status badge
- **Actions**: View details, bid/apply button
- **Status colors**: Open (Guardian Teal), Assigned (Aqua Glow), Completed (Green)

### 31. **DashboardStatCard**
- **Elements**: Icon, label, value, trend indicator
- **Style**: Gradient background option
- **Animation**: Count-up on load

### 32. **EarningsCard**
- **Elements**: Period selector, total earnings, chart, breakdown
- **Chart**: Line or bar, Guardian Teal
- **Action**: "Withdraw" CTA

### 33. **ReviewCard**
- **Elements**: Avatar, name, rating stars, date, comment
- **Layout**: Horizontal
- **Style**: Subtle border

---

## Modal & Overlay Components

### 34. **Modal**
- **Backdrop**: Navy 50% opacity, blur
- **Content**: White, 2xl radius, 2xl shadow, center
- **Close**: X icon button (top-right)
- **Animation**: Scale-in

### 35. **Drawer**
- **Direction**: Right (default), left, bottom
- **Style**: White, full height, lg shadow
- **Close**: Overlay click or X button
- **Animation**: Slide-in

### 36. **BottomSheet**
- **Mobile**: Slide-up from bottom
- **Handle**: Drag handle for iOS-style
- **Max height**: 90vh

### 37. **Popover**
- **Style**: White, md shadow, sm radius
- **Arrow**: Centered on trigger
- **Trigger**: Click or hover

### 38. **Tooltip**
- **Style**: Deep Navy bg, white text, sm text
- **Position**: Auto (smart positioning)
- **Delay**: 300ms

---

## List & Table Components

### 39. **DataTable**
- **Header**: Guardian Teal background, white text
- **Rows**: Zebra striping (optional)
- **Sort**: Arrow indicators
- **Pagination**: Bottom, Guardian Teal active

### 40. **ListGroup**
- **Item**: Border between, hover bg
- **Icon**: Left-aligned
- **Action**: Right chevron

### 41. **StepIndicator**
- **Style**: Horizontal timeline
- **Active**: Guardian Teal circle
- **Complete**: Aqua Glow check
- **Inactive**: Gray

### 42. **TabGroup**
- **Style**: Underline tabs
- **Active**: Guardian Teal underline, bold
- **Hover**: Subtle bg

---

## Feedback Components

### 43. **Alert**
- **Types**: Success, Warning, Error, Info
- **Style**: Colored border-left, icon, message, close
- **Position**: Top-center toast or inline

### 44. **Toast**
- **Position**: Top-right stack
- **Duration**: 3s (default)
- **Style**: White card, colored icon
- **Animation**: Slide-in-right

### 45. **ProgressBar**
- **Style**: Gray track, Guardian Teal fill
- **Height**: 8px
- **Radius**: Full

### 46. **Spinner**
- **Style**: Circular, Guardian Teal
- **Size**: sm (24px), md (48px), lg (64px)

### 47. **SkeletonLoader**
- **Style**: Gray gradient, shimmer animation
- **Variants**: Text, circle, rectangle, custom

### 48. **EmptyState**
- **Elements**: Illustration, heading, description, CTA
- **Style**: Centered, muted colors

### 49. **ErrorBoundary**
- **Fallback**: Friendly error message, reload button
- **Style**: Centered card

---

## Search & Filter Components

### 50. **SearchBar**
- **Style**: Input with search icon (left)
- **Clear**: X button when typing
- **Suggestions**: Dropdown below

### 51. **FilterPanel**
- **Layout**: Sidebar or top bar
- **Controls**: Checkboxes, range sliders, dropdowns
- **Apply**: Primary button at bottom

### 52. **SortDropdown**
- **Options**: Price, rating, distance, date
- **Style**: Select with arrow

---

## Media Components

### 53. **Avatar**
- **Sizes**: xs (24px), sm (32px), md (40px), lg (64px), xl (96px)
- **Style**: Circular, border optional
- **Fallback**: Initials on gradient

### 54. **ImageGallery**
- **Layout**: Grid, lightbox on click
- **Controls**: Arrows, thumbnails, zoom

### 55. **Badge**
- **Sizes**: sm, md, lg
- **Colors**: Guardian Teal, Aqua Glow, Success, Warning, Error
- **Style**: Pill shape, bold text

### 56. **StatusBadge**
- **Variants**: Online, offline, busy, away
- **Position**: Bottom-right of avatar

---

## Dashboard-Specific Components

### 57. **CustomerDashboard**
- **Sections**: Active requests, recent helpers, quick actions
- **Layout**: 3-column grid

### 58. **HelperDashboard**
- **Sections**: Earnings summary, active jobs, new requests
- **Layout**: 2-column + full-width

### 59. **AdminDashboard**
- **Sections**: Overview stats, recent activity, charts
- **Layout**: Flexible grid

### 60. **EarningsChart**
- **Type**: Line chart
- **Colors**: Guardian Teal line, Aqua Glow gradient fill
- **X-axis**: Dates
- **Y-axis**: Currency

### 61. **ActivityFeed**
- **Items**: Icon, timestamp, description
- **Style**: Vertical timeline
- **Load more**: Button at bottom

---

## Booking Flow Components

### 62. **ServiceSelector**
- **Layout**: Category grid, service list
- **Selection**: Guardian Teal border

### 63. **DateTimeSelector**
- **Calendar**: Guardian Teal highlights
- **Time slots**: Grid, selectable

### 64. **LocationPicker**
- **Map**: Interactive, Teal marker
- **Search**: Address autocomplete

### 65. **BudgetSelector**
- **Range slider**: Guardian Teal
- **Inputs**: Min and max

### 66. **HelperBrowser**
- **List**: Helper cards
- **Filters**: Sidebar
- **Sort**: Top controls

### 67. **BookingConfirmation**
- **Summary**: Service, date, time, helper, price
- **Actions**: Confirm (Aqua Glow), Edit (Ghost)

---

## Messaging Components

### 68. **ChatWindow**
- **Layout**: Messages list, input at bottom
- **Message**: Bubble style, sent (Guardian Teal), received (gray)
- **Typing indicator**: Animated dots

### 69. **MessageComposer**
- **Input**: Auto-expand textarea
- **Actions**: Send button (Aqua Glow), attach file

### 70. **ConversationList**
- **Items**: Avatar, name, last message, timestamp, unread count
- **Style**: List with hover

---

## Payment Components

### 71. **PaymentMethodCard**
- **Display**: Card brand icon, last 4 digits
- **Actions**: Edit, delete

### 72. **PricingBreakdown**
- **Rows**: Service fee, platform fee, total
- **Style**: Table layout, bold total

### 73. **WithdrawForm**
- **Inputs**: Amount, method
- **Validation**: Minimum amount check

---

## Profile Components

### 74. **ProfileHeader**
- **Elements**: Avatar, name, rating, bio, edit button
- **Style**: Card or banner

### 75. **SkillsTag**
- **Style**: Pill shape, Guardian Teal border
- **Removable**: X icon

### 76. **RatingDisplay**
- **Stars**: 5-star system, Aqua Glow fill
- **Count**: Reviews count

### 77. **ReviewsList**
- **Items**: Review cards
- **Pagination**: Load more

---

## Onboarding Components

### 78. **WelcomeScreen**
- **Hero**: Illustration, heading, subtext
- **CTA**: Get started (Aqua Glow)

### 79. **OnboardingSteps**
- **Progress**: Step indicator at top
- **Content**: Form or info per step
- **Navigation**: Back, Next buttons

### 80. **RoleSelector**
- **Options**: Customer, Helper
- **Style**: Large cards, selectable

---

## Settings Components

### 81. **SettingsSidebar**
- **Sections**: Profile, security, notifications, billing
- **Style**: Vertical menu, active highlight

### 82. **ToggleSetting**
- **Label**: Left, toggle right
- **Description**: Small text below

### 83. **PasswordChangeForm**
- **Fields**: Current, new, confirm
- **Validation**: Strength meter

---

## Admin Components

### 84. **UserManagementTable**
- **Columns**: ID, name, role, status, actions
- **Actions**: Edit, suspend, delete

### 85. **VerificationQueue**
- **Items**: Helper applications
- **Actions**: Approve, reject, request info

### 86. **AnalyticsChart**
- **Types**: Line, bar, pie
- **Style**: Guardian Teal palette

---

## Utility Components

### 87. **Divider**
- **Style**: 1px gray line, optional text

### 88. **Spacer**
- **Variants**: All spacing scale values

### 89. **Container**
- **Max width**: 1280px
- **Padding**: Responsive

### 90. **Grid**
- **Columns**: 1-12, responsive
- **Gap**: Consistent spacing

### 91. **Stack**
- **Direction**: Vertical (default), horizontal
- **Gap**: Spacing scale

### 92. **AspectRatio**
- **Ratios**: 16/9, 4/3, 1/1, 3/2
- **Usage**: Images, videos

### 93. **Collapse**
- **Style**: Expandable panel
- **Icon**: Chevron indicator

### 94. **Accordion**
- **Multiple**: Single or multi-expand
- **Style**: Border between items

### 95. **Tabs**
- **Orientation**: Horizontal, vertical
- **Style**: Pills or underline

### 96. **Pagination**
- **Controls**: Prev, numbers, next
- **Active**: Guardian Teal

### 97. **LoadingOverlay**
- **Style**: Backdrop with spinner
- **Message**: Optional text

### 98. **ErrorBanner**
- **Style**: Red border, icon, message
- **Position**: Top of page

### 99. **SuccessBanner**
- **Style**: Green border, checkmark
- **Auto-dismiss**: 5s

### 100. **InfoBanner**
- **Style**: Blue border, info icon
- **Dismissible**: Close button

---

## Total: 100 Core Components

All components follow the Guardian Teal design system:
- **Colors**: Guardian Teal, Deep Navy, Aqua Glow
- **Typography**: Poppins (headings), Inter (body)
- **Spacing**: 4px base scale
- **Radius**: 8-16px
- **Shadows**: Subtle elevation
- **Animations**: 200-300ms smooth transitions
- **Responsive**: Mobile-first breakpoints

# User Status Badge Logic - User Management Page

## Status Badges Explained

### 1. **Account Status Badge** (Always Visible)
Shows the current status of the user's account:

- **Active** (Green ✓): User account is active and can use the platform
- **Suspended** (Orange ⚠️): Account temporarily suspended by admin
- **Inactive** (Gray): Account is inactive

**Condition**: Always shown for all users

---

### 2. **Banned Badge** (Red 🚫)
Shows when a user is permanently banned

**Condition**: Only shown when `user.is_banned === true`

---

### 3. **Pending Approval Badge** (Yellow ⚠️)
Shows for helpers who are waiting for admin approval

**Conditions** (ALL must be true):
1. `user.role === 'helper'` (User must be a helper)
2. `user.helper_profiles.length > 0` (Helper profile exists)
3. `user.helper_profiles[0].is_approved === false` (Not approved yet)

**Why this badge appears:**
- When a user signs up as a helper, they create a `helper_profiles` record
- By default, `is_approved` is set to `false`
- Admins must click "Approve" button to set `is_approved = true`
- Once approved, the badge disappears

---

## Action Buttons Logic

### 1. **Approve Button**
- **Shows when**: Helper is NOT approved yet (same conditions as Pending badge)
- **Action**: Sets `helper_profiles.is_approved = true`
- **After approval**: Button and "Pending Approval" badge both disappear

### 2. **Suspend/Activate Button**
- **Suspend shows when**: `user.status === 'active'`
- **Activate shows when**: `user.status === 'suspended'`
- **Action**: Toggles user status between active and suspended

### 3. **Ban/Unban Button**
- **Ban shows when**: `user.is_banned === false`
- **Unban shows when**: `user.is_banned === true`
- **Action**: Permanently bans or unbans the user

### 4. **View Button**
- **Always visible** for all users
- Opens user detail page

---

## Database Tables Reference

### `profiles` table:
```sql
- status: user_status enum (active, inactive, suspended)
- is_banned: boolean (default: false)
- ban_reason: text
- role: user_role enum (customer, helper, admin)
```

### `helper_profiles` table:
```sql
- user_id: uuid (references profiles.id)
- is_approved: boolean (default: false)
- service_categories: text[]
```

---

## Alignment Fixes Applied

1. ✅ **DataTable Actions Column**: Added `min-width: 200px` for consistent spacing
2. ✅ **Action Buttons**: Added `whitespace-nowrap` to prevent text wrapping
3. ✅ **Status Badges**: Added `whitespace-nowrap` and `flex-wrap` for proper flow
4. ✅ **Actions Wrapper**: Changed to flex container with proper alignment

---

## Testing Checklist

- [ ] Regular customer shows only "Active" badge
- [ ] Regular helper shows "Active" + "Approved" (if approved)
- [ ] New helper shows "Active" + "Pending Approval" + "Approve" button
- [ ] Banned user shows "Active" + "Banned" badge + "Unban" button
- [ ] Suspended user shows "Suspended" badge + "Activate" button
- [ ] All action buttons align properly in a single row
- [ ] View button is always visible on the right

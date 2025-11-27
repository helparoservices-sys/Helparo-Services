# Supabase Email Template Setup Guide

This guide explains how to configure beautiful, branded email templates for Helparo's authentication system.

## 📧 Email Templates Created

1. **Email Confirmation** (`confirmation.html`) - For verifying new user emails
2. **Password Reset** (`reset-password.html`) - For forgot password flow

## 🎯 How Supabase Handles Email Verification

### Email Confirmation Flow

**When a user signs up:**
1. Supabase sends confirmation email with a magic link
2. User clicks "Confirm Your Email" button
3. Link redirects to: `https://yourdomain.com/auth/confirm?token_hash=xxx&type=email`
4. Your Next.js page (`/auth/confirm/page.tsx`) verifies the token
5. Shows success or error message based on verification result

**Success States:**
- ✅ **Valid token** → Email verified → Shows success message → Auto redirects to login
- ⏱️ **Expired token** → Shows error with "request new confirmation email" option
- ♻️ **Already verified** → Shows message to login directly
- ❌ **Invalid token** → Shows error with support options

**Error Handling:**
- All errors are caught and displayed with user-friendly messages
- Specific error types (expired, invalid, already verified) get custom messages
- Users can request new confirmation emails or contact support

### Password Reset Flow

**When a user requests password reset:**
1. Supabase sends reset email with secure link
2. User clicks "Reset My Password" button
3. Link redirects to: `https://yourdomain.com/auth/reset-password?token_hash=xxx&type=recovery`
4. User enters new password on your page
5. Password is updated and user can login

**Success States:**
- ✅ **Valid reset** → Password updated → Auto redirects to login
- ⏱️ **Expired link (1 hour)** → Shows error with "request new link" option
- ❌ **Invalid session** → Shows error message

## 🚀 Setup Instructions

### Step 1: Upload Email Templates to Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Authentication** → **Email Templates**

#### Configure Email Confirmation Template:

1. Click on **"Confirm signup"** template
2. **Subject**: `Confirm your email - Welcome to Helparo! 🎉`
3. Click **"Edit template"**
4. Copy the entire content from `supabase/email-templates/confirmation.html`
5. Paste into the template editor
6. Click **"Save"**

#### Configure Password Reset Template:

1. Click on **"Reset password"** template
2. **Subject**: `Reset your Helparo password 🔒`
3. Click **"Edit template"**
4. Copy the entire content from `supabase/email-templates/reset-password.html`
5. Paste into the template editor
6. Click **"Save"**

### Step 2: Configure Redirect URLs

1. In Supabase Dashboard, go to: **Authentication** → **URL Configuration**

2. Set these URLs:

   **Site URL** (where users land after email confirmation):
   ```
   https://yourdomain.com
   ```

   **Redirect URLs** (allowed redirect destinations):
   ```
   https://yourdomain.com/auth/confirm
   https://yourdomain.com/auth/reset-password
   https://yourdomain.com/auth/login
   ```

   For development, also add:
   ```
   http://localhost:3000/auth/confirm
   http://localhost:3000/auth/reset-password
   http://localhost:3000/auth/login
   ```

3. Click **"Save"**

### Step 3: Update Email Template Variables (Optional)

The templates use these Supabase variables:
- `{{ .ConfirmationURL }}` - Auto-generated confirmation/reset link
- `{{ .SiteURL }}` - Your site URL from config
- `{{ .Email }}` - User's email address (if you want to add it)

### Step 4: Test the Flow

#### Test Email Confirmation:
1. Sign up a new user on your site
2. Check email inbox for confirmation email
3. Click "Confirm Your Email" button
4. Verify you see the success page at `/auth/confirm`
5. Confirm auto-redirect to login works

#### Test Password Reset:
1. Go to forgot password page
2. Enter your email
3. Check email inbox for reset email
4. Click "Reset My Password" button
5. Enter new password on reset page
6. Verify password updates successfully

## 📱 What Users See

### Email Confirmation Journey

**Step 1: Email Received**
- Beautiful branded email with Helparo logo
- Clear "Confirm Your Email" button
- Security notice about expiration
- Alternative link if button doesn't work

**Step 2: Click Confirmation Link**
- Redirects to `/auth/confirm`
- Shows loading spinner while verifying
- Then shows one of:
  - ✅ Success: "Email Verified! 🎉" + auto redirect
  - ❌ Error: Specific error message + action buttons

**Step 3: Next Actions**
- Success → Auto redirects to login in 3 seconds
- Error → Shows "Request New Email" or "Contact Support"

### Password Reset Journey

**Step 1: Email Received**
- Red-themed security email with lock icon
- "1 Hour" expiration timer displayed
- "Reset My Password" button
- Security tips for strong passwords

**Step 2: Click Reset Link**
- Redirects to `/auth/reset-password`
- Shows password form with:
  - Password strength meter (Weak/Medium/Strong)
  - Real-time password requirements checklist
  - Show/hide password toggles
  - Confirmation field

**Step 3: Submit New Password**
- Validates password strength (must be "Strong")
- Updates password in Supabase
- Shows success message + auto redirect to login

## 🎨 Email Template Features

### Design Elements:
- ✨ Modern gradient headers (blue for confirmation, red for reset)
- 📱 Fully responsive for mobile devices
- 🎯 Clear call-to-action buttons with hover effects
- 🔒 Security notices and warnings
- ⏱️ Expiration timers (24 hours for confirmation, 1 hour for reset)
- 📋 Helpful information boxes
- 🔗 Alternative text links if buttons don't work

### Branding:
- Helparo logo placeholder (H icon)
- Brand colors matching your site
- Consistent typography
- Professional footer with links

## 🔧 Customization

### Change Brand Colors:

In both HTML templates, find and replace:

**Primary Blue (Confirmation Email):**
```css
background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
```

**Red (Password Reset Email):**
```css
background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
```

### Add Real Logo:

Replace the logo div with an image:
```html
<img src="https://yourdomain.com/logo.png" alt="Helparo" style="width: 60px; height: 60px; border-radius: 12px;">
```

### Update Footer Links:

In the footer section, update these URLs:
```html
<a href="https://yourwebsite.com">Visit Website</a>
<a href="https://yourwebsite.com/support">Support</a>
<a href="https://yourwebsite.com/privacy">Privacy Policy</a>
```

## 🔐 Security Features

### Email Expiration:
- Confirmation links: **24 hours** (displayed in email)
- Password reset links: **1 hour** (displayed in email)
- Supabase automatically invalidates expired tokens

### Error Messages:
- Never reveal if an email exists in the system
- Generic error messages for security
- Rate limiting on email sends (Supabase handles this)

### Password Requirements:
- Minimum 8 characters
- Must contain uppercase and lowercase
- Must contain numbers
- Must contain special characters
- Real-time strength validation

## 📊 Monitoring

### Track Email Success:

In Supabase Dashboard:
1. Go to **Authentication** → **Users**
2. Check user's `email_confirmed_at` field
3. Check `last_sign_in_at` for activity

### Common Issues:

**Emails not sending:**
- Check spam folder
- Verify email provider settings in Supabase
- Check Supabase logs for email errors

**Redirect not working:**
- Verify redirect URLs are added in Supabase config
- Check browser console for errors
- Verify environment variables are set

**Token expired errors:**
- Users took too long to click link
- Send new confirmation/reset email

## 🎯 Next Steps

1. ✅ Upload templates to Supabase Dashboard
2. ✅ Configure redirect URLs
3. ✅ Test with real email address
4. ✅ Customize colors and branding
5. ✅ Add your real logo URL
6. ✅ Update footer links to your domains
7. ✅ Test on mobile devices

## 💡 Pro Tips

- **Test with multiple email providers** (Gmail, Outlook, Yahoo)
- **Check mobile rendering** using email testing tools
- **Monitor bounce rates** in Supabase email logs
- **Add custom domain email** (e.g., noreply@helparo.com) for better deliverability
- **Enable email rate limiting** to prevent abuse
- **Set up email templates for other auth flows** (invite user, magic link, etc.)

## 📞 Support

If you encounter issues:
1. Check Supabase Dashboard logs
2. Verify email template syntax
3. Test redirect URLs
4. Check browser console errors
5. Contact Supabase support if needed

---

**Last Updated:** November 2025
**Version:** 1.0
**Helparo Service Marketplace**

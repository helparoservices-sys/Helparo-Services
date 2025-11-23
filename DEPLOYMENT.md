# 🚀 Deployment Guide - Helparo Services

## Vercel Deployment

### Prerequisites
1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install Vercel CLI (optional): `npm install -g vercel`

### Steps to Deploy on Vercel

#### Option 1: Using Vercel Dashboard (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

4. Add Environment Variables in Vercel Dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   ```

5. Click "Deploy"

#### Option 2: Using Vercel CLI
1. Login to Vercel:
   ```bash
   vercel login
   ```

2. Deploy from project root:
   ```bash
   vercel
   ```

3. Follow the prompts to set up the project

4. Add environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add NEXT_PUBLIC_SITE_URL
   ```

5. Deploy to production:
   ```bash
   vercel --prod
   ```

### Vercel Configuration
- ✅ `vercel.json` configured
- ✅ `.vercelignore` configured
- ✅ Optimized for Mumbai region (bom1)

---

## Netlify Deployment

### Prerequisites
1. Create a Netlify account at [netlify.com](https://netlify.com)
2. Install Netlify CLI (optional): `npm install -g netlify-cli`

### Steps to Deploy on Netlify

#### Option 1: Using Netlify Dashboard (Recommended)
1. Go to [app.netlify.com/start](https://app.netlify.com/start)
2. Connect your GitHub repository
3. Configure build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `.next`
   - **Base Directory**: (leave empty)

4. Add Environment Variables in Netlify Dashboard:
   - Go to Site Settings → Environment Variables
   - Add the following variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app
     NODE_VERSION=20
     ```

5. Click "Deploy Site"

#### Option 2: Using Netlify CLI
1. Login to Netlify:
   ```bash
   netlify login
   ```

2. Initialize the site:
   ```bash
   netlify init
   ```

3. Follow the prompts:
   - Create & configure a new site
   - Select your team
   - Enter site name (or leave blank for auto-generation)

4. Add environment variables:
   ```bash
   netlify env:set NEXT_PUBLIC_SUPABASE_URL "your_value"
   netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your_value"
   netlify env:set SUPABASE_SERVICE_ROLE_KEY "your_value"
   netlify env:set NEXT_PUBLIC_SITE_URL "your_value"
   ```

5. Deploy:
   ```bash
   netlify deploy --prod
   ```

### Netlify Configuration
- ✅ `netlify.toml` configured
- ✅ Next.js plugin enabled
- ✅ Optimized build settings

---

## 🔐 Required Environment Variables

Make sure to set these in both Vercel and Netlify dashboards:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGc...` |
| `NEXT_PUBLIC_SITE_URL` | Your deployed site URL | `https://yoursite.vercel.app` |

### Where to Find Supabase Keys
1. Go to your Supabase project dashboard
2. Click on Settings → API
3. Copy the following:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 📝 Post-Deployment Checklist

### After deploying to Vercel:
- [ ] Verify environment variables are set correctly
- [ ] Test authentication flow
- [ ] Check API routes are working
- [ ] Configure custom domain (optional)
- [ ] Set up automatic deployments from main branch

### After deploying to Netlify:
- [ ] Verify environment variables are set correctly
- [ ] Test authentication flow
- [ ] Check API routes are working
- [ ] Configure custom domain (optional)
- [ ] Set up automatic deployments from main branch

### Supabase Configuration:
- [ ] Add deployed URLs to Supabase Authentication → URL Configuration
- [ ] Add to Site URL: `https://your-domain.vercel.app` or `https://your-site.netlify.app`
- [ ] Add to Redirect URLs:
  - `https://your-domain.vercel.app/auth/callback`
  - `https://your-site.netlify.app/auth/callback`

---

## 🐛 Troubleshooting

### Build Failures
- Check Node.js version (should be 20)
- Verify all environment variables are set
- Check build logs for specific errors

### Authentication Issues
- Verify Supabase redirect URLs are configured
- Check NEXT_PUBLIC_SITE_URL matches your deployment URL
- Ensure Supabase keys are correct

### API Route Errors
- Check SUPABASE_SERVICE_ROLE_KEY is set correctly
- Verify API routes are not being blocked by middleware

---

## 🔄 Continuous Deployment

Both Vercel and Netlify support automatic deployments:

1. Push to `main` branch → Auto-deploy to production
2. Push to feature branches → Auto-deploy preview URLs
3. Pull requests → Auto-deploy preview for testing

---

## 📊 Monitoring

### Vercel
- Analytics: Vercel Dashboard → Analytics
- Logs: Vercel Dashboard → Deployments → View Function Logs

### Netlify
- Analytics: Netlify Dashboard → Analytics
- Logs: Netlify Dashboard → Deploys → Deploy Log

---

## 🌐 Custom Domains

### Vercel
1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Netlify
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Configure DNS records as instructed

---

## ✅ Ready to Deploy!

You're all set! Choose your preferred platform and follow the steps above.

**Quick Deploy Links:**
- 🔷 [Deploy to Vercel](https://vercel.com/new)
- 🔶 [Deploy to Netlify](https://app.netlify.com/start)

Good luck! 🚀

# 🚀 Deploy to Vercel - Step by Step

Your code is ready to deploy! Follow these steps to get your app live.

## Step 1: Create a GitHub Repository

1. Go to https://github.com/new
2. Sign in with your GitHub account (create one if needed)
3. Fill in:
   - **Repository name**: `celluma-tracker`
   - **Description**: `Red light therapy session tracker with heatmap visualization`
   - **Visibility**: Public (recommended) or Private
4. Click "Create repository"

## Step 2: Add Your Local Code to GitHub

You have two options:

### Option A: Command Line (Recommended)

After creating the repo on GitHub, you'll see instructions. Run these commands in Terminal:

```bash
cd "/Users/AarraMBP/Desktop/The Prize/Apps/CelluMe"

# Set the remote (replace YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/celluma-tracker.git

# Rename branch to main if needed
git branch -M main

# Push code to GitHub
git push -u origin main
```

### Option B: GitHub Desktop

If you prefer a GUI:
1. Download GitHub Desktop from https://desktop.github.com/
2. Open the app and sign in
3. File → Clone Repository → Choose your local folder
4. Make commits and push from the UI

## Step 3: Connect Vercel to Your GitHub

1. Go to https://vercel.com/
2. Sign in (or create account - you can use GitHub)
3. Click "New Project"
4. Click "Import Git Repository"
5. Search for "celluma-tracker"
6. Click "Import"

## Step 4: Configure Vercel Settings

Vercel should auto-detect the settings, but verify:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

All should be pre-filled correctly. Just click "Deploy"!

## Step 5: Wait for Deployment

Vercel will:
1. Install dependencies
2. Build the app
3. Deploy to CDN
4. Give you a live URL

Takes about 2-3 minutes.

## Step 6: Get Your Live URL

Once deployed, you'll see:
- Production URL: `https://celluma-tracker.vercel.app` (or similar)
- Share this with your wife!

## Congratulations! 🎉

Your app is now live on the internet!

### You Can Now:

✅ Share the URL with your wife
✅ Access from any device
✅ Use on mobile, tablet, desktop
✅ Auto-updates when you push to GitHub

### Automatic Updates

Any time you push code to GitHub:
```bash
git add .
git commit -m "Update: description of changes"
git push
```

Vercel automatically rebuilds and deploys within seconds!

---

## Troubleshooting

**"Repository not found"**
- Make sure you pushed to GitHub first
- Wait 1-2 minutes for GitHub to sync
- Refresh Vercel page

**Build fails on Vercel**
- Check the build logs (click the failed deployment)
- Usually a Node.js version issue
- Verify `package.json` has correct dependencies

**App shows blank page**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Check browser console (F12) for errors
- Verify build completed successfully

**Data not saving**
- Same as local - check localStorage is enabled
- Not in private/incognito mode
- Try a different browser

---

## Once You Have the URL

Send something like this to your wife:

```
Hi! Your red light therapy tracker is ready!

Visit: https://celluma-tracker.vercel.app

How to use:
1. Select your device (Celluma PRO, POD, Torch, or TheraFace)
2. Click on the body area where you used it
3. Watch the heatmap update with cumulative exposure
4. Data saves automatically!

You can access this from any device, anywhere.
```

---

## Advanced: Custom Domain (Optional)

If you own a domain, you can use it:

1. In Vercel project settings → Domains
2. Add your custom domain
3. Follow DNS instructions
4. Wait 24 hours for DNS propagation

Example: `celluma-tracker.yourdomain.com`

---

That's it! You're done! 🚀✨

Any questions? Check the Vercel docs: https://vercel.com/docs

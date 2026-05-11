# Deployment Guide - Celluma Tracker

This guide helps you publish the Celluma Tracker app so your wife can use it anywhere.

## Simplest Option: Vercel (Recommended)

Vercel is the **easiest and fastest** way to get your app live. It's free and takes 5 minutes.

### Step-by-step:

1. **Set up GitHub** (if not already done)
   - Go to https://github.com
   - Create a free account
   - Create a new repository called "celluma-tracker"
   - Clone it locally (or upload files via GitHub web interface)

2. **Upload your app to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/celluma-tracker.git
   git push -u origin main
   ```

3. **Deploy with Vercel**
   - Go to https://vercel.com
   - Sign in with GitHub
   - Click "New Project"
   - Select your "celluma-tracker" repository
   - Vercel auto-detects it's a Vite app
   - Click "Deploy"
   - **Done!** Your app is live

4. **Your app is now at:** `celluma-tracker.vercel.app` (custom domain available)

## Option 2: GitHub Pages (Free, Good Alternative)

### Prerequisites:
- GitHub account with the code pushed
- Modify `vite.config.js`:
```javascript
export default defineConfig({
  base: '/celluma-tracker/', // Match your repo name
  // ... rest stays same
})
```

### Deploy:
```bash
npm run build
npm install -g gh-pages
gh-pages -d dist
```

Your site will be at: `https://yourusername.github.io/celluma-tracker`

## Option 3: Netlify (Also Free)

1. Go to https://netlify.com
2. Click "New site from Git"
3. Connect your GitHub account
4. Select the repository
5. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

## Option 4: Traditional Web Host

If you have a host like GoDaddy, Bluehost, etc:

1. Build the app:
   ```bash
   npm run build
   ```

2. Upload the `dist` folder to your web host

3. Point your domain to the `dist` folder

## Post-Deployment Checklist

- [ ] Test on desktop browser
- [ ] Test on mobile/tablet
- [ ] Clear browser cache
- [ ] Verify localStorage works (add a session, refresh page)
- [ ] Test all four devices
- [ ] Test body, hand, and face panels
- [ ] Share the URL with your wife!

## Sharing the App

Once deployed, share the URL:

**Email template:**
```
Hi,

Your red light therapy tracker is ready! Visit:
https://celluma-tracker.vercel.app

How to use:
1. Select your device (Celluma PRO, POD, Torch, or TheraFace)
2. Click on the body part where you used the device
3. Drag sessions to reposition, double-click to delete
4. See the heatmap update with cumulative exposure
5. Data saves automatically!

Your data never leaves your browser - it's all stored locally.
```

## Updating Your App

Made changes and want to update the live version?

### Vercel & GitHub:
```bash
git add .
git commit -m "Update: [describe changes]"
git push
```
✅ Vercel auto-deploys within seconds

### Traditional Host:
```bash
npm run build
# Upload dist/ folder again via FTP/SFTP
```

## Environment Variables

The app doesn't need any API keys or environment variables - it's completely standalone. If needed later, you can:

1. Add to `vite.config.js`:
   ```javascript
   export default defineConfig({
     define: {
       __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
     }
   })
   ```

2. Create `.env` file:
   ```
   VITE_API_URL=https://api.example.com
   ```

## Security

✅ **This app is safe because:**
- No server backend (100% client-side)
- No personal data sent anywhere
- HTTPS on all major platforms
- Data stays on your wife's device
- No tracking or analytics

## Monitoring & Analytics (Optional)

Add minimal analytics to track usage:

```javascript
// Add to src/App.jsx
useEffect(() => {
  // Log only basic page view
  if (window.location.hostname !== 'localhost') {
    fetch('https://api.example.com/pageview', { method: 'POST' })
      .catch(() => {}) // Silently fail
  }
}, [])
```

## Custom Domain

If using Vercel and own a domain:
1. In Vercel settings, add your domain
2. Follow DNS instructions
3. Done - app accessible at yourdomain.com

## Backup & Restore

User data is stored in browser localStorage. To backup:

1. Open DevTools (F12)
2. Go to Application → Storage → localStorage
3. Find "celluma-v18" key
4. Copy the entire JSON
5. Save in a text file

To restore on another browser:
1. Open DevTools
2. Paste in console:
   ```javascript
   localStorage.setItem('celluma-v18', 'PASTE_JSON_HERE')
   ```

## Troubleshooting Deployment

**Blank page after deployment?**
- Check browser console (F12) for errors
- Hard refresh (Cmd+Shift+R)
- Clear site data and reload

**Assets 404 errors?**
- Verify `base` in `vite.config.js` matches deployment path
- On Vercel: no configuration needed
- On GitHub Pages: set `base: '/celluma-tracker/'`

**Data not saving?**
- Check localStorage is enabled
- Check not in private/incognito mode
- Try different browser

**Performance issues?**
- Heatmap rendering slows with 1000+ sessions
- Consider: "Clear Faded" button to prune old sessions
- Future: add session pagination

## Next Steps

1. ✅ Deploy using Vercel (recommended)
2. ✅ Test thoroughly
3. ✅ Share with your wife
4. ✅ Collect feedback
5. 🚀 Optional: Add features like CSV export, weekly reports, etc.

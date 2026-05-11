# Celluma Tracker - Complete Setup Guide

## Quick Start (5 minutes)

### 1. Install Node.js
Download and install from https://nodejs.org/ (LTS version recommended)

Verify installation:
```bash
node --version
npm --version
```

### 2. Install Dependencies
In your project directory:
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

The app will automatically open in your browser at `http://localhost:5173`

## For Your Wife - Simplified Steps

1. **Download Node.js**
   - Go to https://nodejs.org/
   - Click the big green "LTS" button
   - Install it (just click through the setup)

2. **Open Terminal/Command Prompt**
   - Mac: Press Cmd+Space, type "Terminal", hit Enter
   - Windows: Press Win+R, type "cmd", hit Enter

3. **Navigate to the app folder**
   ```bash
   cd "path/to/CelluMe"
   ```

4. **Install and run**
   ```bash
   npm install
   npm run dev
   ```

5. **Browser opens automatically** - Start tracking red light therapy!

## Deploying to the Web

### Option A: GitHub Pages (Free, Best for Sharing)

1. Create a GitHub account at github.com (if you don't have one)
2. Create a new repository called "celluma-tracker"
3. Upload all files from the CelluMe folder (except node_modules)
4. In Settings → Pages, set source to "gh-pages" branch
5. Copy the deployment workflow below into `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

6. Wait for "Actions" to complete (green checkmark)
7. Your site is live at: `https://yourusername.github.io/celluma-tracker`

### Option B: Vercel (FREE, Easiest, Recommended!)

1. Sign up at https://vercel.com (free plan)
2. Click "New Project"
3. Select your GitHub repository
4. Click "Deploy"
5. Done! You get a live URL instantly

**Vercel is recommended because:**
- 0 configuration needed
- Automatic updates when you push to GitHub
- Fast global CDN
- Free SSL certificate

### Option C: Deploy Your Own Server

If you have a web host (GoDaddy, Bluehost, etc.):

1. Run: `npm run build`
2. Upload the entire `dist/` folder contents to your web host
3. Set the web root to the `dist` folder in your hosting control panel
4. Access at: `https://yourdomain.com`

## File Structure

```
CelluMe/
├── src/
│   ├── main.jsx          # Entry point
│   └── App.jsx           # Main app component
├── index.html            # HTML template
├── package.json          # Dependencies
├── vite.config.js        # Build configuration
├── README.md             # User guide
├── SETUP.md              # This file
└── .gitignore            # Git ignore rules
```

## Common Issues & Solutions

### "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Port 5173 already in use
**Solution:** Close other apps using that port, or run: `npm run dev -- --port 3000`

### Blank white page
**Solution:** 
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear cache: DevTools → Storage → Clear Site Data

### Data not saving
**Solution:**
- Make sure localStorage is enabled in browser
- Check you're not in private/incognito mode
- Try a different browser

### Build failing on Vercel/GitHub Pages
**Solution:** Make sure `node_modules` folder is NOT in the repository

## Performance Tips

- The app is lightweight (~500KB gzipped)
- All data stored locally in browser (no server needed)
- Works completely offline
- Heatmaps render in real-time as you place sessions

## Future Enhancements

Potential features to add:
- CSV export of session history
- Weekly/monthly dose summary reports
- Multiple user profiles
- Backup/restore functionality
- Dark/light mode toggle
- Multi-language support

## Support

For issues or questions, check:
1. Browser console (F12 → Console tab)
2. README.md for feature docs
3. This SETUP.md for troubleshooting

## License & Credits

- Built with React 18 + Vite
- No external dependencies for core functionality
- Free to use and modify
- Original concept with Claude AI

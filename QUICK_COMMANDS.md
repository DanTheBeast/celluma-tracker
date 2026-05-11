# Quick Reference - Common Commands

## Development

```bash
# Install dependencies (first time only)
npm install

# Start development server (localhost:5173)
npm run dev

# Stop server
Ctrl+C (or Cmd+C on Mac)
```

## Building & Deployment

```bash
# Create production build
npm run build

# Preview the production build locally
npm run preview

# Deploy to GitHub Pages (after npm install -g gh-pages)
npm run build && gh-pages -d dist
```

## Git Commands

```bash
# Initialize repo (first time only)
git init

# Add all changes
git add .

# Commit changes
git commit -m "Description of changes"

# Push to GitHub
git push -u origin main

# Check status
git status
```

## Troubleshooting Commands

```bash
# Clear npm cache
npm cache clean --force

# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install

# Check npm version
npm --version

# Check node version
node --version

# Kill process on port 5173 (if stuck)
# macOS/Linux:
lsof -ti:5173 | xargs kill -9

# Windows (in PowerShell):
netstat -ano | findstr :5173
taskkill /PID [PID] /F
```

## File Structure Quick Tips

```
CelluMe/
├── src/
│   ├── main.jsx       ← Entry point (don't change)
│   └── App.jsx        ← Main app logic (change here for features)
├── index.html         ← HTML template (title, favicon)
├── package.json       ← Dependencies, scripts
└── vite.config.js     ← Build settings
```

## Adding Features

To add new features, edit `src/App.jsx`:

```javascript
// Add a new color to heatmap
const HEAT_STOPS = [
  { t: 0.0, rgb: [29, 72, 119] }, // Add new stops here
  // ...
]

// Add a new device
const DEVICES = {
  mynewdevice: {
    name: "My Device",
    shape: "rect", // or "circle", "ellipse"
    // ... settings
  }
}

// Add UI elements
// Edit the return statement in CellumaTracker() component
```

## Environment Setup (Per Machine)

### Mac/Linux
```bash
# Install Node.js with Homebrew (optional)
brew install node

# Verify install
node -v
npm -v
```

### Windows
1. Download from https://nodejs.org/
2. Run installer
3. Restart terminal
4. Verify: `node -v`

### Check Everything Works
```bash
npm install
npm run dev
# Should open http://localhost:5173
```

## Useful VS Code Extensions

If using VS Code editor:
- **ES7+ React/Redux/React-Native snippets**
- **Prettier - Code formatter**
- **GitLens - Git supercharged**
- **Thunder Client - API testing**

Install: VS Code → Extensions → search name → Install

## Environment Variables (Future)

When needed, create `.env`:
```
VITE_API_URL=https://api.example.com
VITE_DEBUG=false
```

Then access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL
```

## Database Setup (If Adding Backend Later)

Simple Firebase example:
```javascript
// src/firebase.js
import { initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ...
}

export const app = initializeApp(firebaseConfig)
```

Then in `.env`:
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_PROJECT_ID=xxx
```

## Performance Tips

```javascript
// Use React.memo for expensive components
const HeatLegend = React.memo(() => {
  // Component code
})

// Use useCallback for event handlers
const handleClick = useCallback((e) => {
  // Handle click
}, [dependencies])

// Use useMemo for expensive calculations
const heatmapUrl = useMemo(() => {
  return renderHeatmap(sessions, side)
}, [sessions, side])
```

## Testing (Optional - Add Later)

```bash
# Install test framework
npm install --save-dev vitest

# Run tests
npm test
```

Example test (`src/App.test.jsx`):
```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CellumaTracker from './App'

describe('CellumaTracker', () => {
  it('renders title', () => {
    render(<CellumaTracker />)
    expect(screen.getByText(/LED THERAPY MAP/)).toBeTruthy()
  })
})
```

## Useful Resources

- **React docs**: https://react.dev
- **Vite docs**: https://vitejs.dev
- **JavaScript async/await**: https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous
- **Canvas API**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

## Emergency Fixes

**App won't start?**
```bash
npm cache clean --force
rm -rf node_modules
npm install
npm run dev
```

**Build fails?**
```bash
npm run build 2>&1 | head -20  # See first errors
```

**Lost data?**
- Check browser DevTools → Application → Storage → localStorage
- Look for `celluma-v18` key
- Export the JSON for backup

**Need to clear all data?**
In browser console (F12):
```javascript
localStorage.removeItem('celluma-v18')
location.reload()
```

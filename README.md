# Celluma Tracker - Red Light Therapy Session Map

A sophisticated web application for tracking red light therapy sessions with anatomically-mapped heatmap visualization. Track cumulative dosage across multiple devices (Celluma PRO, Celluma POD, Hooga Torch, TheraFace Glow) on front/back body views, hands, and face parts.

## Features

- **Multi-Device Support**: Track 4 different red light therapy devices with calibrated fluence values
- **Anatomical Mapping**: Place sessions on front/back body views, hand palms, ears, nose, and mouth
- **Heatmap Visualization**: Real-time color-coded heatmaps showing cumulative J/cm² exposure with exponential decay over 72 hours
- **Session Management**: Drag to reposition, double-click or right-click to delete sessions
- **Device Rotation**: Adjust device orientation (0°, 45°, 90°, 135°) for precise placement
- **Local Storage**: All sessions automatically saved to browser localStorage
- **Responsive Design**: Works on desktop and touch devices

## Installation

### Prerequisites
- Node.js 16+ and npm

### Setup

1. Navigate to the project directory:
```bash
cd CelluMe
```

2. Install dependencies:
```bash
npm install
```

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The app will open automatically at `http://localhost:5173`

## Building for Production

Create an optimized production build:
```bash
npm run build
```

This generates a `dist` folder ready for deployment.

## Deployment Options

### Option 1: GitHub Pages (Recommended for Free Hosting)

1. Create a GitHub repository
2. Push the code to GitHub
3. Add to `vite.config.js`:
```javascript
export default defineConfig({
  base: '/celluma-tracker/', // or your repo name
  // ... rest of config
})
```

4. Add GitHub Actions workflow (`.github/workflows/deploy.yml`):
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
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

5. Enable GitHub Pages in repository settings (source: gh-pages branch)

### Option 2: Vercel (Recommended - Easiest)

1. Sign up at [vercel.com](https://vercel.com)
2. Connect your GitHub repository
3. Vercel auto-detects Vite and deploys automatically
4. Get a live URL instantly

### Option 3: Netlify

1. Sign up at [netlify.com](https://netlify.com)
2. Connect your GitHub repository
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Deploy!

### Option 4: Traditional Web Host

1. Build locally: `npm run build`
2. Upload the `dist` folder contents to your web host
3. Set your web root to the dist folder
4. Ensure your host supports client-side routing (or use a simple redirect)

## Usage

### Logging Sessions

1. **Select a device** from the device selector (Celluma PRO, POD, Hooga Torch, or TheraFace Glow)
2. **Set orientation** (if rotatable): Choose vertical, horizontal, or diagonal
3. **Click on the body part** where you want to place the session
4. **View the heatmap** - colors show cumulative J/cm² exposure:
   - 🔵 Blue: Sub-therapeutic
   - 🟢 Green: Therapeutic sweet spot (7 J/cm²)
   - 🟡 Yellow: Top of effective window (15 J/cm²)
   - 🟠 Orange: High exposure risk (22 J/cm²)
   - 🔴 Red: Saturated/overdone (30+ J/cm²)

### Managing Sessions

- **Move**: Drag the small ring handle at the center of each session
- **Delete**: Double-click the ring handle or right-click and select remove
- **Clear Faded**: Remove all sessions older than 72 hours
- **Clear All**: Remove all sessions (with confirmation)

### Data Persistence

All sessions are saved to browser localStorage under key `celluma-v18`. Data persists across browser sessions and page refreshes.

## Device Specifications

| Device | Shape | Fluence | Duration | Notes |
|--------|-------|---------|----------|-------|
| Celluma PRO | Rectangle | 8 J/cm² | 30 min | 16″ × 8″ flexible panel, 22 mW/cm² |
| Celluma POD | Rectangle | 6 J/cm² | 30 min | 4.4″ × 2.75″ portable, 35 mW/cm² |
| Hooga Torch | Circle | 22 J/cm² | 3 min | 1.25″ precision spot, 120 mW/cm² |
| TheraFace Glow | Ellipse | 15 J/cm² | 12 min | 5″ × 7″ face mask, 87 mW/cm² |

## Physics & Dosimetry

- **Fluence**: Energy delivered per unit area (J/cm²)
- **Exponential Decay**: Sessions fade over 72 hours with ~18-hour half-life
- **Therapeutic Window**: 5-15 J/cm² per treatment for skin benefits
- **Over-stimulation Risk**: >22 J/cm² short-term accumulation

The app models acute mitochondrial response kinetics, with peak benefits at 3-6 hours post-treatment and baseline return by ~72 hours.

## Troubleshooting

**Data not saving?**
- Check browser localStorage is enabled
- Check dev console for errors

**Heatmaps not rendering?**
- Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache

**Devices not rotating?**
- Only Celluma PRO, POD, and TheraFace Glow support rotation
- Hooga Torch is a fixed point source

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Created for personal wellness tracking. Use freely.

## Credits

Original code concept created with Claude AI. Medical device specifications from manufacturer datasheets (April 2026).

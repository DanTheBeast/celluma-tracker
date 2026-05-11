# 🔴 Celluma Tracker - Start Here!

Hi! This is your red light therapy tracker app. Here's how to get started.

## What This App Does

Track your red light therapy sessions with a visual heatmap that shows:
- Where you used each device
- How much cumulative energy your skin received
- Safe vs. risky exposure levels (blue = safe, red = too much)

## 30-Second Setup

### Step 1: Install Node.js
Download from https://nodejs.org/ and run the installer. Takes 2 minutes.

### Step 2: Open Terminal
- Mac: Press Cmd+Space, type "Terminal", Enter
- Windows: Press Win+R, type "cmd", Enter

### Step 3: Go to Your App Folder
```bash
cd Desktop/The\ Prize/Apps/CelluMe
```
(or wherever you saved the folder)

### Step 4: Start the App
```bash
npm install
npm run dev
```

Your app opens automatically in your browser! 🎉

## Using the App

### 1. Choose Your Device
Click one of these buttons:
- **Celluma PRO** - Your big panel (30 min sessions, 8 J/cm²)
- **Celluma POD** - Your portable device (30 min sessions, 6 J/cm²)
- **Hooga Torch** - Precision spot (3 min sessions, 22 J/cm²)
- **TheraFace Glow** - Face mask (12 min sessions, 15 J/cm²)

### 2. Set the Angle (If Needed)
For the PRO, POD, and Glow devices, choose how you positioned it:
- ↕ Vertical
- ↔ Horizontal
- ↗ Diagonal
- ↘ Other diagonal

### 3. Click Where You Used It
Click on the body part where you used the device. Options:
- **Body**: Front and Back views
- **Hands**: Left and Right palms (great for face targeting with small devices)
- **Face**: Ears, Nose, Mouth

### 4. Watch the Heatmap Update
As you add sessions, the colors show cumulative exposure:

| Color | Meaning | J/cm² |
|-------|---------|-------|
| 🔵 Blue | Safe, sub-therapeutic | 0-1 |
| 🟢 Green | Perfect! Therapeutic range | ~7 |
| 🟡 Yellow | Effective but upper limit | ~15 |
| 🟠 Orange | Getting risky | ~22 |
| 🔴 Red | Too much in short time | 30+ |

## Managing Sessions

### Move a Session
- Grab the small white ring at the center
- Drag it to a new location

### Delete a Session
- Double-click the white ring, OR
- Right-click the white ring and select "Remove"

### Clear Old Sessions
- **"Clear Faded"** - removes sessions older than 72 hours
- **"Clear All"** - removes everything (asks for confirmation)

### View Recent Sessions
Scroll down to see your last 10 sessions with timestamps. Click the × to remove any.

## How the Science Works

Your skin's benefits from red light fade over time:
- **Peak benefit**: 3-6 hours after treatment
- **Still effective**: up to 24-48 hours
- **Mostly faded**: by 72 hours

The heatmap shows this with fading colors - older sessions appear lighter.

## Tips for Best Results

✅ **DO:**
- Use 5-15 J/cm² per body area per week for best results
- Space out sessions (don't do the same spot daily)
- Keep a log using this app!
- Monitor for redness or discomfort

❌ **DON'T:**
- Accumulate >22 J/cm² in short periods on the same spot
- Use without eye protection if near eyes
- Ignore redness or irritation
- Trust this app over medical advice

## Your Data is Safe

✅ All your data stays on YOUR computer
✅ Nothing is sent to servers
✅ Works offline (once loaded)
✅ Automatically saves to browser storage

## Sharing Your App Online

Once you want to use it from anywhere (phone, other computers), follow **DEPLOYMENT.md** for free hosting on Vercel (takes 5 minutes).

## Troubleshooting

**App won't open?**
- Check Terminal shows no red errors
- Try: `npm cache clean --force` then `npm install`

**Data disappeared?**
- Might be in private/incognito mode
- Try a normal browser window

**Page looks wrong?**
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

**Forgot where the app folder is?**
- Desktop/The Prize/Apps/CelluMe

## Quick Commands You'll Use

```bash
# Start the app
npm run dev

# Stop it (when you're done)
Ctrl+C

# Deploy to web (later)
npm run build
```

## Features Explained

### Device Selector
Choose which device you used. Each has different:
- Size (controls where it can reach)
- Power (40mW - 120mW/cm²)
- Session length and dose

### Body Views
- **Front**: What you see looking in a mirror
- **Back**: Back of body (neck, shoulders, back)
- **Hands**: Palm-side for treating hands/fingers
- **Face**: Detailed views of ears, nose, mouth

### Rotation Control
For flexible devices, you can pick how you positioned it. This helps the app know what area you actually treated.

### Heatmap
Real-time visualization of cumulative energy. The colors change as:
1. You add new sessions (colors get darker/redder)
2. Time passes (colors fade over 72 hours)

### Recent Sessions
Quick log of your last 10 treatments showing:
- Device used
- Body part treated
- How long ago

## Next Steps

1. ✅ Start using it to log sessions
2. ✅ After a few weeks, check your patterns
3. ✅ When ready, deploy online (DEPLOYMENT.md)
4. ✅ Share with your doctor if tracking for skin conditions

## Questions?

- Check **README.md** for detailed docs
- Check **SETUP.md** for technical help
- Check **QUICK_COMMANDS.md** for command reference

## One More Thing

This app was built just for you using your Claude session! It includes:
- ✨ Professional heatmap visualization
- 📊 Exponential decay physics (real science!)
- 🎯 All your devices preconfigured
- 💾 Automatic data saving
- 📱 Works on phone, tablet, desktop
- 🚀 Ready to deploy online

Enjoy tracking your red light therapy! Your skin will thank you. 🔴✨

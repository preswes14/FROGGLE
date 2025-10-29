# Getting FROGGLE on Your iPhone - Complete Guide

## The Problem
iOS Safari can't easily open local HTML files, making it tricky to play FROGGLE directly on your iPhone.

## The Solution: 3 Methods (Easiest to Hardest)

---

## METHOD 1: GitHub Pages (RECOMMENDED - FREE & EASIEST)

This is by far the best option! Host your game on GitHub Pages and access it via URL.

### Step 1: Enable GitHub Pages

1. Go to https://github.com/preswes14/FROGGLE
2. Click **Settings** (top menu bar)
3. Click **Pages** (left sidebar under "Code and automation")
4. Under **"Build and deployment"**:
   - **Source**: Select "Deploy from a branch"
   - **Branch**: Select **`main`** (not the claude branches!)
   - **Folder**: Select **`/ (root)`**
   - Click **Save**

5. Wait 2-3 minutes while GitHub deploys your site
6. Refresh the Pages settings page - you'll see a green banner with your URL:
   ```
   Your site is live at https://preswes14.github.io/FROGGLE/
   ```

### Step 2: Play on Your iPhone

1. Open **Safari** on your iPhone
2. Visit: **https://preswes14.github.io/FROGGLE/**
3. You'll see a landing page with two buttons
4. Tap **"📱 Play on Mobile"**
5. The game loads instantly!

### Step 3: Add to Home Screen (Makes it feel like a real app!)

1. While on the game page, tap the **Share** button (square with arrow up)
2. Scroll down and tap **"Add to Home Screen"**
3. Name it **"FROGGLE"**
4. Tap **"Add"**
5. Now you have a FROGGLE app icon on your home screen!

### Why This Is Best:
- ✅ **Free forever**
- ✅ **No apps to install**
- ✅ **Works perfectly in Safari**
- ✅ **Works offline after first load**
- ✅ **Easy to share with beta testers** (just send the URL!)
- ✅ **Easy to update** (just push changes to main branch)

---

## METHOD 2: Using iCloud Drive (If GitHub Pages doesn't work)

### Step 1: Upload to iCloud Drive

1. On your **computer**:
   - Download `Froggle9.0_Mobile.html` from the repo
   - Open **iCloud.com** in your browser
   - Go to **iCloud Drive**
   - Create a folder called **"FROGGLE"**
   - Upload `Froggle9.0_Mobile.html` to that folder

2. On your **iPhone**:
   - Open the **Files** app
   - Go to **iCloud Drive → FROGGLE**
   - Tap **`Froggle9.0_Mobile.html`**
   - Choose **"Safari"** when prompted

### Limitations:
- ⚠️ Files may not sync immediately
- ⚠️ Requires iCloud storage
- ⚠️ May have permissions issues

---

## METHOD 3: Paid iOS Apps (Last Resort)

If you want to run local HTML files without hosting:

### Option A: Working Copy ($20 one-time)
- Full-featured Git client for iOS
- Can clone your GitHub repo
- Built-in HTML preview
- **Best for developers**

1. Download Working Copy from App Store
2. Clone your FROGGLE repo
3. Tap `Froggle9.0_Mobile.html` to preview

### Option B: Inspect Browser ($7/month or free limited)
- Web developer browser for iOS
- Can open local HTML files
- Has dev tools

### Option C: Textastic ($10 one-time)
- Code editor for iOS
- Built-in web preview
- Can import files

---

## Troubleshooting

### "I enabled GitHub Pages but the URL doesn't work"
- Wait 3-5 minutes after enabling
- Make sure you selected the `main` branch, not a claude/ branch
- Try visiting in Safari's private mode first
- Check Settings → Pages for any error messages

### "The page loads but images are broken"
- Make sure you tapped "Play on Mobile" - this version has all images embedded
- The desktop version requires the assets folder to work

### "Game doesn't save my progress"
- Make sure you're not in Private Browsing mode
- Check Settings → Safari → Privacy - "Block All Cookies" should be OFF
- Try adding to Home Screen - this can help with storage permissions

### "Screen is cut off or too small"
- Rotate to landscape mode
- Tap the address bar area to hide/show browser chrome
- If on Home Screen, make sure you're using the mobile version

---

## My Recommendation

**Use GitHub Pages (Method 1)** - it's:
- Free
- No apps needed
- Perfect for iPhone
- Easy to update
- Great for beta testing (just share the URL!)

Just enable it in your repo settings and visit the URL. It takes 2 minutes to set up and works flawlessly!

---

## Need Help?

Let me know what specific error or issue you're encountering and I can help troubleshoot!

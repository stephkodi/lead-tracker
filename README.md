# Service Lead Tracker (iOS 26 Liquid Glass PWA)

A mobile-first Service Lead Capture and Instant WhatsApp Dispatch PWA featuring an **iOS 26 Liquid Glass** design system, persistent **Light & Dark mode**, and automated **Google Sheets synchronization**.

---

## ✨ Features

- **iOS 26 Liquid Glass Aesthetic**: Translucent frosted surfaces, ambient liquid aurora refraction orbs, specular top-edge light highlights, and micro-spring animations.
- **Light & Dark Mode**: Seamless toggle in the header and settings, persistent in `localStorage` and synchronized with the device's system theme and mobile browser chrome.
- **Service Lead Capture**: Multi-service categories (General, Electrical, Plumbing, Carpentry, Painting, etc.), contact validation, address input, and detailed scope notes.
- **Instant WhatsApp Vendor Dispatch**: One-tap formatted WhatsApp dispatch message pre-filled with customer details, scope, date, and address.
- **Native Liquid Celebration**: Clean, smooth expanding liquid checkmark animation replacing bulky particle effects.
- **Vendor Directory**: Manage service partners, filter by trade category, launch direct WhatsApp chats, and auto-match vendors to leads.
- **Google Sheets Webhook Sync**: Real-time logging of captured leads directly to Google Sheets via Google Apps Script.

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Local Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser (or open in mobile view for the optimal smartphone experience).

---

## 🐙 Uploading to GitHub

To publish this project to GitHub:

1. **Initialize Git in your local folder** (if not already done):
   ```bash
   git init
   ```

2. **Stage and commit all files**:
   ```bash
   git add .
   git commit -m "feat: iOS 26 liquid glass lead tracker with dark mode"
   ```

3. **Link to your GitHub repository**:
   - Create a new empty repository on [GitHub](https://github.com/new) (e.g. `lead-tracker`).
   - Run:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/lead-tracker.git
   git push -u origin main
   ```

---

## ⚡ Deploying to Vercel

This app is built on **Next.js 16 (App Router)** and deploys effortlessly on [Vercel](https://vercel.com).

### Option A: Import from GitHub (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and select your `lead-tracker` repository.
3. Keep the default settings (Framework Preset: **Next.js**, Root Directory: `./`).
4. *(Optional)* Add the environment variable:
   - `GOOGLE_SHEETS_WEBHOOK_URL`: Your Google Apps Script Web App URL.
   - Note: You can also configure the Web App URL directly inside the app's **Settings** tab.
5. Click **Deploy**. Your PWA will be live with a free SSL certificate and CDN.

### Option B: Deploy via Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## ⚙️ Google Sheets Integration

1. Create a Google Sheet and open **Extensions > Apps Script**.
2. Paste the snippet provided in the app's **Settings** tab.
3. Click **Deploy > New deployment**, select **Web app**, and set *Who has access* to **Anyone**.
4. Paste the Web App URL into **Settings > Google Apps Script Web App URL** and tap **Test Connection**.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Library**: React 19
- **Styling**: Tailwind CSS v4, custom iOS 26 Liquid Glass design system
- **Motion**: Framer Motion
- **Icons**: Lucide React

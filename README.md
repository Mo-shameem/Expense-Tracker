# Expense Tracker PWA

A Progressive Web App for tracking expenses, backed by Google Sheets. Works offline and installable on iOS and Android.

## Features

- **Google Sign-In** via OAuth 2.0 (popup flow, no backend)
- **Google Sheets database** — one sheet per user, auto-created on first login
- **Calendar view** — monthly calendar with daily expense totals; tap to view/add
- **Charts** — pie chart breakdown by category (week/month toggle)
- **Offline support** — queues writes when offline, syncs on reconnect
- **PWA** — installable on iOS and Android

---

## Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **New Project**, give it a name (e.g. "Expense Tracker"), click **Create**
3. Select the new project from the top dropdown

### 2. Enable APIs

1. Go to **APIs & Services → Library**
2. Search for **Google Sheets API** and click **Enable**
3. Search for **Google Drive API** and click **Enable**

### 3. Set Up OAuth Credentials

1. Go to **APIs & Services → Credentials**
2. Click **Configure Consent Screen**
   - Choose **External** user type
   - Fill in App name, support email, developer email
   - Add scopes: `spreadsheets` and `drive.file`
   - Add your own email as a Test user (while in development)
   - Click **Save and Continue** through all steps
3. Back on Credentials, click **+ Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: e.g. "Expense Tracker Web"
   - **Authorized JavaScript origins** — add:
     - `http://localhost:5173`
     - `http://localhost:4173`
     - Your production domain (e.g. `https://your-app.vercel.app`)
   - **Authorized redirect URIs** — leave empty (popup flow doesn't need it)
   - Click **Create**
4. Copy the **Client ID** shown in the dialog

### 4. Create an API Key

1. Still on Credentials, click **+ Create Credentials → API Key**
2. Copy the key
3. Click **Edit API key** → restrict it to **Sheets API** and **Drive API**
4. Add HTTP referrer restrictions: `localhost:5173/*` and your production domain

### 5. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_API_KEY=your-api-key
```

### 6. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 7. Build for Production

```bash
npm run build
npm run preview   # test the production build locally
```

---

## Deploying to Netlify

### Option A — Netlify UI (recommended for first deploy)

1. Push this repo to GitHub (or GitLab / Bitbucket):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git
   git push -u origin main
   ```

2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**

3. Connect your GitHub account and select the repo

4. Build settings are picked up automatically from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`

5. **Add environment variables** before deploying:
   - Go to **Site configuration → Environment variables → Add a variable**
   - Add `VITE_GOOGLE_CLIENT_ID` = your OAuth client ID
   - Add `VITE_GOOGLE_API_KEY` = your API key

6. Click **Deploy site** — Netlify builds and publishes automatically

### Option B — Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init        # links repo and configures the site
netlify env:set VITE_GOOGLE_CLIENT_ID "your-client-id.apps.googleusercontent.com"
netlify env:set VITE_GOOGLE_API_KEY "your-api-key"
netlify deploy --build --prod
```

### After deploying

Once your site is live at e.g. `https://your-app.netlify.app`, go back to the **Google Cloud Console** and:

1. **APIs & Services → Credentials → Edit your OAuth 2.0 Client ID**
   - Add `https://your-app.netlify.app` to **Authorized JavaScript origins**

2. **Edit your API Key**
   - Add `https://your-app.netlify.app/*` to the HTTP referrer restrictions

The app will auto-redeploy on every `git push` to `main`.

---

## Project Structure

```
src/
├── lib/
│   └── googleApi.js      # All Google API logic (auth, Sheets, offline queue)
├── hooks/
│   ├── useAuth.js        # Authentication state + GSI setup
│   └── useExpenses.js    # Expense CRUD + offline sync
├── pages/
│   ├── LoginPage.jsx     # Sign-in screen
│   ├── CalendarPage.jsx  # Monthly calendar home screen
│   └── ChartsPage.jsx    # Pie chart analytics
├── components/
│   ├── Layout.jsx        # App shell with nav
│   ├── DaySheet.jsx      # Bottom sheet for day expenses
│   ├── Toast.jsx         # Error/info notifications
│   └── Skeleton.jsx      # Loading skeletons
├── App.jsx
├── main.jsx
└── index.css
```

## Data Schema (Google Sheet)

**Expenses sheet** columns: `Date | Amount | Category | Note | Timestamp`

**Categories sheet**: one category name per row (editable, synced to app)

## Offline Behavior

- The app shell (HTML, JS, CSS) is cached by the service worker.
- When you add an expense without internet, it's saved to `localStorage` as a queue.
- On reconnect, queued expenses are automatically flushed to Google Sheets.
- The pending count is shown in the header badge.

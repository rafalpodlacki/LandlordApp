# PropGuard — Property Insurance & Certificate Manager

A full-stack property management app for landlords to track properties, certificates, and insurance documents — with expiry reminders.

## Tech Stack

- **Frontend**: React + Vite
- **Database & Auth**: Firebase (Firestore + Firebase Auth)
- **Hosting**: Netlify

---

## Setup Guide

### 1. Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it (e.g. `propguard`)
3. Disable Google Analytics if not needed → **Create project**

### 2. Enable Firebase Auth

1. In Firebase Console → **Authentication** → **Get started**
2. Under **Sign-in method**, enable **Email/Password**
3. Save

### 3. Create Firestore Database

1. In Firebase Console → **Firestore Database** → **Create database**
2. Choose **Production mode** → select your region → **Done**
3. Go to **Rules** tab and replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /properties/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    match /documents/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

4. Click **Publish**

### 4. Get Your Firebase Config

1. In Firebase Console → **Project Settings** (gear icon) → **Your apps**
2. Click **Add app** → Web (`</>`)
3. Register app → copy the `firebaseConfig` object values

### 5. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Firebase values:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
```

### 6. Run Locally

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## Deploy to Netlify

### Option A: Netlify CLI (recommended)

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod
```

### Option B: Netlify Dashboard + GitHub

1. Push this project to a GitHub repository
2. Go to [https://app.netlify.com](https://app.netlify.com) → **Add new site** → **Import from Git**
3. Connect GitHub → select your repo
4. Build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **Add environment variables** and add all `VITE_FIREBASE_*` values from your `.env.local`
6. Click **Deploy site**

---

## Email Reminders (Optional)

For automated email reminders, add a Firebase Cloud Function:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. `firebase init functions` in the project root
3. Create a scheduled function in `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

exports.sendExpiryReminders = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const docs = await db.collection('documents')
      .where('expiryDate', '<=', admin.firestore.Timestamp.fromDate(thirtyDaysFromNow))
      .where('expiryDate', '>=', admin.firestore.Timestamp.fromDate(now))
      .get();

    // Group by userId and send emails
    // Configure nodemailer with your email provider (SendGrid, Mailgun, etc.)
    
    console.log(`Found ${docs.size} expiring documents`);
  });
```

4. `firebase deploy --only functions`

---

## Features

- 🔐 Secure login / register / password reset
- 🏠 Property portfolio management
- 📄 Certificate & insurance tracking (Gas Safety, EICR, EPC, Buildings Insurance, etc.)
- ⏰ Configurable expiry reminders (7/14/30/60/90 days)
- 🚨 Dashboard alerts for expired and expiring documents
- 🔍 Search and filter documents
- 📱 Responsive design

## Document Types Supported

- Buildings Insurance
- Contents Insurance
- Landlord Insurance
- Gas Safety Certificate
- Electrical Safety Certificate (EICR)
- Energy Performance Certificate (EPC)
- Fire Safety Certificate
- PAT Testing Certificate
- Legionella Risk Assessment
- HMO Licence
- Planning Permission
- Boiler Service Record
- Custom (Other)

# Firebase Emulator Setup Guide

## Overview
This guide explains how to use Firebase emulators for local development and testing before deploying to production.

## What Are Firebase Emulators?

Firebase emulators run locally on your machine and simulate Firebase services (Firestore, Authentication, etc.) without affecting your production database. This allows you to:
- Test database operations locally without using real Firebase quota
- Iterate quickly without network latency
- Avoid polluting production data with test entries
- Test security rules safely
- Develop offline

## Current Configuration

### Environment Files

#### Development (`src/environments/environment.ts`)
```typescript
useEmulators: true  // Uses local emulators
```

#### Production (`src/environments/environment.prod.ts`)
```typescript
useEmulators: false  // Uses real Firebase cloud services
```

### Emulator Ports
- **Firestore**: `localhost:8080`
- **Auth**: `localhost:9099`
- **Emulator UI**: `http://127.0.0.1:4000`

## Commands

### Start Firebase Emulators
```powershell
firebase emulators:start
```
Starts all configured emulators (Firestore, Auth, etc.) with the rules defined in `firestore.rules`.

### Start Development Server
```powershell
ionic serve
```
Starts the Ionic/Angular app on `http://localhost:8100` and automatically connects to emulators when `useEmulators: true`.

### Build for Production
```powershell
ng build --configuration=production
```
Builds the app using `environment.prod.ts`, which disables emulators and connects to real Firebase.

## Typical Development Workflow

### 1. Local Development & Testing
```powershell
# Terminal 1: Start emulators
firebase emulators:start

# Terminal 2: Start dev server
ionic serve
```

**What happens:**
- App runs on `localhost:8100`
- All Firestore operations go to local emulator
- View data in Emulator UI at `http://127.0.0.1:4000/firestore`
- No impact on production database
- Fast iteration with hot reload

### 2. Testing Security Rules
Edit `firestore.rules` → Emulator automatically reloads the rules → Test in your app immediately.

### 3. Before Pushing to Master
```powershell
# Run tests
npm test

# Run Cypress E2E tests (optional)
npx cypress run

# Build production version
ng build --configuration=production

# Verify build succeeded
```

### 4. Deploy to Production
```powershell
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy hosting (if using Firebase hosting)
firebase deploy --only hosting
```

## Current Firestore Rules

The `firestore.rules` file defines three collections:

### 1. `competitiveResults`
- Public read
- Write requires: `username`, `score`, `timeSpent`, `difficulty`, `questionsCount`, `timestamp`
- Username: 3-20 characters
- Score: 0-100
- No updates or deletes

### 2. `practiceResults`
- Public read  
- Write requires: `username`, `flagsLearned`, `practiceTime`, `timestamp`
- Username: 3+ characters
- No updates or deletes

### 3. `leaderboard`
- Public read
- Write requires: `username`, `rating`, `accuracy`, `totalTime`, `correctAnswers`, `totalQuestions`, `sessionId`, `createdAt`
- Username: 3-20 characters
- Accuracy: 0-100%
- No updates or deletes

## Key Points

✅ **Development**: Data writes to local emulator only  
✅ **Production Build**: Automatically connects to real Firebase  
✅ **Security**: Rules are enforced in both emulator and production  
✅ **Testing**: Emulator UI shows real-time data at `http://127.0.0.1:4000`  

## Troubleshooting

### "Permission denied" errors
Check that your data matches the schema in `firestore.rules`. The emulator enforces rules just like production.

### Data not appearing in production
If `useEmulators: true` in your environment file, data only goes to the local emulator. Set to `false` or build with `--configuration=production` to use real Firebase.

### Emulator won't start
- Check if ports 8080, 9099, or 4000 are already in use
- Ensure Java is installed (required for Firestore emulator)
- Check `firebase.json` configuration

## Recent Fixes Applied

### 1. Added Leaderboard Collection Rules
Added validation rules for the `leaderboard` collection to allow score submissions from the app.

### 2. Fixed Zone Warning
Removed `runOutsideAngular` wrapper from `onSnapshot` call in `leaderboard.service.ts` to prevent injection context warnings.

---

**Last Updated**: November 24, 2025

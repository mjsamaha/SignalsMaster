# Firebase Competitive Leaderboard - Debug Testing Guide

## Overview
This guide walks you through testing the competitive leaderboard submission flow with comprehensive console logging to identify where submissions are failing.

**Last Updated**: 2025-11-23

---

## Quick Start Testing Steps

### 1. **Open DevTools and Clear Console**
- Press `F12` in Chrome to open Developer Tools
- Click the **Console** tab
- Click the circle with slash icon to clear console
- **Keep the Console tab visible during testing** - watch logs in real-time

### 2. **Navigate to Best Signaller Mode**
1. App loads at `http://localhost:8100`
2. Click the **menu icon** or navigate to **Best Signaller** tab
3. Enter a username (e.g., `TestUser123`)
4. Click **Start Competitive Quiz**
5. **Expected console output**:
   ```
   [DEBUG] LeaderboardService constructor called, firestore: true
   ```

### 3. **Complete 50 Questions**
- Quickly answer all 50 questions (or use reasonable answers)
- Track your accuracy score
- **Watch console** - should see quiz progress logs (not from leaderboard service yet)

### 4. **Submit Results to Leaderboard**
On the results page:
1. Verify you see your score, accuracy, and tier
2. **Expected console output** (CRITICAL - if missing, this is the bug):
   ```
   [DEBUG] CompetitiveResultsPage.ngOnInit() called
   [DEBUG] Current navigation: <navigation object>
   [DEBUG] Navigation state: {results: {...}}
   [DEBUG] Results extracted from state: {...}
   [DEBUG] Results confirmed, page ready to display
   ```

3. Enter a **username** (3-20 characters) in the text input
4. Click **Submit to Leaderboard**
5. **Expected console output** (CRITICAL - watch for these in order):
   ```
   [DEBUG] submitScore() called, results: {...}, isSubmitting: false
   [DEBUG] Proceeding with score submission...
   [DEBUG] Calling leaderboardService.submitScore...
   [DEBUG] LeaderboardService.submitScore called with: {...}
   [DEBUG] Prepared document data: {...}
   [DEBUG] Document added successfully, ID: abc123...
   [DEBUG] submitScore response: {success: true, message: "Score submitted successfully!"}
   [DEBUG] Submission successful
   ```

6. **Success message** should appear on the page
7. Check the page UI - should show "Submitted!" confirmation

### 5. **Verify Firestore Data**
1. Open **Firebase Console** → Project: `signalsmaster-40d2f`
2. Navigate to **Firestore Database** → Collection: `leaderboard`
3. **Expected**: New document visible with:
   - `username`: Your submitted username
   - `rating`: Your final rating
   - `accuracy`: Your accuracy percentage
   - `createdAt`: Timestamp (current time)

### 6. **Check Leaderboard Page**
1. From results page, click **View Leaderboard**
2. Navigate to **Leaderboard** tab
3. **Expected console output**:
   ```
   [DEBUG] LeaderboardPage.ngOnInit() called
   [DEBUG] onSnapshot fired, docs count: 1
   [DEBUG] Processed entries: 1
   [DEBUG] Leaderboard received entries: 1, entries: [...]
   ```

4. **UI should display**: Your submitted entry with rank, username, rating, and tier

---

## Troubleshooting By Console Output

### **SYMPTOM: No debug logs at all**
**Problem**: Service not being instantiated
**Check**:
- Look for: `[DEBUG] LeaderboardService constructor called, firestore: true`
- If missing: Service DI failed, check `main.ts` providers

### **SYMPTOM: Logs stop at submitScore() call**
**Problem**: Early return guard triggered
**Console shows**:
```
[DEBUG] submitScore() called, results: null, isSubmitting: false
[DEBUG] Early return: results null or already submitting
```
**Root cause**: `navigation.extras.state` is null → router state not passed from quiz page
**Fix**: Check `quiz.page.ts` line 227 - ensure `router.navigate(['/competitive-results'], { state: { results } })`

### **SYMPTOM: submitScore called but service method not reached**
**Console shows**:
```
[DEBUG] submitScore() called, results: {...}, isSubmitting: false
[DEBUG] Proceeding with score submission...
[DEBUG] Calling leaderboardService.submitScore...
[DEBUG] LeaderboardService.submitScore called with: {...}
```
(stops after this)

**Root cause**: Validation failing or Firebase error
**Check next log**:
```
[DEBUG] Validation failed for results: {...}
```
or
```
[DEBUG] Error submitting score: {code: "permission-denied", message: "..."}
```

### **SYMPTOM: Document added log seen but no data in Firebase**
**Console shows**:
```
[DEBUG] Document added successfully, ID: abc123...
[DEBUG] submitScore response: {success: true, message: "..."}
```
But Firebase console is empty

**Root cause**: Firestore Rules blocking writes
**Check**:
1. Firebase Console → Firestore Security Rules
2. Verify rule allows `create` with proper validation
3. Run test query: Submit with missing field (username, rating, etc.)
   - Should see: `permission-denied` error
   - If error appears, rules are enforced (good!)

### **SYMPTOM: Leaderboard page shows empty state**
**Console shows**:
```
[DEBUG] LeaderboardPage.ngOnInit() called
[DEBUG] onSnapshot fired, docs count: 0
[DEBUG] Processed entries: 0
```

**Root cause**: Firebase read working, but no documents in collection
**Check**:
1. Did the "Document added successfully" log appear during submission?
2. Is the document in Firebase Console → Firestore?
3. Check permission logs: Did a `permission-denied` error occur during read?

---

## Key Injection Points for Logging

### **If you need to add more logging:**

**In `quiz.page.ts` (line ~227) before navigation:**
```typescript
const results = this.quizService.getCompetitiveResults();
console.log('[DEBUG] Quiz completed, results:', results);
if (results) {
  console.log('[DEBUG] Navigating to competitive-results with state:', { results });
  this.router.navigate(['/competitive-results'], {
    state: { results }
  });
}
```

**In `competitive-results.page.ts` HTML button:**
```html
<ion-button 
  (click)="submitScore()"
  [disabled]="isSubmitting">
  {{ isSubmitting ? 'Submitting...' : 'Submit to Leaderboard' }}
</ion-button>
```
Add to component class:
```typescript
console.log('[DEBUG] Submit button clicked, component ready');
```

---

## Expected Console Timeline

### **Complete Successful Flow:**
```
1. App loads
   → [DEBUG] LeaderboardService constructor called, firestore: true

2. Quiz completed, navigate to results
   → (quiz logs...)

3. Results page loads
   → [DEBUG] CompetitiveResultsPage.ngOnInit() called
   → [DEBUG] Current navigation: {...}
   → [DEBUG] Results extracted from state: {...}

4. User clicks Submit
   → [DEBUG] submitScore() called, results: {...}, isSubmitting: false
   → [DEBUG] Proceeding with score submission...
   → [DEBUG] Calling leaderboardService.submitScore...
   → [DEBUG] LeaderboardService.submitScore called with: {...}
   → [DEBUG] Prepared document data: {...}
   → [DEBUG] Document added successfully, ID: <doc-id>
   → [DEBUG] submitScore response: {success: true, ...}
   → [DEBUG] Submission successful

5. User navigates to Leaderboard
   → [DEBUG] LeaderboardPage.ngOnInit() called
   → [DEBUG] Creating leaderboard query
   → [DEBUG] onSnapshot fired, docs count: 1
   → [DEBUG] Processed entries: 1
   → [DEBUG] Leaderboard received entries: 1, entries: [...]
```

---

## Firebase Security Rules Validation

**Current Rules** (in Firebase Console):
```firestore-rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboard/{entryId} {
      function isValidSubmission(data) {
        return data.username is string && data.username.size() >= 3 && data.username.size() <= 20
          && data.rating is number && data.rating >= 0 && data.rating <= 5000
          && data.accuracy is number && data.accuracy >= 0 && data.accuracy <= 100
          && data.totalTime is number && data.totalTime >= 0
          && data.createdAt is timestamp;
      }
      allow read: if true;
      allow create: if isValidSubmission(request.resource.data);
      allow update, delete: if false;
    }
  }
}
```

**To test rules manually:**
1. Firebase Console → Firestore → Test Rules (bottom right)
2. Set method: `create`
3. Resource: `/leaderboard/test`
4. Submit valid document:
   ```json
   {
     "username": "TestUser",
     "rating": 85,
     "accuracy": 92,
     "totalTime": 175,
     "correctAnswers": 46,
     "totalQuestions": 50,
     "sessionId": "sess-123",
     "createdAt": "2025-11-23T10:00:00Z"
   }
   ```
5. Should see: **Access denied** (for now - public write rules)
6. Update rules to `allow create: if true` temporarily for testing

---

## Next Steps if Still Broken

1. **Screenshot console output** - paste the full timeline
2. **Check Network tab** in DevTools:
   - Click Network tab
   - Perform submission
   - Look for `api.firebaseio.com` or `firestore.googleapis.com` calls
   - Check for **red X** (failed requests)
   - Click request → Response tab to see Firebase error

3. **Check Cloud Logs** in Firebase Console:
   - Go to Security Rules
   - Click "Cloud Logging" link
   - Should show permission-denied or validation errors

4. **Test with Firestore Emulator**:
   - Install Firebase emulator
   - Update `main.ts` to use emulator in dev mode
   - Re-test locally with full debug control

---

## Common Fixes Applied

✅ Added NgZone injection for proper change detection
✅ Fixed validation: `rating > 100` → `rating > 5000`
✅ Changed field: `timestamp` → `createdAt` (matches Firestore rules)
✅ Added comprehensive debug logging at all critical points
✅ Proper error handling with detailed error codes


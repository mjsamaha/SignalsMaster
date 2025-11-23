# Quick Test Checklist

## Pre-Test Setup
- [ ] Close browser completely
- [ ] Open `http://localhost:8100` fresh
- [ ] Press F12 → Console tab  
- [ ] Clear any previous logs (Ctrl+L in console)

## Test Steps
- [ ] Click "Best Signaller" tab
- [ ] Enter username (e.g., `testUser123`)
- [ ] Click "Start" button
- [ ] Answer all 50 questions as quickly as you can
- [ ] After question 50, click the "Next/Submit" button
- [ ] Watch console for logs (they appear in real-time)
- [ ] You'll see the Results page appear
- [ ] Click "Submit to Leaderboard" button
- [ ] Watch console for submission logs

## Critical Logs to Watch For (Copy-Paste These)

### Quiz Completion (After Q50)
```
[DEBUG] submitCompetitiveAnswer - updating session: {
```
✓ Look for: `willSetEndTime: true`

### Results Retrieval
```
[DEBUG] getCompetitiveResults returning:
```
✓ Look for all 5 fields (username, finalRating, accuracy, totalTime, sessionId)

### Results Page Navigation
```
[DEBUG] Results exist, navigating to competitive-results
```

### Submit Button Click
```
[DEBUG] submitScore() called, results: CompetitiveResults
```

### Service Processing  
```
[DEBUG] Document added successfully, ID:
```
✓ This is the critical one - if you see this, the write succeeded

## What to Report Back

After test, tell us:

1. **Did you see these logs?** (Yes/No for each)
   - [ ] `willSetEndTime: true`
   - [ ] `getCompetitiveResults returning:`
   - [ ] `submitScore() called`
   - [ ] `Document added successfully`
   - [ ] `Submission successful`

2. **Did success message appear?** (Yes/No)

3. **Did document appear in Firebase?** (Yes/No)
   - To check: Open [Firebase Console](https://console.firebase.google.com)
   - Project: signalsmaster-40d2f
   - Firestore → leaderboard → Look for new document

4. **Any error messages?** (Copy/paste them)

## Emergency Debug Commands

If you want to manually check the session in the browser console:

```javascript
// Check if session exists
JSON.stringify(sessionStorage)

// Check DOM for error messages  
console.log(document.body.innerText)
```

## Expected Outcome

✅ **Best Case**: All logs appear → Success message → Document in Firebase within 2 seconds

❌ **Likely Case**: Some logs missing → Tells us exactly where it fails

Either way, the missing logs will pinpoint the issue!

---

**Start test whenever ready. Report which logs appear in order!**

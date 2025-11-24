```Typescript
// In a service or component
import { getAnalytics, logEvent } from '@angular/fire/analytics';

// Log custom events
logEvent(analytics, 'quiz_completed', {
  mode: 'competitive',
  score: 85,
  username: 'player123'
});
```

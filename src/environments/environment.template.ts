// TEMPLATE FILE - Copy this to environment.ts and environment.prod.ts
// Replace placeholder values with your actual Firebase configuration
// DO NOT commit environment.ts or environment.prod.ts to git

export const environment = {
  production: false, // Set to true for environment.prod.ts
  useEmulators: true, // Set to false for environment.prod.ts
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
  },
  emulators: {
    firestore: {
      host: 'localhost',
      port: 8080
    },
    auth: {
      host: 'localhost',
      port: 9099
    }
  }
};

// For development (environment.ts):
// - Set production: false
// - Set useEmulators: true (or false if connecting to live Firebase)
//
// For production (environment.prod.ts):
// - Set production: true
// - Set useEmulators: false
// - Remove the emulators configuration object

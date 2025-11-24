// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  useEmulators: true, // Enable emulators for testing
  firebase: {
    apiKey: 'fake-api-key-for-emulator',
    authDomain: 'localhost',
    projectId: 'signalsmaster-40d2f',
    storageBucket: 'signalsmaster-40d2f.firebasestorage.app',
    messagingSenderId: '303346601142',
    appId: 'fake-app-id-for-emulator',
    measurementId: 'G-XXXXXXXX'
  },
  emulators: {
    firestore: {
      host: 'localhost',
      port: 8080
    },
    auth: {
      host: 'localhost',
      port: 9099
    },
    hosting: {
      host: 'localhost',
      port: 5000
    }
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.

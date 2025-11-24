// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR logs for cleaner test output (optional)
const app = window.top;
if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Preserve Firebase emulator state between tests
beforeEach(() => {
  // Set emulator environment variables
  cy.window().then((win) => {
    // @ts-ignore
    win.FIRESTORE_EMULATOR_HOST = Cypress.env('FIRESTORE_EMULATOR_HOST');
    // @ts-ignore
    win.FIREBASE_AUTH_EMULATOR_HOST = Cypress.env('FIREBASE_AUTH_EMULATOR_HOST');
  });
});

// Global error handler
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // Adjust this based on your needs
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }
  return true;
});

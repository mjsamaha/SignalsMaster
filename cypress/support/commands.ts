/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to navigate to a specific tab in the app
       * @example cy.navigateToTab('tab1')
       */
      navigateToTab(tabName: string): Chainable<void>;

      /**
       * Custom command to start a quiz
       * @example cy.startQuiz()
       */
      startQuiz(): Chainable<void>;

      /**
       * Custom command to answer a quiz question
       * @example cy.answerQuestion('Alpha')
       */
      answerQuestion(answer: string): Chainable<void>;

      /**
       * Custom command to submit quiz results to leaderboard
       * @example cy.submitToLeaderboard('TestUser')
       */
      submitToLeaderboard(username: string): Chainable<void>;

      /**
       * Custom command to clear Firebase emulator data
       * @example cy.clearFirestoreData()
       */
      clearFirestoreData(): Chainable<void>;

      /**
       * Custom command to seed Firebase emulator with test data
       * @example cy.seedFirestoreData()
       */
      seedFirestoreData(): Chainable<void>;

      /**
       * Custom command to wait for Ionic components to be ready
       * @example cy.waitForIonic()
       */
      waitForIonic(): Chainable<void>;
    }
  }
}

// Navigate to specific tab
Cypress.Commands.add('navigateToTab', (tabName: string) => {
  cy.get(`ion-tab-button[tab="${tabName}"]`).click();
  cy.wait(500); // Wait for animation
});

// Start a quiz
Cypress.Commands.add('startQuiz', () => {
  cy.contains('Start Quiz').click();
  cy.wait(1000); // Wait for quiz initialization
});

// Answer a quiz question by signal name
Cypress.Commands.add('answerQuestion', (answer: string) => {
  cy.get('.answer-button').contains(answer).click();
  cy.wait(500); // Wait for answer processing
});

// Submit results to leaderboard
Cypress.Commands.add('submitToLeaderboard', (username: string) => {
  cy.get('input[placeholder*="username"], input[name="username"]').clear().type(username);
  cy.contains('button', /submit|save/i).click();
});

// Clear Firestore emulator data
Cypress.Commands.add('clearFirestoreData', () => {
  const emulatorHost = Cypress.env('FIRESTORE_EMULATOR_HOST');
  if (emulatorHost) {
    const [host, port] = emulatorHost.split(':');
    cy.request('DELETE', `http://${host}:${port}/emulator/v1/projects/signalsmaster-40d2f/databases/(default)/documents`);
  }
});

// Seed Firestore emulator with test data
Cypress.Commands.add('seedFirestoreData', () => {
  // Example leaderboard entries
  const testData = [
    {
      username: 'TestUser1',
      score: 95,
      timeSpent: 120,
      difficulty: 'all-flags',
      questionsCount: 10,
      timestamp: new Date().toISOString(),
    },
    {
      username: 'TestUser2',
      score: 85,
      timeSpent: 150,
      difficulty: 'all-flags',
      questionsCount: 10,
      timestamp: new Date().toISOString(),
    },
  ];

  // In a real implementation, you would use Firebase Admin SDK
  // or REST API to seed data. This is a placeholder.
  cy.window().then((win) => {
    // Access your app's Firebase instance and add data
    // win.firebase.firestore().collection('competitiveResults').add(...)
    cy.log('Seeding test data to Firestore emulator');
  });
});

// Wait for Ionic components to be fully initialized
Cypress.Commands.add('waitForIonic', () => {
  cy.window().should('have.property', 'Ionic');
  cy.get('ion-app').should('be.visible');
  cy.wait(500); // Additional buffer for Ionic animations
});

// Export to make TypeScript happy
export {};

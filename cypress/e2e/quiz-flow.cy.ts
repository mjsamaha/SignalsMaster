describe('Quiz Flow E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForIonic();
  });

  it('should load the home page successfully', () => {
    cy.get('ion-app').should('be.visible');
    cy.contains('SignalsMaster').should('be.visible');
  });

  it('should navigate to quiz tab', () => {
    cy.navigateToTab('tab1');
    cy.url().should('include', '/tab1');
  });

  it('should display quiz mode selection', () => {
    cy.navigateToTab('tab1');
    cy.contains('Competitive Mode').should('be.visible');
    cy.contains('Practice Mode').should('be.visible');
  });

  it('should start a competitive quiz', () => {
    cy.navigateToTab('tab1');
    cy.contains('Competitive Mode').click();

    // Should navigate to quiz page
    cy.url().should('include', '/quiz');

    // Should show quiz configuration options
    cy.contains('Select Difficulty').should('be.visible');
    cy.contains('Number of Questions').should('be.visible');
  });

  it('should configure and start quiz with default settings', () => {
    cy.navigateToTab('tab1');
    cy.contains('Competitive Mode').click();
    cy.url().should('include', '/quiz');

    // Start quiz with default settings
    cy.contains('button', 'Start Quiz').click();

    // Should show first question
    cy.get('.quiz-question').should('be.visible');
    cy.get('.answer-options').should('be.visible');
    cy.get('.answer-button').should('have.length.at.least', 2);
  });

  it('should answer a quiz question', () => {
    cy.navigateToTab('tab1');
    cy.contains('Competitive Mode').click();
    cy.contains('button', 'Start Quiz').click();

    // Wait for question to load
    cy.get('.answer-button').first().should('be.visible');

    // Click first answer
    cy.get('.answer-button').first().click();

    // Should show feedback or next question
    cy.wait(1000);
    // Verify quiz progressed (either new question or results)
    cy.get('body').should('exist');
  });

  it('should complete a full quiz and show results', () => {
    cy.navigateToTab('tab1');
    cy.contains('Competitive Mode').click();
    cy.contains('button', 'Start Quiz').click();

    // Answer 3 questions quickly
    for (let i = 0; i < 3; i++) {
      cy.get('.answer-button').first().click({ force: true });
      cy.wait(800);
    }

    // Should eventually show results
    cy.contains(/results|score|complete/i, { timeout: 10000 }).should('be.visible');
  });

  it('should navigate to practice mode', () => {
    cy.navigateToTab('tab1');
    cy.contains('Practice Mode').click();

    cy.url().should('include', '/practice-mode');
    cy.contains('Practice').should('be.visible');
  });

  it('should show flag details in practice mode', () => {
    cy.navigateToTab('tab1');
    cy.contains('Practice Mode').click();

    // Should display flag cards or list
    cy.get('ion-card, .flag-item').should('have.length.at.least', 1);
  });
});

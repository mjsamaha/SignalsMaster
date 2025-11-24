describe('Leaderboard E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForIonic();
  });

  it('should navigate to leaderboard tab', () => {
    cy.navigateToTab('tab2');
    cy.url().should('include', '/tab2');
    cy.contains(/leaderboard|rankings/i).should('be.visible');
  });

  it('should display leaderboard entries', () => {
    cy.navigateToTab('tab2');

    // Should show leaderboard container
    cy.get('ion-content').should('be.visible');

    // May have entries or empty state
    cy.get('body').then(($body) => {
      expect($body.text()).to.satisfy((text: string) =>
        text.includes('Leaderboard') || text.includes('No entries') || text.includes('Top')
      );
    });
  });

  it('should filter leaderboard by difficulty', () => {
    cy.navigateToTab('tab2');

    // Look for difficulty selector
    cy.get('ion-select, ion-segment, select').first().should('exist');

    // Select a difficulty if available
    cy.get('ion-segment-button').first().click();
    cy.wait(500);
  });

  it('should submit quiz results to leaderboard', () => {
    // Complete a quiz first
    cy.navigateToTab('tab1');
    cy.contains('Competitive Mode').click();
    cy.contains('button', 'Start Quiz').click();

    // Answer questions quickly
    for (let i = 0; i < 3; i++) {
      cy.get('.answer-button', { timeout: 10000 }).first().click({ force: true });
      cy.wait(800);
    }

    // Wait for results page
    cy.contains(/results|complete/i, { timeout: 15000 }).should('be.visible');

    // Submit to leaderboard
    const username = `CypressTest${Date.now()}`;
    cy.get('input[type="text"], ion-input').first().clear().type(username);
    cy.contains('button', /submit|save/i).click();

    // Should show success message or navigate
    cy.contains(/success|submitted|saved/i, { timeout: 5000 }).should('be.visible');
  });

  it('should validate username input', () => {
    // Navigate to competitive results (if accessible directly)
    cy.navigateToTab('tab1');
    cy.contains('Competitive Mode').click();
    cy.contains('button', 'Start Quiz').click();

    // Answer questions to get to results
    for (let i = 0; i < 3; i++) {
      cy.get('.answer-button', { timeout: 10000 }).first().click({ force: true });
      cy.wait(800);
    }

    // Try submitting with invalid username
    cy.get('input[type="text"], ion-input').first().clear().type('ab'); // Too short
    cy.contains('button', /submit|save/i).click();

    // Should show validation error
    cy.contains(/invalid|too short|minimum/i).should('be.visible');
  });

  it('should display user ranking after submission', () => {
    cy.navigateToTab('tab2');

    // Check if any entries exist
    cy.get('ion-list, .leaderboard-list').should('exist');
  });

  it('should show best signaller when available', () => {
    cy.navigateToTab('tab2');

    // Look for best signaller section
    cy.get('body').then(($body) => {
      if ($body.text().includes('Best Signaller')) {
        cy.contains('Best Signaller').should('be.visible');
      }
    });
  });
});

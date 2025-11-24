describe('Navigation E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForIonic();
  });

  it('should load the app and display tabs', () => {
    cy.get('ion-tab-bar').should('be.visible');
    cy.get('ion-tab-button').should('have.length', 3);
  });

  it('should navigate between all tabs', () => {
    // Tab 1 - Quiz/Home
    cy.navigateToTab('tab1');
    cy.url().should('include', '/tab1');

    // Tab 2 - Leaderboard
    cy.navigateToTab('tab2');
    cy.url().should('include', '/tab2');

    // Tab 3 - About/Info
    cy.navigateToTab('tab3');
    cy.url().should('include', '/tab3');
  });

  it('should maintain tab state when switching tabs', () => {
    // Go to tab1, then tab2, then back to tab1
    cy.navigateToTab('tab1');
    cy.navigateToTab('tab2');
    cy.navigateToTab('tab1');

    // Should still be on tab1
    cy.url().should('include', '/tab1');
  });

  it('should display correct tab highlights', () => {
    cy.navigateToTab('tab1');
    cy.get('ion-tab-button[tab="tab1"]').should('have.class', 'tab-selected');

    cy.navigateToTab('tab2');
    cy.get('ion-tab-button[tab="tab2"]').should('have.class', 'tab-selected');
  });

  it('should navigate to quiz page from home', () => {
    cy.navigateToTab('tab1');
    cy.contains('Competitive Mode').click();
    cy.url().should('include', '/quiz');
  });

  it('should navigate to practice mode from home', () => {
    cy.navigateToTab('tab1');
    cy.contains('Practice Mode').click();
    cy.url().should('include', '/practice');
  });

  it('should use browser back button correctly', () => {
    cy.navigateToTab('tab1');
    cy.contains('Competitive Mode').click();
    cy.url().should('include', '/quiz');

    cy.go('back');
    cy.url().should('include', '/tab1');
  });

  it('should handle direct URL navigation', () => {
    cy.visit('/tab2');
    cy.url().should('include', '/tab2');
    cy.get('ion-tab-button[tab="tab2"]').should('have.class', 'tab-selected');
  });

  it('should redirect invalid routes to home', () => {
    cy.visit('/invalid-route-12345');
    // Should redirect to default route
    cy.url().should('match', /\/(tab1|tabs|$)/);
  });
});

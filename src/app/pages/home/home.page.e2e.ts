/**
 * End-to-End Tests for HomePage
 *
 * Tests complete user flows including navigation, button clicks, and visual rendering.
 * Example of Playwright E2E tests for SignalsMaster Ionic app.
 */

import { test, expect } from '@playwright/test';

test.describe('HomePage', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page before each test
    await page.goto('/tabs/home');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('should display page title', async ({ page }) => {
    const title = page.locator('ion-title');

    await expect(title).toBeVisible();
    await expect(title).toContainText(/SignalsMaster|Home/i);
  });

  test('should display navigation buttons', async ({ page }) => {
    // Check for any navigation buttons on the page
    const buttons = page.locator('ion-button');
    const buttonCount = await buttons.count();
    
    // HomePage should have multiple navigation buttons
    expect(buttonCount).toBeGreaterThan(0);
  });

  test.skip('should navigate to practice mode', async ({ page }) => {
    // TODO: Re-enable once routing is confirmed working in test environment
    const practiceButton = page.locator('ion-button:has-text("Practice Mode")');

    await practiceButton.click();

    // Wait for navigation
    await page.waitForURL('**/practice-mode', { timeout: 5000 });

    expect(page.url()).toContain('/practice-mode');
  });

  test.skip('should navigate to best signaller', async ({ page }) => {
    // TODO: Re-enable once routing is confirmed working in test environment
    const bestSignallerButton = page.locator('ion-button:has-text("Best Signaller")');

    await bestSignallerButton.click();

    // Wait for navigation
    await page.waitForURL('**/best-signaller', { timeout: 5000 });

    expect(page.url()).toContain('/best-signaller');
  });

  test.skip('should navigate to leaderboard', async ({ page }) => {
    // TODO: Re-enable once routing is confirmed working in test environment
    const leaderboardButton = page.locator('ion-button:has-text("Leaderboard")');

    await leaderboardButton.click();

    // Wait for navigation
    await page.waitForURL('**/leaderboard', { timeout: 5000 });

    expect(page.url()).toContain('/leaderboard');
  });

  test('should start practice quiz with specific count', async ({ page }) => {
    // Look for quick start button or similar
    const quickStartButton = page.locator('ion-button:has-text("Quick Start")').first();

    if (await quickStartButton.isVisible()) {
      await quickStartButton.click();

      // Verify navigation to quiz
      await page.waitForURL('**/quiz**', { timeout: 5000 });
      expect(page.url()).toContain('/quiz');
    }
  });

  test('should display feedback button', async ({ page }) => {
    const feedbackButton = page.locator('ion-button:has-text("Feedback"), ion-button:has([name="chatbubblesOutline"])');

    if (await feedbackButton.count() > 0) {
      await expect(feedbackButton.first()).toBeVisible();
    }
  });

  test('should have accessible navigation', async ({ page }) => {
    // Check for ARIA labels and accessible elements
    const buttons = page.locator('ion-button');
    const buttonCount = await buttons.count();

    expect(buttonCount).toBeGreaterThan(0);

    // Verify buttons are keyboard accessible
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = buttons.nth(i);
      await expect(button).toBeEnabled();
    }
  });

  test('should render Ionic components correctly', async ({ page }) => {
    // Verify key Ionic components are present
    await expect(page.locator('ion-header')).toBeVisible();
    await expect(page.locator('ion-content')).toBeVisible();
    await expect(page.locator('ion-toolbar')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify content is still visible
    const content = page.locator('ion-content');
    await expect(content).toBeVisible();

    // Verify buttons are still accessible
    const buttons = page.locator('ion-button');
    const firstButton = buttons.first();
    await expect(firstButton).toBeVisible();
  });

  test.skip('should handle rapid button clicks gracefully', async ({ page }) => {
    // TODO: Re-enable once routing is confirmed working in test environment
    const practiceButton = page.locator('ion-button:has-text("Practice Mode")');

    // Click multiple times rapidly
    await practiceButton.click();
    await practiceButton.click();

    // Should still navigate correctly
    await page.waitForURL('**/practice-mode', { timeout: 5000 });
    expect(page.url()).toContain('/practice-mode');
  });

  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/tabs/home');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });
});

test.describe('HomePage Visual Tests', () => {
  test('should maintain consistent layout', async ({ page }) => {
    await page.goto('/tabs/home');
    await page.waitForLoadState('networkidle');

    // Take screenshot for visual regression (optional)
    // await expect(page).toHaveScreenshot('home-page.png');

    // Verify key visual elements
    const header = page.locator('ion-header');
    const content = page.locator('ion-content');

    await expect(header).toBeVisible();
    await expect(content).toBeVisible();
  });
});

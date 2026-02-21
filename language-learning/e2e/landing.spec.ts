import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display landing page content when not authenticated', async ({ page }) => {
    await page.goto('/');
    
    // Check for landing page elements
    // Note: Adjust selectors based on your actual landing page content
    await expect(page).toHaveTitle(/Language Learners/i);
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check if header/navigation is present
    // Adjust selector based on your Header component
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();
  });
});

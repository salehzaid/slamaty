import { test, expect } from '@playwright/test';

test('evaluation with failing items redirects to capa dashboard and allows creating CAPA (permitted user)', async ({ page }) => {
  // Assumes dev server running at baseURL
  await page.goto('/login');

  // Perform login as quality_manager test user (needs to exist in env)
  await page.fill('input[name="email"]', 'testqm@local');
  await page.fill('input[name="password"]', 'test123');
  await page.click('button[type="submit"]');

  // Navigate to an evaluation page for a known round (test data required)
  await page.goto('/rounds/evaluate/1');

  // Simulate marking an item as not_applied
  await page.click('button[data-test="mark-not-applied-0"]');
  await page.click('button[data-test="submit-evaluation"]');

  // Expect redirect to capa-dashboard
  await expect(page).toHaveURL(/\/capa-dashboard/);

  // Expect failing items panel visible
  await expect(page.locator('text=عناصر غير مكتملة من التقييم')).toBeVisible();

  // If user has permission, create CAPA for first item
  const createBtn = page.locator('button', { hasText: 'إنشاء خطة لهذا العنصر' }).first();
  await expect(createBtn).toBeVisible();
  await createBtn.click();

  // Submit the CAPA form (fields depend on app form)
  await page.fill('input[name="title"]', 'E2E Test CAPA');
  await page.fill('textarea[name="description"]', 'Auto-created by E2E test');
  await page.click('button[type="submit"]');

  // Expect success toast or new CAPA in list
  await expect(page.locator('text=تم إنشاء الخطة التصحيحية بنجاح')).toBeVisible({ timeout: 5000 });
});



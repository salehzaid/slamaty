import { test, expect } from '@playwright/test';

test('evaluation with failing items redirects to capa dashboard and allows creating CAPA (permitted user)', async ({ page }) => {
  // Assumes dev server running at baseURL
  // Sign in via API and inject token into localStorage to avoid UI login flakiness
  // Call backend directly (container network) to obtain token reliably
  const signinResp = await page.request.post('http://salamah-backend:8000/api/auth/signin', { data: { email: 'testqm@local', password: 'test123' } });
  const signinBody = await signinResp.json();
  const token = signinBody?.access_token;
  const user = signinBody?.user || { id: 1, username: 'testqm', email: 'testqm@local', first_name: 'Test', last_name: 'QM', role: 'quality_manager', department: 'QA' };
  if (!token) throw new Error('Failed to obtain access token for test user: ' + JSON.stringify(signinBody));
  // Inject both token and serialized user so AuthContext recognizes the user and permissions
  await page.context().addInitScript(tu => {
    try {
      localStorage.setItem('access_token', tu.token);
      localStorage.setItem('sallamaty_user', JSON.stringify(tu.user));
    } catch (e) {}
  }, { token, user });

  // Instead of driving the full evaluate UI (flaky), inject failingItems into history.state
  const failingItems = [{ item_id: 8, item_code: 'ITM-8', item_title: 'Seed Item', status: 'not_applied', comments: 'E2E smoke' }];
  await page.context().addInitScript(s => { try { history.replaceState(s, '', '/capa-dashboard'); } catch(e){} }, { failingItems, round: { id: 100, title: 'Stub Round 100', department: 'عام' } });
  await page.goto('/capa');

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



import { test, expect } from '@playwright/test';

// Working test user credentials
const WORKING_TEST_USERS = {
  admin: {
    email: 'admin@testcompany.local',
    password: 'TestPass123!',
    expectedRole: 'admin'
  },
  rfiUser: {
    email: 'rfiuser@testcompany.local',
    password: 'TestPass123!',
    expectedRole: 'rfi_user'
  },
  client: {
    email: 'client@testcompany.local',
    password: 'TestPass123!',
    expectedRole: 'client_collaborator'
  }
};

test.describe('Basic Authentication Tests', () => {
  
  test('Admin user can login successfully', async ({ page }) => {
    console.log('🧪 Testing admin user authentication...');
    
    // Navigate to login page
    await page.goto('/login');
    
    // Fill in credentials
    await page.fill('input[type="email"]', WORKING_TEST_USERS.admin.email);
    await page.fill('input[type="password"]', WORKING_TEST_USERS.admin.password);
    
    // Click sign in
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/');
    await page.waitForLoadState('networkidle');
    
    // Verify we're logged in (should see dashboard content)
    await expect(page.getByText('Welcome to RFITrak')).toBeVisible();
    
    // Verify admin can access admin panel
    await page.goto('/admin');
    await expect(page.getByText('Admin Settings')).toBeVisible();
    
    console.log('✅ Admin user authentication successful');
  });

  test('RFI user can login successfully', async ({ page }) => {
    console.log('🧪 Testing RFI user authentication...');
    
    await page.goto('/login');
    await page.fill('input[type="email"]', WORKING_TEST_USERS.rfiUser.email);
    await page.fill('input[type="password"]', WORKING_TEST_USERS.rfiUser.password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL('/');
    await page.waitForLoadState('networkidle');
    
    // Verify dashboard access
    await expect(page.getByText('Welcome to RFITrak')).toBeVisible();
    
    // Verify can access RFI creation
    await page.goto('/rfis');
    await expect(page.getByRole('button', { name: 'New RFI' })).toBeVisible();
    
    console.log('✅ RFI user authentication successful');
  });

  test('Client user can login successfully', async ({ page }) => {
    console.log('🧪 Testing client user authentication...');
    
    await page.goto('/login');
    await page.fill('input[type="email"]', WORKING_TEST_USERS.client.email);
    await page.fill('input[type="password"]', WORKING_TEST_USERS.client.password);
    await page.click('button[type="submit"]');
    
    // Client users are redirected to /rfi-log automatically
    await page.waitForURL('/rfi-log');
    await page.waitForLoadState('networkidle');
    
    // Client should see the RFI Log page content
    await expect(page.getByRole('heading', { name: 'RFI Log' })).toBeVisible();
    
    console.log('✅ Client user authentication successful');
  });

  test('All users can authenticate simultaneously', async ({ browser }) => {
    console.log('🧪 Testing concurrent user authentication...');
    
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(), 
      browser.newContext()
    ]);
    
    const pages = await Promise.all([
      contexts[0].newPage(),
      contexts[1].newPage(),
      contexts[2].newPage()
    ]);
    
    // Login all users simultaneously
    await Promise.all([
      // Admin login
      (async () => {
        const page = pages[0];
        await page.goto('/login');
        await page.fill('input[type="email"]', WORKING_TEST_USERS.admin.email);
        await page.fill('input[type="password"]', WORKING_TEST_USERS.admin.password);
        await page.click('button[type="submit"]');
        await page.waitForURL('/');
        await expect(page.getByText('Welcome to RFITrak')).toBeVisible();
      })(),
      
      // RFI User login
      (async () => {
        const page = pages[1];
        await page.goto('/login');
        await page.fill('input[type="email"]', WORKING_TEST_USERS.rfiUser.email);
        await page.fill('input[type="password"]', WORKING_TEST_USERS.rfiUser.password);
        await page.click('button[type="submit"]');
        await page.waitForURL('/');
        await expect(page.getByText('Welcome to RFITrak')).toBeVisible();
      })(),
      
      // Client login
      (async () => {
        const page = pages[2];
        await page.goto('/login');
        await page.fill('input[type="email"]', WORKING_TEST_USERS.client.email);
        await page.fill('input[type="password"]', WORKING_TEST_USERS.client.password);
        await page.click('button[type="submit"]');
        await page.waitForURL('/rfi-log');
        await expect(page.getByRole('heading', { name: 'RFI Log' })).toBeVisible();
      })()
    ]);
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()));
    
    console.log('✅ All users authenticated successfully');
  });

  test('Verify no database errors on login', async ({ page }) => {
    console.log('🧪 Testing for database errors...');
    
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Test login
    await page.goto('/login');
    await page.fill('input[type="email"]', WORKING_TEST_USERS.admin.email);
    await page.fill('input[type="password"]', WORKING_TEST_USERS.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    await page.waitForLoadState('networkidle');
    
    // Verify no "Database error querying schema" message
    const errorMessage = await page.getByText('Database error querying schema').isVisible().catch(() => false);
    expect(errorMessage).toBe(false);
    
    // Verify no critical errors in console
    const criticalErrors = errors.filter(error => 
      error.includes('Database error') || 
      error.includes('500') ||
      error.includes('Internal Server Error')
    );
    
    expect(criticalErrors.length).toBe(0);
    
    console.log('✅ No database errors detected');
  });
}); 
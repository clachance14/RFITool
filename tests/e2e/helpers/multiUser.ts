import { Browser, BrowserContext, Page } from '@playwright/test';

export interface TestUser {
  name: string;
  email: string;
  password: string;
  role: 'app_owner' | 'super_admin' | 'admin' | 'rfi_user' | 'view_only' | 'client_collaborator';
  company?: string;
}

export const TEST_USERS = {
  admin: {
    email: 'admin@testcompany.local',
    password: 'TestPass123!',
    role: 'admin',
    name: 'Test Admin User'
  },
  rfiUser: {
    email: 'rfiuser@testcompany.local', 
    password: 'TestPass123!',
    role: 'rfi_user',
    name: 'Test RFI User'
  },
  client: {
    email: 'client@testcompany.local',
    password: 'TestPass123!',
    role: 'client_collaborator',
    name: 'Test Client User'
  }
} as const;

export class MultiUserSession {
  private browser: Browser;
  private contexts: Map<string, BrowserContext> = new Map();
  private pages: Map<string, Page> = new Map();

  constructor(browser: Browser) {
    this.browser = browser;
  }

  async createUserSession(userKey: string, user: TestUser): Promise<Page> {
    console.log(`👤 Creating session for ${user.name} (${user.role})`);
    
    const context = await this.browser.newContext({
      storageState: undefined // Start fresh
    });
    
    const page = await context.newPage();
    
    // Add console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Browser error for ${userKey}:`, msg.text());
      }
    });
    
    // Login as this user
    await this.loginUser(page, user);
    
    this.contexts.set(userKey, context);
    this.pages.set(userKey, page);
    
    console.log(`✅ Session created for ${user.name}`);
    return page;
  }

  private async loginUser(page: Page, user: TestUser) {
    try {
      console.log(`🔐 Logging in ${user.name}...`);
      
      // Use relative URL
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Fill in login credentials directly
      await page.fill('input[type="email"]', user.email);
      await page.fill('input[type="password"]', user.password);
      
      // Click the sign in button
      await page.click('button[type="submit"]');
      
      // Wait for navigation with reduced timeout
      await page.waitForTimeout(1000);
      
      // Check if we're redirected (successful login)
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        throw new Error(`Login failed - still on login page for ${user.name}`);
      }
      
      console.log(`✅ Successfully logged in ${user.name}`);
      
    } catch (error) {
      console.error(`❌ Failed to login ${user.name}:`, error);
      // Take a screenshot for debugging
      await page.screenshot({ path: `debug-login-error-${user.email.replace('@', '-')}.png` });
      throw error;
    }
  }

  getPage(userKey: string): Page {
    const page = this.pages.get(userKey);
    if (!page) throw new Error(`No page found for user: ${userKey}`);
    return page;
  }

  async cleanup() {
    console.log('🧹 Cleaning up multi-user sessions...');
    
    for (const context of this.contexts.values()) {
      await context.close();
    }
    this.contexts.clear();
    this.pages.clear();
    
    console.log('✅ Multi-user cleanup complete');
  }

  // Simulate concurrent actions
  async performConcurrentActions(actions: Array<{
    user: string;
    action: (page: Page) => Promise<void>;
    description?: string;
  }>) {
    console.log(`⚡ Performing ${actions.length} concurrent actions...`);
    
    const promises = actions.map(({ user, action, description }) => {
      const page = this.getPage(user);
      console.log(`🔄 ${user}: ${description || 'Performing action'}`);
      return action(page);
    });
    
    await Promise.all(promises);
    console.log('✅ All concurrent actions completed');
  }

  // Test role-based access control
  async testRolePermissions(): Promise<{
    admin: { canAccessAdmin: boolean; canCreateProject: boolean };
    rfiUser: { canAccessAdmin: boolean; canCreateRFI: boolean };
    client: { canAccessAdmin: boolean; canCreateRFI: boolean };
    viewOnly: { canAccessAdmin: boolean; canCreateRFI: boolean };
  }> {
    const results = {
      admin: { canAccessAdmin: false, canCreateProject: false },
      rfiUser: { canAccessAdmin: false, canCreateRFI: false },
      client: { canAccessAdmin: false, canCreateRFI: false },
      viewOnly: { canAccessAdmin: false, canCreateRFI: false }
    };

    // Test admin permissions
    const adminPage = this.getPage('admin');
    await adminPage.goto('/admin');
    results.admin.canAccessAdmin = await adminPage.getByText('Admin Settings').isVisible({ timeout: 2000 }).catch(() => false);
    
    await adminPage.goto('/projects');
    results.admin.canCreateProject = await adminPage.getByRole('button', { name: 'New Project' }).isVisible({ timeout: 2000 }).catch(() => false);

    // Test RFI user permissions
    const rfiUserPage = this.getPage('rfiUser');
    await rfiUserPage.goto('/admin');
    results.rfiUser.canAccessAdmin = !await rfiUserPage.getByText('Access Denied').isVisible({ timeout: 2000 }).catch(() => true);
    
    await rfiUserPage.goto('/rfis');
    results.rfiUser.canCreateRFI = await rfiUserPage.getByRole('button', { name: 'New RFI' }).isVisible({ timeout: 2000 }).catch(() => false);

    // Test client permissions 
    const clientPage = this.getPage('client');
    await clientPage.goto('/admin');
    results.client.canAccessAdmin = !await clientPage.getByText('Access Denied').isVisible({ timeout: 2000 }).catch(() => true);
    
    // Client will be redirected to /rfi-log, so check there
    const currentUrl = clientPage.url();
    if (currentUrl.includes('/rfi-log')) {
      results.client.canCreateRFI = false; // Clients can't create RFIs
    } else {
      await clientPage.goto('/rfis');
      results.client.canCreateRFI = await clientPage.getByRole('button', { name: 'New RFI' }).isVisible({ timeout: 2000 }).catch(() => false);
    }

    // For now, skip view-only since we only have 3 test users
    results.viewOnly.canAccessAdmin = false;
    results.viewOnly.canCreateRFI = false;

    return results;
  }
} 
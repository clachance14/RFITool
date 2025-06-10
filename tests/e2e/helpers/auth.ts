import { Page, expect } from '@playwright/test';

export const TEST_USER = {
  email: 'clachance14@hotmail.com', // Your existing user
  password: 'One!663579', // Your actual password
  name: 'Cory LaChance',
  company: 'ICS, Inc.'
};

export async function loginUser(page: Page, userCredentials = TEST_USER) {
  // 1. Navigate to the homepage
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  console.log('Page loaded');
  
  // Check if we're already logged in by looking for user name
  const hasUserName = await page.getByText(userCredentials.name).isVisible().catch(() => false);
  if (hasUserName) {
    console.log('User already logged in');
    return;
  }
  
  // 2. Find and click the button with the text "Sign in here"
  console.log('Clicking sign in button...');
  await page.getByText('Sign in here').click();
  
  // 3. Wait for the modal to appear by asserting that an element with the accessibility role of 'dialog' is visible
  console.log('Waiting for login modal...');
  await expect(page.getByRole('dialog')).toBeVisible();
  
  // 4. Within that dialog, find the heading "Sign In" to confirm the correct form is showing
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  
  // 5. Find the input fields for "Email Address" and "Password" and fill them with the user's credentials
  console.log('Filling login form...');
  await page.getByLabel('Email Address').fill(userCredentials.email);
  await page.getByLabel('Password').fill(userCredentials.password);
  
  // 6. Find the submit button within the modal (which also has the text "Sign In") and click it
  console.log('Submitting login...');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  
  // 7. After a successful login, assert that the modal disappears from the page
  console.log('Waiting for modal to disappear...');
  await expect(page.getByRole('dialog')).toBeHidden();
  
  // Verify we're logged in by checking for user name in header
  console.log('Verifying login...');
  await expect(page.getByText(userCredentials.name)).toBeVisible({ timeout: 10000 });
  console.log('Login successful!');
}

export async function logout(page: Page) {
  try {
    // Click sign out button in header
    await page.getByRole('button', { name: 'Sign Out' }).click();
    
    // Wait for redirect to home page
    await page.waitForURL('/', { timeout: 10000 });
  } catch (error) {
    console.log('Logout failed or user already logged out:', error);
    // Navigate to home page as fallback
    await page.goto('/');
  }
} 
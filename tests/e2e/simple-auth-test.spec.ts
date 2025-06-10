import { test, expect } from '@playwright/test';

test('Simple modal debug test', async ({ page }) => {
  // Capture console logs and errors
  const logs: string[] = [];
  const errors: string[] = [];
  
  page.on('console', msg => {
    logs.push(`CONSOLE ${msg.type()}: ${msg.text()}`);
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}`);
    console.log(`PAGE ERROR: ${error.message}`);
  });
  
  // Go to home page
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  console.log('✅ Page loaded');
  
  // Wait for React to be ready
  await page.waitForTimeout(2000);
  
  // Take a screenshot of the initial state
  await page.screenshot({ path: 'debug-1-homepage.png' });
  
  // Check if the sign in link exists
  const signInLink = page.getByText('Already have an account? Sign in here');
  const isSignInLinkVisible = await signInLink.isVisible();
  console.log('✅ Sign in link visible:', isSignInLinkVisible);
  
  if (!isSignInLinkVisible) {
    const pageText = await page.textContent('body');
    console.log('Page text:', pageText?.substring(0, 500));
    throw new Error('Sign in link not found');
  }
  
  // Check if it's actually a button (clickable)
  const signInButton = page.locator('button:has-text("Sign in here")');
  const isSignInButton = await signInButton.isVisible();
  console.log('✅ Sign in button (if button element):', isSignInButton);
  
  // Check for any overlays that might be blocking clicks
  console.log('Checking for overlays...');
  const overlays = await page.locator('.fixed, .absolute, [style*="position: fixed"], [style*="position: absolute"]').all();
  console.log('✅ Found overlays:', overlays.length);
  
  // Try clicking with scroll to ensure visibility
  console.log('Scrolling to sign in button...');
  await signInButton.scrollIntoViewIfNeeded();
  
  // Wait for any animations or state changes
  await page.waitForTimeout(500);
  
  // Log the bounding box to see if it's clickable
  const boundingBox = await signInButton.boundingBox();
  console.log('✅ Sign in button bounding box:', boundingBox);
  
  // Try multiple clicking approaches
  console.log('Attempting click with different methods...');
  
  // Method 1: Normal click
  try {
    await signInButton.click({ timeout: 2000 });
    console.log('✅ Normal click succeeded');
  } catch (e) {
    console.log('❌ Normal click failed:', (e as Error).message);
  }
  
  await page.waitForTimeout(1000);
  
  // Method 2: Force click
  try {
    await signInButton.click({ force: true, timeout: 2000 });
    console.log('✅ Force click succeeded');
  } catch (e) {
    console.log('❌ Force click failed:', (e as Error).message);
  }
  
  await page.waitForTimeout(1000);
  
  // Method 3: JavaScript click
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const signInButton = buttons.find(button => button.textContent?.includes('Sign in here'));
    
    if (signInButton) {
      console.log('Found button via JS, dispatching click event...');
      
      // Try multiple event types
      signInButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      signInButton.dispatchEvent(new Event('click', { bubbles: true }));
      
      // Try direct click
      signInButton.click();
    } else {
      console.log('Button not found via JS querySelector');
    }
  });
  
  await page.waitForTimeout(2000);
  
  // Method 4: Click the text directly
  try {
    await page.getByText('Sign in here').click({ timeout: 2000 });
    console.log('✅ Text click succeeded');
  } catch (e) {
    console.log('❌ Text click failed:', (e as Error).message);
  }
  
  // Wait for modal and check for any errors
  await page.waitForTimeout(3000);
  
  // Log any console messages or errors
  console.log('Console logs count:', logs.length);
  console.log('Page errors count:', errors.length);
  
  // Take a screenshot after clicking
  await page.screenshot({ path: 'debug-2-after-click.png' });
  
  // Check for modal elements
  const modal = page.locator('.fixed');
  const isModalVisible = await modal.isVisible();
  console.log('✅ Modal visible:', isModalVisible);
  
  // Check for any element with "Sign In" text
  const signInTexts = await page.getByText('Sign In').all();
  console.log('✅ Elements with "Sign In" text found:', signInTexts.length);
  
  // Check if authMode state is set by looking for modal content
  try {
    await expect(page.getByRole('dialog')).toBeVisible();
    console.log('✅ Modal content (dialog role) visible: true');
  } catch (e) {
    console.log('✅ Modal content (dialog role) visible: false');
  }
  
  // Final state check
  if (isModalVisible) {
    console.log('🎉 MODAL APPEARED! Test successful');
    const modalHTML = await modal.innerHTML();
    console.log('Modal HTML:', modalHTML.substring(0, 500));
  } else {
    console.log('❌ Modal did not appear after all attempts');
    
    // Debug: Check if React is working at all
    const reactCheck = await page.evaluate(() => {
      return {
        hasReact: typeof window.React !== 'undefined',
        hasReactDOM: typeof window.ReactDOM !== 'undefined',
        buttonsCount: document.querySelectorAll('button').length,
        bodyClasses: document.body.className,
        currentURL: window.location.href
      };
    });
    console.log('React debug info:', reactCheck);
  }
}); 
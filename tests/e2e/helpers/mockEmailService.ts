import { Page } from '@playwright/test';

export interface MockEmail {
  id: string;
  to: string[];
  subject: string;
  body: string;
  template: string;
  timestamp: Date;
  rfiId?: string;
  status: 'sent' | 'delivered' | 'failed';
}

export class MockEmailService {
  private emails: MockEmail[] = [];
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async setup() {
    console.log('🔧 Setting up email interception...');
    
    // Intercept all email API calls
    await this.page.route('**/api/send-email', (route) => {
      const request = route.request();
      const postData = JSON.parse(request.postData() || '{}');
      
      const mockEmail: MockEmail = {
        id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        to: Array.isArray(postData.to) ? postData.to : [postData.to],
        subject: postData.subject || '',
        body: postData.body || '',
        template: postData.template || 'unknown',
        timestamp: new Date(),
        rfiId: postData.rfiId,
        status: 'sent'
      };

      this.emails.push(mockEmail);
      console.log(`📧 Intercepted email: ${mockEmail.template} to ${mockEmail.to.join(', ')}`);
      
      // Simulate successful email send
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, messageId: mockEmail.id })
      });
    });

    // Intercept client link generation
    await this.page.route('**/api/rfis/**/generate-link', (route) => {
      const mockLinkData = {
        secure_link: `https://localhost:3002/client/rfi/${Date.now()}`,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        link_id: `link_${Date.now()}`
      };

      console.log(`🔗 Generated mock client link: ${mockLinkData.secure_link}`);

      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: mockLinkData })
      });
    });

    // Intercept notification API calls
    await this.page.route('**/api/notifications/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });
  }

  getEmailsByTemplate(template: string): MockEmail[] {
    return this.emails.filter(email => email.template === template);
  }

  getEmailsByRFI(rfiId: string): MockEmail[] {
    return this.emails.filter(email => email.rfiId === rfiId);
  }

  getLatestEmail(): MockEmail | null {
    return this.emails.length > 0 ? this.emails[this.emails.length - 1] : null;
  }

  getAllEmails(): MockEmail[] {
    return [...this.emails];
  }

  clear() {
    this.emails = [];
    console.log('🧹 Cleared email history');
  }

  // Verify email sequences
  verifyEmailSequence(expectedSequence: Array<{template: string, subject?: string}>) {
    if (this.emails.length < expectedSequence.length) {
      throw new Error(`Expected ${expectedSequence.length} emails, got ${this.emails.length}`);
    }

    expectedSequence.forEach((expected, index) => {
      const email = this.emails[index];
      if (email.template !== expected.template) {
        throw new Error(`Email ${index}: expected template '${expected.template}', got '${email.template}'`);
      }
      if (expected.subject && !email.subject.includes(expected.subject)) {
        throw new Error(`Email ${index}: expected subject to contain '${expected.subject}', got '${email.subject}'`);
      }
    });
  }

  // Get email statistics
  getEmailStats(): {
    total: number;
    byTemplate: Record<string, number>;
    byRecipient: Record<string, number>;
  } {
    const byTemplate: Record<string, number> = {};
    const byRecipient: Record<string, number> = {};

    this.emails.forEach(email => {
      byTemplate[email.template] = (byTemplate[email.template] || 0) + 1;
      email.to.forEach(recipient => {
        byRecipient[recipient] = (byRecipient[recipient] || 0) + 1;
      });
    });

    return {
      total: this.emails.length,
      byTemplate,
      byRecipient
    };
  }
} 
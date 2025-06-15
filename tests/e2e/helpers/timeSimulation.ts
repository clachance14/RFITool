import { Page } from '@playwright/test';

export interface TimeEvent {
  day: number;
  week: number;
  description: string;
  action: (page: Page) => Promise<void>;
  user?: string;
}

export class ProjectTimelineSimulator {
  private events: TimeEvent[] = [];
  private currentDay = 1;
  private currentWeek = 1;
  private startDate: Date;

  constructor() {
    this.startDate = new Date();
  }

  addEvent(event: TimeEvent) {
    this.events.push(event);
  }

  addWeeklyEvents(weekEvents: Omit<TimeEvent, 'week'>[]) {
    weekEvents.forEach(event => {
      this.addEvent({ ...event, week: this.currentWeek });
    });
  }

  // Simulate passage of time for testing overdue scenarios
  async simulateTimePassage(days: number, page: Page) {
    console.log(`⏰ Simulating ${days} days passage...`);
    
    // Calculate the future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    // Mock the current date in the browser using a simple approach
    await page.addInitScript((dateStr) => {
      const mockDate = new Date(dateStr);
      
      // Override Date.now to return our mock time
      Date.now = () => mockDate.getTime();
      
      // Store original constructor
      const OriginalDate = Date;
      
      // Override the global Date constructor
      (globalThis as any).Date = function(...args: any[]): any {
        if (args.length === 0) {
          return new OriginalDate(mockDate);
        } else {
          return new OriginalDate(args[0], args[1] || 0, args[2] || 1, args[3] || 0, args[4] || 0, args[5] || 0, args[6] || 0);
        }
      };
      
      // Copy static methods
      (globalThis as any).Date.now = () => mockDate.getTime();
      (globalThis as any).Date.parse = OriginalDate.parse;
      (globalThis as any).Date.UTC = OriginalDate.UTC;
      
      console.log(`🕒 Browser time set to: ${mockDate.toISOString()}`);
    }, futureDate.toISOString());
    
    this.currentDay += days;
    if (this.currentDay > 7) {
      this.currentWeek += Math.floor(this.currentDay / 7);
      this.currentDay = this.currentDay % 7;
    }
    
    console.log(`📅 Now at Week ${this.currentWeek}, Day ${this.currentDay}`);
  }

  getCurrentWeek(): number {
    return this.currentWeek;
  }

  getCurrentDay(): number {
    return this.currentDay;
  }

  // Execute all events for current time period
  async executeCurrentEvents(page: Page): Promise<void> {
    const currentEvents = this.events.filter(
      event => event.week === this.currentWeek && event.day === this.currentDay
    );

    for (const event of currentEvents) {
      console.log(`📋 Week ${event.week}, Day ${event.day}: ${event.description}`);
      await event.action(page);
    }
  }

  // Reset time simulation
  async resetTime(page: Page) {
    console.log('🔄 Resetting time to current...');
    
    this.currentDay = 1;
    this.currentWeek = 1;
    this.startDate = new Date();
  }

  // Get simulated current date
  getSimulatedDate(): Date {
    const date = new Date(this.startDate);
    const totalDays = (this.currentWeek - 1) * 7 + (this.currentDay - 1);
    date.setDate(date.getDate() + totalDays);
    return date;
  }

  // Create a scenario timeline
  createProjectScenario(): TimeEvent[] {
    const scenario: TimeEvent[] = [
      // Week 1: Project kickoff
      {
        week: 1,
        day: 1,
        description: 'Project kickoff - Create initial RFIs',
        action: async (page) => {
          console.log('🚀 Project kickoff activities');
        }
      },
      // Week 2: Design phase RFIs
      {
        week: 2,
        day: 3,
        description: 'Design clarification RFIs',
        action: async (page) => {
          console.log('📐 Design phase activities');
        }
      },
      // Week 3: Field work begins
      {
        week: 3,
        day: 1,
        description: 'Field work RFIs created',
        action: async (page) => {
          console.log('🔨 Field work begins');
        }
      },
      // Week 4: Client responses due
      {
        week: 4,
        day: 5,
        description: 'Check for overdue responses',
        action: async (page) => {
          console.log('⏰ Checking overdue responses');
        }
      },
      // Week 8: Mid-project review
      {
        week: 8,
        day: 3,
        description: 'Mid-project RFI review',
        action: async (page) => {
          console.log('📊 Mid-project review');
        }
      },
      // Week 12: Project completion
      {
        week: 12,
        day: 7,
        description: 'Project completion - Close remaining RFIs',
        action: async (page) => {
          console.log('🏁 Project completion activities');
        }
      }
    ];

    this.events = scenario;
    return scenario;
  }

  // Test overdue logic
  async testOverdueScenarios(page: Page, rfiIds: string[]) {
    console.log('🕐 Testing overdue scenarios...');
    
    // Simulate 1 week passage
    await this.simulateTimePassage(7, page);
    
    // Check for RFIs that should now show as overdue
    await page.goto('/rfis');
    
    for (const rfiId of rfiIds) {
      const rfiCard = page.locator(`[data-testid="rfi-${rfiId}"]`);
      const isOverdue = await rfiCard.locator('.overdue-indicator').isVisible().catch(() => false);
      
      if (isOverdue) {
        console.log(`⚠️ RFI ${rfiId} correctly showing as overdue`);
      } else {
        console.log(`✅ RFI ${rfiId} not overdue yet`);
      }
    }
    
    // Simulate another week
    await this.simulateTimePassage(7, page);
    
    // Check again
    await page.reload();
    
    for (const rfiId of rfiIds) {
      const rfiCard = page.locator(`[data-testid="rfi-${rfiId}"]`);
      const isOverdue = await rfiCard.locator('.overdue-indicator').isVisible().catch(() => false);
      
      if (isOverdue) {
        console.log(`⚠️ RFI ${rfiId} showing as overdue after 2 weeks`);
      }
    }
  }

  // Get time statistics
  getTimeStats(): {
    currentWeek: number;
    currentDay: number;
    totalDaysSimulated: number;
    eventsScheduled: number;
    simulatedDate: string;
  } {
    const totalDaysSimulated = (this.currentWeek - 1) * 7 + (this.currentDay - 1);
    
    return {
      currentWeek: this.currentWeek,
      currentDay: this.currentDay,
      totalDaysSimulated,
      eventsScheduled: this.events.length,
      simulatedDate: this.getSimulatedDate().toISOString()
    };
  }
} 
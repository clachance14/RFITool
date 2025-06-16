import { Page, expect } from '@playwright/test';

export interface RFITestData {
  id: string;
  number: string;
  subject: string;
  status: 'draft' | 'active' | 'closed'; // Actual 3-value system
  stage?: 'sent_to_client' | 'awaiting_response' | 'response_received' | 'field_work_in_progress' | 'work_completed' | 'declined' | 'late_overdue' | 'revision_requested' | 'on_hold';
  urgency: 'urgent' | 'non-urgent'; // Actual urgency field
  createdAt: Date;
  responses: Array<{
    date: Date;
    respondent: string;
    content: string;
  }>;
  attachments: Array<{
    filename: string;
    size: number;
    type: string;
  }>;
  costImpact?: {
    labor_costs?: number;
    material_costs?: number;
    equipment_costs?: number;
    subcontractor_costs?: number;
    total?: number;
  };
  // Field work tracking
  work_started_date?: string;
  work_completed_date?: string;
  actual_labor_hours?: number;
  actual_total_cost?: number;
}

export interface AuditLogEntry {
  timestamp: Date;
  action: string;
  rfiId: string;
  user: string;
  userRole: string;
  oldState?: any;
  newState?: any;
  details?: string;
}

export class DataLifecycleTracker {
  private rfis: Map<string, RFITestData> = new Map();
  private auditLog: AuditLogEntry[] = [];

  trackRFICreation(rfiData: RFITestData, user: string, userRole: string = 'unknown') {
    this.rfis.set(rfiData.id, rfiData);
    this.auditLog.push({
      timestamp: new Date(),
      action: 'created',
      rfiId: rfiData.id,
      user,
      userRole,
      newState: rfiData,
      details: `Created RFI: ${rfiData.subject}`
    });
    console.log(`📝 Tracked RFI creation: ${rfiData.number} by ${user}`);
  }

  trackRFIUpdate(rfiId: string, updates: Partial<RFITestData>, user: string, userRole: string = 'unknown') {
    const oldState = this.rfis.get(rfiId);
    if (!oldState) throw new Error(`RFI ${rfiId} not found in tracker`);
    
    const newState = { ...oldState, ...updates };
    this.rfis.set(rfiId, newState);
    
    this.auditLog.push({
      timestamp: new Date(),
      action: 'updated',
      rfiId,
      user,
      userRole,
      oldState,
      newState,
      details: `Updated RFI: ${Object.keys(updates).join(', ')}`
    });
    console.log(`📝 Tracked RFI update: ${oldState.number} by ${user}`);
  }

  trackStatusTransition(rfiId: string, fromStatus: string, toStatus: string, user: string, userRole: string = 'unknown') {
    const rfi = this.rfis.get(rfiId);
    if (!rfi) throw new Error(`RFI ${rfiId} not found in tracker`);
    
    this.trackRFIUpdate(rfiId, { status: toStatus as any }, user, userRole);
    
    this.auditLog.push({
      timestamp: new Date(),
      action: 'status_transition',
      rfiId,
      user,
      userRole,
      oldState: { status: fromStatus },
      newState: { status: toStatus },
      details: `Status changed from ${fromStatus} to ${toStatus}`
    });
    console.log(`🔄 Tracked status transition: ${rfi.number} ${fromStatus} → ${toStatus}`);
  }

  trackStageTransition(rfiId: string, fromStage: string | undefined, toStage: string, user: string, userRole: string = 'unknown') {
    const rfi = this.rfis.get(rfiId);
    if (!rfi) throw new Error(`RFI ${rfiId} not found in tracker`);
    
    this.trackRFIUpdate(rfiId, { stage: toStage as any }, user, userRole);
    
    this.auditLog.push({
      timestamp: new Date(),
      action: 'stage_transition',
      rfiId,
      user,
      userRole,
      oldState: { stage: fromStage },
      newState: { stage: toStage },
      details: `Stage changed from ${fromStage || 'none'} to ${toStage}`
    });
    console.log(`🎯 Tracked stage transition: ${rfi.number} ${fromStage || 'none'} → ${toStage}`);
  }

  async verifyDataIntegrity(page: Page): Promise<void> {
    console.log('🔍 Verifying data integrity...');
    
    await page.goto('/rfis');
    await page.waitForLoadState('networkidle');
    
    for (const [id, rfi] of this.rfis) {
      const rfiElement = page.locator(`text="${rfi.number}"`).first();
      await expect(rfiElement).toBeVisible({ timeout: 5000 });
      console.log(`✅ Verified RFI: ${rfi.number}`);
    }
    
    console.log(`✅ Data integrity verified for ${this.rfis.size} RFIs`);
  }

  async verifyWorkflowTransitions(page: Page): Promise<void> {
    console.log('🔄 Verifying workflow transitions...');
    
    const statusTransitions = this.auditLog.filter(entry => entry.action === 'status_transition');
    const stageTransitions = this.auditLog.filter(entry => entry.action === 'stage_transition');
    
    console.log(`📊 Found ${statusTransitions.length} status transitions and ${stageTransitions.length} stage transitions`);
    
    // Verify each transition was valid
    for (const transition of statusTransitions) {
      const validTransitions = this.getValidStatusTransitions(transition.oldState.status);
      if (!validTransitions.includes(transition.newState.status)) {
        throw new Error(`Invalid status transition: ${transition.oldState.status} → ${transition.newState.status}`);
      }
    }
    
    console.log('✅ All workflow transitions are valid');
  }

  private getValidStatusTransitions(fromStatus: string): string[] {
    const transitions: Record<string, string[]> = {
      'draft': ['active'],
      'active': ['closed'],
      'closed': ['active'] // Can reopen
    };
    
    return transitions[fromStatus] || [];
  }

  generateCompletionReport(): {
    totalRFIs: number;
    byStatus: Record<string, number>;
    byUrgency: Record<string, number>;
    byStage: Record<string, number>;
    totalCostImpact: number;
    auditTrailLength: number;
    userActivity: Record<string, number>;
  } {
    const rfis = Array.from(this.rfis.values());
    
    const userActivity: Record<string, number> = {};
    this.auditLog.forEach(entry => {
      userActivity[entry.user] = (userActivity[entry.user] || 0) + 1;
    });
    
    return {
      totalRFIs: rfis.length,
      byStatus: this.groupBy(rfis, 'status'),
      byUrgency: this.groupBy(rfis, 'urgency'),
      byStage: this.groupBy(rfis.filter(r => r.stage), 'stage'),
      totalCostImpact: rfis.reduce((sum, rfi) => sum + (rfi.costImpact?.total || 0), 0),
      auditTrailLength: this.auditLog.length,
      userActivity
    };
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      groups[groupKey] = (groups[groupKey] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }

  getRFIById(id: string): RFITestData | undefined {
    return this.rfis.get(id);
  }

  getAllRFIs(): RFITestData[] {
    return Array.from(this.rfis.values());
  }

  getAuditLog(): AuditLogEntry[] {
    return [...this.auditLog];
  }

  getActionsByUser(user: string): AuditLogEntry[] {
    return this.auditLog.filter(entry => entry.user === user);
  }

  getActionsByRFI(rfiId: string): AuditLogEntry[] {
    return this.auditLog.filter(entry => entry.rfiId === rfiId);
  }

  // Export data for external analysis
  exportTestData(): {
    rfis: RFITestData[];
    auditLog: AuditLogEntry[];
    summary: {
      totalRFIs: number;
      byStatus: Record<string, number>;
      byUrgency: Record<string, number>;
      byStage: Record<string, number>;
      totalCostImpact: number;
      auditTrailLength: number;
      userActivity: Record<string, number>;
    };
  } {
    return {
      rfis: this.getAllRFIs(),
      auditLog: this.getAuditLog(),
      summary: this.generateCompletionReport()
    };
  }

  // Clear all data
  clear(): void {
    this.rfis.clear();
    this.auditLog = [];
    console.log('🧹 Data lifecycle tracker cleared');
  }
} 
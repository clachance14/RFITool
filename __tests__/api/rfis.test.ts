import { GET, POST } from '@/app/api/rfis/route';
import { GET as getRFI, PUT, DELETE } from '@/app/api/rfis/[id]/route';
import type { CreateRFIInput, UpdateRFIInput } from '@/lib/types';
import { createMockRequest, createMockContext } from '../utils/test-utils';

// Mock the database client
jest.mock('@/lib/db', () => ({
  db: {
    rfi: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('RFI API Routes', () => {
  const mockRFI = {
    id: '1',
    rfi_number: 'RFI-001',
    project_id: 'project-1',
    subject: 'Test RFI',
    description: 'Test Description',
    status: 'draft',
    priority: 'low',
    assigned_to: null,
    due_date: null,
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    response: null,
    response_date: null,
    attachments: [],
  };

  const mockCreateRFIInput: CreateRFIInput = {
    project_id: 'project-1',
    subject: 'New RFI',
    to_recipient: 'Test Recipient',
    company: 'Test Company',
    contract_number: 'CN-001',
    revision: '1',
    date_created: '2024-01-01',
    work_impact: 'None',
    cost_impact: 'None',
    schedule_impact: 'None',
    discipline: 'Electrical',
    system: 'Power',
    sub_system: 'Distribution',
    schedule_id: 'SCH-001',
    reason_for_rfi: 'Test Reason',
    test_package: 'TP-001',
    contractor_proposed_solution: 'Test Solution',
    associated_reference_documents: 'REF-001',
    requested_by: 'Test User',
    reviewed_by: 'Test Reviewer',
    urgency: 'non-urgent',
    status: 'draft',
  };

  const mockUpdateRFIInput: UpdateRFIInput = {
    subject: 'Updated Subject',
    status: 'sent',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/rfis', () => {
    it('returns all RFIs', async () => {
      const { db } = require('@/lib/db');
      db.rfi.findMany.mockResolvedValue([mockRFI]);

      const request = createMockRequest({});
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockRFI]);
    });

    it('filters RFIs by project_id', async () => {
      const { db } = require('@/lib/db');
      db.rfi.findMany.mockResolvedValue([mockRFI]);

      const request = createMockRequest({
        searchParams: { project_id: 'project-1' }
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockRFI]);
      expect(db.rfi.findMany).toHaveBeenCalledWith({
        where: { project_id: 'project-1' },
      });
    });

    it('handles database errors', async () => {
      const { db } = require('@/lib/db');
      db.rfi.findMany.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({});
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch RFIs');
    });
  });

  describe('POST /api/rfis', () => {
    it('creates a new RFI', async () => {
      const { db } = require('@/lib/db');
      db.rfi.create.mockResolvedValue(mockRFI);

      const request = createMockRequest({
        method: 'POST',
        body: mockCreateRFIInput
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockRFI);
    });

    it('validates input data', async () => {
      const invalidInput = { ...mockCreateRFIInput, project_id: undefined };

      const request = createMockRequest({
        method: 'POST',
        body: invalidInput
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('handles database errors', async () => {
      const { db } = require('@/lib/db');
      db.rfi.create.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'POST',
        body: mockCreateRFIInput
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create RFI');
    });
  });

  describe('GET /api/rfis/[id]', () => {
    it('returns a single RFI', async () => {
      const { db } = require('@/lib/db');
      db.rfi.findUnique.mockResolvedValue(mockRFI);

      const request = createMockRequest({});
      const context = createMockContext({ id: '1' });
      const response = await getRFI(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockRFI);
    });

    it('handles non-existent RFI', async () => {
      const { db } = require('@/lib/db');
      db.rfi.findUnique.mockResolvedValue(null);

      const request = createMockRequest({});
      const context = createMockContext({ id: '999' });
      const response = await getRFI(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('RFI not found');
    });
  });

  describe('PUT /api/rfis/[id]', () => {
    it('updates an RFI', async () => {
      const { db } = require('@/lib/db');
      const updatedRFI = { ...mockRFI, ...mockUpdateRFIInput };
      db.rfi.update.mockResolvedValue(updatedRFI);

      const request = createMockRequest({
        method: 'PUT',
        body: mockUpdateRFIInput
      });
      const context = createMockContext({ id: '1' });
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedRFI);
    });

    it('validates update data', async () => {
      const invalidUpdate = { status: 'invalid-status' };

      const request = createMockRequest({
        method: 'PUT',
        body: invalidUpdate
      });
      const context = createMockContext({ id: '1' });
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });

  describe('DELETE /api/rfis/[id]', () => {
    it('deletes an RFI', async () => {
      const { db } = require('@/lib/db');
      db.rfi.delete.mockResolvedValue(mockRFI);

      const request = createMockRequest({
        method: 'DELETE'
      });
      const context = createMockContext({ id: '1' });
      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockRFI);
    });

    it('handles non-existent RFI', async () => {
      const { db } = require('@/lib/db');
      db.rfi.delete.mockRejectedValue(new Error('Record not found'));

      const request = createMockRequest({
        method: 'DELETE'
      });
      const context = createMockContext({ id: '999' });
      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('RFI not found');
    });
  });
}); 
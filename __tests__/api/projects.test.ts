import { GET, POST } from '@/app/api/projects/route';
import { GET as getProject, PUT, DELETE } from '@/app/api/projects/[id]/route';
import { createMockRequest, createMockContext } from '../utils/test-utils';

// Mock the database client
jest.mock('@/lib/db', () => ({
  db: {
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Project API Routes', () => {
  const mockProject = {
    id: '1',
    name: 'Test Project',
    contract_number: 'CN-001',
    client_company: 'Test Client',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockCreateProjectInput = {
    name: 'New Project',
    contract_number: 'CN-002',
    client_company: 'New Client',
  };

  const mockUpdateProjectInput = {
    name: 'Updated Project',
    contract_number: 'CN-003',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    it('returns all projects', async () => {
      const { db } = require('@/lib/db');
      db.project.findMany.mockResolvedValue([mockProject]);

      const request = createMockRequest({});
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([mockProject]);
    });

    it('handles database errors', async () => {
      const { db } = require('@/lib/db');
      db.project.findMany.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({});
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch projects');
    });
  });

  describe('POST /api/projects', () => {
    it('creates a new project', async () => {
      const { db } = require('@/lib/db');
      db.project.create.mockResolvedValue(mockProject);

      const request = createMockRequest({
        method: 'POST',
        body: mockCreateProjectInput
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockProject);
    });

    it('validates input data', async () => {
      const invalidInput = { ...mockCreateProjectInput, name: undefined };

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
      db.project.create.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({
        method: 'POST',
        body: mockCreateProjectInput
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create project');
    });
  });

  describe('GET /api/projects/[id]', () => {
    it('returns a single project', async () => {
      const { db } = require('@/lib/db');
      db.project.findUnique.mockResolvedValue(mockProject);

      const request = createMockRequest({});
      const context = createMockContext({ id: '1' });
      const response = await getProject(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockProject);
    });

    it('handles non-existent project', async () => {
      const { db } = require('@/lib/db');
      db.project.findUnique.mockResolvedValue(null);

      const request = createMockRequest({});
      const context = createMockContext({ id: '999' });
      const response = await getProject(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Project not found');
    });
  });

  describe('PUT /api/projects/[id]', () => {
    it('updates a project', async () => {
      const { db } = require('@/lib/db');
      const updatedProject = { ...mockProject, ...mockUpdateProjectInput };
      db.project.update.mockResolvedValue(updatedProject);

      const request = createMockRequest({
        method: 'PUT',
        body: mockUpdateProjectInput
      });
      const context = createMockContext({ id: '1' });
      const response = await PUT(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedProject);
    });

    it('validates update data', async () => {
      const invalidUpdate = { name: '' };

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

  describe('DELETE /api/projects/[id]', () => {
    it('deletes a project', async () => {
      const { db } = require('@/lib/db');
      db.project.delete.mockResolvedValue(mockProject);

      const request = createMockRequest({
        method: 'DELETE'
      });
      const context = createMockContext({ id: '1' });
      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockProject);
    });

    it('handles non-existent project', async () => {
      const { db } = require('@/lib/db');
      db.project.delete.mockRejectedValue(new Error('Record not found'));

      const request = createMockRequest({
        method: 'DELETE'
      });
      const context = createMockContext({ id: '999' });
      const response = await DELETE(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Project not found');
    });
  });
}); 
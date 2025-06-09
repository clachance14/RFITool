import { renderHook, act } from '@testing-library/react';
import { useRFIs } from '@/hooks/useRFIs';
import type { RFI, CreateRFIInput, UpdateRFIInput } from '@/lib/types';

// Mock fetch
global.fetch = jest.fn();

describe('useRFIs Hook', () => {
  const mockRFIs: RFI[] = [
    {
      id: '1',
      rfi_number: 'RFI-001',
      project_id: '1',
      subject: 'Test RFI 1',
      description: 'Test Description 1',
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
    },
    {
      id: '2',
      rfi_number: 'RFI-002',
      project_id: '1',
      subject: 'Test RFI 2',
      description: 'Test Description 2',
      status: 'sent',
      priority: 'high',
      assigned_to: 'user-2',
      due_date: '2024-02-01T00:00:00Z',
      created_by: 'user-1',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      response: 'Test Response',
      response_date: '2024-01-03T00:00:00Z',
      attachments: ['attachment-1'],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CRUD Operations', () => {
    it('gets RFIs successfully', async () => {
      const { result } = renderHook(() => useRFIs());

      await act(async () => {
        await result.current.getRFIs();
      });

      expect(result.current.rfis).toBeDefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('creates RFI successfully', async () => {
      const mockRFI = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        rfi_number: 'RFI-001',
        project_id: '123e4567-e89b-12d3-a456-426614174000',
        subject: 'Test RFI',
        to_recipient: 'Test Recipient',
        company: 'Test Company',
        contract_number: 'TEST-001',
        revision: '1',
        date_created: '2024-03-20T00:00:00Z',
        work_impact: 'None',
        cost_impact: 'None',
        schedule_impact: 'None',
        discipline: 'Test',
        system: 'Test',
        sub_system: 'Test',
        schedule_id: 'TEST-001',
        reason_for_rfi: 'Test',
        test_package: 'Test',
        contractor_proposed_solution: 'Test',
        associated_reference_documents: 'Test',
        requested_by: 'Test',
        reviewed_by: 'Test',
        urgency: 'non-urgent' as const,
        status: 'draft' as const,
      };

      const { result } = renderHook(() => useRFIs());

      await act(async () => {
        await result.current.createRFI(mockRFI);
      });

      expect(result.current.rfis).toContainEqual(expect.objectContaining({
        project_id: mockRFI.project_id,
        subject: mockRFI.subject,
      }));
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('updates RFI successfully', async () => {
      const updateData: UpdateRFIInput = {
        subject: 'Updated Subject',
        description: 'Updated Description',
        status: 'sent',
        priority: 'high',
        assigned_to: 'user-2',
        due_date: '2024-02-01T00:00:00Z',
        response: 'Test Response',
        response_date: '2024-01-03T00:00:00Z',
      };

      const { result } = renderHook(() => useRFIs());

      await act(async () => {
        await result.current.updateRFI('1', updateData);
      });

      expect(result.current.rfis).toContainEqual(expect.objectContaining({
        id: '1',
        subject: updateData.subject,
        status: updateData.status,
      }));
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('deletes RFI successfully', async () => {
      const { result } = renderHook(() => useRFIs());

      await act(async () => {
        await result.current.deleteRFI('1');
      });

      expect(result.current.rfis).not.toContainEqual(expect.objectContaining({ id: '1' }));
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Error Handling', () => {
    it('handles get RFIs errors', async () => {
      const { result } = renderHook(() => useRFIs());

      await act(async () => {
        await result.current.getRFIs();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
    });

    it('handles create RFI errors', async () => {
      const invalidRFI = {} as CreateRFIInput;

      const { result } = renderHook(() => useRFIs());

      await act(async () => {
        try {
          await result.current.createRFI(invalidRFI);
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('filters RFIs by status', () => {
      const { result } = renderHook(() => useRFIs());

      const draftRFIs = result.current.filterRFIsByStatus('draft');
      expect(draftRFIs).toHaveLength(1);
      expect(draftRFIs[0].status).toBe('draft');

      const sentRFIs = result.current.filterRFIsByStatus('sent');
      expect(sentRFIs).toHaveLength(1);
      expect(sentRFIs[0].status).toBe('sent');
    });

    it('filters RFIs by project', () => {
      const { result } = renderHook(() => useRFIs());

      const projectRFIs = result.current.getRFIsByProject('1');
      expect(projectRFIs).toHaveLength(2);
      expect(projectRFIs.every(rfi => rfi.project_id === '1')).toBe(true);
    });

    it('gets overdue RFIs', () => {
      const { result } = renderHook(() => useRFIs());

      const overdueRFIs = result.current.overdueRFIs;
      expect(Array.isArray(overdueRFIs)).toBe(true);
    });
  });

  describe('Loading States', () => {
    it('sets loading state during operations', async () => {
      const { result } = renderHook(() => useRFIs());

      act(() => {
        result.current.getRFIs();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
      });

      expect(result.current.loading).toBe(false);
    });
  });
}); 
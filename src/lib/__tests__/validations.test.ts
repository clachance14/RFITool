import { createRFISchema, CreateRFIInput } from '../validations';

describe('createRFISchema Validation Tests', () => {
  // Test data helpers
  const validProjectId = '123e4567-e89b-12d3-a456-426614174000';
  
  const baseValidRFI = {
    subject: 'Test RFI Subject',
    reason_for_rfi: 'Need clarification on specifications',
    contractor_question: 'What is the required material specification?',
    project_id: validProjectId,
    status: 'draft' as const,
    urgency: 'non-urgent' as const,
  };

  describe('Valid RFI Scenarios', () => {
    it('should validate a basic draft RFI with minimum required fields', () => {
      const result = createRFISchema.safeParse(baseValidRFI);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subject).toBe('Test RFI Subject');
        expect(result.data.reason_for_rfi).toBe('Need clarification on specifications');
        expect(result.data.contractor_question).toBe('What is the required material specification?');
        expect(result.data.project_id).toBe(validProjectId);
        expect(result.data.status).toBe('draft');
        expect(result.data.urgency).toBe('non-urgent');
      }
    });

    it('should validate a complete RFI with all optional fields populated', () => {
      const completeRFI = {
        ...baseValidRFI,
        discipline: 'HVAC',
        system: 'Ventilation System',
        work_impact: 'Minor delay expected',
        cost_impact: 5000.50,
        schedule_impact: 'Two week delay possible',
        test_package: 'TP-001',
        schedule_id: 'SCH-2024-001',
        block_area: 'Building A - Floor 2',
        contractor_proposed_solution: 'Recommend using alternative material specification',
        client_response: 'Response from client',
        client_response_submitted_by: 'John Doe',
        client_cm_approval: 'Jane Smith',
        to_recipient: 'client@example.com',
        revision: '1',
        requested_by: 'Contractor Name',
        reviewed_by: 'Project Manager',
      };

      const result = createRFISchema.safeParse(completeRFI);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.discipline).toBe('HVAC');
        expect(result.data.system).toBe('Ventilation System');
        expect(result.data.cost_impact).toBe(5000.50);
        expect(result.data.test_package).toBe('TP-001');
        expect(result.data.block_area).toBe('Building A - Floor 2');
      }
    });

    it('should handle valid sent status with required fields present', () => {
      const sentRFI = {
        ...baseValidRFI,
        status: 'sent' as const,
      };

      const result = createRFISchema.safeParse(sentRFI);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('sent');
      }
    });
  });

  describe('Invalid RFI Scenarios - Missing Required Fields', () => {
    it('should fail validation when subject is missing', () => {
      const invalidRFI = {
        ...baseValidRFI,
        subject: '',
      };

      const result = createRFISchema.safeParse(invalidRFI);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['subject'],
              message: 'Subject is required',
            })
          ])
        );
      }
    });

    it('should fail validation when reason_for_rfi is missing', () => {
      const invalidRFI = {
        ...baseValidRFI,
        reason_for_rfi: '',
      };

      const result = createRFISchema.safeParse(invalidRFI);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['reason_for_rfi'],
              message: 'Reason for RFI is required',
            })
          ])
        );
      }
    });

    it('should fail validation when contractor_question is missing', () => {
      const invalidRFI = {
        ...baseValidRFI,
        contractor_question: '',
      };

      const result = createRFISchema.safeParse(invalidRFI);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['contractor_question'],
              message: 'Contractor question is required',
            })
          ])
        );
      }
    });

    it('should fail validation when project_id is invalid UUID', () => {
      const invalidRFI = {
        ...baseValidRFI,
        project_id: 'invalid-uuid',
      };

      const result = createRFISchema.safeParse(invalidRFI);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['project_id'],
              message: 'Invalid project ID',
            })
          ])
        );
      }
    });
  });

  describe('Invalid RFI Scenarios - Incorrect Data Types', () => {
    it('should handle invalid cost_impact string by converting to undefined', () => {
      const invalidRFI = {
        ...baseValidRFI,
        cost_impact: 'not-a-number',
      };

      const result = createRFISchema.safeParse(invalidRFI);
      
      // The preprocessing converts invalid numbers to undefined, so validation passes
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cost_impact).toBeUndefined();
      }
    });

    it('should handle empty string cost_impact by converting to undefined', () => {
      const rfiWithEmptyCost = {
        ...baseValidRFI,
        cost_impact: '',
      };

      const result = createRFISchema.safeParse(rfiWithEmptyCost);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cost_impact).toBeUndefined();
      }
    });

    it('should fail validation when status has invalid value', () => {
      const invalidRFI = {
        ...baseValidRFI,
        status: 'invalid-status',
      };

      const result = createRFISchema.safeParse(invalidRFI);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['status'],
              message: 'Invalid status value',
            })
          ])
        );
      }
    });

    it('should fail validation when urgency has invalid value', () => {
      const invalidRFI = {
        ...baseValidRFI,
        urgency: 'invalid-urgency',
      };

      const result = createRFISchema.safeParse(invalidRFI);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['urgency'],
              message: 'Invalid urgency value',
            })
          ])
        );
      }
    });
  });

  describe('Invalid RFI Scenarios - Conditional Logic', () => {
    it('should fail validation when status is "sent" but reason_for_rfi is empty', () => {
      const invalidRFI = {
        ...baseValidRFI,
        status: 'sent' as const,
        reason_for_rfi: '',
      };

      const result = createRFISchema.safeParse(invalidRFI);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        // Should have both the required field error and the refine error
        const errors = result.error.errors;
        expect(errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['reason_for_rfi'],
              message: 'Reason for RFI is required',
            })
          ])
        );
      }
    });

    it('should fail validation when status is "sent" but contractor_question is empty', () => {
      const invalidRFI = {
        ...baseValidRFI,
        status: 'sent' as const,
        contractor_question: '',
      };

      const result = createRFISchema.safeParse(invalidRFI);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors;
        expect(errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['contractor_question'],
              message: 'Contractor question is required',
            })
          ])
        );
      }
    });

    it('should fail validation when status is "sent" but both required fields are empty', () => {
      const invalidRFI = {
        ...baseValidRFI,
        status: 'sent' as const,
        reason_for_rfi: '',
        contractor_question: '',
      };

      const result = createRFISchema.safeParse(invalidRFI);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.errors;
        // Should have individual field errors plus the refine error
        expect(errors.length).toBeGreaterThan(1);
        expect(errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['reason_for_rfi'],
              message: 'Reason for RFI is required',
            }),
            expect.objectContaining({
              path: ['contractor_question'],
              message: 'Contractor question is required',
            })
          ])
        );
      }
    });
  });

  describe('Field Length Validation', () => {
    it('should fail validation when subject exceeds maximum length', () => {
      const longSubject = 'x'.repeat(501); // Exceeds 500 char limit
      const invalidRFI = {
        ...baseValidRFI,
        subject: longSubject,
      };

      const result = createRFISchema.safeParse(invalidRFI);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['subject'],
              message: 'Subject too long',
            })
          ])
        );
      }
    });

    it('should fail validation when discipline exceeds maximum length', () => {
      const longDiscipline = 'x'.repeat(256); // Exceeds 255 char limit
      const invalidRFI = {
        ...baseValidRFI,
        discipline: longDiscipline,
      };

      const result = createRFISchema.safeParse(invalidRFI);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              path: ['discipline'],
              message: 'Maximum 255 characters allowed',
            })
          ])
        );
      }
    });
  });
}); 
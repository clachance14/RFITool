"use client";

import { useState, useCallback, useMemo } from 'react';
import { RFI, CreateRFIInput, UpdateRFIInput, RFIStatus, RFICostItem, RFICostType, RFIAttachment, RFITimesheetSummary } from '@/lib/types';
import { createRFISchema, updateRFISchema } from '@/lib/validations';
import { supabase, handleSupabaseError } from '@/lib/supabase';
import { uploadAttachment } from '@/lib/storage';
import { RFIWorkflowService } from '@/services/rfiWorkflow';

// Types for the hook
type RFIResponse = {
  success: boolean;
  data?: RFI;
  error?: string;
};

export function useRFIs() {
  const [rfis, setRFIs] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRFI, setCurrentRFI] = useState<RFI | null>(null);

  // Helper function to calculate total cost from cost items
  const calculateTotalCostFromItems = (costItems: RFICostItem[]): number => {
    return costItems.reduce((total, item) => total + (item.quantity * item.unit_cost), 0);
  };

  // Helper function to create cost items from legacy cost fields
  const createCostItemsFromLegacyFields = async (rfiId: string, data: CreateRFIInput) => {
    console.log('💰 Creating cost items for RFI:', rfiId, 'with data:', {
      manhours: data.manhours,
      labor_costs: data.labor_costs,
      material_costs: data.material_costs,
      equipment_costs: data.equipment_costs,
      subcontractor_costs: data.subcontractor_costs
    });
    
    // Debug: Log detailed information about each field
    console.log('🔍 Field analysis:');
    console.log('  manhours:', typeof data.manhours, data.manhours, 'isNaN:', isNaN(data.manhours as any));
    console.log('  labor_costs:', typeof data.labor_costs, data.labor_costs, 'isNaN:', isNaN(data.labor_costs as any));
    console.log('  material_costs:', typeof data.material_costs, data.material_costs, 'isNaN:', isNaN(data.material_costs as any));
    console.log('  equipment_costs:', typeof data.equipment_costs, data.equipment_costs, 'isNaN:', isNaN(data.equipment_costs as any));
    console.log('  subcontractor_costs:', typeof data.subcontractor_costs, data.subcontractor_costs, 'isNaN:', isNaN(data.subcontractor_costs as any));

    const costItems: Array<{ rfi_id: string; description: string; cost_type: RFICostType; quantity: number; unit: string; unit_cost: number }> = [];

    // Helper function to check if a value is a valid positive number
    const isValidPositiveNumber = (value: any): value is number => {
      return typeof value === 'number' && !isNaN(value) && value > 0;
    };

    if (isValidPositiveNumber(data.labor_costs)) {
      console.log('➕ Adding labor cost item');
      costItems.push({
        rfi_id: rfiId,
        description: isValidPositiveNumber(data.manhours) ? `Labor - ${data.manhours} hours` : 'Labor costs',
        cost_type: 'labor',
        quantity: isValidPositiveNumber(data.manhours) ? data.manhours : 1,
        unit: isValidPositiveNumber(data.manhours) ? 'hours' : 'lump sum',
        unit_cost: isValidPositiveNumber(data.manhours) ? data.labor_costs / data.manhours : data.labor_costs
      });
    }

    if (isValidPositiveNumber(data.material_costs)) {
      console.log('➕ Adding material cost item');
      costItems.push({
        rfi_id: rfiId,
        description: 'Material costs',
        cost_type: 'material',
        quantity: 1,
        unit: 'lump sum',
        unit_cost: data.material_costs
      });
    }

    if (isValidPositiveNumber(data.equipment_costs)) {
      console.log('➕ Adding equipment cost item');
      costItems.push({
        rfi_id: rfiId,
        description: 'Equipment costs',
        cost_type: 'equipment',
        quantity: 1,
        unit: 'lump sum',
        unit_cost: data.equipment_costs
      });
    }

    if (isValidPositiveNumber(data.subcontractor_costs)) {
      console.log('➕ Adding subcontractor cost item');
      costItems.push({
        rfi_id: rfiId,
        description: 'Subcontractor costs',
        cost_type: 'subcontractor',
        quantity: 1,
        unit: 'lump sum',
        unit_cost: data.subcontractor_costs
      });
    }

    console.log('💰 Cost items to insert:', costItems);

    // Insert cost items into database
    if (costItems.length > 0) {
      try {
        const { data: insertedItems, error } = await supabase
          .from('rfi_cost_items')
          .insert(costItems)
          .select();
        
        if (error) {
          console.error('❌ Error creating cost items:', error);
          console.error('📋 Error code:', error.code);
          console.error('📝 Error message:', error.message);
          console.error('💡 Error hint:', error.hint);
          console.error('🔍 Data that failed:', costItems);
          throw error;
        }
        
        console.log('✅ Cost items created successfully:', insertedItems);
      } catch (err) {
        console.error('❌ Cost item creation failed:', err);
        // Don't throw here - let RFI creation succeed even if cost items fail
        // This allows for fallback to legacy cost fields
      }
    } else {
      console.log('💰 No cost items to create');
    }
  };

  // Helper function to fetch cost items for an RFI
  const fetchCostItems = async (rfiId: string): Promise<RFICostItem[]> => {
    try {
      const { data, error } = await supabase
        .from('rfi_cost_items')
        .select('*')
        .eq('rfi_id', rfiId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err) {
      console.error('Error fetching cost items:', err);
      return [];
    }
  };

  // Helper function to fetch attachments for an RFI
  const fetchAttachments = async (rfiId: string): Promise<RFIAttachment[]> => {
    try {
      const { data, error } = await supabase
        .from('rfi_attachments')
        .select('*')
        .eq('rfi_id', rfiId);
      
      if (error) {
        console.error('Error fetching attachments:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching attachments:', error);
      return [];
    }
  };

  const fetchTimesheetSummary = async (rfiId: string): Promise<RFITimesheetSummary | null> => {
    try {
      const { data, error } = await supabase
        .from('rfi_timesheet_summary')
        .select('*')
        .eq('rfi_id', rfiId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching timesheet summary:', error);
        return null;
      }
      
      return data || null;
    } catch (error) {
      console.error('Error fetching timesheet summary:', error);
      return null;
    }
  };

  // CRUD Operations
  const createRFI = useCallback(async (data: CreateRFIInput): Promise<RFI> => {
    setLoading(true);
    setError(null);
    try {
      // Validate input data
      const validatedData = createRFISchema.parse(data);
      
      // Get the currently authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Generate RFI number for the specific project
      const rfiNumber = await getNextRFINumber(validatedData.project_id);
      
      // Create new RFI data - mapping only to fields that exist in database
      const newRFIData = {
        rfi_number: rfiNumber,
        project_id: validatedData.project_id,
        subject: validatedData.subject,
        reason_for_rfi: validatedData.reason_for_rfi,
        contractor_question: validatedData.contractor_question,
        contractor_proposed_solution: validatedData.contractor_proposed_solution || null,
        discipline: validatedData.discipline || null,
        system: validatedData.system || null,
        work_impact: validatedData.work_impact || null,
        cost_impact: validatedData.cost_impact || null,
        schedule_impact: validatedData.schedule_impact || null,
        test_package: validatedData.test_package || null,
        schedule_id: validatedData.schedule_id || null,
        block_area: validatedData.block_area || null,
        status: validatedData.status,
        urgency: validatedData.urgency,
        assigned_to: null,
        due_date: null,
        created_by: user.id,
        client_response: null,
        date_sent: null,
        date_responded: null,
      };
      
      console.log('💾 Creating RFI with data:', newRFIData);
      
      // Insert RFI into database
      const { data: rfiData, error: rfiError } = await supabase
        .from('rfis')
        .insert(newRFIData)
        .select()
        .single();
      
      if (rfiError) {
        console.error('❌ RFI creation error:', rfiError);
        throw rfiError;
      }
      
      console.log('✅ RFI created successfully:', rfiData);
      
      // Upload attachments if any
      let uploadedAttachments: RFIAttachment[] = [];
      if (data.attachments && data.attachments.length > 0) {
        console.log('📎 Uploading attachments:', data.attachments.length);
        
        const uploadPromises = data.attachments.map(async (file, index) => {
          try {
            const { url, path, error } = await uploadAttachment(file, rfiData.id);
            if (error || !url || !path) {
              console.error(`❌ Failed to upload file ${file.name}:`, error);
              throw new Error(`Failed to upload ${file.name}: ${error}`);
            }
            
            // Insert attachment record into database
            const { data: attachmentData, error: attachmentError } = await supabase
              .from('rfi_attachments')
              .insert({
                rfi_id: rfiData.id,
                file_name: file.name,
                file_path: path,
                file_size_bytes: file.size,
                file_type: file.type,
                uploaded_by: user.id
              })
              .select()
              .single();
              
            if (attachmentError) {
              console.error(`❌ Failed to save attachment record for ${file.name}:`, attachmentError);
              throw attachmentError;
            }
            
            console.log(`✅ Attachment uploaded successfully: ${file.name}`);
            
            // Add public URL to attachment data
            return {
              ...attachmentData,
              public_url: url
            } as RFIAttachment;
          } catch (error) {
            console.error(`❌ Error uploading attachment ${file.name}:`, error);
            throw error;
          }
        });
        
        try {
          uploadedAttachments = await Promise.all(uploadPromises);
          console.log('✅ All attachments uploaded successfully:', uploadedAttachments.length);
        } catch (error) {
          console.error('❌ Failed to upload some attachments:', error);
          // Note: We could continue without attachments or throw - depends on requirements
          // For now, let's continue and log the error
        }
      }
      
      // Create cost items if there are any cost inputs
      await createCostItemsFromLegacyFields(rfiData.id, data);
      
      // Fetch the complete RFI with cost items
      const costItems = await fetchCostItems(rfiData.id);
      
      // Convert database RFI to our RFI interface
      const newRFI: RFI = {
        id: rfiData.id,
        rfi_number: rfiData.rfi_number,
        project_id: rfiData.project_id,
        subject: rfiData.subject,
        description: rfiData.reason_for_rfi, // Map reason_for_rfi to description
        status: rfiData.status as any,
        priority: 'medium', // Default priority
        assigned_to: rfiData.assigned_to,
        due_date: rfiData.due_date,
        created_by: rfiData.created_by,
        created_at: rfiData.created_at,
        updated_at: rfiData.updated_at,
        response: rfiData.client_response,
        response_date: rfiData.date_responded,
        attachments: uploadedAttachments.map(att => att.file_name),
        attachment_files: uploadedAttachments,
        cost_items: costItems,
        // Legacy cost fields for compatibility
        manhours: data.manhours,
        labor_costs: data.labor_costs,
        material_costs: data.material_costs,
        equipment_costs: data.equipment_costs,
        subcontractor_costs: data.subcontractor_costs,
      };
      
      setRFIs(prev => [...prev, newRFI]);
      setCurrentRFI(newRFI);
      return newRFI;
    } catch (err) {
      const message = handleSupabaseError(err);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRFIs = useCallback(async (projectId?: string): Promise<RFI[]> => {
    setLoading(true);
    setError(null);
    try {
      // Get the currently authenticated user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Get the user's role from the company_users table
      const { data: companyUserData, error: companyUserError } = await supabase
        .from('company_users')
        .select('company_id, role_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (companyUserError) {
        console.error('Error fetching company user data:', companyUserError);
        throw new Error('Database error: ' + companyUserError.message);
      }
      
      if (!companyUserData) {
        console.error('No company association found for user:', {
          userId: user.id,
          userEmail: user.email
        });
        
        // Special handling for client users - check if they are trying to access via client session
        const isClientSession = typeof window !== 'undefined' && 
          (sessionStorage.getItem('client_session') || sessionStorage.getItem('client_token'));
        
        if (isClientSession) {
          // For client sessions, we can allow limited access but with no data
          console.log('Client session detected, allowing limited access with empty data');
          setRFIs([]);
          return [];
        }
        
        throw new Error('No company association found. Please contact your administrator to set up your account properly.');
      }

      // Check if user is App Owner (role_id = 0)
      const isAppOwner = companyUserData.role_id === 0;

      // Build query with optional company filtering through projects table
      let query = supabase
        .from('rfis')
        .select(`
          *,
          projects!inner(company_id, project_name, client_company_name)
        `);
      
      // Only apply company filtering if not App Owner
      if (!isAppOwner) {
        query = query.eq('projects.company_id', companyUserData.company_id);
      }
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        const message = 'Failed to fetch RFIs: ' + error.message;
        setError(message);
        throw new Error(message);
      }
      
      // Convert database RFIs to our RFI interface and fetch cost items, attachments, and timesheet summaries
      const rfisWithCostItems: RFI[] = await Promise.all(
        (data || []).map(async (rfiData) => {
          const costItems = await fetchCostItems(rfiData.id);
          const attachments = await fetchAttachments(rfiData.id);
          const timesheetSummary = await fetchTimesheetSummary(rfiData.id);
          
          return {
            id: rfiData.id,
            rfi_number: rfiData.rfi_number,
            project_id: rfiData.project_id,
            subject: rfiData.subject,
            description: rfiData.contractor_question || '',
            proposed_solution: rfiData.contractor_proposed_solution || undefined,
            status: rfiData.status as any,
            stage: rfiData.stage || null,
            priority: 'medium' as any, // Default priority
            assigned_to: rfiData.assigned_to,
            due_date: rfiData.due_date,
            created_by: rfiData.created_by,
            created_at: rfiData.created_at,
            updated_at: rfiData.updated_at,
            response: rfiData.client_response,
            response_date: rfiData.date_responded,
            // Field work tracking
            requires_field_work: rfiData.requires_field_work,
            field_work_description: rfiData.field_work_description,
            work_started_date: rfiData.work_started_date,
            work_completed_date: rfiData.work_completed_date,
            actual_labor_hours: rfiData.actual_labor_hours,
            actual_labor_cost: rfiData.actual_labor_cost,
            actual_material_cost: rfiData.actual_material_cost,
            actual_equipment_cost: rfiData.actual_equipment_cost,
            actual_total_cost: rfiData.actual_total_cost,
            attachments: attachments.map(att => att.file_name),
            attachment_files: attachments,
            cost_items: costItems,
            timesheet_summary: timesheetSummary || undefined,
            // Calculate legacy cost fields from cost items for compatibility
            labor_costs: costItems.filter(item => item.cost_type === 'labor').reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) || undefined,
            material_costs: costItems.filter(item => item.cost_type === 'material').reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) || undefined,
            equipment_costs: costItems.filter(item => item.cost_type === 'equipment').reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) || undefined,
            subcontractor_costs: costItems.filter(item => item.cost_type === 'subcontractor').reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) || undefined,
          } as RFI;
        })
      );
      
      setRFIs(rfisWithCostItems);
      return rfisWithCostItems;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch RFIs';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRFIById = useCallback(async (id: string): Promise<RFI> => {
    setLoading(true);
    setError(null);
    try {
      // Get the currently authenticated user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }
      
      // Get the user's role from the company_users table
      const { data: companyUserData, error: companyUserError } = await supabase
        .from('company_users')
        .select('company_id, role_id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (companyUserError) {
        console.error('Error fetching company user data:', companyUserError);
        throw new Error('Database error: ' + companyUserError.message);
      }
      
      if (!companyUserData) {
        console.error('No company association found for user:', {
          userId: user.id,
          userEmail: user.email
        });
        throw new Error('No company association found. Please contact your administrator to set up your account properly.');
      }

      // Check if user is App Owner (role_id = 0)
      const isAppOwner = companyUserData.role_id === 0;

      // Build query with optional company filtering through projects table
      let query = supabase
        .from('rfis')
        .select(`
          *,
          projects!inner(company_id, project_name, client_company_name)
        `)
        .eq('id', id);
      
      // Only apply company filtering if not App Owner
      if (!isAppOwner) {
        query = query.eq('projects.company_id', companyUserData.company_id);
      }

      const { data, error } = await query.single();
      
      if (error) {
        const message = 'Failed to fetch RFI: ' + error.message;
        setError(message);
        throw new Error(message);
      }
      
      if (!data) {
        const message = 'RFI not found';
        setError(message);
        throw new Error(message);
      }
      
      // Fetch cost items, attachments, and timesheet summary for this RFI
      const costItems = await fetchCostItems(id);
      const attachments = await fetchAttachments(id);
      const timesheetSummary = await fetchTimesheetSummary(id);
      
      // Convert database RFI to our RFI interface
      const rfi: RFI = {
        id: data.id,
        rfi_number: data.rfi_number,
        project_id: data.project_id,
        subject: data.subject,
        description: data.contractor_question || '',
        proposed_solution: data.contractor_proposed_solution || undefined,
        status: data.status as any,
        stage: data.stage || null,
        priority: 'medium' as any, // Default priority
        assigned_to: data.assigned_to,
        due_date: data.due_date,
        created_by: data.created_by,
        created_at: data.created_at,
        updated_at: data.updated_at,
        response: data.client_response,
        response_date: data.date_responded,
        // Field work tracking
        requires_field_work: data.requires_field_work,
        field_work_description: data.field_work_description,
        work_started_date: data.work_started_date,
        work_completed_date: data.work_completed_date,
        actual_labor_hours: data.actual_labor_hours,
        actual_labor_cost: data.actual_labor_cost,
        actual_material_cost: data.actual_material_cost,
        actual_equipment_cost: data.actual_equipment_cost,
        actual_total_cost: data.actual_total_cost,
        attachments: attachments.map(att => att.file_name),
        attachment_files: attachments,
        cost_items: costItems,
        timesheet_summary: timesheetSummary || undefined,
        // Calculate legacy cost fields from cost items for compatibility
        labor_costs: costItems.filter(item => item.cost_type === 'labor').reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) || undefined,
        material_costs: costItems.filter(item => item.cost_type === 'material').reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) || undefined,
        equipment_costs: costItems.filter(item => item.cost_type === 'equipment').reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) || undefined,
        subcontractor_costs: costItems.filter(item => item.cost_type === 'subcontractor').reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) || undefined,
      };
      
      setCurrentRFI(rfi);
      return rfi;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch RFI';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRFI = useCallback(async (id: string, data: UpdateRFIInput): Promise<RFI> => {
    setLoading(true);
    setError(null);
    try {
      // Validate input data
      const validatedData = updateRFISchema.parse(data);
      
      // Get current user for activity logging
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get existing RFI data to compare changes
      const { data: existingRFI, error: fetchError } = await supabase
        .from('rfis')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingRFI) {
        throw new Error('RFI not found');
      }

      const { data: updatedData, error } = await supabase
        .from('rfis')
        .update({
          ...validatedData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        const message = 'Failed to update RFI: ' + error.message;
        setError(message);
        throw new Error(message);
      }

      if (!updatedData) {
        const message = 'RFI not found';
        setError(message);
        throw new Error(message);
      }

      // Log specific activity for significant changes
      const changedFields: string[] = [];
      if (validatedData.subject && existingRFI.subject !== validatedData.subject) {
        changedFields.push('subject');
      }
      if (validatedData.status && existingRFI.status !== validatedData.status) {
        changedFields.push('status');
      }
      if (validatedData.stage && existingRFI.stage !== validatedData.stage) {
        changedFields.push('stage');
      }
      if (validatedData.response && existingRFI.client_response !== validatedData.response) {
        changedFields.push('response');
      }

      // Log activity if there were significant changes
      if (changedFields.length > 0) {
        await RFIWorkflowService.logRFIActivity(
          id,
          user.id,
          'updated',
          {
            message: `RFI updated: ${changedFields.join(', ')} changed`,
            changed_fields: changedFields,
            rfi_number: updatedData.rfi_number,
            previous_values: {
              subject: existingRFI.subject,
              status: existingRFI.status,
              stage: existingRFI.stage,
              response: existingRFI.client_response
            },
            new_values: {
              subject: validatedData.subject || existingRFI.subject,
              status: validatedData.status || existingRFI.status,
              stage: validatedData.stage || existingRFI.stage,
              response: validatedData.response || existingRFI.client_response
            }
          }
        );
      }

      // Fetch cost items and attachments for the updated RFI
      const costItems = await fetchCostItems(id);
      const attachments = await fetchAttachments(id);

      // Convert database RFI to our RFI interface (same mapping as in getRFIById)
      const updatedRFI: RFI = {
        id: updatedData.id,
        rfi_number: updatedData.rfi_number,
        project_id: updatedData.project_id,
        subject: updatedData.subject,
        description: updatedData.contractor_question || '',
        proposed_solution: updatedData.contractor_proposed_solution || undefined,
        status: updatedData.status as any,
        stage: updatedData.stage || null,
        priority: 'medium' as any, // Default priority
        assigned_to: updatedData.assigned_to,
        due_date: updatedData.due_date,
        created_by: updatedData.created_by,
        created_at: updatedData.created_at,
        updated_at: updatedData.updated_at,
        response: updatedData.client_response,
        response_date: updatedData.date_responded,
        // Field work tracking
        requires_field_work: updatedData.requires_field_work,
        field_work_description: updatedData.field_work_description,
        work_started_date: updatedData.work_started_date,
        work_completed_date: updatedData.work_completed_date,
        actual_labor_hours: updatedData.actual_labor_hours,
        actual_labor_cost: updatedData.actual_labor_cost,
        actual_material_cost: updatedData.actual_material_cost,
        actual_equipment_cost: updatedData.actual_equipment_cost,
        actual_total_cost: updatedData.actual_total_cost,
        attachments: attachments.map(att => att.file_name),
        attachment_files: attachments,
        cost_items: costItems,
        // Calculate legacy cost fields from cost items for compatibility
        labor_costs: costItems.filter(item => item.cost_type === 'labor').reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) || undefined,
        material_costs: costItems.filter(item => item.cost_type === 'material').reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) || undefined,
        equipment_costs: costItems.filter(item => item.cost_type === 'equipment').reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) || undefined,
        subcontractor_costs: costItems.filter(item => item.cost_type === 'subcontractor').reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0) || undefined,
      };
      
      setRFIs(prev => prev.map(rfi => rfi.id === id ? updatedRFI : rfi));
      setCurrentRFI(updatedRFI);
      return updatedRFI;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update RFI';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRFI = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('rfis')
        .delete()
        .eq('id', id);
      
      if (error) {
        const message = 'Failed to delete RFI: ' + error.message;
        setError(message);
        throw new Error(message);
      }
      
      setRFIs(prev => prev.filter(rfi => rfi.id !== id));
      if (currentRFI?.id === id) {
        setCurrentRFI(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete RFI';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [currentRFI]);

  // RFI Status Management
  const updateRFIStatus = useCallback(async (id: string, status: RFIStatus): Promise<RFI> => {
    setLoading(true);
    setError(null);
    try {
      const updatedRFI = await updateRFI(id, { status });
      return updatedRFI;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update RFI status';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [updateRFI]);

  const markAsOverdue = useCallback(async (id: string): Promise<RFI> => {
    return updateRFI(id, { stage: 'late_overdue' });
  }, [updateRFI]);

  const submitResponse = useCallback(async (id: string, response: string): Promise<RFI> => {
    setLoading(true);
    setError(null);
    try {
      const updatedRFI = await updateRFI(id, {
        response,
        response_date: new Date().toISOString(),
        stage: 'response_received',
      });
      return updatedRFI;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit response';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [updateRFI]);

  // RFI Numbering Logic
  const generateRFINumber = useCallback(async (projectId?: string): Promise<string> => {
    try {
      let query = supabase
        .from('rfis')
        .select('rfi_number')
        .order('created_at', { ascending: false });
      
      // If projectId is provided, filter by project
      if (projectId) {
        query = query.eq('project_id', projectId);
      }
      
      const { data, error } = await query.limit(1);

      if (error) {
        throw new Error('Failed to generate RFI number: ' + error.message);
      }

      const lastRFI = data?.[0];
      const lastNumber = lastRFI ? parseInt(lastRFI.rfi_number.split('-')[1]) : 0;
      const nextNumber = lastNumber + 1;
      return `RFI-${nextNumber.toString().padStart(3, '0')}`;
    } catch (err) {
      // Fallback to timestamp-based numbering if query fails
      const timestamp = Date.now().toString().slice(-6);
      return `RFI-${timestamp}`;
    }
  }, []);

  const getNextRFINumber = useCallback(async (projectId?: string): Promise<string> => {
    return generateRFINumber(projectId);
  }, [generateRFINumber]);

  // Utility Functions
  const filterRFIsByStatus = useCallback((status: RFIStatus): RFI[] => {
    return rfis.filter(rfi => rfi.status === status);
  }, [rfis]);

  const getRFIsByProject = useCallback((projectId: string): RFI[] => {
    return rfis.filter(rfi => rfi.project_id === projectId);
  }, [rfis]);

  const getOverdueRFIs = useCallback((): RFI[] => {
    return rfis.filter(rfi => rfi.stage === 'late_overdue');
  }, [rfis]);

  // Memoized values
  const overdueRFIs = useMemo(() => getOverdueRFIs(), [getOverdueRFIs]);

  return {
    // State
    rfis,
    loading,
    error,
    currentRFI,
    
    // CRUD Operations
    createRFI,
    getRFIs,
    getRFIById,
    updateRFI,
    deleteRFI,
    
    // Status Management
    updateRFIStatus,
    markAsOverdue,
    submitResponse,
    
    // Utility Functions
    getNextRFINumber,
    filterRFIsByStatus,
    getRFIsByProject,
    overdueRFIs,
  };
} 
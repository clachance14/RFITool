export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          contract_number: string | null
          client_company: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contract_number?: string | null
          client_company?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contract_number?: string | null
          client_company?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rfis: {
        Row: {
          id: string
          rfi_number: string
          revision: number
          project_id: string
          contract_number: string | null
          to_recipient: string
          company: string | null
          subject: string
          date_created: string
          work_impact: string | null
          cost_impact: string | null
          schedule_impact: string | null
          discipline: string | null
          system: string | null
          sub_system: string | null
          schedule_id: string | null
          reason_for_rfi: string
          test_package: string | null
          contractor_proposed_solution: string | null
          associated_reference_documents: string | null
          requested_by: string | null
          reviewed_by: string | null
          company_reviewer: string | null
          client_response: string | null
          client_response_submitted_by: string | null
          client_cm_approval: string | null
          status: 'draft' | 'sent' | 'responded' | 'overdue'
          urgency: 'urgent' | 'non-urgent'
          secure_link_token: string
          link_expires_at: string | null
          date_sent: string | null
          date_responded: string | null
          response_status: 'approved' | 'rejected' | 'needs_clarification' | null
          additional_comments: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rfi_number?: string
          revision?: number
          project_id: string
          contract_number?: string | null
          to_recipient: string
          company?: string | null
          subject: string
          date_created?: string
          work_impact?: string | null
          cost_impact?: string | null
          schedule_impact?: string | null
          discipline?: string | null
          system?: string | null
          sub_system?: string | null
          schedule_id?: string | null
          reason_for_rfi: string
          test_package?: string | null
          contractor_proposed_solution?: string | null
          associated_reference_documents?: string | null
          requested_by?: string | null
          reviewed_by?: string | null
          company_reviewer?: string | null
          client_response?: string | null
          client_response_submitted_by?: string | null
          client_cm_approval?: string | null
          status?: 'draft' | 'sent' | 'responded' | 'overdue'
          urgency?: 'urgent' | 'non-urgent'
          secure_link_token?: string
          link_expires_at?: string | null
          date_sent?: string | null
          date_responded?: string | null
          response_status?: 'approved' | 'rejected' | 'needs_clarification' | null
          additional_comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rfi_number?: string
          revision?: number
          project_id?: string
          contract_number?: string | null
          to_recipient?: string
          company?: string | null
          subject?: string
          date_created?: string
          work_impact?: string | null
          cost_impact?: string | null
          schedule_impact?: string | null
          discipline?: string | null
          system?: string | null
          sub_system?: string | null
          schedule_id?: string | null
          reason_for_rfi?: string
          test_package?: string | null
          contractor_proposed_solution?: string | null
          associated_reference_documents?: string | null
          requested_by?: string | null
          reviewed_by?: string | null
          company_reviewer?: string | null
          client_response?: string | null
          client_response_submitted_by?: string | null
          client_cm_approval?: string | null
          status?: 'draft' | 'sent' | 'responded' | 'overdue'
          urgency?: 'urgent' | 'non-urgent'
          secure_link_token?: string
          link_expires_at?: string | null
          date_sent?: string | null
          date_responded?: string | null
          response_status?: 'approved' | 'rejected' | 'needs_clarification' | null
          additional_comments?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rfi_attachments: {
        Row: {
          id: string
          rfi_id: string
          file_name: string
          file_path: string
          file_size_bytes: number
          file_type: string
          uploaded_by: string
          public_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          rfi_id: string
          file_name: string
          file_path: string
          file_size_bytes: number
          file_type: string
          uploaded_by: string
          public_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          rfi_id?: string
          file_name?: string
          file_path?: string
          file_size_bytes?: number
          file_type?: string
          uploaded_by?: string
          public_url?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          rfi_id: string
          type: 'response_received' | 'overdue_reminder'
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          rfi_id: string
          type: 'response_received' | 'overdue_reminder'
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          rfi_id?: string
          type?: 'response_received' | 'overdue_reminder'
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 
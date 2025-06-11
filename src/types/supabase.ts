export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  auth: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          raw_user_meta_data: any
          created_at: string
          updated_at: string
          last_sign_in_at: string | null
        }
        Insert: {
          id?: string
          email: string
          raw_user_meta_data?: any
          created_at?: string
          updated_at?: string
          last_sign_in_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          raw_user_meta_data?: any
          created_at?: string
          updated_at?: string
          last_sign_in_at?: string | null
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
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
          logo_url: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
          logo_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
          logo_url?: string | null
        }
      }
      company_users: {
        Row: {
          user_id: string
          company_id: string
          role_id: number
          created_at: string
        }
        Insert: {
          user_id: string
          company_id: string
          role_id: number
          created_at?: string
        }
        Update: {
          user_id?: string
          company_id?: string
          role_id?: number
          created_at?: string
        }
      }
      roles: {
        Row: {
          id: number
          name: string
          description: string | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
        }
      }
      role_permissions: {
        Row: {
          role_id: number
          permission_id: string
        }
        Insert: {
          role_id: number
          permission_id: string
        }
        Update: {
          role_id?: number
          permission_id?: string
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
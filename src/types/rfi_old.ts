export type RFIStatus = "open" | "in_progress" | "closed";

export interface RFI {
  id: string;
  status: RFIStatus;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  assignedTo?: string;
  projectId: string;
  attachments?: string[];
  responses?: RFIResponse[];
}

export interface RFIResponse {
  id: string;
  rfiId: string;
  content: string;
  createdAt: string;
  createdBy: string;
  attachments?: string[];
} 
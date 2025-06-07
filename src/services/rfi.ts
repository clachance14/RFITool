import { RFI, RFIStatus } from "@/types/rfi";
import { api } from "@/lib/api";

export const updateRFIStatus = async (rfiId: string, status: RFIStatus): Promise<RFI> => {
  const response = await api.patch(`/rfis/${rfiId}/status`, { status });
  return response.data;
};

export const getRFI = async (rfiId: string): Promise<RFI> => {
  const response = await api.get(`/rfis/${rfiId}`);
  return response.data;
};

export const createRFI = async (rfi: Omit<RFI, "id" | "createdAt" | "updatedAt">): Promise<RFI> => {
  const response = await api.post("/rfis", rfi);
  return response.data;
};

export const deleteRFI = async (rfiId: string): Promise<void> => {
  await api.delete(`/rfis/${rfiId}`);
}; 
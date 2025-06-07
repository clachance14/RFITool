"use client";

import { useCallback, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { RFI, RFIStatus } from "@/types/rfi";
import { updateRFIStatus, getRFI } from "@/services/rfi";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RfiDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [rfi, setRfi] = useState<RFI | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRFI = async () => {
      if (!id) return;
      try {
        const data = await getRFI(id);
        setRfi(data);
      } catch (error) {
        console.error("Error fetching RFI:", error);
        toast({
          title: "Error",
          description: "Failed to load RFI details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRFI();
  }, [id, toast]);

  const handleStatusChange = useCallback(
    async (newStatus: RFIStatus) => {
      if (!rfi) return;

      try {
        const updatedRfi = await updateRFIStatus(rfi.id, newStatus);
        setRfi(updatedRfi);
        toast({
          title: "Status Updated",
          description: `RFI status changed to ${newStatus}`,
        });
      } catch (error) {
        console.error("Error updating RFI status:", error);
        toast({
          title: "Error",
          description: "Failed to update RFI status",
          variant: "destructive",
        });
      }
    },
    [rfi, toast]
  );

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">Loading RFI details...</div>
        </CardContent>
      </Card>
    );
  }

  if (!rfi) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">RFI not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>RFI Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <span className="font-medium">Status:</span>
            <Select
              value={rfi.status}
              onValueChange={(value) => handleStatusChange(value as RFIStatus)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{rfi.title}</h3>
            <p className="text-gray-600">{rfi.description}</p>
          </div>
          <div className="text-sm text-gray-500">
            <p>Created: {new Date(rfi.createdAt).toLocaleDateString()}</p>
            <p>Last Updated: {new Date(rfi.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RfiDetail; 
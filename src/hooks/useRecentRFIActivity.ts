import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface RFIActivity {
  id: string;
  type: 'status_change' | 'created' | 'updated';
  rfi_id: string;
  rfi_number: string;
  rfi_subject: string;
  project_name: string;
  description: string;
  change_type: 'status' | 'stage' | 'creation' | 'update';
  from_value?: string;
  to_value?: string;
  timestamp: string;
  user_name: string;
  user_email?: string;
  reason?: string;
}

export function useRecentRFIActivity() {
  const [activities, setActivities] = useState<RFIActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const fetchRecentActivity = useCallback(async (limit: number = 15) => {
    if (!session?.access_token) {
      console.log('No authentication token available');
      setError('No authentication token available');
      return;
    }

    console.log('Fetching recent activity with token:', session.access_token?.substring(0, 20) + '...');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rfis/recent-activity?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Recent activity API result:', result);
      
      if (result.success) {
        console.log('Recent activity data received:', result.data?.length, 'items');
        setActivities(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch recent activity');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recent activity';
      setError(errorMessage);
      console.error('Error fetching recent RFI activity:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  return {
    activities,
    loading,
    error,
    fetchRecentActivity,
    refetch: fetchRecentActivity
  };
} 
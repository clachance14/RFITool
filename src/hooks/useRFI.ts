"use client";

import { useState } from 'react';
import type { CreateRFIInput, RFI } from '@/lib/types';

interface RFIResponse {
  rfi_number: string;
  id: string;
}

interface RFIError {
  message: string;
  code?: string;
}

export function useRFI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<RFIError | null>(null);

  const createRFI = async (data: CreateRFIInput): Promise<RFIResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rfis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create RFI');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const error = err as Error;
      setError({
        message: error.message || 'An error occurred while creating the RFI',
        code: 'CREATE_RFI_ERROR',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createRFI,
    isLoading,
    error,
  };
} 
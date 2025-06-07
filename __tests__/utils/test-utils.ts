import { NextRequest } from 'next/server';

export const createMockRequest = (options: {
  method?: string;
  url?: string;
  body?: any;
  searchParams?: Record<string, string>;
  headers?: Record<string, string>;
}) => {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/rfis',
    body = {},
    searchParams = {},
    headers = {},
  } = options;

  const mockRequest = {
    method,
    url,
    nextUrl: {
      searchParams: new URLSearchParams(searchParams),
    },
    headers: new Headers(headers),
    json: jest.fn().mockResolvedValue(body),
    formData: jest.fn().mockResolvedValue(new FormData()),
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  } as unknown as NextRequest;

  return mockRequest;
};

export const createMockResponse = () => {
  const mockResponse = {
    json: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    headers: new Headers(),
    ok: true,
    statusText: 'OK',
  };

  return mockResponse;
};

export const createMockContext = (params: { id: string }) => {
  return {
    params,
  };
}; 
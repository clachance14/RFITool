// Mock authentication implementation for development

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
}

// Mock user data
const mockUser: AuthUser = {
  id: 'mock-user-id',
  email: 'test@example.com',
  name: 'Test User',
};

export async function login(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  // Mock login - always succeed for development
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  
  // Store mock session in localStorage
  const mockSession: AuthSession = {
    user: mockUser,
    access_token: 'mock-access-token',
  };
  
  localStorage.setItem('auth_session', JSON.stringify(mockSession));
  
  return { user: mockUser, error: null };
}

export async function logout(): Promise<{ error: string | null }> {
  // Clear mock session
  localStorage.removeItem('auth_session');
  return { error: null };
}

export async function getSession(): Promise<{ session: AuthSession | null; error: string | null }> {
  try {
    const sessionData = localStorage.getItem('auth_session');
    if (sessionData) {
      const session = JSON.parse(sessionData) as AuthSession;
      return { session, error: null };
    }
    return { session: null, error: null };
  } catch (error) {
    return { session: null, error: 'Failed to get session' };
  }
}

export async function refreshSession(): Promise<{ session: AuthSession | null; error: string | null }> {
  // For mock implementation, just return existing session
  return getSession();
} 
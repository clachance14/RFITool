// This is a hypothetical function we are testing
async function createUser(userData: { name: string; email: string }) {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  if (!response.ok) {
    return { error: 'Failed to create user' };
  }
  return await response.json();
}

describe('User API', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('should call the create user API with the correct data', async () => {
    const newUser = { name: 'Jane Doe', email: 'jane.doe@example.com' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'user-123', ...newUser } }),
    });

    await createUser(newUser);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/users',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(newUser),
      })
    );
  });
}); 
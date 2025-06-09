# Testing Standards for RFI Ware

## Mandatory Linting Rules for Test Files

### 1. TypeScript Standards
- Never use `any` - use proper types
- Import all types explicitly: `import type { ComponentType } from 'react'`
- Use proper interface definitions for all props
- All variables must have explicit or inferred types

### 2. Required Imports (EXACT ORDER)
```typescript
// 1. React imports first
import React from 'react';

// 2. Testing library imports
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// 3. Jest imports
import { jest } from '@jest/globals';

// 4. Internal imports with @ paths
import { RFIForm } from '@/components/rfi/RFIForm';
import type { RFI, Project } from '@/lib/types';

// 5. Relative imports last
import './test-utils';
```

### 3. Test Structure Standards
```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Always clear mocks and localStorage
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('descriptive test name', async () => {
    // Arrange
    render(<Component />);
    
    // Act
    const element = await screen.findByTestId('element-id');
    await userEvent.click(element);
    
    // Assert
    expect(element).toBeInTheDocument();
  });
});
```

### 4. Async Testing Rules
- Always use await with user interactions: `await userEvent.type()`
- Always use await with findBy queries: `await screen.findByText()`
- Use `waitFor()` for complex async operations
- Use proper timeouts: `{ timeout: 3000 }`

### 5. Mock Standards
```typescript
// Proper mock setup
const mockFunction = jest.fn();
const mockUseHook = jest.fn(() => ({
  data: mockData,
  loading: false,
  error: null
}));

// Mock modules correctly
jest.mock('@/hooks/useProjects', () => ({
  useProjects: mockUseHook
}));
```

### 6. Assertion Standards
- Use specific assertions: `.toHaveValue()`, `.toBeInTheDocument()`
- Use async assertions: `await screen.findByText()`
- Include timeout for flaky tests: `{ timeout: 5000 }`
- Use descriptive error messages

### 7. Variable Naming
- Use descriptive names: `subjectInput`, `submitButton`
- Use camelCase consistently
- Avoid abbreviations: `userEvent` not `ue`

### 8. Debugging Standards
- Use `screen.debug()` for DOM inspection
- Use `console.log()` with descriptive labels
- Remove all debugging before final commit
- Use `screen.logTestingPlaygroundURL()` for complex queries

## Before Writing Any Test:
✅ All imports are correctly ordered and typed
✅ All variables have proper types
✅ All async operations use await
✅ All user interactions are properly awaited
✅ Test structure follows describe/test pattern
✅ Mocks are properly configured
✅ Assertions use correct testing library methods 
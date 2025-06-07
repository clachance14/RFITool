import React from 'react'
import { render as rtlRender, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

function render(ui: React.ReactElement, options = {}) {
  const user = userEvent.setup()
  return {
    user,
    ...rtlRender(ui, options),
  }
}

// Re-export everything
export * from '@testing-library/react'

// Override render method
export { render, screen } 
import React from 'react'
import { render, screen } from '@/lib/test-utils'
import { Alert, AlertTitle, AlertDescription } from '../alert'

describe('Alert', () => {
  it('renders with default props', () => {
    render(
      <Alert>
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>This is a default alert message.</AlertDescription>
      </Alert>
    )
    expect(screen.getByText('Default Alert')).toBeInTheDocument()
    expect(screen.getByText('This is a default alert message.')).toBeInTheDocument()
  })

  it('renders with different variants', () => {
    const { rerender } = render(
      <Alert variant="destructive">
        <AlertTitle>Destructive Alert</AlertTitle>
        <AlertDescription>This is a destructive alert message.</AlertDescription>
      </Alert>
    )
    expect(screen.getByRole('alert')).toHaveClass('border-destructive/50')

    rerender(
      <Alert variant="success">
        <AlertTitle>Success Alert</AlertTitle>
        <AlertDescription>This is a success alert message.</AlertDescription>
      </Alert>
    )
    expect(screen.getByRole('alert')).toHaveClass('border-green-500/50')

    rerender(
      <Alert variant="warning">
        <AlertTitle>Warning Alert</AlertTitle>
        <AlertDescription>This is a warning alert message.</AlertDescription>
      </Alert>
    )
    expect(screen.getByRole('alert')).toHaveClass('border-yellow-500/50')

    rerender(
      <Alert variant="info">
        <AlertTitle>Info Alert</AlertTitle>
        <AlertDescription>This is an info alert message.</AlertDescription>
      </Alert>
    )
    expect(screen.getByRole('alert')).toHaveClass('border-blue-500/50')
  })

  it('applies custom className', () => {
    render(
      <Alert className="custom-class">
        <AlertTitle>Custom Alert</AlertTitle>
        <AlertDescription>This is a custom alert message.</AlertDescription>
      </Alert>
    )
    expect(screen.getByRole('alert')).toHaveClass('custom-class')
  })

  it('maintains accessibility attributes', () => {
    render(
      <Alert
        role="alert"
        aria-label="Custom Alert"
        data-testid="test-alert"
      >
        <AlertTitle>Accessible Alert</AlertTitle>
        <AlertDescription>This is an accessible alert message.</AlertDescription>
      </Alert>
    )
    const alert = screen.getByTestId('test-alert')
    expect(alert).toHaveAttribute('role', 'alert')
    expect(alert).toHaveAttribute('aria-label', 'Custom Alert')
  })

  it('renders with icon', () => {
    render(
      <Alert>
        <AlertTitle>Alert with Icon</AlertTitle>
        <AlertDescription>This alert has an icon.</AlertDescription>
      </Alert>
    )
    const svg = screen.getByRole('alert').querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('renders AlertTitle with correct styling', () => {
    render(
      <Alert>
        <AlertTitle>Styled Title</AlertTitle>
        <AlertDescription>Description</AlertDescription>
      </Alert>
    )
    const title = screen.getByText('Styled Title')
    expect(title).toHaveClass('font-medium')
  })

  it('renders AlertDescription with correct styling', () => {
    render(
      <Alert>
        <AlertTitle>Title</AlertTitle>
        <AlertDescription>Styled Description</AlertDescription>
      </Alert>
    )
    const description = screen.getByText('Styled Description')
    expect(description).toHaveClass('text-sm')
  })

  it('handles nested content', () => {
    render(
      <Alert>
        <AlertTitle>Nested Content</AlertTitle>
        <AlertDescription>
          <p>Paragraph 1</p>
          <p>Paragraph 2</p>
        </AlertDescription>
      </Alert>
    )
    expect(screen.getByText('Paragraph 1')).toBeInTheDocument()
    expect(screen.getByText('Paragraph 2')).toBeInTheDocument()
  })
}) 
import React from 'react'
import { render, screen } from '@/lib/test-utils'
import { Badge } from '../badge'

describe('Badge', () => {
  it('renders with default props', () => {
    render(<Badge>Default Badge</Badge>)
    const badge = screen.getByText('Default Badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-primary')
  })

  it('renders with different variants', () => {
    const { rerender } = render(<Badge variant="secondary">Secondary</Badge>)
    expect(screen.getByText('Secondary')).toHaveClass('bg-secondary')

    rerender(<Badge variant="destructive">Destructive</Badge>)
    expect(screen.getByText('Destructive')).toHaveClass('bg-destructive')

    rerender(<Badge variant="outline">Outline</Badge>)
    expect(screen.getByText('Outline')).toHaveClass('text-foreground')

    rerender(<Badge variant="success">Success</Badge>)
    expect(screen.getByText('Success')).toHaveClass('bg-green-500')

    rerender(<Badge variant="warning">Warning</Badge>)
    expect(screen.getByText('Warning')).toHaveClass('bg-yellow-500')

    rerender(<Badge variant="info">Info</Badge>)
    expect(screen.getByText('Info')).toHaveClass('bg-blue-500')
  })

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>)
    expect(screen.getByText('Custom Badge')).toHaveClass('custom-class')
  })

  it('maintains accessibility attributes', () => {
    render(
      <Badge
        role="status"
        aria-label="Status"
        data-testid="test-badge"
      >
        Status Badge
      </Badge>
    )
    const badge = screen.getByTestId('test-badge')
    expect(badge).toHaveAttribute('role', 'status')
    expect(badge).toHaveAttribute('aria-label', 'Status')
  })

  it('handles focus states', () => {
    render(<Badge tabIndex={0}>Focusable Badge</Badge>)
    const badge = screen.getByText('Focusable Badge')
    expect(badge).toHaveClass('focus:ring-2')
    expect(badge).toHaveAttribute('tabIndex', '0')
  })

  it('renders with children', () => {
    render(
      <Badge>
        <span>Child Element</span>
      </Badge>
    )
    expect(screen.getByText('Child Element')).toBeInTheDocument()
  })

  it('applies hover styles', () => {
    render(<Badge>Hover Badge</Badge>)
    const badge = screen.getByText('Hover Badge')
    expect(badge).toHaveClass('hover:bg-primary/80')
  })
}) 
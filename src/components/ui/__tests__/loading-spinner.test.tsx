import React from 'react'
import { render, screen } from '@/lib/test-utils'
import { LoadingSpinner } from '../loading-spinner'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    expect(screen.getByRole('status')).toHaveClass('h-4 w-4')

    rerender(<LoadingSpinner size="md" />)
    expect(screen.getByRole('status')).toHaveClass('h-8 w-8')

    rerender(<LoadingSpinner size="lg" />)
    expect(screen.getByRole('status')).toHaveClass('h-12 w-12')
  })

  it('renders with different variants', () => {
    const { rerender } = render(<LoadingSpinner variant="default" />)
    expect(screen.getByRole('status')).toHaveClass('text-gray-400')

    rerender(<LoadingSpinner variant="primary" />)
    expect(screen.getByRole('status')).toHaveClass('text-primary')

    rerender(<LoadingSpinner variant="secondary" />)
    expect(screen.getByRole('status')).toHaveClass('text-secondary')
  })

  it('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />)
    expect(screen.getByRole('status')).toHaveClass('custom-class')
  })

  it('maintains accessibility attributes', () => {
    render(
      <LoadingSpinner
        aria-label="Loading content"
        data-testid="test-spinner"
      />
    )
    const spinner = screen.getByTestId('test-spinner')
    expect(spinner).toHaveAttribute('role', 'status')
    expect(spinner).toHaveAttribute('aria-label', 'Loading content')
  })

  it('includes screen reader text', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('Loading...')).toHaveClass('sr-only')
  })

  it('renders SVG with correct attributes', () => {
    render(<LoadingSpinner />)
    const svg = screen.getByRole('status').querySelector('svg')
    expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg')
    expect(svg).toHaveAttribute('fill', 'none')
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
  })

  it('renders circle and path elements', () => {
    render(<LoadingSpinner />)
    const svg = screen.getByRole('status').querySelector('svg')
    expect(svg?.querySelector('circle')).toBeInTheDocument()
    expect(svg?.querySelector('path')).toBeInTheDocument()
  })
}) 
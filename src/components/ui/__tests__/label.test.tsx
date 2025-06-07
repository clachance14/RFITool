import React from 'react'
import { render, screen } from '@/lib/test-utils'
import { Label } from '../label'

describe('Label', () => {
  it('renders with default props', () => {
    render(<Label>Test Label</Label>)
    const label = screen.getByText('Test Label')
    expect(label).toBeInTheDocument()
    expect(label).toHaveClass('text-sm font-medium')
  })

  it('applies custom className', () => {
    render(<Label className="custom-class">Test Label</Label>)
    expect(screen.getByText('Test Label')).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLLabelElement>()
    render(<Label ref={ref}>Test Label</Label>)
    expect(ref.current).toBeInstanceOf(HTMLLabelElement)
  })

  it('handles htmlFor attribute', () => {
    render(<Label htmlFor="test-input">Test Label</Label>)
    const label = screen.getByText('Test Label')
    expect(label).toHaveAttribute('for', 'test-input')
  })

  it('maintains accessibility attributes', () => {
    render(
      <Label
        aria-label="Test Label"
        data-testid="test-label"
      >
        Test Label
      </Label>
    )
    const label = screen.getByTestId('test-label')
    expect(label).toHaveAttribute('aria-label', 'Test Label')
  })

  it('handles disabled state when used with disabled input', () => {
    render(
      <div>
        <Label htmlFor="test-input">Test Label</Label>
        <input id="test-input" disabled />
      </div>
    )
    const label = screen.getByText('Test Label')
    expect(label).toHaveClass('peer-disabled:opacity-70')
  })
}) 
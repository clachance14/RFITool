import React from 'react'
import { render, screen } from '@/lib/test-utils'
import { Input } from '../input'

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('h-10')
  })

  it('handles different input types', () => {
    const { rerender } = render(<Input type="text" placeholder="text" />)
    expect(screen.getByPlaceholderText('text')).toHaveAttribute('type', 'text')

    rerender(<Input type="password" placeholder="password" />)
    expect(screen.getByPlaceholderText('password')).toHaveAttribute('type', 'password')

    rerender(<Input type="email" placeholder="email" />)
    expect(screen.getByPlaceholderText('email')).toHaveAttribute('type', 'email')

    rerender(<Input type="number" />)
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number')

    rerender(<Input type="file" aria-label="Upload" />)
    expect(screen.getByLabelText('Upload')).toHaveAttribute('type', 'file')
  })

  it('handles disabled state', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:opacity-50')
  })

  it('handles value changes', async () => {
    const { user } = render(<Input />)
    const input = screen.getByRole('textbox')
    
    await user.type(input, 'Hello, World!')
    expect(input).toHaveValue('Hello, World!')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>()
    render(<Input ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })

  it('applies custom className', () => {
    render(<Input className="custom-class" />)
    expect(screen.getByRole('textbox')).toHaveClass('custom-class')
  })

  it('maintains accessibility attributes', () => {
    render(
      <Input
        aria-label="Username"
        data-testid="test-input"
        required
      />
    )
    const input = screen.getByTestId('test-input')
    expect(input).toHaveAttribute('aria-label', 'Username')
    expect(input).toBeRequired()
  })

  it('handles file input type', () => {
    render(<Input type="file" aria-label="Upload file" data-testid="file-input" />)
    const input = screen.getByTestId('file-input')
    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveClass('file:border-0')
  })

  it('handles placeholder text', () => {
    render(<Input placeholder="Enter your name" />)
    const input = screen.getByPlaceholderText('Enter your name')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('placeholder:text-muted-foreground')
  })

  it('handles focus and blur events', async () => {
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    const { user } = render(
      <Input
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    )
    const input = screen.getByRole('textbox')
    
    await user.click(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)
    
    await user.tab()
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })
}) 
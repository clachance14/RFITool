import React from 'react'
import { render, screen } from '@/lib/test-utils'
import { act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from '../textarea'

describe('Textarea', () => {
  it('renders with default props', () => {
    render(<Textarea placeholder="Enter text" />)
    const textarea = screen.getByPlaceholderText('Enter text')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveClass('min-h-[80px]')
  })

  it('handles value changes', async () => {
    const { user } = render(<Textarea />)
    const textarea = screen.getByRole('textbox')
    
    await act(async () => {
      await user.type(textarea, 'Hello, World!')
    })
    expect(textarea).toHaveValue('Hello, World!')
  })

  it('shows character count when enabled', async () => {
    const { user } = render(
      <Textarea maxLength={100} showCount placeholder="Enter text" />
    )
    const textarea = screen.getByPlaceholderText('Enter text')
    
    await act(async () => {
      await user.type(textarea, 'Hello')
    })
    expect(screen.getByText('5/100')).toBeInTheDocument()
  })

  it('respects maxLength prop', async () => {
    const { user } = render(
      <Textarea maxLength={5} placeholder="Enter text" />
    )
    const textarea = screen.getByPlaceholderText('Enter text')
    
    await act(async () => {
      await user.type(textarea, 'Hello, World!')
    })
    expect(textarea).toHaveValue('Hello')
  })

  it('handles disabled state', () => {
    render(<Textarea disabled placeholder="Enter text" />)
    const textarea = screen.getByPlaceholderText('Enter text')
    expect(textarea).toBeDisabled()
    expect(textarea).toHaveClass('disabled:opacity-50')
  })

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLTextAreaElement>()
    render(<Textarea ref={ref} />)
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement)
  })

  it('applies custom className', () => {
    render(<Textarea className="custom-class" />)
    expect(screen.getByRole('textbox')).toHaveClass('custom-class')
  })

  it('maintains accessibility attributes', () => {
    render(
      <Textarea
        aria-label="Description"
        data-testid="test-textarea"
        required
      />
    )
    const textarea = screen.getByTestId('test-textarea')
    expect(textarea).toHaveAttribute('aria-label', 'Description')
    expect(textarea).toBeRequired()
  })

  it('handles initial value with character count', () => {
    render(
      <Textarea
        maxLength={100}
        showCount
        value="Initial text"
      />
    )
    expect(screen.getByText('12/100')).toBeInTheDocument()
  })

  it('updates character count on controlled value change', () => {
    const { rerender } = render(
      <Textarea
        maxLength={100}
        showCount
        value="Initial text"
      />
    )
    expect(screen.getByText('12/100')).toBeInTheDocument()

    rerender(
      <Textarea
        maxLength={100}
        showCount
        value="Updated text"
      />
    )
    expect(screen.getByText('12/100')).toBeInTheDocument()
  })
}) 
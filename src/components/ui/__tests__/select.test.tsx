import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  SelectComponent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select'

// Mock browser APIs that are not available in JSDOM
const mockResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
window.ResizeObserver = mockResizeObserver

describe('Select Component', () => {
  it('renders select with options', async () => {
    render(
      <SelectComponent id="test-select">
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectGroup>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectGroup>
      </SelectComponent>
    )

    const trigger = screen.getByRole('combobox')
    expect(trigger).toBeInTheDocument()

    await userEvent.click(trigger)

    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('handles selection', async () => {
    render(
      <SelectComponent id="test-select">
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectGroup>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectGroup>
      </SelectComponent>
    )

    const trigger = screen.getByRole('combobox')
    await userEvent.click(trigger)
    await userEvent.click(screen.getByText('Option 1'))

    expect(trigger).toHaveTextContent('Option 1')
  })
}) 
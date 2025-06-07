import React from 'react'
import { render, screen, act } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../modal'

describe('Dialog', () => {
  it('renders trigger button', () => {
    render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
      </Dialog>
    )
    expect(screen.getByText('Open Dialog')).toBeInTheDocument()
  })

  it('opens dialog on trigger click', async () => {
    const { user } = render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog Description</DialogDescription>
          </DialogHeader>
          <div>Dialog Content</div>
          <DialogFooter data-testid="dialog-footer">Dialog Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    )

    await act(async () => {
      await user.click(screen.getByText('Open Dialog'))
    })
    
    expect(await screen.findByText('Dialog Title')).toBeInTheDocument()
    expect(await screen.findByText('Dialog Description')).toBeInTheDocument()
    expect(await screen.findByText('Dialog Content')).toBeInTheDocument()
    expect(await screen.findByTestId('dialog-footer')).toBeInTheDocument()
  })

  it('closes dialog when clicking close button', async () => {
    const { user } = render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )

    await act(async () => {
      await user.click(screen.getByText('Open Dialog'))
    })
    expect(await screen.findByText('Dialog Title')).toBeInTheDocument()

    await act(async () => {
      await user.click(await screen.findByRole('button', { name: 'Close' }))
    })
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
  })

  it('closes dialog when clicking overlay', async () => {
    const { user } = render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )

    await act(async () => {
      await user.click(screen.getByText('Open Dialog'))
    })
    expect(await screen.findByText('Dialog Title')).toBeInTheDocument()

    const overlay = screen.getByTestId('dialog-overlay')
    expect(overlay).toBeInTheDocument()
    
    await act(async () => {
      await user.click(overlay)
    })
    expect(await screen.queryByText('Dialog Title')).not.toBeInTheDocument()
  })

  it('applies custom className to content', async () => {
    const { user } = render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent className="custom-class">
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    await act(async () => {
      await user.click(screen.getByText('Open Dialog'))
    })
    const content = await screen.findByRole('dialog')
    expect(content).toHaveClass('custom-class')
  })

  it('maintains accessibility attributes', async () => {
    const { user } = render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent aria-label="Custom Dialog">
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    await act(async () => {
      await user.click(screen.getByText('Open Dialog'))
    })
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-label', 'Custom Dialog')
  })

  it('handles keyboard navigation', async () => {
    const { user } = render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )

    await act(async () => {
      await user.click(screen.getByText('Open Dialog'))
    })
    expect(await screen.findByText('Dialog Title')).toBeInTheDocument()
    
    await act(async () => {
      await user.keyboard('{Escape}')
    })
    expect(screen.queryByText('Dialog Title')).not.toBeInTheDocument()
  })

  it('renders with different header alignments', async () => {
    const { user } = render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader className="text-center">
            <DialogTitle>Centered Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    await act(async () => {
      await user.click(screen.getByText('Open Dialog'))
    })
    const header = (await screen.findByText((content, element) =>
      element?.tagName.toLowerCase() === 'h2' && /centered title/i.test(content)
    )).parentElement
    expect(header).toHaveClass('text-center')
  })

  it('renders footer with correct layout', async () => {
    const { user } = render(
      <Dialog>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogFooter data-testid="dialog-footer">
            <button>Cancel</button>
            <button>Confirm</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
    await act(async () => {
      await user.click(screen.getByText('Open Dialog'))
    })
    const footer = await screen.findByTestId('dialog-footer')
    expect(footer).toHaveClass('flex-col-reverse')
  })
}) 
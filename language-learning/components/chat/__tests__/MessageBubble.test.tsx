import { render, screen } from '@testing-library/react'
import MessageBubble from '../MessageBubble'

describe('MessageBubble', () => {
  const defaultProps = {
    text: 'Hello, world!',
    isMe: false,
    partnerFirstName: 'John',
    partnerLastName: 'Doe',
    partnerAvatarUrl: '/test-avatar.jpg',
  }

  it('renders the message text', () => {
    render(<MessageBubble {...defaultProps} />)
    expect(screen.getByText('Hello, world!')).toBeInTheDocument()
  })

  it('displays partner avatar when message is not from me', () => {
    render(<MessageBubble {...defaultProps} />)
    const avatar = screen.getByAltText('John Doe avatar')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', '/test-avatar.jpg')
  })

  it('does not display avatar when message is from me', () => {
    render(<MessageBubble {...defaultProps} isMe={true} />)
    expect(screen.queryByAltText('John Doe avatar')).not.toBeInTheDocument()
  })

  it('displays time when provided', () => {
    render(<MessageBubble {...defaultProps} time="10:30 AM" />)
    expect(screen.getByText('10:30 AM')).toBeInTheDocument()
  })

  it('does not display time when not provided', () => {
    const { container } = render(<MessageBubble {...defaultProps} />)
    // Time should not be rendered
    const timeElements = container.querySelectorAll('.text-xs.text-gray-muted-2')
    expect(timeElements.length).toBe(0)
  })

  it('uses default avatar when partnerAvatarUrl is null', () => {
    render(
      <MessageBubble
        {...defaultProps}
        partnerAvatarUrl={null}
      />
    )
    const avatar = screen.getByAltText('John Doe avatar')
    expect(avatar).toHaveAttribute('src', '/default-avatar.jpg')
  })

  it('applies correct styling for my messages', () => {
    const { container } = render(
      <MessageBubble {...defaultProps} isMe={true} />
    )
    const bubble = container.querySelector('.bg-blue-dark')
    expect(bubble).toBeInTheDocument()
    expect(bubble).toHaveClass('text-white')
  })

  it('applies correct styling for partner messages', () => {
    const { container } = render(
      <MessageBubble {...defaultProps} isMe={false} />
    )
    const bubble = container.querySelector('.bg-gray-soft-2')
    expect(bubble).toBeInTheDocument()
    expect(bubble).toHaveClass('text-gray-text')
  })

  it('handles multiline text correctly', () => {
    const multilineText = 'Line 1\nLine 2\nLine 3'
    render(<MessageBubble {...defaultProps} text={multilineText} />)
    // Check that all lines are present (getByText normalizes whitespace)
    expect(screen.getByText(/Line 1/)).toBeInTheDocument()
    expect(screen.getByText(/Line 2/)).toBeInTheDocument()
    expect(screen.getByText(/Line 3/)).toBeInTheDocument()
  })
})

import { render, screen, act } from '@testing-library/react'
import { Timer } from '@/components/exam/Timer'

jest.useFakeTimers()

describe('Timer', () => {
  const mockOnTimeUp = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  it('displays initial time correctly', () => {
    const timeRemainingMs = 5 * 60 * 1000 // 5 minutes
    const durasi = 10 // 10 minutes

    render(<Timer timeRemainingMs={timeRemainingMs} durasi={durasi} onTimeUp={mockOnTimeUp} />)

    expect(screen.getByText('05:00')).toBeInTheDocument()
  })

  it('displays time in MM:SS format', () => {
    const timeRemainingMs = 62000 // 1 minute 2 seconds
    const durasi = 10

    render(<Timer timeRemainingMs={timeRemainingMs} durasi={durasi} onTimeUp={mockOnTimeUp} />)

    expect(screen.getByText('01:02')).toBeInTheDocument()
  })

  it('counts down over time', () => {
    const timeRemainingMs = 5000 // 5 seconds
    const durasi = 10

    render(<Timer timeRemainingMs={timeRemainingMs} durasi={durasi} onTimeUp={mockOnTimeUp} />)

    expect(screen.getByText('00:05')).toBeInTheDocument()

    act(() => {
      jest.advanceTimersByTime(2000)
    })

    expect(screen.getByText('00:03')).toBeInTheDocument()
  })

  it('calls onTimeUp when timer reaches zero', () => {
    const timeRemainingMs = 1000 // 1 second
    const durasi = 10

    render(<Timer timeRemainingMs={timeRemainingMs} durasi={durasi} onTimeUp={mockOnTimeUp} />)

    act(() => {
      jest.advanceTimersByTime(1500)
    })

    expect(mockOnTimeUp).toHaveBeenCalledTimes(1)
  })

  it('applies warning state at 10%', () => {
    const durasi = 10 * 60 // 10 minutes = 600 seconds
    const timeRemainingMs = 60 * 1000 // 1 minute = 10% of duration

    render(<Timer timeRemainingMs={timeRemainingMs} durasi={durasi} onTimeUp={mockOnTimeUp} />)

    const timerElement = screen.getByText('01:00')
    expect(timerElement).toHaveClass('text-red-600')
    expect(timerElement).toHaveClass('animate-pulse')
  })

  it('does not apply warning state when above 10%', () => {
    const durasi = 10 * 60 // 10 minutes = 600 seconds
    const timeRemainingMs = 120 * 1000 // 2 minutes = 20% of duration

    render(<Timer timeRemainingMs={timeRemainingMs} durasi={durasi} onTimeUp={mockOnTimeUp} />)

    const timerElement = screen.getByText('02:00')
    expect(timerElement).toHaveClass('text-gray-900')
    expect(timerElement).not.toHaveClass('text-red-600')
  })

  it('displays zero time correctly', () => {
    const timeRemainingMs = 0
    const durasi = 10

    render(<Timer timeRemainingMs={timeRemainingMs} durasi={durasi} onTimeUp={mockOnTimeUp} />)

    expect(screen.getByText('00:00')).toBeInTheDocument()
  })
})

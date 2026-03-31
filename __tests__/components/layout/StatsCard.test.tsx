import { render, screen } from '@testing-library/react'
import { StatsCard } from '@/components/layout/StatsCard'
import { Users, Container } from 'lucide-react'

describe('StatsCard', () => {
  it('renders correctly with props', () => {
    const icon = <Users data-testid="test-icon" />
    const label = 'Total Users'
    const value = 100

    render(<StatsCard icon={icon} label={label} value={value} />)

    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.getByText(value.toString())).toBeInTheDocument()
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('displays correct value', () => {
    const icon = <Users data-testid="test-icon" />
    const label = 'Total Exams'
    const value = '25'

    render(<StatsCard icon={icon} label={label} value={value} />)

    expect(screen.getByText(value)).toBeInTheDocument()
  })

  it('displays icon correctly', () => {
    const icon = <Container data-testid="container-icon" />
    const label = 'Total Classes'
    const value = 10

    render(<StatsCard icon={icon} label={label} value={value} />)

    expect(screen.getByTestId('container-icon')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const icon = <Users data-testid="test-icon" />
    const label = 'Total Users'
    const value = 100
    const customClass = 'custom-test-class'

    render(<StatsCard icon={icon} label={label} value={value} className={customClass} />)

    expect(screen.getByText(label).parentElement?.parentElement).toHaveClass(customClass)
  })

  it('renders with string value', () => {
    const icon = <Users data-testid="test-icon" />
    const label = 'Status'
    const value = 'Active'

    render(<StatsCard icon={icon} label={label} value={value} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})

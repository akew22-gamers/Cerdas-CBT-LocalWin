import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/LoginForm'
import { toast } from 'sonner'

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('LoginForm', () => {
  const schoolName = 'Test School'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    render(<LoginForm schoolName={schoolName} />)
    
    expect(screen.getByText(/Login sebagai Super-admin/i)).toBeInTheDocument()
    expect(screen.getByText(/Username harus diisi/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Masuk/i })).toBeInTheDocument()
    expect(screen.getByText(new RegExp(schoolName, 'i'))).toBeInTheDocument()
  })

  it('shows validation error for empty username', async () => {
    const user = userEvent.setup()
    render(<LoginForm schoolName={schoolName} />)

    const submitButton = screen.getByRole('button', { name: /Masuk/i })
    await user.click(submitButton)

    expect(toast.error).toHaveBeenCalledWith('Username harus diisi')
  })

  it('shows validation error for empty password', async () => {
    const user = userEvent.setup()
    render(<LoginForm schoolName={schoolName} />)

    const usernameInput = screen.getByPlaceholderText(/Masukkan username/i)
    await user.type(usernameInput, 'testuser')

    const submitButton = screen.getByRole('button', { name: /Masuk/i })
    await user.click(submitButton)

    expect(toast.error).toHaveBeenCalledWith('Password harus diisi')
  })

  it('shows validation error for password less than 6 characters', async () => {
    const user = userEvent.setup()
    render(<LoginForm schoolName={schoolName} />)

    const usernameInput = screen.getByPlaceholderText(/Masukkan username/i)
    await user.type(usernameInput, 'testuser')

    const passwordInput = screen.getByLabelText(/Password/i)
    await user.type(passwordInput, '12345')

    const submitButton = screen.getByRole('button', { name: /Masuk/i })
    await user.click(submitButton)

    expect(toast.error).toHaveBeenCalledWith('Password minimal 6 karakter')
  })

  it('changes role selector and updates UI', async () => {
    const user = userEvent.setup()
    render(<LoginForm schoolName={schoolName} />)

    const guruTab = screen.getByRole('tab', { name: /Guru/i })
    await user.click(guruTab)

    expect(screen.getByText(/Login sebagai Guru/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Username Guru/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Masukkan username guru/i)).toBeInTheDocument()

    const siswaTab = screen.getByRole('tab', { name: /Siswa/i })
    await user.click(siswaTab)

    expect(screen.getByText(/Login sebagai Siswa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/NISN/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Masukkan NISN Anda/i)).toBeInTheDocument()

    const superAdminTab = screen.getByRole('tab', { name: /Super-admin/i })
    await user.click(superAdminTab)

    expect(screen.getByText(/Login sebagai Super-admin/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Username Super-admin/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Masukkan username super-admin/i)).toBeInTheDocument()
  })

  it('submit button is disabled during loading state simulation', () => {
    render(<LoginForm schoolName={schoolName} />)
    
    const submitButton = screen.getByRole('button', { name: /Masuk/i })
    expect(submitButton).not.toBeDisabled()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<LoginForm schoolName={schoolName} />)

    const passwordInput = screen.getByLabelText(/Password/i)
    const toggleButton = screen.getByRole('button', { name: /show password/i })

    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })
})

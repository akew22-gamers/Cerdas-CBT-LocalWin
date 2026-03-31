import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KelasForm } from '@/components/kelas/KelasForm'
import { toast } from 'sonner'

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}))

const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

describe('KelasForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form correctly in create mode', () => {
    render(<KelasForm mode="create" />)

    expect(screen.getByLabelText(/Nama Kelas/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Contoh: X IPA 1/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Buat Kelas/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Batal/i })).toBeInTheDocument()
  })

  it('renders form correctly in edit mode with initial data', () => {
    const initialData = {
      id: '123',
      nama_kelas: 'X IPA 1',
    }

    render(<KelasForm mode="edit" initialData={initialData} />)

    expect(screen.getByLabelText(/Nama Kelas/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('X IPA 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Simpan Perubahan/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Batal/i })).toBeInTheDocument()
  })

  it('shows validation error for empty nama_kelas', async () => {
    const user = userEvent.setup()
    render(<KelasForm mode="create" />)

    const submitButton = screen.getByRole('button', { name: /Buat Kelas/i })
    await user.click(submitButton)

    expect(toast.error).toHaveBeenCalledWith('Nama kelas harus diisi')
  })

  it('calls correct function on submit in create mode', async () => {
    const user = userEvent.setup()
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    ) as jest.Mock

    render(<KelasForm mode="create" />)

    const input = screen.getByLabelText(/Nama Kelas/i)
    await user.type(input, 'XII IPA 1')

    const submitButton = screen.getByRole('button', { name: /Buat Kelas/i })
    await user.click(submitButton)

    expect(global.fetch).toHaveBeenCalledWith('/api/guru/kelas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nama_kelas: 'XII IPA 1',
      }),
    })

    await screen.findByText(/Kelas berhasil dibuat/i, undefined, { timeout: 1000 })
    expect(toast.success).toHaveBeenCalled()
  })

  it('calls correct function on submit in edit mode', async () => {
    const user = userEvent.setup()
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    ) as jest.Mock

    const initialData = {
      id: '123',
      nama_kelas: 'X IPA 1',
    }

    render(<KelasForm mode="edit" initialData={initialData} />)

    const input = screen.getByLabelText(/Nama Kelas/i)
    await user.clear(input)
    await user.type(input, 'Updated Class')

    const submitButton = screen.getByRole('button', { name: /Simpan Perubahan/i })
    await user.click(submitButton)

    expect(global.fetch).toHaveBeenCalledWith('/api/guru/kelas/123', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nama_kelas: 'Updated Class',
      }),
    })
  })

  it('navigates back on cancel button click', async () => {
    const user = userEvent.setup()
    render(<KelasForm mode="create" />)

    const cancelButton = screen.getByRole('button', { name: /Batal/i })
    await user.click(cancelButton)

    expect(mockPush).toHaveBeenCalledWith('/guru/kelas')
  })

  it('disables inputs while loading', async () => {
    const user = userEvent.setup()
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    ) as jest.Mock

    render(<KelasForm mode="create" />)

    const input = screen.getByLabelText(/Nama Kelas/i)
    await user.type(input, 'Test Class')

    const submitButton = screen.getByRole('button', { name: /Buat Kelas/i })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
    expect(input).toBeDisabled()
  })
})

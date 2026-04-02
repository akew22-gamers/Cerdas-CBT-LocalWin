'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Image from 'next/image'
import { Database, RefreshCw, Plus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type SetupStep = 'database' | 'admin' | 'sekolah' | 'confirm'
type DatabaseState = 'checking' | 'ready' | 'has_data' | 'empty' | 'error'

interface SchoolData {
  nama_sekolah: string
  npsn: string
  alamat: string
  telepon: string
  email: string
  website: string
  kepala_sekolah: string
  tahun_ajaran: string
}

interface AdminData {
  username: string
  password: string
  confirmPassword: string
  nama: string
}

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<SetupStep>('database')
  const [isLoading, setIsLoading] = useState(false)
  const [dbState, setDbState] = useState<DatabaseState>('checking')
  const [dbMessage, setDbMessage] = useState('')
  const [selectedAction, setSelectedAction] = useState<'ready' | 'reset' | 'init' | null>(null)
  
  const [adminData, setAdminData] = useState<AdminData>({
    username: '',
    password: '',
    confirmPassword: '',
    nama: 'Administrator'
  })
  
  const [schoolData, setSchoolData] = useState<SchoolData>({
    nama_sekolah: '',
    npsn: '',
    alamat: '',
    telepon: '',
    email: '',
    website: '',
    kepala_sekolah: '',
    tahun_ajaran: '2025/2026'
  })

  useEffect(() => {
    checkDatabase()
  }, [])

  const checkDatabase = async () => {
    setDbState('checking')
    try {
      const res = await fetch('/api/setup/database-check')
      const data = await res.json()
      
      if (data.success) {
        setDbState(data.data.state)
        setDbMessage(data.data.message)
      } else {
        setDbState('error')
        setDbMessage(data.error?.message || 'Gagal memeriksa database')
      }
    } catch {
      setDbState('error')
      setDbMessage('Tidak dapat terhubung ke database')
    }
  }

  const handleDatabaseAction = async () => {
    if (!selectedAction) return

    setIsLoading(true)
    try {
      if (selectedAction === 'reset') {
        const res = await fetch('/api/setup/database-reset', { method: 'POST' })
        const data = await res.json()
        
        if (data.success) {
          toast.success('Database berhasil di-reset')
          setCurrentStep('admin')
        } else {
          toast.error(data.error?.message || 'Gagal mereset database')
        }
      } else if (selectedAction === 'init') {
        const res = await fetch('/api/setup/database-init', { method: 'POST' })
        const data = await res.json()
        
        if (data.success) {
          toast.success('Database berhasil diinisialisasi')
          setCurrentStep('admin')
        } else {
          toast.error(data.error?.message || 'Gagal menginisialisasi database')
        }
      } else if (selectedAction === 'ready') {
        setCurrentStep('admin')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteSetup = async () => {
    if (adminData.password !== adminData.confirmPassword) {
      toast.error('Password tidak cocok')
      return
    }

    if (adminData.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          super_admin: {
            username: adminData.username,
            password: adminData.password,
            nama: adminData.nama
          },
          sekolah: schoolData
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        toast.success('Setup berhasil! Mengalihkan ke login...')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        toast.error(data.error?.message || 'Setup gagal')
      }
    } catch {
      toast.error('Terjadi kesalahan saat setup')
    } finally {
      setIsLoading(false)
    }
  }

  const canProceedToAdmin = adminData.username.trim() && adminData.password && adminData.confirmPassword
  const canProceedToConfirm = schoolData.nama_sekolah.trim() && schoolData.tahun_ajaran.trim()

  const renderDatabaseStep = () => (
    <div className="space-y-6">
      {dbState === 'checking' && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Memeriksa status database...</p>
        </div>
      )}

      {dbState === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-semibold text-red-800 mb-2">Koneksi Database Gagal</h3>
          <p className="text-red-600 text-sm mb-4">{dbMessage}</p>
          <Button onClick={checkDatabase} variant="outline">
            Coba Lagi
          </Button>
        </div>
      )}

      {(dbState === 'ready' || dbState === 'has_data' || dbState === 'empty') && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Database className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800">Status Database</h3>
                <p className="text-blue-600 text-sm">{dbMessage}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Pilih Aksi:</Label>
            
            {dbState === 'ready' && (
              <div
                onClick={() => setSelectedAction('ready')}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedAction === 'ready' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className={`w-6 h-6 ${selectedAction === 'ready' ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium">Database sudah siap</p>
                    <p className="text-sm text-gray-500">Lanjutkan setup dengan database yang ada</p>
                  </div>
                </div>
              </div>
            )}

            {(dbState === 'ready' || dbState === 'has_data') && (
              <div
                onClick={() => setSelectedAction('reset')}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedAction === 'reset' 
                    ? 'border-amber-500 bg-amber-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <RefreshCw className={`w-6 h-6 ${selectedAction === 'reset' ? 'text-amber-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium">Reset database</p>
                    <p className="text-sm text-gray-500">Hapus semua data lama dan mulai dari awal</p>
                  </div>
                </div>
              </div>
            )}

            {dbState === 'empty' && (
              <div
                onClick={() => setSelectedAction('init')}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedAction === 'init' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Plus className={`w-6 h-6 ${selectedAction === 'init' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="font-medium">Buat tabel baru</p>
                    <p className="text-sm text-gray-500">Inisialisasi database dengan struktur tabel yang diperlukan</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/logo_kemendikdasmen.svg"
              alt="Logo Kemendikdasmen"
              width={80}
              height={80}
              className="h-20 w-auto"
            />
          </div>
          <CardTitle className="text-2xl text-indigo-900">Setup Aplikasi Cerdas-CBT</CardTitle>
          <CardDescription>
            {currentStep === 'database' && 'Periksa dan siapkan database'}
            {currentStep === 'admin' && 'Buat akun Super Admin'}
            {currentStep === 'sekolah' && 'Masukkan identitas sekolah'}
            {currentStep === 'confirm' && 'Konfirmasi data sebelum melanjutkan'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {currentStep === 'database' && renderDatabaseStep()}

          {currentStep === 'admin' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username">Username *</Label>
                <Input
                  id="admin-username"
                  placeholder="admin"
                  value={adminData.username}
                  onChange={(e) => setAdminData({ ...adminData, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-nama">Nama Lengkap</Label>
                <Input
                  id="admin-nama"
                  placeholder="Administrator"
                  value={adminData.nama}
                  onChange={(e) => setAdminData({ ...adminData, nama: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password *</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={adminData.password}
                  onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-confirm">Konfirmasi Password *</Label>
                <Input
                  id="admin-confirm"
                  type="password"
                  placeholder="Ulangi password"
                  value={adminData.confirmPassword}
                  onChange={(e) => setAdminData({ ...adminData, confirmPassword: e.target.value })}
                />
              </div>
            </div>
          )}

          {currentStep === 'sekolah' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nama-sekolah">Nama Sekolah *</Label>
                <Input
                  id="nama-sekolah"
                  placeholder="SMA Negeri 1 Jakarta"
                  value={schoolData.nama_sekolah}
                  onChange={(e) => setSchoolData({ ...schoolData, nama_sekolah: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="npsn">NPSN</Label>
                  <Input
                    id="npsn"
                    placeholder="12345678"
                    value={schoolData.npsn}
                    onChange={(e) => setSchoolData({ ...schoolData, npsn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tahun-ajaran">Tahun Ajaran *</Label>
                  <Input
                    id="tahun-ajaran"
                    placeholder="2025/2026"
                    value={schoolData.tahun_ajaran}
                    onChange={(e) => setSchoolData({ ...schoolData, tahun_ajaran: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat Sekolah</Label>
                <Input
                  id="alamat"
                  placeholder="Jl. Pendidikan No. 1"
                  value={schoolData.alamat}
                  onChange={(e) => setSchoolData({ ...schoolData, alamat: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telepon">Telepon</Label>
                  <Input
                    id="telepon"
                    placeholder="021-1234567"
                    value={schoolData.telepon}
                    onChange={(e) => setSchoolData({ ...schoolData, telepon: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="sekolah@example.com"
                    value={schoolData.email}
                    onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://sekolah.sch.id"
                    value={schoolData.website}
                    onChange={(e) => setSchoolData({ ...schoolData, website: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kepala-sekolah">Kepala Sekolah</Label>
                  <Input
                    id="kepala-sekolah"
                    placeholder="Dr. Nama Kepala Sekolah"
                    value={schoolData.kepala_sekolah}
                    onChange={(e) => setSchoolData({ ...schoolData, kepala_sekolah: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 'confirm' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Super Admin</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Username</dt>
                    <dd className="font-medium">{adminData.username}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Nama</dt>
                    <dd className="font-medium">{adminData.nama}</dd>
                  </div>
                </dl>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Identitas Sekolah</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Nama Sekolah</dt>
                    <dd className="font-medium">{schoolData.nama_sekolah}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">NPSN</dt>
                    <dd className="font-medium">{schoolData.npsn || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tahun Ajaran</dt>
                    <dd className="font-medium">{schoolData.tahun_ajaran}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Alamat</dt>
                    <dd className="font-medium">{schoolData.alamat || '-'}</dd>
                  </div>
                </dl>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                <p className="text-amber-800">
                  <strong>Perhatian:</strong> Pastikan semua data sudah benar sebelum melanjutkan.
                  Perubahan dapat dilakukan setelah login melalui menu pengaturan.
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          {currentStep !== 'database' ? (
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 'admin') setCurrentStep('database')
                if (currentStep === 'sekolah') setCurrentStep('admin')
                if (currentStep === 'confirm') setCurrentStep('sekolah')
              }}
            >
              Kembali
            </Button>
          ) : (
            <div />
          )}
          
          {currentStep === 'database' && (
            <Button 
              onClick={handleDatabaseAction} 
              disabled={!selectedAction || isLoading || dbState === 'checking' || dbState === 'error'}
            >
              {isLoading ? 'Memproses...' : 'Lanjut'}
            </Button>
          )}
          
          {currentStep === 'admin' && (
            <Button 
              onClick={() => setCurrentStep('sekolah')} 
              disabled={!canProceedToAdmin || isLoading}
            >
              Lanjut
            </Button>
          )}
          
          {currentStep === 'sekolah' && (
            <Button 
              onClick={() => setCurrentStep('confirm')} 
              disabled={!canProceedToConfirm || isLoading}
            >
              Lanjut
            </Button>
          )}
          
          {currentStep === 'confirm' && (
            <Button 
              onClick={handleCompleteSetup} 
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Menyimpan...' : 'Selesaikan Setup'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
import { Card, CardContent } from "@/components/ui/card"
import { LoginForm } from "@/components/auth/LoginForm"

async function getSchoolIdentity() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/public/sekolah`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      return { nama_sekolah: 'Cerdas-CBT', logo_url: null }
    }
    
    const data = await response.json()
    return data.data || { nama_sekolah: 'Cerdas-CBT', logo_url: null }
  } catch {
    return { nama_sekolah: 'Cerdas-CBT', logo_url: null }
  }
}

export default async function LoginPage() {
  const school = await getSchoolIdentity()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <img
              src="/images/logo_kemendikdasmen.svg"
              alt="Logo Kemendikdasmen"
              className="h-16 mx-auto mb-4 drop-shadow-sm"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Cerdas-CBT
          </h1>
          <p className="text-sm text-gray-500">
            {school.nama_sekolah}
          </p>
        </div>

        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <LoginForm schoolName={school.nama_sekolah} />
          </CardContent>
        </Card>

        <footer className="text-center mt-8">
          <p className="text-xs text-gray-400">
            © 2026 Cerdas-CBT by EAS Creative Studio
          </p>
        </footer>
      </div>
    </div>
  )
}

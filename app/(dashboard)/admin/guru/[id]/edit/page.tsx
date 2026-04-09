import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { DashboardLayout } from '@/components/layout'
import { GuruForm } from '@/components/admin/GuruForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface EditGuruPageProps {
  params: Promise<{ id: string }>
}

async function getGuruData(id: string) {
  const session = await getSession()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'super_admin') {
    redirect('/login')
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/guru/${id}`, { cache: 'no-store' })
    const { data } = await res.json()
    
    if (!data?.guru) {
      return { guruData: null, session }
    }
    
    return { guruData: data.guru, session }
  } catch {
    return { guruData: null, session }
  }
}

export default async function EditGuruPage({ params }: EditGuruPageProps) {
  const { id } = await params
  const { guruData, session } = await getGuruData(id)

  if (!guruData) {
    notFound()
  }

  return (
    <DashboardLayout
      user={{
        nama: session.user.nama,
        username: session.user.username,
        role: 'super_admin'
      }}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900">Edit Guru</h1>
          <p className="text-gray-600 mt-1">Update data guru</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Data Guru</CardTitle>
            <CardDescription>
              Update informasi guru {guruData.nama}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GuruForm
              initialData={{
                id: guruData.id,
                username: guruData.username,
                nama: guruData.nama,
              }}
              mode="edit"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
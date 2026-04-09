import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { HasilClient } from "@/components/hasil/HasilClient"

async function getUjianList() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "guru") {
    redirect("/login")
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/guru/ujian`, { cache: 'no-store' })
    const { data } = await res.json()
    return { 
      ujianList: data?.ujian || [], 
      session 
    }
  } catch {
    return { 
      ujianList: [], 
      session 
    }
  }
}

export default async function HasilListPage() {
  const { ujianList, session } = await getUjianList()

  const user = {
    nama: session.user.nama || "Guru",
    username: session.user.username,
    role: "guru",
  }

  return (
    <HasilClient
      user={user}
      ujianList={ujianList || []}
    />
  )
}
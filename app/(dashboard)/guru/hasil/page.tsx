import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { HasilClient } from "@/components/hasil/HasilClient"

export default async function HasilListPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "guru") {
    redirect("/login")
  }

  const supabase = createAdminClient()

  const { data: ujianList } = await supabase
    .from("ujian")
    .select("id, judul, kode_ujian, status")
    .eq("created_by", session.user.id)
    .order("created_at", { ascending: false })

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
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminNav from "./AdminNav"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")
  if (user.email !== process.env.ADMIN_EMAIL) redirect("/dashboard")

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}

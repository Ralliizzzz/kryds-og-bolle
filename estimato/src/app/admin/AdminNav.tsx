import Link from "next/link"

export default function AdminNav() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center gap-6">
      <span className="font-bold text-sm mr-4">Estimato Admin</span>
      <Link href="/admin/companies" className="text-sm text-gray-300 hover:text-white transition-colors">
        Firmaer
      </Link>
      <Link href="/admin/feedback" className="text-sm text-gray-300 hover:text-white transition-colors">
        Feedback
      </Link>
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors ml-auto">
        → Dashboard
      </Link>
    </nav>
  )
}

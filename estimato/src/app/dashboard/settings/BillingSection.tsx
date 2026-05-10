"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { SubscriptionStatus } from "@/types/database"

interface Props {
  subscriptionStatus: SubscriptionStatus
  trialEndDate: string
  stripeCustomerId: string | null
}

export default function BillingSection({ subscriptionStatus, trialEndDate, stripeCustomerId }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const daysLeft =
    subscriptionStatus === "trial"
      ? Math.max(0, Math.ceil((new Date(trialEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null

  async function handlePortal() {
    setLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const { url } = await res.json()
      router.push(url)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="border-t border-gray-100 pt-8 mt-8">
      <h2 className="text-base font-semibold text-gray-900 mb-1">Abonnement</h2>
      <p className="text-sm text-gray-500 mb-4">Administrer din fakturering og dit abonnement.</p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-800">
            {subscriptionStatus === "active" && "Aktivt abonnement — 499 kr/md"}
            {subscriptionStatus === "trial" && daysLeft !== null && daysLeft > 0 && `Prøveperiode — ${daysLeft} dag${daysLeft === 1 ? "" : "e"} tilbage`}
            {subscriptionStatus === "trial" && daysLeft === 0 && "Prøveperiode udløbet"}
            {subscriptionStatus === "cancelled" && "Abonnement afsluttet"}
            {subscriptionStatus === "expired" && "Abonnement udløbet"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {subscriptionStatus === "active" && "Næste betaling sker automatisk via Stripe"}
            {subscriptionStatus === "trial" && "Intet kreditkort tilknyttet endnu"}
            {(subscriptionStatus === "cancelled" || subscriptionStatus === "expired") && "Opgrader for at genaktivere widgetten"}
          </p>
        </div>

        {stripeCustomerId && (
          <button
            onClick={handlePortal}
            disabled={loading}
            className="flex-shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Åbner..." : "Administrer →"}
          </button>
        )}
      </div>
    </div>
  )
}

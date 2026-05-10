"use client"

import { useState } from "react"
import { submitFeedback } from "@/app/admin/actions"

export default function FeedbackButton() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await submitFeedback(message.trim())
      setSent(true)
      setMessage("")
      setTimeout(() => { setOpen(false); setSent(false) }, 1800)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noget gik galt")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors w-full text-left"
      >
        <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Giv feedback
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Giv os feedback</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {sent ? (
              <p className="text-sm text-emerald-600 text-center py-4">Tak for din feedback!</p>
            ) : (
              <form onSubmit={handleSubmit}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                  placeholder="Hvad kan vi gøre bedre?"
                  rows={5}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <div className="flex items-center justify-between mt-1 mb-4">
                  <span className="text-xs text-gray-400">{message.length}/1000</span>
                </div>
                {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Sender..." : "Send feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

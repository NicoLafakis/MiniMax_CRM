import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { X } from 'lucide-react'

type EmailComposerProps = {
  onClose: () => void
  customerId?: string
  recipientEmail?: string
  recipientName?: string
}

export default function EmailComposer({ onClose, customerId, recipientEmail, recipientName }: EmailComposerProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    to: recipientEmail || '',
    subject: '',
    body: '',
  })
  const [sending, setSending] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    try {
      setSending(true)

      // Log as email activity
      const activityData = {
        type: 'email',
        subject: formData.subject,
        description: `To: ${formData.to}\n\n${formData.body}`,
        customer_id: customerId || null,
        user_id: user.id,
        completed: true,
      }

      const { error } = await supabase
        .from('activities')
        .insert([activityData])

      if (error) throw error

      alert('Email logged successfully! Note: This is a demo CRM - actual email sending would require email service integration.')
      onClose()
    } catch (error: any) {
      console.error('Error logging email:', error)
      alert(`Failed to log email: ${error.message || 'Unknown error'}`)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-surface rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-modal">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Compose Email</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-dark-800 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        {recipientName && (
          <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-500/10 rounded-md">
            <p className="text-sm">
              <span className="font-medium">To:</span> {recipientName} ({recipientEmail})
            </p>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Recipient Email *</label>
            <input
              type="email"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="recipient@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Subject *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Email subject"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message *</label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={12}
              className="w-full px-4 py-3 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Write your email message here..."
              required
            />
          </div>

          <div className="bg-info-500 bg-opacity-10 text-info-500 p-4 rounded-md text-sm">
            <strong>Note:</strong> This is a demo CRM system. Emails will be logged as activities but not actually sent. 
            For production use, integrate with email services like SendGrid, Mailgun, or AWS SES.
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 border-2 border-neutral-200 dark:border-neutral-dark-700 rounded-md font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-dark-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="flex-1 h-12 bg-primary-500 text-white rounded-md font-semibold btn-hover disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send & Log Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

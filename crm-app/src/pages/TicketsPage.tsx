import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Ticket } from '../lib/supabase'
import { Plus, Search, Sparkles, Loader } from 'lucide-react'

const STATUSES = ['New', 'In Progress', 'Pending', 'Resolved', 'Closed']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

export default function TicketsPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (user) {
      loadTickets()
    }
  }, [user])

  useEffect(() => {
    let filtered = tickets

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTickets(filtered)
  }, [searchTerm, filterStatus, tickets])

  async function loadTickets() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
      setFilteredTickets(data || [])
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateTicketStatus(ticketId: string, newStatus: string) {
    try {
      const updateData: any = { status: newStatus }
      if (newStatus === 'Resolved' || newStatus === 'Closed') {
        updateData.resolved_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId)
        .eq('user_id', user?.id)

      if (error) throw error
      loadTickets()
    } catch (error) {
      console.error('Error updating ticket:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-info-500'
      case 'In Progress': return 'bg-primary-500'
      case 'Pending': return 'bg-warning-500'
      case 'Resolved': return 'bg-success-500'
      case 'Closed': return 'bg-neutral-500'
      default: return 'bg-neutral-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-error-500 text-white'
      case 'High': return 'bg-warning-500 bg-opacity-20 text-warning-600'
      case 'Medium': return 'bg-neutral-500 bg-opacity-10 text-neutral-600'
      case 'Low': return 'bg-neutral-200 text-neutral-500'
      default: return 'bg-neutral-200 text-neutral-500'
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Service Desk</h1>
            <p className="text-secondary">Manage support tickets and issues</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="h-12 px-6 bg-primary-500 text-white rounded-md font-semibold btn-hover flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Ticket</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tickets..."
              className="w-full h-12 pl-12 pr-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-surface rounded-lg p-6 shadow-card card-hover border border-neutral-200 dark:border-neutral-dark-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{ticket.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  {ticket.description && (
                    <p className="text-secondary">{ticket.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-secondary">
                  <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                  {ticket.resolved_at && (
                    <span>Resolved: {new Date(ticket.resolved_at).toLocaleDateString()}</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)} bg-opacity-10`}>
                    {ticket.status}
                  </span>
                  <select
                    value={ticket.status}
                    onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                    className="h-10 px-3 text-sm rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}

          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              <p className="text-secondary">
                {searchTerm || filterStatus !== 'all' ? 'No tickets found matching your filters.' : 'No tickets yet. Create your first ticket!'}
              </p>
            </div>
          )}
        </div>
      )}

      {showModal && <AddTicketModal onClose={() => setShowModal(false)} onSuccess={loadTickets} />}
    </div>
  )
}

function AddTicketModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'New',
  })
  const [saving, setSaving] = useState(false)
  const [classifying, setClassifying] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<any>(null)

  async function handleAutoClassify() {
    if (!formData.title || !formData.description) {
      alert('Please enter title and description first')
      return
    }

    try {
      setClassifying(true)
      const { data, error } = await supabase.functions.invoke('ai-ticket-classification', {
        body: {
          title: formData.title,
          description: formData.description
        }
      })

      if (error) throw error

      const classification = data?.data
      setAiSuggestion(classification)

      // Auto-fill the form with AI suggestions
      if (classification) {
        setFormData({
          ...formData,
          priority: classification.priority.charAt(0).toUpperCase() + classification.priority.slice(1),
          status: classification.suggestedStatus?.charAt(0).toUpperCase() + classification.suggestedStatus?.slice(1).replace('_', ' ') || 'New'
        })
      }
    } catch (error: any) {
      console.error('Error classifying ticket:', error)
      alert(error.message || 'Failed to classify ticket. Please check your AI settings.')
    } finally {
      setClassifying(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      const { error } = await supabase
        .from('tickets')
        .insert([{ ...formData, user_id: user.id }])

      if (error) throw error
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating ticket:', error)
      alert('Failed to create ticket')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-surface rounded-lg p-6 max-w-lg w-full shadow-modal">
        <h2 className="text-2xl font-bold mb-6">Create New Ticket</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* AI Auto-Classify Button */}
          <div>
            <button
              type="button"
              onClick={handleAutoClassify}
              disabled={classifying || !formData.title || !formData.description}
              className="w-full h-10 bg-primary-500/10 text-primary-500 rounded-md font-medium hover:bg-primary-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {classifying ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Classifying...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  AI Auto-Classify
                </>
              )}
            </button>
            {aiSuggestion && (
              <div className="mt-2 p-3 bg-info-500/10 border border-info-500/20 rounded-md">
                <p className="text-xs font-medium text-info-500 mb-1">AI Reasoning:</p>
                <p className="text-xs text-secondary">{aiSuggestion.reasoning}</p>
                {aiSuggestion.category && (
                  <p className="text-xs text-secondary mt-1">
                    <span className="font-medium">Category:</span> {aiSuggestion.category}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {PRIORITIES.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 border-2 border-neutral-200 dark:border-neutral-dark-700 rounded-md font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-dark-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-12 bg-primary-500 text-white rounded-md font-semibold btn-hover disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

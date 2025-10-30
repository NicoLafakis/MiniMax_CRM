import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Deal } from '../lib/supabase'
import { Plus, DollarSign } from 'lucide-react'

const STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']

export default function DealsPage() {
  const { user } = useAuth()
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (user) {
      loadDeals()
    }
  }, [user])

  async function loadDeals() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDeals(data || [])
    } catch (error) {
      console.error('Error loading deals:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateDealStage(dealId: string, newStage: string) {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ stage: newStage })
        .eq('id', dealId)
        .eq('user_id', user?.id)

      if (error) throw error
      loadDeals()
    } catch (error) {
      console.error('Error updating deal:', error)
    }
  }

  const getDealsByStage = (stage: string) => deals.filter(d => d.stage === stage)
  const getStageTotal = (stage: string) => {
    return getDealsByStage(stage).reduce((sum, deal) => sum + (parseFloat(String(deal.value)) || 0), 0)
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Sales Pipeline</h1>
          <p className="text-secondary">Track and manage your deals</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="h-12 px-6 bg-primary-500 text-white rounded-md font-semibold btn-hover flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Add Deal</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="inline-flex gap-4 min-w-full">
            {STAGES.map((stage) => {
              const stageDeals = getDealsByStage(stage)
              const stageTotal = getStageTotal(stage)
              
              return (
                <div key={stage} className="flex-shrink-0 w-80">
                  <div className="bg-surface rounded-lg p-4 shadow-card border border-neutral-200 dark:border-neutral-dark-700">
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold mb-1">{stage}</h2>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-secondary">{stageDeals.length} deals</span>
                        <span className="font-medium text-primary-500">${stageTotal.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin">
                      {stageDeals.map((deal) => (
                        <div
                          key={deal.id}
                          className="bg-page dark:bg-neutral-dark-900 rounded-md p-4 hover:shadow-md transition-shadow"
                        >
                          <h3 className="font-semibold mb-2 truncate">{deal.title}</h3>
                          <div className="flex items-center gap-2 text-lg font-bold text-primary-500 mb-2">
                            <DollarSign size={18} />
                            {parseFloat(String(deal.value)).toLocaleString()}
                          </div>
                          {deal.expected_close_date && (
                            <p className="text-xs text-secondary">
                              Expected: {new Date(deal.expected_close_date).toLocaleDateString()}
                            </p>
                          )}
                          
                          <select
                            value={deal.stage}
                            onChange={(e) => updateDealStage(deal.id, e.target.value)}
                            className="w-full mt-3 h-8 px-2 text-sm rounded border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            {STAGES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                      
                      {stageDeals.length === 0 && (
                        <p className="text-secondary text-center text-sm py-8">No deals</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showModal && <AddDealModal onClose={() => setShowModal(false)} onSuccess={loadDeals} />}
    </div>
  )
}

function AddDealModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    stage: 'Lead',
    expected_close_date: '',
    probability: 50,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      
      // Prepare data with proper types
      const dealData = {
        title: formData.title,
        description: formData.description || null,
        value: parseFloat(formData.value) || 0,
        stage: formData.stage,
        expected_close_date: formData.expected_close_date || null,
        probability: formData.probability,
        user_id: user.id
      }

      const { error } = await supabase
        .from('deals')
        .insert([dealData])

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error creating deal:', error)
      alert(`Failed to create deal: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-surface rounded-lg p-6 max-w-lg w-full shadow-modal">
        <h2 className="text-2xl font-bold mb-6">Add New Deal</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Deal Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Value ($) *</label>
            <input
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Stage</label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {STAGES.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Expected Close Date</label>
            <input
              type="date"
              value={formData.expected_close_date}
              onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
              className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
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
              {saving ? 'Saving...' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

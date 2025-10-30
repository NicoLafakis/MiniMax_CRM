import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { workflowsAPI, WorkflowRule } from '../lib/api'
import { Plus, Power, PowerOff } from 'lucide-react'

export default function WorkflowsPage() {
  const { user } = useAuth()
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (user) {
      loadWorkflows()
    }
  }, [user])

  async function loadWorkflows() {
    try {
      setLoading(true)
      const response = await workflowsAPI.getAll()
      setWorkflows(response.data)
    } catch (error) {
      console.error('Error loading workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleWorkflow(workflowId: string, currentStatus: boolean) {
    try {
      await workflowsAPI.update(workflowId, { is_active: !currentStatus })
      loadWorkflows()
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Workflow Automation</h1>
            <p className="text-secondary">Automate repetitive tasks and actions</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="h-12 px-6 bg-primary-500 text-white rounded-md font-semibold btn-hover flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Workflow</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-surface rounded-lg p-6 shadow-card border border-neutral-200 dark:border-neutral-dark-700"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold">{workflow.name}</h3>
                <button
                  onClick={() => toggleWorkflow(workflow.id, workflow.is_active)}
                  className={`p-2 rounded-md ${
                    workflow.is_active
                      ? 'bg-success-500 bg-opacity-10 text-success-500'
                      : 'bg-neutral-500 bg-opacity-10 text-neutral-500'
                  }`}
                >
                  {workflow.is_active ? <Power size={20} /> : <PowerOff size={20} />}
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-page dark:bg-neutral-dark-900 rounded-md p-4">
                  <p className="text-xs font-medium text-tertiary mb-1">WHEN</p>
                  <p className="text-sm font-medium capitalize">{workflow.trigger_type.replace(/_/g, ' ')}</p>
                </div>

                <div className="text-center text-tertiary">↓</div>

                <div className="bg-page dark:bg-neutral-dark-900 rounded-md p-4">
                  <p className="text-xs font-medium text-tertiary mb-1">THEN</p>
                  <p className="text-sm font-medium capitalize">{workflow.action_type.replace(/_/g, ' ')}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-dark-700">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  workflow.is_active
                    ? 'bg-success-500 bg-opacity-10 text-success-500'
                    : 'bg-neutral-500 bg-opacity-10 text-neutral-500'
                }`}>
                  {workflow.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}

          {workflows.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-secondary">No workflows yet. Create your first automation!</p>
            </div>
          )}
        </div>
      )}

      {showModal && <AddWorkflowModal onClose={() => setShowModal(false)} onSuccess={loadWorkflows} />}
    </div>
  )
}

function AddWorkflowModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'deal_stage_change',
    trigger_value: {},
    action_type: 'create_task',
    action_value: {},
    is_active: true,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      setSaving(true)
      await workflowsAPI.create(formData)
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating workflow:', error)
      alert('Failed to create workflow')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-surface rounded-lg p-6 max-w-lg w-full shadow-modal">
        <h2 className="text-2xl font-bold mb-6">Create Workflow</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Workflow Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Trigger (When)</label>
            <select
              value={formData.trigger_type}
              onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
              className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="deal_stage_change">Deal stage changes</option>
              <option value="ticket_created">New ticket created</option>
              <option value="customer_created">New customer added</option>
              <option value="task_overdue">Task becomes overdue</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Action (Then)</label>
            <select
              value={formData.action_type}
              onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
              className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="create_task">Create a task</option>
              <option value="send_notification">Send notification</option>
              <option value="update_status">Update status</option>
              <option value="assign_owner">Assign owner</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded border-neutral-200 dark:border-neutral-dark-700"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Activate workflow immediately
            </label>
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
              disabled={saving}
              className="flex-1 h-12 bg-primary-500 text-white rounded-md font-semibold btn-hover disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { activitiesAPI, Activity } from '../lib/api'
import { Plus, CheckCircle, Circle } from 'lucide-react'

export default function ActivitiesPage() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [filterType, setFilterType] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (user) {
      loadActivities()
    }
  }, [user])

  async function loadActivities() {
    try {
      setLoading(true)
      const response = await activitiesAPI.getAll()
      setActivities(response.data)
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleTaskComplete(activityId: string, currentStatus: boolean) {
    try {
      await activitiesAPI.update(activityId, { completed: !currentStatus })
      loadActivities()
    } catch (error) {
      console.error('Error updating activity:', error)
    }
  }

  const filteredActivities = filterType === 'all'
    ? activities
    : activities.filter(a => a.type === filterType)

  const tasks = activities.filter(a => a.type === 'task')
  const completedTasks = tasks.filter(t => t.completed).length
  const pendingTasks = tasks.filter(t => !t.completed).length

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Activities</h1>
            <p className="text-secondary">Track all your interactions and tasks</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="h-12 px-6 bg-primary-500 text-white rounded-md font-semibold btn-hover flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">New Activity</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-surface rounded-lg p-4 shadow-card border border-neutral-200 dark:border-neutral-dark-700">
            <p className="text-sm text-secondary mb-1">Total Activities</p>
            <p className="text-3xl font-bold">{activities.length}</p>
          </div>
          <div className="bg-surface rounded-lg p-4 shadow-card border border-neutral-200 dark:border-neutral-dark-700">
            <p className="text-sm text-secondary mb-1">Completed Tasks</p>
            <p className="text-3xl font-bold text-success-500">{completedTasks}</p>
          </div>
          <div className="bg-surface rounded-lg p-4 shadow-card border border-neutral-200 dark:border-neutral-dark-700">
            <p className="text-sm text-secondary mb-1">Pending Tasks</p>
            <p className="text-3xl font-bold text-warning-500">{pendingTasks}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'task', 'call', 'email', 'meeting', 'note'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 h-10 rounded-md font-medium text-sm whitespace-nowrap ${
                filterType === type
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface border border-neutral-200 dark:border-neutral-dark-700 hover:bg-neutral-100 dark:hover:bg-neutral-dark-800'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-surface rounded-lg p-6 shadow-card border border-neutral-200 dark:border-neutral-dark-700 hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start gap-4">
                {activity.type === 'task' && (
                  <button
                    onClick={() => toggleTaskComplete(activity.id, activity.completed)}
                    className="mt-1 flex-shrink-0"
                  >
                    {activity.completed ? (
                      <CheckCircle className="text-success-500" size={24} />
                    ) : (
                      <Circle className="text-neutral-500" size={24} />
                    )}
                  </button>
                )}

                <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                  activity.type === 'call' ? 'bg-primary-500' :
                  activity.type === 'email' ? 'bg-info-500' :
                  activity.type === 'task' ? 'bg-warning-500' :
                  activity.type === 'meeting' ? 'bg-success-500' :
                  'bg-neutral-500'
                }`}></div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className={`text-lg font-semibold ${activity.completed ? 'line-through text-tertiary' : ''}`}>
                      {activity.subject}
                    </h3>
                    <span className="text-xs text-tertiary whitespace-nowrap">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      activity.type === 'call' ? 'bg-primary-500 bg-opacity-10 text-primary-500' :
                      activity.type === 'email' ? 'bg-info-500 bg-opacity-10 text-info-500' :
                      activity.type === 'task' ? 'bg-warning-500 bg-opacity-10 text-warning-500' :
                      activity.type === 'meeting' ? 'bg-success-500 bg-opacity-10 text-success-500' :
                      'bg-neutral-500 bg-opacity-10 text-neutral-500'
                    }`}>
                      {activity.type}
                    </span>
                    
                    {activity.due_date && (
                      <span className="text-sm text-secondary">
                        Due: {new Date(activity.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {activity.description && (
                    <p className="text-secondary text-sm">{activity.description}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-secondary">No activities found. Create your first activity!</p>
            </div>
          )}
        </div>
      )}

      {showModal && <AddActivityModal onClose={() => setShowModal(false)} onSuccess={loadActivities} />}
    </div>
  )
}

function AddActivityModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    type: 'note',
    subject: '',
    description: '',
    due_date: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      setSaving(true)
      
      // Prepare data with proper types
      const activityData = {
        type: formData.type,
        subject: formData.subject,
        description: formData.description || undefined,
        due_date: formData.due_date || undefined,
        completed: false
      }

      await activitiesAPI.create(activityData)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error creating activity:', error)
      alert(`Failed to create activity: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-surface rounded-lg p-6 max-w-lg w-full shadow-modal">
        <h2 className="text-2xl font-bold mb-6">Create New Activity</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="task">Task</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Subject *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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

          {formData.type === 'task' && (
            <div>
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

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
              {saving ? 'Saving...' : 'Create Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

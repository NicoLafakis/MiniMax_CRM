import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Customer, Activity } from '../lib/api'
import { customersAPI, activitiesAPI } from '../lib/api'
import { Mail, Phone, Building, MapPin, ArrowLeft, Plus, Send } from 'lucide-react'
import FileAttachments from '../components/FileAttachments'
import EmailComposer from '../components/EmailComposer'

export default function CustomerDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showEmailComposer, setShowEmailComposer] = useState(false)

  async function loadCustomerData() {
    try {
      setLoading(true)
      
      // Get customer data
      const { data: customerData } = await customersAPI.getOne(id!)
      setCustomer(customerData)

      // Get all activities and filter by customer_id
      const { data: allActivities } = await activitiesAPI.getAll()
      const customerActivities = allActivities.filter((activity: Activity) => activity.customer_id === id)
      setActivities(customerActivities)
    } catch (error) {
      console.error('Error loading customer:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && id) {
      loadCustomerData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
      </div>
    )
  }

  if (!customer) {
    return <div className="text-center py-12">Customer not found</div>
  }

  return (
    <div>
      <Link to="/customers" className="inline-flex items-center gap-2 text-primary-500 hover:underline mb-6">
        <ArrowLeft size={20} />
        Back to Customers
      </Link>

      {/* Customer Header */}
      <div className="bg-surface rounded-lg p-6 shadow-card border border-neutral-200 dark:border-neutral-dark-700 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-1">{customer.name}</h1>
              {customer.company && <p className="text-lg text-secondary">{customer.company}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            {customer.email && (
              <button
                onClick={() => setShowEmailComposer(true)}
                className="h-10 px-4 bg-info-500 text-white rounded-md font-semibold btn-hover flex items-center gap-2"
              >
                <Send size={18} />
                Send Email
              </button>
            )}
            <button
              onClick={() => setShowActivityModal(true)}
              className="h-10 px-4 bg-primary-500 text-white rounded-md font-semibold btn-hover flex items-center gap-2"
            >
              <Plus size={18} />
              Log Activity
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {customer.email && (
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-tertiary" />
              <a href={`mailto:${customer.email}`} className="text-primary-500 hover:underline">{customer.email}</a>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-2">
              <Phone size={18} className="text-tertiary" />
              <a href={`tel:${customer.phone}`} className="text-primary-500 hover:underline">{customer.phone}</a>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-tertiary" />
              <span className="text-secondary">
                {customer.address}{customer.city && `, ${customer.city}`}{customer.state && `, ${customer.state}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* File Attachments */}
      <FileAttachments relatedType="customer" relatedId={customer.id} />

      {/* Activity Timeline */}
      <div className="bg-surface rounded-lg p-6 shadow-card border border-neutral-200 dark:border-neutral-dark-700 mt-6">
        <h2 className="text-2xl font-semibold mb-6">Activity Timeline</h2>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-secondary text-center py-8">No activities yet. Log your first interaction above!</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex gap-4 p-4 hover:bg-neutral-100 dark:hover:bg-neutral-dark-800 rounded-md">
                <div className={`w-3 h-3 rounded-full mt-1.5 ${
                  activity.type === 'call' ? 'bg-primary-500' :
                  activity.type === 'email' ? 'bg-info-500' :
                  activity.type === 'task' ? 'bg-warning-500' :
                  activity.type === 'note' ? 'bg-success-500' :
                  'bg-neutral-500'
                }`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{activity.subject}</h3>
                    <span className="text-xs text-tertiary">{new Date(activity.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-secondary capitalize">{activity.type}</p>
                  {activity.description && <p className="text-sm mt-2">{activity.description}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showActivityModal && (
        <AddActivityModal
          customerId={customer.id}
          onClose={() => setShowActivityModal(false)}
          onSuccess={loadCustomerData}
        />
      )}

      {showEmailComposer && (
        <EmailComposer
          customerId={customer.id}
          recipientEmail={customer.email || ''}
          recipientName={customer.name}
          onClose={() => {
            setShowEmailComposer(false)
            loadCustomerData()
          }}
        />
      )}
    </div>
  )
}

function AddActivityModal({ customerId, onClose, onSuccess }: { customerId: string; onClose: () => void; onSuccess: () => void }) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    type: 'note',
    subject: '',
    description: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    try {
      setSaving(true)
      
      // Prepare data (user_id added by backend via JWT)
      const activityData = {
        type: formData.type,
        subject: formData.subject,
        description: formData.description || null,
        customer_id: customerId,
        completed: false
      }

      await activitiesAPI.create(activityData)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error creating activity:', error)
      alert(`Failed to log activity: ${error.message || 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-surface rounded-lg p-6 max-w-lg w-full shadow-modal">
        <h2 className="text-2xl font-bold mb-6">Log Activity</h2>
        
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
            <label className="block text-sm font-medium mb-2">Subject</label>
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
              {saving ? 'Saving...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

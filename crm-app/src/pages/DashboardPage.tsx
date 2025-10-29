import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Customer, Deal, Ticket, Activity } from '../lib/supabase'
import { Users, DollarSign, Ticket as TicketIcon, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalDeals: 0,
    dealsValue: 0,
    openTickets: 0,
    completedTasks: 0,
    pendingTasks: 0,
  })
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  async function loadDashboardData() {
    try {
      setLoading(true)

      // Get customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)

      // Get deals data
      const { data: deals } = await supabase
        .from('deals')
        .select('value, stage')
        .eq('user_id', user?.id)

      const dealsCount = deals?.length || 0
      const dealsValue = deals?.reduce((sum, deal) => sum + (parseFloat(String(deal.value)) || 0), 0) || 0

      // Get open tickets count
      const { count: openTicketsCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .neq('status', 'Closed')

      // Get tasks data
      const { data: tasks } = await supabase
        .from('activities')
        .select('completed')
        .eq('user_id', user?.id)
        .eq('type', 'task')

      const completedTasks = tasks?.filter(t => t.completed).length || 0
      const pendingTasks = tasks?.filter(t => !t.completed).length || 0

      // Get recent activities
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setStats({
        totalCustomers: customersCount || 0,
        totalDeals: dealsCount,
        dealsValue,
        openTickets: openTicketsCount || 0,
        completedTasks,
        pendingTasks,
      })

      setRecentActivities(activities || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const metricCards = [
    { title: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'primary', link: '/customers' },
    { title: 'Active Deals', value: stats.totalDeals, icon: TrendingUp, color: 'info', link: '/deals' },
    { title: 'Deals Value', value: `$${stats.dealsValue.toLocaleString()}`, icon: DollarSign, color: 'success', link: '/deals' },
    { title: 'Open Tickets', value: stats.openTickets, icon: TicketIcon, color: 'warning', link: '/tickets' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-secondary">Welcome back! Here's your CRM overview.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-component="dashboard-metrics">
        {metricCards.map((metric) => (
          <Link
            key={metric.title}
            to={metric.link}
            className="bg-surface rounded-lg p-6 shadow-card card-hover border border-neutral-200 dark:border-neutral-dark-700"
            data-component="metric-card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-${metric.color}-500 bg-opacity-10 flex items-center justify-center`}>
                <metric.icon className={`text-${metric.color}-500`} size={24} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-secondary mb-1">{metric.title}</h3>
            <p className="text-3xl font-bold">{metric.value}</p>
          </Link>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Overview */}
        <div className="bg-surface rounded-lg p-6 shadow-card border border-neutral-200 dark:border-neutral-dark-700" data-component="task-overview-card">
          <h2 className="text-2xl font-semibold mb-4">Tasks Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-success-500 bg-opacity-10 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="text-success-500" size={24} />
                <div>
                  <p className="font-medium">Completed Tasks</p>
                  <p className="text-sm text-secondary">Tasks finished</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{stats.completedTasks}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-warning-500 bg-opacity-10 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-warning-500" size={24} />
                <div>
                  <p className="font-medium">Pending Tasks</p>
                  <p className="text-sm text-secondary">Need attention</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{stats.pendingTasks}</span>
            </div>
          </div>
          <Link
            to="/activities"
            className="mt-4 block w-full h-12 bg-primary-500 text-white rounded-md font-semibold btn-hover flex items-center justify-center"
          >
            View All Activities
          </Link>
        </div>

        {/* Recent Activities */}
        <div className="bg-surface rounded-lg p-6 shadow-card border border-neutral-200 dark:border-neutral-dark-700" data-component="recent-activities-card">
          <h2 className="text-2xl font-semibold mb-4">Recent Activities</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
            {recentActivities.length === 0 ? (
              <p className="text-secondary text-center py-8">No activities yet</p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-neutral-100 dark:hover:bg-neutral-dark-800 rounded-md">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'call' ? 'bg-primary-500' :
                    activity.type === 'email' ? 'bg-info-500' :
                    activity.type === 'task' ? 'bg-warning-500' :
                    'bg-neutral-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.subject}</p>
                    <p className="text-sm text-secondary capitalize">{activity.type}</p>
                    <p className="text-xs text-tertiary">{new Date(activity.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

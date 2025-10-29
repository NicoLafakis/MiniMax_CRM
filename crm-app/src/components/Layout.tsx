import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  Ticket,
  ListChecks,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Workflow,
  Mail,
  Settings,
  Sparkles
} from 'lucide-react'
import EmailComposer from './EmailComposer'
import AIWizard from './AIWizard'

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showEmailComposer, setShowEmailComposer] = useState(false)
  const [showAIWizard, setShowAIWizard] = useState(false)
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Sales Pipeline', path: '/deals', icon: TrendingUp },
    { name: 'Service Desk', path: '/tickets', icon: Ticket },
    { name: 'Activities', path: '/activities', icon: ListChecks },
    { name: 'Workflows', path: '/workflows', icon: Workflow },
    { name: 'Settings', path: '/settings', icon: Settings },
  ]

  const isActive = (path: string) => location.pathname === path

  async function handleSignOut() {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-surface border-b border-neutral-200 dark:border-neutral-dark-700 z-50">
        <div className="max-w-[1400px] mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden w-10 h-10 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-dark-800 rounded-md"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg"></div>
              <span className="text-xl font-bold hidden sm:block">CRM</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-4 h-10 rounded-md font-medium text-sm transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-500'
                    : 'text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-dark-800'
                }`}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAIWizard(true)}
              className="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-dark-800 rounded-md bg-gradient-to-br from-primary-500 to-info-500 text-white"
              title="AI Wizard"
            >
              <Sparkles size={20} />
            </button>
            <button
              onClick={() => setShowEmailComposer(true)}
              className="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-dark-800 rounded-md"
              title="Compose Email"
            >
              <Mail size={20} />
            </button>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-dark-800 rounded-md"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={handleSignOut}
              className="w-10 h-10 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-dark-800 rounded-md text-error-500"
              title="Sign Out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
          <div className="absolute top-16 left-0 bottom-0 w-64 bg-surface border-r border-neutral-200 dark:border-neutral-dark-700 p-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 h-12 rounded-md font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-500'
                      : 'text-secondary hover:bg-neutral-100 dark:hover:bg-neutral-dark-800'
                  }`}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-16">
        <div className="max-w-[1400px] mx-auto p-6">
          {children}
        </div>
      </main>

      {/* Email Composer Modal */}
      {showEmailComposer && (
        <EmailComposer onClose={() => setShowEmailComposer(false)} />
      )}

      {/* AI Wizard Modal */}
      {showAIWizard && (
        <AIWizard onClose={() => setShowAIWizard(false)} />
      )}
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Settings as SettingsIcon, Key, Save, Sparkles, Check, X } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const [openaiApiKey, setOpenaiApiKey] = useState('')
  const [aiEnabled, setAiEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [usageCount, setUsageCount] = useState(0)

  useEffect(() => {
    if (user) {
      loadSettings()
    }
  }, [user])

  async function loadSettings() {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setOpenaiApiKey(data.openai_api_key || '')
        setAiEnabled(data.ai_features_enabled || false)
        setUsageCount(data.usage_count || 0)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function saveSettings() {
    try {
      setSaving(true)
      setMessage(null)

      // Check if settings exist
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('user_settings')
          .update({
            openai_api_key: openaiApiKey,
            ai_features_enabled: aiEnabled,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id)

        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: user?.id,
            openai_api_key: openaiApiKey,
            ai_features_enabled: aiEnabled
          })

        if (error) throw error
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon size={32} className="text-primary-500" />
        <div>
          <h1 className="text-3xl font-bold text-primary">Settings</h1>
          <p className="text-secondary mt-1">Manage your CRM preferences and AI features</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-success-500/10 text-success-500 border border-success-500/20'
              : 'bg-error-500/10 text-error-500 border border-error-500/20'
          }`}
        >
          {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* AI Features Section */}
      <div className="bg-surface rounded-lg border border-neutral-200 dark:border-neutral-dark-700 p-8 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles size={24} className="text-primary-500" />
          <h2 className="text-2xl font-semibold text-primary">AI Features</h2>
        </div>

        <div className="space-y-6">
          {/* OpenAI API Key */}
          <div>
            <label htmlFor="openai-key" className="flex items-center gap-2 text-sm font-medium mb-2">
              <Key size={16} />
              OpenAI API Key
            </label>
            <input
              id="openai-key"
              type="password"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full h-12 px-4 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-secondary mt-2">
              Your API key is stored securely and never shared. Get your key from{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>

          {/* Enable AI Features Toggle */}
          <div className="flex items-center justify-between p-4 rounded-md bg-neutral-50 dark:bg-neutral-dark-800">
            <div>
              <div className="font-medium text-primary">Enable AI Features</div>
              <p className="text-sm text-secondary mt-1">
                Activate AI-powered insights, suggestions, and automation
              </p>
            </div>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                aiEnabled ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-dark-700'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  aiEnabled ? 'transform translate-x-6' : ''
                }`}
              ></div>
            </button>
          </div>

          {/* AI Features List */}
          {aiEnabled && (
            <div className="space-y-3 p-4 bg-primary-50 dark:bg-primary-500/10 rounded-md border border-primary-500/20">
              <p className="font-medium text-primary">Enabled AI Features:</p>
              <ul className="space-y-2 text-sm text-secondary">
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-success-500" />
                  Customer insights and pattern analysis
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-success-500" />
                  Smart activity suggestions
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-success-500" />
                  AI-generated email templates
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-success-500" />
                  Deal probability scoring
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-success-500" />
                  Automatic ticket priority classification
                </li>
                <li className="flex items-center gap-2">
                  <Check size={16} className="text-success-500" />
                  Dynamic UI customization wizard
                </li>
              </ul>
            </div>
          )}

          {/* Usage Stats */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-dark-800 rounded-md">
            <div className="text-sm font-medium text-primary">AI API Usage</div>
            <p className="text-2xl font-bold text-primary-500 mt-2">{usageCount} requests</p>
            <p className="text-xs text-secondary mt-1">Total AI API calls made</p>
          </div>

          {/* Save Button */}
          <button
            onClick={saveSettings}
            disabled={saving || !openaiApiKey}
            className="w-full h-12 bg-primary-500 text-white rounded-md font-semibold flex items-center justify-center gap-2 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={20} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-info-500/10 border border-info-500/20 rounded-lg p-6">
        <h3 className="font-semibold text-info-500 mb-2">About AI Features</h3>
        <p className="text-sm text-secondary">
          Our AI-powered CRM uses OpenAI's advanced models to provide intelligent insights,
          automate routine tasks, and help you make better decisions. All data is processed
          securely and your API key is never shared with third parties.
        </p>
      </div>
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUICustomization } from '../contexts/UICustomizationContext'
import { supabase } from '../lib/supabase'
import { 
  Sparkles, 
  Send, 
  X, 
  RotateCcw, 
  Check, 
  Loader, 
  Eye, 
  EyeOff,
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  customization?: any
}

interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export default function AIWizard({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const {
    customizations,
    loadCustomizations,
    applyCustomization,
    removeCustomization,
    previewMode,
    setPreviewMode,
    setPreviewStyles
  } = useUICustomization()
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI UI Wizard. I can help you customize the CRM interface in real-time with live preview. Try saying things like:\n\n• "Make the deal cards neon green with larger fonts"\n• "Add more spacing to the dashboard"\n• "Change customer cards to a minimal style"\n• "Make the sidebar darker"\n\nWhat would you like to customize?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentPreview, setCurrentPreview] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCustomizations()
    loadChatSessions()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function loadChatSessions() {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setChatSessions(data || [])
    } catch (error) {
      console.error('Error loading chat sessions:', error)
    }
  }

  async function createNewSession() {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user?.id,
          title: 'New Conversation'
        })
        .select()
        .single()

      if (error) throw error

      setCurrentSessionId(data.id)
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I\'m your AI UI Wizard. I can help you customize the CRM interface in real-time with live preview. Try saying things like:\n\n• "Make the deal cards neon green with larger fonts"\n• "Add more spacing to the dashboard"\n• "Change customer cards to a minimal style"\n• "Make the sidebar darker"\n\nWhat would you like to customize?'
        }
      ])
      await loadChatSessions()
    } catch (error) {
      console.error('Error creating session:', error)
    }
  }

  async function loadSession(sessionId: string) {
    try {
      setLoading(true)
      setCurrentSessionId(sessionId)

      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const loadedMessages: Message[] = data.map(msg => ({
        role: msg.role,
        content: msg.content,
        customization: msg.customization_data
      }))

      setMessages(loadedMessages.length > 0 ? loadedMessages : [
        {
          role: 'assistant',
          content: 'Hello! I\'m your AI UI Wizard. What would you like to customize?'
        }
      ])
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteSession(sessionId: string) {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) throw error

      if (currentSessionId === sessionId) {
        setCurrentSessionId(null)
        setMessages([
          {
            role: 'assistant',
            content: 'Hello! I\'m your AI UI Wizard. What would you like to customize?'
          }
        ])
      }

      await loadChatSessions()
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      // Create session if needed
      let sessionId = currentSessionId
      if (!sessionId) {
        const { data, error } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user?.id,
            title: userMessage.substring(0, 50)
          })
          .select()
          .single()

        if (error) throw error
        sessionId = data.id
        setCurrentSessionId(sessionId)
        await loadChatSessions()
      }

      const { data, error } = await supabase.functions.invoke('ai-ui-wizard', {
        body: {
          action: 'generate',
          userRequest: userMessage,
          sessionId
        }
      })

      if (error) throw error

      const customization = data?.data
      
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I've created a customization for you!\n\n**Component:** ${customization.component}\n**Changes:** ${customization.description}\n\n**Preview:** ${customization.preview}\n\nClick "Show Preview" to see the changes live, or "Apply Now" to make them permanent.`,
          customization
        }
      ])

      setCurrentPreview(customization)
    } catch (error: any) {
      console.error('Error generating customization:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please make sure AI features are enabled in Settings and your OpenAI API key is configured.`
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  function togglePreview(customization: any) {
    if (showPreview) {
      // Disable preview
      setShowPreview(false)
      setPreviewMode(false)
      setPreviewStyles({})
      
      // Remove preview styles from DOM
      const previewElement = document.getElementById('ai-preview-styles')
      if (previewElement) {
        previewElement.remove()
      }
    } else {
      // Enable preview
      setShowPreview(true)
      setPreviewMode(true)
      
      // Apply preview styles
      const previewStyles = {
        [customization.component]: customization.modifications
      }
      setPreviewStyles(previewStyles)
      
      // Create preview style element
      let previewElement = document.getElementById('ai-preview-styles')
      if (!previewElement) {
        previewElement = document.createElement('style')
        previewElement.id = 'ai-preview-styles'
        document.head.appendChild(previewElement)
      }
      
      // Generate CSS for preview
      const css = generatePreviewCSS(customization)
      previewElement.textContent = css
    }
  }

  function generatePreviewCSS(customization: any): string {
    const { component, modifications } = customization
    const selector = `[data-component="${component}"]`
    const rules: string[] = []

    if (modifications.colors) {
      Object.entries(modifications.colors).forEach(([key, value]: [string, any]) => {
        if (key === 'background') rules.push(`background-color: ${value} !important;`)
        else if (key === 'text') rules.push(`color: ${value} !important;`)
        else if (key === 'border') rules.push(`border-color: ${value} !important;`)
      })
    }

    if (modifications.spacing) {
      Object.entries(modifications.spacing).forEach(([key, value]: [string, any]) => {
        if (key === 'padding') rules.push(`padding: ${value} !important;`)
        else if (key === 'margin') rules.push(`margin: ${value} !important;`)
        else if (key === 'gap') rules.push(`gap: ${value} !important;`)
      })
    }

    if (modifications.fontSize) {
      rules.push(`font-size: ${modifications.fontSize} !important;`)
    }

    if (modifications.borderRadius) {
      rules.push(`border-radius: ${modifications.borderRadius} !important;`)
    }

    if (modifications.theme === 'neon') {
      rules.push('box-shadow: 0 0 20px currentColor !important;')
      rules.push('border: 2px solid currentColor !important;')
    }

    return `${selector} { ${rules.join(' ')} animation: ai-preview-pulse 2s infinite; }\n@keyframes ai-preview-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.8; } }`
  }

  async function applyCustomizationNow(customization: any) {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.functions.invoke('ai-ui-wizard', {
        body: {
          action: 'apply',
          customizationId: customization.id
        }
      })

      if (error) throw error

      // Apply to context immediately
      applyCustomization({
        id: customization.id,
        component_name: customization.component,
        modifications: customization.modifications,
        is_active: true
      })

      // Disable preview mode
      setShowPreview(false)
      setPreviewMode(false)
      const previewElement = document.getElementById('ai-preview-styles')
      if (previewElement) {
        previewElement.remove()
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Customization applied successfully! The changes are now live. You can continue making more changes or close the wizard.'
        }
      ])

      await loadCustomizations()
    } catch (error) {
      console.error('Error applying customization:', error)
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Failed to apply customization. Please try again.'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  async function rollbackCustomization(id: string, componentName: string) {
    try {
      setLoading(true)
      
      const { error } = await supabase.functions.invoke('ai-ui-wizard', {
        body: {
          action: 'rollback',
          customizationId: id
        }
      })

      if (error) throw error

      removeCustomization(id)

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Customization for ${componentName} rolled back successfully!`
        }
      ])

      await loadCustomizations()
    } catch (error) {
      console.error('Error rolling back customization:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Sliding Sidebar */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-full sm:w-[500px] bg-surface shadow-2xl z-50 flex transform transition-transform duration-300 ease-out"
        style={{ transform: 'translateX(0)' }}
      >
        {/* Chat History Panel (Collapsible) */}
        {showHistory && (
          <div className="w-64 border-r border-neutral-200 dark:border-neutral-dark-700 flex flex-col">
            {/* History Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-dark-700 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-primary">Chat History</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="w-6 h-6 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-dark-800 rounded"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="p-3">
              <button
                onClick={createNewSession}
                className="w-full h-10 bg-primary-500 text-white rounded-md font-medium text-sm hover:bg-primary-600 flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                New Chat
              </button>
            </div>

            {/* Session List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-md cursor-pointer group relative ${
                    currentSessionId === session.id
                      ? 'bg-primary-50 dark:bg-primary-500/10 border border-primary-500/20'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-dark-800'
                  }`}
                  onClick={() => loadSession(session.id)}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare size={14} className="text-primary-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-primary truncate">{session.title}</p>
                      <p className="text-xs text-secondary mt-1">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSession(session.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center hover:bg-error-500/10 rounded text-error-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-dark-700">
            <div className="flex items-center gap-3">
              {!showHistory && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-dark-800 rounded-md"
                >
                  <ChevronRight size={18} />
                </button>
              )}
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-info-500 rounded-lg flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary">AI UI Wizard</h2>
                <p className="text-xs text-secondary">Customize with live preview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showPreview && (
                <div className="px-2 py-1 bg-info-500/10 text-info-500 rounded-md text-xs font-medium flex items-center gap-1">
                  <Eye size={12} />
                  Preview
                </div>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-dark-800 rounded-md"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-info-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles size={16} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 dark:bg-neutral-dark-800 text-primary'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.customization && (
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <button
                        onClick={() => togglePreview(message.customization)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-info-500 text-white rounded-md text-xs font-medium hover:bg-info-600 disabled:opacity-50 flex items-center gap-1"
                      >
                        {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showPreview ? 'Hide' : 'Preview'}
                      </button>
                      <button
                        onClick={() => applyCustomizationNow(message.customization)}
                        disabled={loading}
                        className="px-3 py-1.5 bg-success-500 text-white rounded-md text-xs font-medium hover:bg-success-600 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Check size={14} />
                        Apply
                      </button>
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-medium text-xs">
                    {user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-info-500 rounded-full flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div className="bg-neutral-100 dark:bg-neutral-dark-800 rounded-lg p-3">
                  <Loader size={16} className="animate-spin text-primary-500" />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Active Customizations */}
          {customizations.filter(c => c.is_active).length > 0 && (
            <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-dark-700 bg-primary-50 dark:bg-primary-500/10">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-medium text-primary">
                  Active: {customizations.filter(c => c.is_active).length}
                </span>
                <div className="flex gap-1 flex-wrap">
                  {customizations.filter(c => c.is_active).slice(0, 3).map((custom) => (
                    <button
                      key={custom.id}
                      onClick={() => rollbackCustomization(custom.id, custom.component_name)}
                      className="px-2 py-1 bg-error-500/10 text-error-500 rounded text-xs font-medium hover:bg-error-500/20 flex items-center gap-1"
                      title="Rollback"
                    >
                      <RotateCcw size={10} />
                      {custom.component_name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-dark-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Describe UI changes..."
                disabled={loading}
                className="flex-1 h-10 px-3 rounded-md border border-neutral-200 dark:border-neutral-dark-700 bg-surface text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-primary-500 text-white rounded-md flex items-center justify-center hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-xs text-secondary mt-2">
              Tip: Use "Preview" to see changes before applying
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

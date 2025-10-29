import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Sparkles, Loader, TrendingUp, Mail, CheckCircle, AlertTriangle } from 'lucide-react'

interface AIInsightsProps {
  type: 'customer' | 'deal' | 'ticket' | 'activity' | 'email'
  entityId?: string
  context?: any
  onResult?: (result: any) => void
}

export default function AIInsights({ type, entityId, context, onResult }: AIInsightsProps) {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function generateInsights() {
    setLoading(true)
    setError(null)

    try {
      let functionName = ''
      let body: any = {}

      switch (type) {
        case 'customer':
          functionName = 'ai-customer-insights'
          body = { customerId: entityId }
          break
        case 'deal':
          functionName = 'ai-deal-scoring'
          body = { dealId: entityId }
          break
        case 'ticket':
          functionName = 'ai-ticket-classification'
          body = { ticketId: entityId }
          break
        case 'activity':
          functionName = 'ai-activity-suggestions'
          body = { entityType: context?.entityType, entityId: context?.entityId }
          break
        case 'email':
          functionName = 'ai-email-templates'
          body = {
            scenario: context?.scenario,
            customerId: context?.customerId,
            context: context?.additionalContext
          }
          break
      }

      const { data, error } = await supabase.functions.invoke(functionName, { body })

      if (error) throw error

      setInsights(data?.data)
      onResult?.(data?.data)
    } catch (err: any) {
      console.error('AI insights error:', err)
      setError(err.message || 'Failed to generate insights. Please check your AI settings.')
    } finally {
      setLoading(false)
    }
  }

  function renderInsights() {
    if (!insights) return null

    switch (type) {
      case 'customer':
        return (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none text-primary">
              <div className="whitespace-pre-wrap">{insights.insights}</div>
            </div>
            {insights.summary && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-neutral-50 dark:bg-neutral-dark-800 rounded-md">
                  <div className="text-xs text-secondary">Total Deals</div>
                  <div className="text-lg font-bold text-primary-500">{insights.summary.totalDeals}</div>
                </div>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-dark-800 rounded-md">
                  <div className="text-xs text-secondary">Activities</div>
                  <div className="text-lg font-bold text-primary-500">{insights.summary.totalActivities}</div>
                </div>
              </div>
            )}
          </div>
        )

      case 'deal':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-secondary">AI Probability Score</div>
                <div className="text-3xl font-bold text-primary-500">{insights.probability}%</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                insights.confidence === 'high' ? 'bg-success-500/10 text-success-500' :
                insights.confidence === 'medium' ? 'bg-warning-500/10 text-warning-500' :
                'bg-neutral-500/10 text-neutral-700'
              }`}>
                {insights.confidence} confidence
              </div>
            </div>
            
            {insights.factors && insights.factors.length > 0 && (
              <div>
                <div className="text-sm font-medium text-primary mb-2">Key Factors:</div>
                <ul className="space-y-1">
                  {insights.factors.map((factor: string, i: number) => (
                    <li key={i} className="text-sm text-secondary flex items-start gap-2">
                      <span className="text-primary-500 mt-1">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {insights.recommendation && (
              <div className="p-3 bg-primary-50 dark:bg-primary-500/10 rounded-md border border-primary-500/20">
                <div className="text-sm font-medium text-primary mb-1">Recommendation:</div>
                <p className="text-sm text-secondary">{insights.recommendation}</p>
              </div>
            )}
          </div>
        )

      case 'ticket':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`${
                insights.priority === 'urgent' ? 'text-error-500' :
                insights.priority === 'high' ? 'text-warning-500' :
                'text-info-500'
              }`} />
              <div>
                <div className="text-sm text-secondary">Suggested Priority</div>
                <div className="text-lg font-bold capitalize">{insights.priority}</div>
              </div>
            </div>
            
            <div className="p-3 bg-neutral-50 dark:bg-neutral-dark-800 rounded-md">
              <div className="text-sm font-medium text-primary mb-1">AI Reasoning:</div>
              <p className="text-sm text-secondary">{insights.reasoning}</p>
            </div>
            
            {insights.suggestedStatus && (
              <div className="text-sm">
                <span className="text-secondary">Suggested Status: </span>
                <span className="font-medium capitalize">{insights.suggestedStatus.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        )

      case 'activity':
        return (
          <div className="space-y-3">
            {insights.suggestions && insights.suggestions.map((suggestion: any, i: number) => (
              <div key={i} className="p-4 bg-neutral-50 dark:bg-neutral-dark-800 rounded-md border border-neutral-200 dark:border-neutral-dark-700">
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-primary-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium text-primary">{suggestion.subject}</div>
                    <div className="text-sm text-secondary mt-1 capitalize">
                      Type: {suggestion.type}
                    </div>
                    {suggestion.reason && (
                      <div className="text-xs text-secondary mt-2">{suggestion.reason}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'email':
        return (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-secondary mb-2">Subject:</div>
              <div className="p-3 bg-neutral-50 dark:bg-neutral-dark-800 rounded-md font-medium">
                {insights.template.subject}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-secondary mb-2">Body:</div>
              <div className="p-4 bg-neutral-50 dark:bg-neutral-dark-800 rounded-md whitespace-pre-wrap text-sm">
                {insights.template.body}
              </div>
            </div>
          </div>
        )

      default:
        return <div className="text-sm text-secondary">No insights available</div>
    }
  }

  return (
    <div className="bg-surface rounded-lg border border-neutral-200 dark:border-neutral-dark-700 p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-primary-500" />
          <h3 className="font-semibold text-primary">AI Insights</h3>
        </div>
        
        {!insights && (
          <button
            onClick={generateInsights}
            disabled={loading}
            className="px-4 py-2 bg-primary-500 text-white rounded-md text-sm font-medium hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={16} className="animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Insights
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-error-500/10 text-error-500 rounded-md border border-error-500/20 text-sm">
          {error}
        </div>
      )}

      {insights && (
        <div>
          {renderInsights()}
          <button
            onClick={generateInsights}
            disabled={loading}
            className="mt-4 px-4 py-2 text-sm text-secondary hover:text-primary border border-neutral-200 dark:border-neutral-dark-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-dark-800"
          >
            Regenerate
          </button>
        </div>
      )}
    </div>
  )
}

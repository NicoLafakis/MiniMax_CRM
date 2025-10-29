import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

interface UICustomization {
  id: string
  component_name: string
  modifications: {
    theme?: string
    colors?: Record<string, string>
    spacing?: Record<string, string>
    fontSize?: Record<string, string>
    borderRadius?: Record<string, string>
    layout?: Record<string, string>
  }
  is_active: boolean
}

interface UICustomizationContextType {
  customizations: UICustomization[]
  activeStyles: Record<string, any>
  loadCustomizations: () => Promise<void>
  applyCustomization: (customization: UICustomization) => void
  removeCustomization: (id: string) => void
  previewMode: boolean
  setPreviewMode: (enabled: boolean) => void
  previewStyles: Record<string, any>
  setPreviewStyles: (styles: Record<string, any>) => void
}

const UICustomizationContext = createContext<UICustomizationContextType | undefined>(undefined)

export function UICustomizationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [customizations, setCustomizations] = useState<UICustomization[]>([])
  const [activeStyles, setActiveStyles] = useState<Record<string, any>>({})
  const [previewMode, setPreviewMode] = useState(false)
  const [previewStyles, setPreviewStyles] = useState<Record<string, any>>({})

  useEffect(() => {
    if (user) {
      loadCustomizations()
    }
  }, [user])

  async function loadCustomizations() {
    try {
      const { data, error } = await supabase
        .from('ui_customizations')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCustomizations(data || [])

      // Apply active customizations immediately
      const active = (data || []).filter((c: UICustomization) => c.is_active)
      const mergedStyles = mergeCustomizations(active)
      setActiveStyles(mergedStyles)
      applyStylesToDOM(mergedStyles)
    } catch (error) {
      console.error('Error loading customizations:', error)
    }
  }

  function mergeCustomizations(customizationList: UICustomization[]): Record<string, any> {
    const merged: Record<string, any> = {}

    customizationList.forEach((customization) => {
      const { component_name, modifications } = customization

      if (!merged[component_name]) {
        merged[component_name] = {}
      }

      // Merge modifications
      Object.assign(merged[component_name], modifications)
    })

    return merged
  }

  function applyStylesToDOM(styles: Record<string, any>) {
    // Create or update dynamic style element
    let styleElement = document.getElementById('ai-dynamic-styles')
    
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'ai-dynamic-styles'
      document.head.appendChild(styleElement)
    }

    // Generate CSS from styles object
    const css = generateCSSFromStyles(styles)
    styleElement.textContent = css
  }

  function generateCSSFromStyles(styles: Record<string, any>): string {
    let css = ''

    Object.entries(styles).forEach(([componentName, modifications]: [string, any]) => {
      const selector = `[data-component="${componentName}"]`

      // Build CSS rules
      const rules: string[] = []

      if (modifications.colors) {
        Object.entries(modifications.colors).forEach(([key, value]) => {
          if (key === 'background') rules.push(`background-color: ${value} !important;`)
          else if (key === 'text') rules.push(`color: ${value} !important;`)
          else if (key === 'border') rules.push(`border-color: ${value} !important;`)
          else rules.push(`--${key}: ${value};`)
        })
      }

      if (modifications.spacing) {
        Object.entries(modifications.spacing).forEach(([key, value]) => {
          if (key === 'padding') rules.push(`padding: ${value} !important;`)
          else if (key === 'margin') rules.push(`margin: ${value} !important;`)
          else if (key === 'gap') rules.push(`gap: ${value} !important;`)
        })
      }

      if (modifications.fontSize) {
        Object.entries(modifications.fontSize).forEach(([key, value]) => {
          rules.push(`font-size: ${value} !important;`)
        })
      }

      if (modifications.borderRadius) {
        Object.entries(modifications.borderRadius).forEach(([key, value]) => {
          rules.push(`border-radius: ${value} !important;`)
        })
      }

      if (modifications.layout) {
        Object.entries(modifications.layout).forEach(([key, value]) => {
          if (key === 'width') rules.push(`width: ${value} !important;`)
          else if (key === 'height') rules.push(`height: ${value} !important;`)
          else if (key === 'display') rules.push(`display: ${value} !important;`)
          else if (key === 'flexDirection') rules.push(`flex-direction: ${value} !important;`)
        })
      }

      // Add theme-specific styles
      if (modifications.theme) {
        switch (modifications.theme) {
          case 'neon':
            rules.push('box-shadow: 0 0 20px currentColor !important;')
            rules.push('border: 2px solid currentColor !important;')
            break
          case 'minimal':
            rules.push('box-shadow: none !important;')
            rules.push('border: 1px solid #e5e5e5 !important;')
            break
          case 'bold':
            rules.push('font-weight: 700 !important;')
            rules.push('border-width: 3px !important;')
            break
        }
      }

      if (rules.length > 0) {
        css += `${selector} { ${rules.join(' ')} }\n`
      }
    })

    return css
  }

  function applyCustomization(customization: UICustomization) {
    const updated = [...customizations]
    const index = updated.findIndex((c) => c.id === customization.id)
    
    if (index >= 0) {
      updated[index] = { ...customization, is_active: true }
    } else {
      updated.push({ ...customization, is_active: true })
    }

    setCustomizations(updated)

    const active = updated.filter((c) => c.is_active)
    const mergedStyles = mergeCustomizations(active)
    setActiveStyles(mergedStyles)
    applyStylesToDOM(mergedStyles)
  }

  function removeCustomization(id: string) {
    const updated = customizations.map((c) =>
      c.id === id ? { ...c, is_active: false } : c
    )

    setCustomizations(updated)

    const active = updated.filter((c) => c.is_active)
    const mergedStyles = mergeCustomizations(active)
    setActiveStyles(mergedStyles)
    applyStylesToDOM(mergedStyles)
  }

  return (
    <UICustomizationContext.Provider
      value={{
        customizations,
        activeStyles,
        loadCustomizations,
        applyCustomization,
        removeCustomization,
        previewMode,
        setPreviewMode,
        previewStyles,
        setPreviewStyles,
      }}
    >
      {children}
    </UICustomizationContext.Provider>
  )
}

export function useUICustomization() {
  const context = useContext(UICustomizationContext)
  if (!context) {
    throw new Error('useUICustomization must be used within UICustomizationProvider')
  }
  return context
}

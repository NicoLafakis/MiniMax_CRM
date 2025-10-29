# AI CRM System - Copilot Instructions

## Architecture Overview

This is a React + TypeScript CRM application with real-time AI features built on Supabase backend. The system uses a modern component architecture with Context providers for state management.

### Key Technologies
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth + Storage)
- **AI Integration**: OpenAI GPT-4/5 via Supabase Edge Functions
- **UI Components**: Radix UI + Custom design system
- **Package Manager**: pnpm (all scripts use `pnpm install --prefer-offline`)

## Project Structure

```
crm-app/src/
├── components/       # Reusable UI components (AIInsights, AIWizard, Layout)
├── contexts/        # React Context providers (Auth, Theme, UICustomization)
├── pages/          # Page components with data fetching
├── lib/            # Shared utilities (supabase client, types)
└── hooks/          # Custom React hooks
```

## Critical Development Patterns

### 1. Supabase Data Architecture
- All entities have `user_id` for multi-tenant isolation
- Use TypeScript types from `lib/supabase.ts` (Customer, Deal, Ticket, etc.)
- RLS policies enforce user-level security
- AI insights stored in `ai_insights` table with `entity_type/entity_id` relations

### 2. AI Feature Implementation
Each AI feature follows this pattern:
- **Edge Function**: `/supabase/functions/ai-{feature}/index.ts` handles OpenAI API calls
- **React Component**: Uses `supabase.functions.invoke()` to call edge functions
- **Fallback Strategy**: Try GPT-5-mini, fallback to GPT-4o-mini
- **User Settings**: Requires `openai_api_key` and `ai_features_enabled` in user_settings

```typescript
// Standard AI function call pattern
const { data, error } = await supabase.functions.invoke('ai-customer-insights', {
  body: { customerId: entityId }
})
```

### 3. UI Customization System
- **Live Preview**: `UICustomizationContext` applies styles via DOM manipulation
- **Component Targeting**: Use `data-component="component-name"` attributes
- **Dynamic CSS**: Styles injected via `#ai-dynamic-styles` element
- **AI Wizard**: Generates customizations through natural language → CSS

### 4. Authentication & Context Layering
App wraps all components in this order:
```tsx
<ThemeProvider>
  <AuthProvider>
    <UICustomizationProvider>
      <BrowserRouter>
        <AppRoutes />
```

## Build & Development Commands

```bash
# Development (auto-installs dependencies)
pnpm dev

# Production build with TypeScript check
pnpm build:prod

# Clean reset (removes node_modules and lockfile)  
pnpm clean
```

## Component Conventions

### Data Components
- Use `data-component` attributes for AI customization targeting
- Implement loading states with spinner + "Loading..." text
- Error boundaries wrap critical sections
- Page components handle their own data fetching in useEffect

### AI Components Pattern
```tsx
// Standard AI component structure
export default function AIComponent({ type, entityId, onResult }) {
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState(null)
  
  async function generateInsights() {
    const { data, error } = await supabase.functions.invoke('ai-function-name')
    // Handle response and update state
  }
}
```

### Theme System
- Uses CSS custom properties with Tailwind
- Light/dark mode via `next-themes`
- Semantic color names: `primary`, `secondary`, `success`, `warning`, `error`, `info`
- Consistent spacing scale: 2, 3, 4, 6, 8, 10, 12, 16, 24

## Database Patterns

### Query Patterns
```typescript
// Always filter by user_id first
const { data } = await supabase
  .from('customers')
  .select('*')
  .eq('user_id', user?.id)
  .order('created_at', { ascending: false })
```

### AI Insights Storage
```sql
INSERT INTO ai_insights (user_id, entity_type, entity_id, insight_type, insight_data)
VALUES (?, 'customer', ?, 'customer_analysis', jsonb)
```

## Critical Integration Points

### Edge Functions (Deno Environment)
- Use `Deno.env.get()` for environment variables
- CORS headers required for all responses
- User authentication via `Authorization: Bearer {token}`
- Service role key for database operations

### Supabase Client Configuration
- Uses Vite env vars in `lib/supabase.ts` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Values come from `crm-app/.env.local` (see `.env.example`), no hardcoded keys in source
- RLS policies handle user isolation
- File uploads use `crm-attachments-temp` bucket

## When Modifying Code

1. **AI Features**: Check user settings for API keys before function calls
2. **UI Components**: Add `data-component` attributes for customization
3. **Database Queries**: Always include `user_id` filter
4. **Styling**: Use semantic color classes, avoid hardcoded values
5. **Error Handling**: Use consistent error boundary patterns

## Common Issues & Solutions

- **AI Function Failures**: Usually missing/invalid OpenAI API key in user_settings
- **Preview Mode**: Check `UICustomizationContext.previewMode` state
- **Build Errors**: Clean node_modules with `pnpm clean` then rebuild
- **RLS Issues**: Verify `user_id` matches authenticated user in queries
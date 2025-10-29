# AI CRM Testing Guide

## Deployment URLs
- **New Deployment**: https://y7dw19pz1e9i.space.minimax.io
- **Previous Deployment**: https://hsoeyx8x486m.space.minimax.io

## What Was Fixed

### 1. OpenAI Integration (Critical Fix)
**Problem**: All AI features were failing because edge functions tried to use `Deno.env.get('OPENAI_API_KEY')` but user keys are stored in database

**Fix Applied**:
- Updated all 6 edge functions to retrieve OpenAI API key from `user_settings` table
- Added validation to check if AI features are enabled
- Added proper error messages when API key is missing
- Increment usage counter after each API call

### 2. Model Upgrade
**Problem**: Using outdated `gpt-4o-mini` model

**Fix Applied**:
- Primary model: `gpt-5-mini-2025-08-07`
- Fallback model: `gpt-4o-mini` (if GPT-5 unavailable)
- Track which model was used in responses

### 3. AI Wizard Redesign
**Problem**: Full-screen modal blocking entire interface

**Fix Applied**:
- Redesigned as sliding sidebar from LEFT edge (not center)
- Width: 500px (responsive on mobile)
- Collapsible chat history panel (264px)
- Smooth slide-in/slide-out animations
- Backdrop overlay with click-to-close

### 4. Chat History System
**New Database Tables**:
- `chat_sessions`: Stores conversation sessions
- `chat_messages`: Stores individual messages with customization data

**Features**:
- Create new chat sessions
- Load previous conversations
- Delete old chats
- Auto-save messages
- Session titles auto-generated from first message

### 5. Edge Functions Deployed (All Version 2)
✅ `ai-customer-insights` - Updated and deployed
✅ `ai-activity-suggestions` - Updated and deployed  
✅ `ai-email-templates` - Updated and deployed
✅ `ai-deal-scoring` - Updated and deployed
✅ `ai-ticket-classification` - Updated and deployed
✅ `ai-ui-wizard` - Updated with chat history support

## Testing Checklist

### Phase 1: Basic Access
- [ ] Access the application URL
- [ ] Login or create new account
- [ ] Verify dashboard loads correctly

### Phase 2: Settings Configuration
- [ ] Navigate to Settings page
- [ ] Verify "OpenAI API Key" field is present (password input)
- [ ] Verify "Enable AI Features" toggle is present
- [ ] Enter your OpenAI API key (starts with sk-...)
- [ ] Toggle "Enable AI Features" to ON
- [ ] Click "Save Settings"
- [ ] Verify success message appears

### Phase 3: AI Wizard Sidebar Test
- [ ] Click the sparkles icon (gradient button) in top navigation
- [ ] **VERIFY**: Sidebar slides in from LEFT edge (not center modal)
- [ ] **VERIFY**: Sidebar is ~500px wide (not full screen)
- [ ] **VERIFY**: Backdrop overlay is visible behind sidebar
- [ ] **VERIFY**: Chat history panel is visible on left side of sidebar
- [ ] **VERIFY**: "New Chat" button is present at top of history panel
- [ ] **VERIFY**: Welcome message from AI assistant is displayed
- [ ] **VERIFY**: Message input field is at bottom of sidebar
- [ ] Click X button or backdrop to close
- [ ] **VERIFY**: Sidebar slides out smoothly

### Phase 4: Chat Functionality Test
- [ ] Open AI Wizard again
- [ ] Type message: "Make the deal cards green with larger fonts"
- [ ] Press Enter or click Send button
- [ ] **VERIFY**: Loading indicator appears
- [ ] **VERIFY**: AI response appears within 5-10 seconds
- [ ] **VERIFY**: Response includes customization details
- [ ] **VERIFY**: "Preview" and "Apply" buttons are present
- [ ] Click "Preview" button
- [ ] **VERIFY**: "Preview Active" badge appears in header
- [ ] **VERIFY**: Changes are visible on dashboard (if visible)
- [ ] Click "Hide Preview"
- [ ] **VERIFY**: Preview badge disappears
- [ ] Click "Apply" button
- [ ] **VERIFY**: Success message appears
- [ ] **VERIFY**: Changes are now permanent

### Phase 5: Chat History Test
- [ ] Click "New Chat" button
- [ ] **VERIFY**: Message history clears
- [ ] **VERIFY**: New conversation starts
- [ ] Send a message in new chat
- [ ] **VERIFY**: Previous chat appears in history panel
- [ ] Click on previous chat in history
- [ ] **VERIFY**: Previous conversation loads correctly
- [ ] Hover over a chat in history
- [ ] **VERIFY**: Delete button (trash icon) appears
- [ ] Click delete button on a chat
- [ ] **VERIFY**: Chat is removed from history

### Phase 6: AI Features Test

#### Customer Insights
- [ ] Navigate to Customers page
- [ ] Click on any existing customer
- [ ] **VERIFY**: "AI Insights" section appears
- [ ] **VERIFY**: Loading state shows briefly
- [ ] **VERIFY**: Insights are generated and displayed
- [ ] **VERIFY**: No error messages appear

#### Activity Suggestions
(If implemented in UI)
- [ ] View a customer, deal, or ticket
- [ ] Look for AI activity suggestions
- [ ] **VERIFY**: Suggestions are relevant and specific

#### Email Templates
- [ ] Click Email composer button (envelope icon)
- [ ] Select a scenario or type a description
- [ ] **VERIFY**: AI generates email subject and body
- [ ] **VERIFY**: Email is personalized if customer selected

#### Deal Scoring
- [ ] Navigate to Sales Pipeline
- [ ] View deal details
- [ ] **VERIFY**: AI probability score is displayed
- [ ] **VERIFY**: Explanation and factors are shown

#### Ticket Classification
- [ ] Navigate to Service Desk
- [ ] Create or view a ticket
- [ ] **VERIFY**: AI priority classification appears
- [ ] **VERIFY**: Reasoning is provided

### Phase 7: Error Handling Test
- [ ] Open AI Wizard without configuring API key
- [ ] Send a message
- [ ] **VERIFY**: Clear error message: "OpenAI API key not configured"
- [ ] Go to Settings, disable AI features
- [ ] Try using AI Wizard again
- [ ] **VERIFY**: Error message: "AI features are disabled"

### Phase 8: Visual & UX Test
- [ ] **VERIFY**: AI Wizard button has gradient background (blue to purple)
- [ ] **VERIFY**: Sidebar animation is smooth (no lag)
- [ ] **VERIFY**: Chat bubbles are properly styled:
  - User messages on right (blue background)
  - AI messages on left (gray background)
- [ ] **VERIFY**: Sidebar is responsive on mobile
- [ ] **VERIFY**: Active customizations show at bottom of sidebar
- [ ] **VERIFY**: Rollback buttons work for customizations

## Expected Errors (That Should Now Be Fixed)
❌ "new row violates row-level security policy" - SHOULD NOT APPEAR
❌ "OpenAI API call failed" with no details - SHOULD NOT APPEAR  
❌ Blank/empty AI responses - SHOULD NOT APPEAR
❌ AI Wizard opening as full-screen modal - SHOULD NOT HAPPEN

## Success Criteria
✅ All AI features work when API key is configured
✅ AI Wizard is a sliding sidebar from left edge
✅ Chat history persists and can be loaded
✅ Clear error messages when configuration is missing
✅ GPT-5-mini model is being used (or fallback to GPT-4o-mini)
✅ Usage counter increments in Settings
✅ Smooth animations and good UX

## If Issues Are Found
Please report:
1. Which test step failed
2. Exact error message (if any)
3. Screenshot of the issue
4. Browser console errors (F12 > Console tab)
5. Expected vs actual behavior

## Notes
- First AI request may take 5-10 seconds (OpenAI API call)
- Some features require existing data (customers, deals, tickets)
- Chat history is per-user (won't see other users' chats)
- All AI calls use your personal OpenAI API key (not shared)

# AI-Powered CRM - Feature Guide

## Deployment Information
- **Production URL**: https://br3792adu2cs.space.minimax.io
- **Original CRM URL**: https://2z1gspwm0824.space.minimax.io
- **Deployment Date**: 2025-10-30

---

## New AI Features Overview

Your CRM has been transformed into the world's first self-customizing AI-powered CRM with the following capabilities:

### 1. OpenAI Integration & Settings
**Location**: Settings page (accessible from navigation menu)

**Features**:
- Secure OpenAI API key storage (encrypted in Supabase)
- Toggle to enable/disable AI features
- Usage tracking dashboard
- Real-time configuration management

**Setup Instructions**:
1. Navigate to Settings
2. Enter your OpenAI API key (get one from https://platform.openai.com/api-keys)
3. Enable AI Features toggle
4. Save settings

---

### 2. AI Wizard - Dynamic UI Customization
**Location**: Gradient sparkles button in top navigation

**What It Does**:
The AI Wizard is a chat interface that lets you modify the CRM's UI using natural language. Simply describe what you want to change, and the AI generates the modifications in real-time.

**Example Commands**:
- "Make the deals board neon green with larger cards"
- "Add customer photos to all customer cards"
- "Change the dashboard to a dark theme"
- "Make the sidebar more compact"
- "Increase the font size on all headers"

**How It Works**:
1. Click the AI Wizard button (sparkles icon)
2. Type your desired UI change in natural language
3. AI analyzes your request and generates customization
4. Preview the changes before applying
5. Click "Apply" to make changes live
6. Use "Rollback" to undo any customization

**Features**:
- Natural language processing for UI modifications
- Real-time preview of changes
- One-click apply/rollback functionality
- Persistent customization profiles
- Change history tracking

---

### 3. AI Customer Insights
**Location**: Customer Detail pages

**What It Does**:
Analyzes customer data including deals, activities, and tickets to provide actionable insights, patterns, and recommendations.

**Features**:
- Behavioral pattern analysis
- Engagement level assessment
- Next action recommendations
- Risk and opportunity indicators
- Automated data aggregation

**How to Use**:
1. Open any customer detail page
2. Find the "AI Insights" section
3. Click "Generate Insights"
4. View AI-generated analysis and recommendations

---

### 4. Smart Activity Suggestions
**Location**: Available throughout the CRM (context-aware)

**What It Does**:
AI suggests relevant activities and next steps based on customer, deal, or ticket context.

**Features**:
- Context-aware suggestions (analyzes recent activities)
- Specific action recommendations (calls, emails, tasks, meetings)
- Reasoning for each suggestion
- Automatically prioritized by relevance

**Use Cases**:
- Get suggestions for customer follow-ups
- Identify next steps for deals
- Plan ticket resolution activities

---

### 5. AI Email Template Generator
**Location**: Email composer interface

**What It Does**:
Generates personalized email templates based on scenario and customer context.

**Features**:
- Scenario-based generation (follow-up, proposal, closing, support, etc.)
- Customer-specific personalization
- Professional tone and structure
- Subject line generation
- Context-aware content

**How to Use**:
1. Open email composer
2. Select or describe the email scenario
3. Choose a customer (optional for personalization)
4. AI generates subject and body
5. Edit and send

---

### 6. Deal Probability Scoring
**Location**: Deal detail pages

**What It Does**:
AI analyzes deal data and provides probability scores with detailed explanations.

**Features**:
- 0-100 probability score
- Confidence level (high/medium/low)
- Key factors analysis (positive and negative)
- Specific recommendations for improving win probability
- Historical activity consideration

**Use Cases**:
- Forecast accuracy improvement
- Deal prioritization
- Risk identification
- Pipeline optimization

---

### 7. Intelligent Ticket Classification
**Location**: Ticket creation and detail pages

**What It Does**:
Automatically classifies ticket priority based on content analysis.

**Features**:
- Priority classification (urgent/high/medium/low)
- Confidence score
- Reasoning explanation
- Suggested status
- Keyword and sentiment analysis

**Benefits**:
- Faster ticket triage
- Consistent prioritization
- Reduced manual classification time
- Better SLA compliance

---

## Technical Architecture

### Backend (Supabase Edge Functions)
All deployed and active at `fnljrbrvoprncsnltjzx.supabase.co`:

1. **ai-customer-insights**: Customer data analysis
2. **ai-activity-suggestions**: Context-based activity recommendations
3. **ai-email-templates**: Personalized email generation
4. **ai-deal-scoring**: Deal probability analysis
5. **ai-ticket-classification**: Automatic priority classification
6. **ai-ui-wizard**: Dynamic UI modification system

### Database Tables
- **user_settings**: Encrypted API keys and AI configuration
- **ui_customizations**: User UI modification profiles
- **ai_insights**: Historical AI-generated insights

### Frontend Components
- **SettingsPage**: API key and feature management
- **AIWizard**: Chat interface for UI customization
- **AIInsights**: Reusable AI insights component

---

## AI Models Used
- **Primary**: GPT-4o-mini (complex reasoning and analysis)
- **Fast**: GPT-4o-nano (simple responses and quick classifications)
- All responses are generated in real-time using OpenAI's API

---

## Privacy & Security
- OpenAI API keys are stored encrypted in Supabase
- No sensitive customer data is sent to AI (anonymized summaries only)
- All AI calls are logged for usage tracking
- Users can delete customizations and reset to original
- Full GDPR compliance maintained

---

## Usage Tips

### Getting Started
1. Configure your OpenAI API key in Settings
2. Enable AI Features
3. Explore AI Wizard by describing simple UI changes
4. Try generating customer insights on existing customers
5. Use AI email templates for common scenarios

### Best Practices
- **UI Wizard**: Be specific about changes (colors, sizes, layouts)
- **Customer Insights**: Review insights regularly for best patterns
- **Email Templates**: Always review AI-generated content before sending
- **Deal Scoring**: Use as a guide, not absolute truth
- **Ticket Classification**: Verify AI priority on critical tickets

### Troubleshooting
- **AI features not working**: Check API key is configured in Settings
- **Slow responses**: OpenAI API may be experiencing high load
- **Errors**: Check browser console and Supabase edge function logs
- **UI customizations not applying**: Refresh page after applying changes

---

## Future Enhancements (Potential)
- Voice-to-text for AI Wizard
- Multi-language support
- Custom AI training on your CRM data
- Automated workflow creation via AI
- Predictive customer churn analysis
- AI-powered reporting and dashboards

---

## Support & Resources
- **OpenAI API Documentation**: https://platform.openai.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **CRM Deployment**: https://br3792adu2cs.space.minimax.io

---

**Built by MiniMax Agent**
Transforming your CRM into an intelligent, self-customizing powerhouse.

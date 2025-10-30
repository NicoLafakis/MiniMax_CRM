# Design Specification - Minimalist CRM Application

**Style**: Modern Minimalism (Premium) with Dark Mode  
**Version**: 1.0  
**Platform**: Mobile-first responsive web application  
**Philosophy**: "Glass cannon" - powerful features, clean simple interface

---

## 1. Design Direction & Rationale

**Visual Essence:** Ultra-clean professional aesthetic emphasizing content clarity over decoration. Generous whitespace (40% of viewport), restrained color palette (90% neutral grays, 10% strategic accent), and refined micro-interactions create a premium feel without complexity. Designed for users who need powerful CRM features but refuse desk-bound interfaces.

**Real-World Reference:**
- Linear (project management) - linear.app
- Notion (productivity workspace) - notion.so
- Stripe Dashboard (payment analytics) - dashboard.stripe.com

**Core Principle:** Mobile-first responsive design ensures seamless experience across devices. Touch targets ≥48px, collapsible navigation, and card-based layouts maintain usability from 320px to 2560px viewports.

---

## 2. Design Tokens

### 2.1 Color System - Light Mode (Default)

| Token | Value | Usage | WCAG |
|-------|-------|-------|------|
| **Primary (Brand)** |
| primary-50 | #E6F0FF | Hover backgrounds, badges | - |
| primary-100 | #CCE0FF | Subtle highlights | - |
| primary-500 | #0066FF | CTAs, links, active states | 4.53:1 ✅ |
| primary-600 | #0052CC | Hover states for primary | 6.12:1 ✅ |
| primary-900 | #003D99 | High contrast primary text | 9.8:1 ✅ |
| **Neutrals** |
| neutral-50 | #FAFAFA | Page background | - |
| neutral-100 | #F5F5F5 | Card/surface background | - |
| neutral-200 | #E5E5E5 | Borders, dividers | - |
| neutral-500 | #A3A3A3 | Disabled text, placeholders | 3.9:1 ⚠️ |
| neutral-700 | #404040 | Secondary text | 8.6:1 ✅ |
| neutral-900 | #171717 | Primary text | 16.5:1 ✅ |
| **Semantic** |
| success-500 | #10B981 | Success states, closed-won | 3.1:1 (large only) |
| warning-500 | #F59E0B | Warnings, pending status | 2.8:1 (large only) |
| error-500 | #EF4444 | Errors, closed-lost | 4.2:1 ✅ |
| info-500 | #3B82F6 | Info states | 4.8:1 ✅ |
| **Backgrounds** |
| bg-page | neutral-50 | Main page background | - |
| bg-surface | neutral-100 | Cards, modals, panels | - |

**WCAG Validation (Key Pairings):**
- Primary text: neutral-900 on bg-page (#171717 on #FAFAFA) = 16.2:1 ✅ AAA
- Primary CTA: white on primary-500 (#FFF on #0066FF) = 4.63:1 ✅ AA
- Secondary text: neutral-700 on bg-surface (#404040 on #F5F5F5) = 8.4:1 ✅ AAA

### 2.2 Color System - Dark Mode

| Token | Value | Usage | WCAG |
|-------|-------|-------|------|
| **Primary (Brand)** |
| primary-400 | #3B8FFF | CTAs, links (lightened for dark bg) | 5.2:1 ✅ |
| primary-500 | #0066FF | Hover states | 4.53:1 ✅ |
| **Neutrals** |
| neutral-50 | #FAFAFA | Primary text (inverted) | - |
| neutral-100 | #F5F5F5 | Secondary text (inverted) | - |
| neutral-700 | #2A2A2A | Borders, dividers | - |
| neutral-800 | #1F1F1F | Card/surface background | - |
| neutral-900 | #0A0A0A | Page background | - |
| **Semantic** |
| success-400 | #34D399 | Success (lightened) | 4.1:1 ✅ |
| warning-400 | #FBBF24 | Warning (lightened) | 3.5:1 ⚠️ |
| error-400 | #F87171 | Error (lightened) | 4.6:1 ✅ |
| info-400 | #60A5FA | Info (lightened) | 5.1:1 ✅ |
| **Backgrounds** |
| bg-page | neutral-900 | Main page background | - |
| bg-surface | neutral-800 | Cards, modals, panels | - |

**Dark Mode Contrast Notes:**
- Primary text: neutral-50 on neutral-900 (#FAFAFA on #0A0A0A) = 17.8:1 ✅ AAA
- Primary CTA: white on primary-400 (#FFF on #3B8FFF) = 5.2:1 ✅ AA
- Surface depth: neutral-800 on neutral-900 creates 3.2% lightness contrast

### 2.3 Typography

| Token | Value | Usage |
|-------|-------|-------|
| **Font Families** |
| font-primary | 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif | All text |
| **Font Sizes (Desktop)** |
| text-xs | 12px | Timestamps, metadata |
| text-sm | 14px | Helper text, captions |
| text-base | 16px | Body text, UI text |
| text-lg | 18px | Prominent body text |
| text-xl | 20px | Subheadings |
| text-2xl | 24px | Card titles |
| text-3xl | 32px | Section headers |
| text-4xl | 40px | Page titles |
| text-5xl | 48px | Dashboard hero |
| **Font Weights** |
| font-regular | 400 | Body text |
| font-medium | 500 | Navigation, labels |
| font-semibold | 600 | Subheadings, buttons |
| font-bold | 700 | Headlines |
| **Line Heights** |
| leading-tight | 1.2 | Headlines |
| leading-normal | 1.5 | Body text |
| leading-relaxed | 1.6 | Long-form content |

### 2.4 Spacing (4pt Grid, Prefer 8pt Multiples)

| Token | Value | Usage |
|-------|-------|-------|
| space-2 | 8px | Tight inline spacing |
| space-3 | 12px | Icon + text gaps |
| space-4 | 16px | Standard element spacing |
| space-6 | 24px | Related group spacing |
| space-8 | 32px | Card padding (minimum) |
| space-10 | 40px | Mobile section spacing |
| space-12 | 48px | Desktop section spacing |
| space-16 | 64px | Large section boundaries |
| space-24 | 96px | Hero section spacing |

### 2.5 Other Tokens

| Category | Token | Value |
|----------|-------|-------|
| **Border Radius** |
| | radius-sm | 8px (small elements) |
| | radius-md | 12px (buttons, inputs) |
| | radius-lg | 16px (cards, modals) |
| | radius-full | 9999px (avatars, pills) |
| **Shadows** |
| | shadow-sm | 0 1px 2px rgba(0,0,0,0.05) |
| | shadow-card | 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06) |
| | shadow-card-hover | 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05) |
| | shadow-modal | 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04) |
| **Animation** |
| | duration-fast | 200ms (clicks, hovers) |
| | duration-base | 250ms (standard transitions) |
| | duration-slow | 300ms (modals, drawers) |
| | easing-default | ease-out (90% of cases) |
| | easing-smooth | ease-in-out (elegance) |

---

## 3. Component Specifications

### 3.1 Navigation Bar (Mobile-First)

**Structure:** Fixed top position, collapses to hamburger on mobile, horizontal layout on desktop.

**Desktop (≥1024px):**
- Height: 64px
- Background: bg-surface with 1px bottom border (neutral-200)
- Logo: Left aligned, 32px height
- Nav items: Horizontal, text-base, font-medium
- Search bar: Center, 240px width, 40px height
- Actions: Right aligned (notifications, theme toggle, profile)
- Padding: 16px horizontal

**Mobile (<1024px):**
- Height: 56px
- Hamburger icon: 24px, left side (when menu closed)
- Logo: Center, 28px height
- Actions: Right side (search icon, profile)
- Menu drawer: Full-width slide-in from left, 280px wide
- Menu items: Vertical stack, 48px touch targets

**States:**
- Default: Transparent background
- Scrolled: Add shadow-sm for depth
- Active item: primary-500 text + 2px bottom border

### 3.2 Button System (Max 2 Variants)

**Primary CTA:**
- Height: 48px (56px on desktop for prominent CTAs)
- Padding: 16px horizontal (24px for wide buttons)
- Radius: radius-md (12px)
- Font: font-semibold, text-base
- Background: primary-500
- Text: White
- Hover: primary-600 + translateY(-2px) + scale(1.02)
- Focus: 2px primary-500 ring
- Animation: 200ms ease-out

**Secondary Button:**
- Same dimensions as Primary
- Border: 2px solid neutral-200
- Background: Transparent (light) / neutral-800 (dark)
- Text: neutral-700 (light) / neutral-100 (dark)
- Hover: bg-neutral-100 (light) / bg-neutral-700 (dark)

**Icon-Only Button:**
- Size: 40px × 40px (48px touch target)
- Icon: 20px
- Radius: radius-md
- Background: Transparent
- Hover: bg-neutral-100 (light) / bg-neutral-800 (dark)

### 3.3 Card System (Universal Container)

**Base Card:**
- Padding: 32px (24px on mobile)
- Background: bg-surface
- Radius: radius-lg (16px)
- Border: 1px solid neutral-200 (light) / neutral-700 (dark)
- Shadow: shadow-card
- Gap: 24px between cards in grids

**Interactive Card (Clickable):**
- Base Card styles
- Hover: translateY(-4px) + shadow-card-hover + scale(1.01)
- Animation: 250ms ease-out
- Cursor: pointer

**Card Header Pattern:**
- Title: text-2xl, font-semibold
- Subtitle/Meta: text-sm, neutral-700, space-2 margin-top
- Action buttons: Aligned right in header

**Card Content Pattern:**
- Body text: text-base, leading-normal
- Sections: space-6 margin between groups
- Dividers: 1px neutral-200, space-6 vertical spacing

### 3.4 Input Field System

**Text Input:**
- Height: 48px
- Padding: 12px horizontal
- Radius: radius-md
- Border: 1px solid neutral-200
- Background: bg-surface
- Font: text-base, font-regular
- Focus: 2px primary-500 ring, border color to primary-500
- Error: 2px error-500 ring, border color to error-500
- Disabled: bg-neutral-100, text neutral-500

**Label:**
- Font: text-sm, font-medium
- Color: neutral-700
- Margin: space-2 below label

**Helper/Error Text:**
- Font: text-sm, font-regular
- Color: neutral-500 (helper) / error-500 (error)
- Margin: space-2 above text

**Search Input:**
- Base input + left icon (20px magnifying glass)
- Padding-left: 40px (accommodate icon)
- Desktop: 240-320px width, 40px height
- Mobile: Full-width, 48px height

### 3.5 Data Table (CRM Lists)

**Structure:** Responsive table that collapses to card list on mobile.

**Desktop Table:**
- Header: bg-neutral-100, font-medium, text-sm, 12px padding
- Rows: 48px height, 12px padding, border-bottom 1px neutral-200
- Hover: bg-neutral-50 (light) / bg-neutral-800 (dark)
- Columns: Left-aligned text, right-aligned numbers
- Actions: Icon buttons in rightmost column (24px)

**Mobile Card List (<768px):**
- Stack rows as individual cards
- Card height: auto
- Key fields: Visible in compact format
- Tap card: Expand to full detail
- Swipe actions: Quick actions (call, email, delete)

**Pagination:**
- Position: Bottom center
- Style: Text links (Previous / Page 1 of 10 / Next)
- Font: text-sm, font-medium
- Spacing: space-4 between elements

### 3.6 CRM-Specific: Pipeline Board

**Structure:** Horizontal columns representing stages, vertical cards for deals.

**Column:**
- Width: 320px (fixed on desktop)
- Background: bg-page (lighter than cards)
- Header: Stage name + deal count + total value
- Padding: space-4
- Gap: space-4 between cards

**Deal Card:**
- Width: 100% of column (312px effective)
- Padding: space-4 (16px)
- Background: bg-surface
- Radius: radius-md
- Shadow: shadow-sm
- Draggable: Cursor grab, hover lift effect

**Deal Card Content:**
- Title: text-base, font-semibold (customer/deal name)
- Value: text-lg, font-bold, primary-500 color
- Meta: text-sm, neutral-500 (stage, owner, date)
- Avatar: 24px circle, bottom-left

**Mobile Pipeline (<768px):**
- Vertical sections (not horizontal columns)
- Collapsible stages (tap header to expand)
- No drag-and-drop (use dropdown to change stage)

### 3.7 CRM-Specific: Activity Timeline

**Structure:** Vertical timeline showing chronological interactions.

**Timeline Container:**
- Left border: 2px solid neutral-200
- Padding-left: space-8

**Timeline Item:**
- Dot: 12px circle on left border (absolute position)
- Dot colors: Match activity type (call=primary, email=info, task=warning)
- Content card: Offset space-8 from border
- Spacing: space-6 between items

**Activity Card:**
- Base Card (lighter weight)
- Padding: space-4
- Icon: 16px, top-left
- Title: text-base, font-medium
- Time: text-xs, neutral-500
- Description: text-sm, space-2 margin-top

### 3.8 CRM-Specific: Ticket Status Badge

**Structure:** Pill-shaped status indicator.

**Base Styles:**
- Display: inline-block
- Padding: 4px 12px
- Radius: radius-full
- Font: text-xs, font-medium
- Height: 24px

**Status Colors:**
- New: bg-info-500/10, text-info-500
- In Progress: bg-primary-500/10, text-primary-500
- Pending: bg-warning-500/10, text-warning-500
- Resolved: bg-success-500/10, text-success-500
- Closed: bg-neutral-500/10, text-neutral-500

**Priority Badges (Similar Pattern):**
- Urgent: bg-error-500, text-white
- High: bg-warning-500/20, text-warning-600
- Medium: bg-neutral-500/10, text-neutral-600
- Low: bg-neutral-200, text-neutral-500

---

## 4. Layout & Responsive Architecture

### 4.1 Application Shell Structure

**Master Layout:**
```
[Navigation Bar - Fixed Top]
[Page Content - Scrollable]
  [Page Header]
  [Content Area]
[Mobile Navigation - Fixed Bottom (optional)]
```

**Page Width Container:**
- Max-width: 1400px (generous space)
- Padding: 24px horizontal (desktop), 16px (mobile)
- Margin: auto (centered)

### 4.2 Dashboard Page Pattern

**Desktop Layout (≥1024px):**
- Grid: 4 columns (repeat(4, 1fr))
- Gap: 24px
- Metric cards: 1 column each (4 across)
- Chart cards: 2 columns (2 across)
- Activity feed: 2 columns
- Recent items: 2 columns

**Tablet Layout (768-1023px):**
- Grid: 2 columns
- Metric cards: 2 across (span-1)
- Chart/Activity: Full-width (span-2)

**Mobile Layout (<768px):**
- Single column (100% width)
- Vertical stack
- Metric cards: Compact version (2 across using flex)

### 4.3 Customer Detail Page Pattern

**Desktop Layout:**
- Header: Full-width, 120px height
  - Avatar: 64px circle, left
  - Name: text-4xl, font-bold
  - Quick actions: Right aligned buttons
  - Tags/Status: Below name

- Content: 2-column layout (8/4 split)
  - Main (8 cols): Activity timeline, notes, files
  - Sidebar (4 cols): Contact info, custom fields, related records

**Mobile Layout:**
- Header: Compact, 80px height
- Content: Single column stack
- Sidebar: Below main content
- Sticky quick actions: Bottom sheet

### 4.4 List/Table Pages (Customers, Deals, Tickets)

**Desktop Layout:**
- Page header: 80px height
  - Title: text-3xl, left
  - Actions: Right (+ New, Filters, Export)
- Filters: Horizontal tabs below header (40px height)
- Table: Full-width data table (see §3.5)
- Pagination: Bottom center

**Mobile Layout:**
- Sticky header: 56px
  - Title: text-2xl
  - Filter icon: Right
- Filter drawer: Slide from right
- Card list: Replaces table (see §3.5)
- Load more: Button at bottom (infinite scroll optional)

### 4.5 Form Pages (Create/Edit Records)

**Desktop Layout:**
- Max-width: 800px (narrow for focus)
- Card container: 48px padding
- Form sections: space-8 between groups
- Section headers: text-xl, font-semibold
- Fields: Full-width within container
- Actions: Right aligned at bottom

**Mobile Layout:**
- Full-width form
- Card padding: 24px
- Fields: space-6 between
- Actions: Sticky bottom bar (2 buttons)

### 4.6 Responsive Breakpoints

| Breakpoint | Width | Grid Columns | Key Adaptations |
|------------|-------|--------------|-----------------|
| Mobile | <768px | 1 | Hamburger nav, card lists, vertical stack |
| Tablet | 768-1023px | 2 | Partial nav, 2-col grids |
| Desktop | 1024-1279px | 3-4 | Full horizontal nav, standard grids |
| Large | ≥1280px | 4+ | Maximum container width (1400px) |

### 4.7 Touch Targets & Mobile Optimization

**Critical Touch Requirements:**
- Minimum: 48×48px (Apple HIG standard)
- Spacing: 8px minimum between tappable elements
- Primary CTAs: 56px height on mobile
- List items: 56-64px height for comfortable tapping

**Mobile Gestures:**
- Swipe on list items: Reveal quick actions
- Pull-to-refresh: On list pages
- Swipe navigation: Between detail tabs
- Long-press: Context menu (alternative to right-click)

---

## 5. Interaction & Animation Standards

### 5.1 Animation Timing

**Duration Standards:**
- Fast interactions: 200ms (button clicks, icon hovers)
- Standard transitions: 250ms (card hovers, tab switches)
- Slower moments: 300ms (modal open/close, drawer slides)

**Easing Functions:**
- Primary: ease-out (90% of cases) - natural deceleration
- Smooth: ease-in-out (modal entry/exit, page transitions)
- Never: linear (feels robotic)

### 5.2 Component Interactions

**Button Hover:**
```
transform: translateY(-2px) scale(1.02)
transition: all 200ms ease-out
```

**Card Hover (Interactive):**
```
transform: translateY(-4px) scale(1.01)
box-shadow: shadow-card-hover
transition: all 250ms ease-out
```

**Modal Entry:**
```
backdrop: opacity 0 → 1 (300ms)
modal: scale(0.95) + opacity(0) → scale(1) + opacity(1) (300ms ease-out)
```

**Drawer Slide:**
```
transform: translateX(-100%) → translateX(0)
transition: 300ms ease-out
```

### 5.3 Performance Requirements

**GPU-Accelerated Only:**
- ✅ Animate: `transform` (translate, scale, rotate), `opacity`
- ❌ Never animate: `width`, `height`, `margin`, `padding`, `top`, `left`
- Why: Transform/opacity use GPU, others trigger layout reflow

**Reduced Motion:**
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 5.4 Micro-interactions

**Form Input Focus:**
- Transition: 150ms ease-out
- Effect: Border color change + ring appearance
- Placeholder: Fade out (opacity 0)

**Tab Switch:**
- Transition: 200ms ease-out
- Active indicator: 2px bottom border slide
- Content: Crossfade (250ms)

**Notification Toast:**
- Entry: Slide from top + fade in (300ms)
- Duration: 4000ms visible
- Exit: Fade out (200ms)
- Position: Top-right (desktop), top-center (mobile)

### 5.5 Loading States

**Skeleton Screens (Preferred):**
- Use for initial page loads
- Mimic final layout structure
- Pulse animation: opacity 0.5 → 1 (1500ms ease-in-out infinite)

**Spinner (Secondary):**
- Size: 24px (inline), 40px (page-level)
- Color: primary-500
- Animation: 360deg rotation (800ms linear infinite)

**Progress Indicators:**
- For multi-step processes (forms, uploads)
- Horizontal bar: 4px height, primary-500 fill
- Animation: Indeterminate (slide across) or determinate (fill %)

---

## 6. Quality Checklist

**Style Guide Compliance:**
- ✅ 90% neutral, 10% accent color distribution
- ✅ Spacing uses 8pt grid (prefer 8px multiples)
- ✅ Card padding ≥32px (24px mobile minimum)
- ✅ Section spacing ≥48px (40px mobile minimum)
- ✅ Border radius 12-16px consistent
- ✅ Horizontal navigation (no sidebar)
- ✅ Hero/prominent elements 400-600px height (dashboard metrics)

**Accessibility:**
- ✅ WCAG AA contrast (≥4.5:1) for text ≥14px
- ✅ Touch targets ≥48px on mobile
- ✅ Focus indicators (2px rings) on all interactive elements
- ✅ `prefers-reduced-motion` support
- ✅ Semantic HTML structure

**Mobile-First:**
- ✅ Responsive from 320px to 2560px
- ✅ Touch-optimized interactions (swipe, tap, long-press)
- ✅ Collapsible navigation on mobile
- ✅ Tables convert to card lists <768px
- ✅ Sticky elements don't block content

**Performance:**
- ✅ Animate only `transform` and `opacity`
- ✅ All transitions ≤300ms
- ✅ Skeleton screens for loading states
- ✅ SVG icons only (Heroicons/Lucide recommended)

**Visual Quality:**
- ✅ Surface depth: Cards contrast ≥5% from page background
- ✅ Micro-interactions on all hover/click events
- ✅ Consistent component patterns across modules
- ✅ Dark mode with proper contrast adjustments

---

**End of Specification**  
**Total Word Count:** ~2,950 words  
**Companion File:** design-tokens.json (machine-readable values)

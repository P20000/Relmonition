# Relmonition UI/UX Design System & Summary

This document summarizes the comprehensive User Interface (UI) and User Experience (UX) architecture of the Relmonition platform, based on the current implementation.

## 1. Design Philosophy & Aesthetics
Relmonition aims to provide a **premium, calming, and empathetic** environment for tracking relationship wellness. The visual language is designed to feel highly modern, responsive, and deeply personal.

### Core Visual Elements:
- **Glassmorphism**: The central aesthetic pillar of the application. Components utilize frosted glass effects (`backdrop-filter: blur(20px)`), semi-transparent backgrounds (`var(--glass-bg)`), and subtle translucent borders (`var(--glass-border)`). This creates a layered, lightweight, and modern feel without overwhelming the user.
- **Color System (OKLCH)**: Powered by a robust, dynamically adjusting OKLCH color palette defined in `theme.css`. 
  - **Light Mode**: Utilizes soft, near-white backgrounds with deep contrasting foregrounds.
  - **Dark Mode**: Employs deep, rich purple/black backgrounds (`oklch(0.15 0.03 280)`) with highly saturated primary accents.
- **Typography**: Clean, sans-serif typography with strong hierarchical scaling. Frequent use of `tracking-tight` for headings to give a sleek appearance, contrasted with `tracking-widest` uppercase micro-text for labels and metadata.
- **Custom Scrollbars**: System-wide refined scrollbars that are thin, rounded, and blend seamlessly into the background, revealing a primary color accent upon hover.

## 2. Micro-Interactions & Animation (Framer Motion)
Animation is not just decorative; it is deeply integrated into the UX to provide spatial awareness and feedback.
- **Navigation Fluidity**: The main navigation uses `framer-motion`'s `AnimatePresence` to create a smooth, sliding background pill effect behind the active tab.
- **AI "Thinking" State**: Instead of a generic spinner, the AI Coach features a custom typing indicator with sequentially pulsing dots and a breathing "Thinking..." text, mimicking a real human on the other end.
- **Hover & Focus States**: Interactive elements (buttons, cards, file upload zones) feature subtle scaling (`hover:scale-105`), opacity transitions, and shadow expansions to signify clickability.
- **Progressive Disclosure**: Elements like "Best Moments" and "Improvements Required" cards expand and collapse smoothly (`animate-in slide-in-from-top-2`) to reveal detailed AI insights only when the user wants to dig deeper.

## 3. Core Pages & Layout UX

### Navigation
- **Desktop**: A sticky top navigation bar acting as a frosted glass header. It clearly delineates sections (Dashboard, Journal, AI Coach, Personality, Settings) and houses the platform's logo.
- **Mobile**: Collapses gracefully into a hamburger menu. When opened, it reveals a clean, full-width dropdown menu with high touch-target areas.

### Dashboard (The Pulse)
The Dashboard is the analytical heart of the application, designed to present complex emotional data at a glance.
- **Greeting & Context**: Welcomes the user with a dynamic greeting and a high-level AI-generated "Relationship Pulse" summary.
- **Connection Health Score**: A prominent, visually striking progress bar utilizing gradient fills (`from-primary to-accent`) to represent the overall health percentage.
- **Gottman 5:1 Ratio**: A custom SVG circular progress indicator that animates dynamically upon loading. It clearly indicates whether the ratio is "Healthy" or "Needs Attention", including a "Low Data" warning badge to manage user expectations.
- **Interaction Trends**: An elegant `Recharts` Area Chart visualizing positive (Bids) vs. negative (Repairs) interactions over time, using soft linear gradients under the curves.
- **Insight Cards**: "Best Moments" and "Improvements Required" are presented as interactive, color-coded cards (e.g., Destructive red for improvements, Primary purple/blue for moments). Clicking them expands the card to show specific, actionable advice.

### AI Coach (Conversational Interface)
The AI Coach interface is heavily optimized for a frictionless, immersive chat experience.
- **Two-Pane Layout**: A fixed left sidebar for Chat History (collapsible via overlay on mobile) and a central, wide chat area.
- **Chat Bubbles**: Distinct visual separation. User prompts are styled as solid primary-colored blocks anchored to the right, while AI responses are left-aligned inside structured glass-cards.
- **Rich Markdown Formatting**: AI responses support rich text via `react-markdown`, rendering tailored lists, blockquotes, and code blocks for high readability.
- **Control & Steering**: Users have granular control over the generation process:
  - **Mode Switching**: A toggle between "Retrieval" (precise advice) and "Exploration" (deep pattern analysis).
  - **Real-time Interrupt**: A prominent "Stop Generation" button appears during streaming.
  - **Prompt Editing**: Users can hover over their latest prompt to edit it and regenerate the response, maintaining conversation flow without restarting.
- **Context Upload Zone**: A dedicated, drag-and-drop friendly area at the bottom for uploading relationship history logs, featuring clear strategy options (Append vs. Replace) inside a beautifully animated modal.

## 4. Empty States & Error Handling
Relmonition handles the "Cold Start" problem elegantly.
- When no data is available (e.g., new user, no journals), the UI does not show broken charts. Instead, it renders faded, low-opacity placeholder SVGs (e.g., dashed circles for Gottman, flat lines for charts) accompanied by friendly, instructive text guiding the user to start logging.
- Loading states utilize custom pulse animations and skeleton screens rather than intrusive blocking spinners, ensuring the UI feels responsive even during heavy data fetching.

---
**Tech Stack Driving the UX:** Next.js 15, Tailwind CSS v4, Framer Motion, Radix UI Primitives, Lucide Icons, Recharts.

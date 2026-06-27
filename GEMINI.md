# Presently Project Instructions

## Project Overview
Presently is a professional Enterprise SaaS platform for presentation timing, room management, and speaker success.

## Core Architectural Pillars
- **Modular Infrastructure:** Decoupled service layer (`src/services`) and state management (`src/context`) using the Firebase NPM SDK.
- **Tri-Phase State Engine:** Linear state machine (Prep -> Present -> Q&A -> Overtime) with automatic transitions and negative-counting overtime.
- **Multi-Tenant SaaS:** RBAC hierarchy separating "Pro-Sumer" Presenters from "Enterprise" Admins/Owners.
- **Zero-Friction Display:** Anonymous pairing protocol for unauthenticated stage monitors via `/display/:sessionId`.

## Implementation Guidelines
- **UI/UX Style:** High-fidelity design using Tailwind CSS, `rounded-3xl` containers, glassmorphism, and bold typography.
- **Data Model:** 
    - `users`: Profiles and role settings.
    - `organizations`: Multi-tenant settings, billing, and domains.
    - `rooms`: Physical and virtual venue registry.
    - `sessions`: Live telemetry mirrored to RTDB and archived in Firestore.

## Technical Implementation Standards
- **State Synchronization:** Local state updates immediately; background sync with Firebase RTDB ensures sub-second multi-device mirroring.
- **Visual Matrix:** Heavy reliance on color signaling (Blue, Green, Purple, Red) and escalating pulses for overtime.
- **Analytics Telemetry:** Track session duration and speaker punctuality at session termination.

## Workflow & Deployment
- **Local Dev:** `npm start`
- **Build:** `npm run build`
- **Deployment:** `firebase deploy`
- **Demo Mode:** Uses `acme.com` domain simulation to test enterprise features offline.

## Administrative & Billing Standards
- **Roles:**
    - `Owner`: Full access, billing management, and role assignment.
    - `Admin`: Room management, team member oversight, and analytics.
    - `Member`: Standard user access to organization rooms and sessions.
- **SSO Management:** Organization Owners can configure SAML 2.0 / OIDC settings in the Security tab.
- **Billing:** Track subscriptions and payment history via the SaaS Billing dashboard.
- **External Access:** Use the `allowedEmails` field in rooms to grant access to guest speakers.

New Approach:

You are acting as a Senior Frontend Engineer specialized in React 18, Tailwind CSS, and native Web APIs. 

### Objective
Implement a lightweight, non-intrusive presentation timer overlay for our app "Presently" using Approach 1: the native browser Document Picture-in-Picture (PiP) API. This allows presenters to view live countdowns floating directly on top of their full-screen presentation notes or slide decks without requiring extra hardware.

### Context & Architecture
- Framework: React 18 (using hooks and functional components)
- Styling: Tailwind CSS
- Data Source: The timer component receives its state/real-time updates via a passed `sessionId` prop connected to Firebase Realtime Database.
- Scope: We need a control button, a PiP manager utility, and the optimized, compact layout for the floating bar itself.

### Specific Technical Requirements

1. **Create the `<TimerBarOverlay />` Component Layout:**
   - It must be a horizontally compact ticker designed to sit inside a low-height window (e.g., 800x60px).
   - Use high-contrast Tailwind colors matching our signaling spec: Blue/Gray for Prep, Green/Yellow for Present, Purple/Orange for Q&A, and a Deep Red flashing animation state for Overtime.
   - Display minimal layout data: Just the active Phase Label (e.g., "PRESENTING") and the ticking countdown time (`MM:SS`).

2. **Implement the PiP Window Manager Loop:**
   - Add a "Launch Overlay Bar" CTA button inside the main control layout.
   - When clicked, asynchronously invoke `window.documentPictureInPicture.requestWindow({ width: 800, height: 60 })`.
   - Implement an automated fallback rule: If the browser does not support `documentPictureInPicture`, gracefully fall back to a standard borderless popup (`window.open`) or an inline notification alert.
   - **Style Injection:** Dynamically iterate through parent document stylesheets (`document.styleSheets`) and copy them into the newly spawned PiP context head to ensure Tailwind utilities render correctly inside the isolated DOM environment.
   - Dynamically create a mounting root inside the PiP window, initialize a React root context via `createRoot`, and render the `<TimerBarOverlay sessionId={sessionId} />`.
   - Listen for the window's `pagehide` event to reset the button's active state toggle gracefully if the user closes the overlay manually.

3. **Commercial Call-to-Action Integration:**
   - In the fallback, evaluation, or offline demo modes, append a professional marketing banner or inline text node targeted at corporate clients:
   - "Need multi-room configurations or automated calendar synchronization for your enterprise venue? Contact us at samuelrobingera@gmail.com to build a custom solution."

### Expected Output
Provide clean, modular, production-ready React component code. Separate the logic cleanly into a parent controller button view and the target child overlay component. Ensure strict error boundary checking for the experimental API window calls.

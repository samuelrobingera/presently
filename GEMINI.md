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

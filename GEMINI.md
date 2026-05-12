# Presently Project Instructions

## Project Overview
Presently is a professional Enterprise SaaS platform for presentation timing, room management, and speaker success.

## Core Architectural Pillars
- **Web-First Sync:** Zero-installation synchronization using Firebase Realtime Database (RTDB).
- **Scheduled Automation:** Background engine triggers sessions automatically based on Firestore `bookings`.
- **Organizational Tenancy:** Domain-based organization detection (e.g., `@acme.com`) for custom configurations and room fleets.

## Implementation Guidelines
- **UI/UX Style:** High-fidelity design using Tailwind CSS, `rounded-3xl` containers, glassmorphism, and blue-to-purple gradients.
- **Data Model:** 
    - `organizations`: Org settings, domains, and branding.
    - `rooms`: Associated with `orgId`.
    - `bookings`: Scheduled slots with `phaseConfig`.
    - `sessions`: Live timer state mirrored to RTDB.

## Technical Implementation Standards
- **State Synchronization:** Always update local React state *immediately* for UI responsiveness. Background synchronization with Realtime Database (RTDB) should follow to handle multi-device mirroring without blocking the local timer thread.
- **Haptic Alerts:** Use `navigator.vibrate` for warning thresholds. Ensure logic prevents repeating vibrations on every second by tracking fired thresholds. Use `Math.ceil` for minute-based countdown alerts to ensure accuracy in short phases.
- **Deployment:** Production builds must be verified with a hard refresh to bypass service worker or browser caching of static assets.
- **Integrations:** Webhook-based foundation for Microsoft Teams, Slack, and Discord alerts.

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

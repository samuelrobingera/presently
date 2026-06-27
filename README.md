# Presently: Enterprise Presentation Management 🕒

Presently is a professional, real-time stage timer and facility event-management SaaS platform. It ensures precision timekeeping for live presentations using a serverless real-time web infrastructure.

## 🚀 Live Demo
Test the application now at: **[https://presently-6151f.web.app](https://presently-6151f.web.app)**

## 🚀 Key Features

- **Tri-Phase State Engine:** Linear automation through Preparation, Presentation, and Q&A phases with autonomous transitions.
- **Negative Overtime Tracking:** Critical tracking of schedule slippage with escalating visual alerts and pulsating signals.
- **Enterprise SaaS Dashboard:** Multi-tenant registry for managing physical rooms, licensing, and facility-wide inventory.
- **Zero-Friction Display:** Unauthenticated, anonymous pairing for downstage monitors (DSM) and transparent video overlays via `/display/:sessionId`.
- **High-Frequency Sync:** Sub-second state mirroring across all devices via Firebase Realtime Database.
- **Professional RBAC:** Strict separation of Individual "Pro-Sumer" access from Global Enterprise Admin authority.
- **Facility Analytics:** Data-driven insights into room utilization, peak hours, and speaker punctuality.
- **Picture-in-Picture Overlay:** Minimalist, translucent floating timer that overlays slides using the browser's Document Picture-in-Picture API, with automatic styling injection and pop-up fallbacks.

## 🛠️ Technical Stack

- **Frontend:** React 18, Tailwind CSS, Lucide Icons
- **Backend:** Firebase (Auth, Firestore, Realtime Database)
- **Routing:** React Router v7
- **Architecture:** Clean, modular structure with decoupled services (`src/services`) and lightweight state context synchronization.

## 📦 Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env` file based on `.env.example` with your Firebase credentials.

3. **Development Mode:**
   ```bash
   npm start
   ```

4. **Production Build:**
   ```bash
   npm run build
   ```

## 🔐 Deployment

Deploy to Firebase Hosting:
```bash
firebase deploy
```

## 🗺️ Product Roadmap

- [x] **Phase 1: Modularization:** Transition to NPM SDK and service-based architecture.
- [x] **Phase 2: State Engine:** Implementation of linear tri-phase logic and overtime tracking.
- [x] **Phase 3: Multi-Tenancy:** Organization dashboards, billing, and room management.
- [x] **Phase 4: Picture-in-Picture (PiP) Overlay:** Native floating countdown timer using the Document PiP API.
- [x] **Phase 5: Code Cleanup & Tech Debt:** Removed legacy/duplicate configuration assets (such as redundant files in the `public/` folder).
- [ ] **Phase 6: Haptic Telemetry:** Wear OS and mobile background sync alerts.

## 📜 License

Proprietary Enterprise SaaS. All Rights Reserved.

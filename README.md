# Presently 🕒

Professional presentation timing for speakers. Ensure your presentations stay on track with real-time synchronization and phase management.

## 🚀 Live Demo
Test the application now at: **[https://presently-6151f.web.app](https://presently-6151f.web.app)**

## 🛠️ Instructions for Testers

### 1. Initial Setup
When you first open the live site, you might see an empty list of rooms. To populate the demo rooms, follow these steps:
1. Open the site in your browser.
2. Open the **Developer Console** (Press `F12` or `Ctrl+Shift+I`).
3. Type the following command and press Enter:
   ```javascript
   setupPresentlyData();
   ```
4. Refresh the page. You should now see 5 sample conference rooms.

### 2. Testing Features
- **Sign In:** Use your Google or Facebook account.
- **Select a Room:** Pick any available room to enter the timer view.
- **Run a Session:** Start the timer and watch it transition from *Preparation* to *Presentation* to *Q&A*.
- **Sync Check:** Open the same session link on your phone and laptop simultaneously to see the timer sync in real-time.

## Features
- **Multi-Phase Timing:** Automatically transitions through Preparation, Presentation, and Q&A phases.
- **Real-Time Sync:** Synchronizes timer state across devices using Firebase Realtime Database.
- **Room Management:** Tracks room availability and current sessions.
- **Vibration Alerts:** Haptic feedback at critical thresholds (5, 2, and 1 minute remaining).
- **Authentication:** Secure login via Google and Facebook.
- **Landing Page:** A professional welcome experience for new users.

## 🗺️ Product Roadmap & Backlog

### Phase 5: Monetization & Integration (Completed ✅)
- [x] **SaaS Subscriptions:** Management interface for organizational billing plans.
- [x] **Platform Integrations:** Webhook foundation for Microsoft Teams, Slack, and Discord.
- [x] **Advanced Analytics:** Live dashboard for room utilization and speaker punctuality.
- [x] **Multi-Admin Roles:** Team management and role-based access control.

## 🛠️ Tech Stack
- **Frontend:** React, Tailwind CSS, Lucide React
- **Backend:** Firebase (Authentication, Firestore, Realtime Database)
- **Deployment:** Firebase Hosting

## Getting Started (Local Development)
... (rest of the installation steps)


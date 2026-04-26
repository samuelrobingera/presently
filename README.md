# Presently 🕒

Professional presentation timing for speakers. Ensure your presentations stay on track with real-time synchronization and phase management.

## Features

- **Multi-Phase Timing:** Automatically transitions through Preparation, Presentation, and Q&A phases.
- **Real-Time Sync:** Synchronizes timer state across devices using Firebase Realtime Database.
- **Room Management:** Tracks room availability and current sessions.
- **Vibration Alerts:** Haptic feedback at critical thresholds (5, 2, and 1 minute remaining).
- **Authentication:** Secure login via Google and Facebook.
- **Demo Mode:** Fully functional offline mode for testing without Firebase.

## Tech Stack

- **Frontend:** React, Tailwind CSS, Lucide React
- **Backend:** Firebase (Authentication, Firestore, Realtime Database)

## Getting Started

### Prerequisites

- Node.js and npm
- Firebase Project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/samuelrobingera/PRESENTLY.git
   cd PRESENTLY
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your Firebase credentials (see `.env.example`):
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   ...
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Development

The main application logic is located in `src/components/PresentlyApp.jsx`.

## License

MIT

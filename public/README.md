# 🎯 Presently

**Professional presentation timer for speakers with real-time synchronization and room management**

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

## ✨ Features

### 🔐 **Authentication System**
- Google & Facebook OAuth integration
- Secure user session management
- Profile-based settings persistence

### 🏢 **Smart Room Management**
- Real-time room availability tracking
- Capacity and equipment information
- Automatic room booking during sessions

### ⏱️ **Advanced Timer System**
- **Multi-phase timing**: Preparation → Presentation → Q&A → Overtime
- **Real-time synchronization** across multiple devices
- **Auto-phase transitions** with customizable durations
- **Manual controls**: Start, Pause, Resume, Stop, Skip

### 🎛️ **Customizable Settings**
- Individual phase duration configuration
- Vibration alerts with warning thresholds
- Settings saved per user in Firebase
- Responsive design for all devices

### 📱 **Progressive Web App (PWA)**
- Install directly from browser
- Offline capability with demo mode
- Native app-like experience
- Home screen shortcuts

### 🔥 **Firebase Integration**
- **Firestore**: Room data, user settings, session history
- **Realtime Database**: Live timer synchronization
- **Authentication**: Secure OAuth providers
- **Hosting**: Production-ready deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Firebase account
- Modern web browser

### 1. Clone & Install
```bash
git clone https://github.com/samuelrobingera/presently.git
cd presently
npm install
```

### 2. Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable these services:
   - **Authentication** → Google & Facebook providers
   - **Firestore Database** → Start in test mode
   - **Realtime Database** → Start in test mode
   - **Hosting** → Set up hosting

3. Update Firebase configuration in `src/components/PresentlyApp.jsx`:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "your-project-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 3. Security Rules
Copy the security rules from the project to your Firebase Console:

**Firestore Rules** (`firebase/firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (resource == null || resource.data.occupiedBy == request.auth.uid);
    }
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == request.resource.data.userId);
    }
  }
}
```

**Realtime Database Rules** (`firebase/database.rules.json`):
```json
{
  "rules": {
    "timers": {
      "$sessionId": {
        ".read": "auth != null",
        ".write": "auth != null && (!data.exists() || data.child('userId').val() == auth.uid)"
      }
    }
  }
}
```

### 4. Initialize Sample Data
Open your browser console and run:
```javascript
// This script is included in the project
setupPresentlyData();
```

### 5. Run Development Server
```bash
npm start
```
Visit `http://localhost:3000` to see Presently in action!

### 6. Deploy to Production
```bash
npm run build
npx firebase deploy
```

## 📖 Usage Guide

### For Speakers

1. **Sign In**: Use Google or Facebook to authenticate
2. **Select Room**: Choose from available presentation rooms
3. **Configure Timer**: Set preparation, presentation, and Q&A durations
4. **Start Session**: Begin your timed presentation
5. **Control Timer**: Use pause, resume, or skip controls as needed

### For Organizations

1. **Room Management**: Add rooms with capacity and equipment details
2. **Real-time Monitoring**: Track room usage and availability
3. **Session Analytics**: Review presentation history and statistics
4. **Multi-device Sync**: Timer state synchronized across all devices

## 🏗️ Architecture

```
Frontend (React + Tailwind CSS)
    ↓
Firebase Authentication (Google/Facebook OAuth)
    ↓
Firestore Database (Rooms, Users, Sessions)
    ↓
Realtime Database (Live Timer Sync)
    ↓
Firebase Hosting (Production Deployment)
```

### Data Structure

**Firestore Collections:**
- `rooms` - Room information and availability
- `users` - User profiles and settings
- `sessions` - Presentation session history
- `config` - App configuration and defaults

**Realtime Database:**
- `timers/{sessionId}` - Live timer state synchronization
- `room_status/{roomId}` - Real-time room status updates

## 🛠️ Development

### Project Structure
```
presently/
├── public/
│   ├── index.html              # Main HTML with Firebase SDK
│   ├── manifest.json           # PWA configuration
│   └── icons/                  # App icons
├── src/
│   ├── components/
│   │   └── PresentlyApp.jsx    # Main React component
│   ├── utils/
│   │   └── setupData.js        # Database initialization
│   └── styles/
│       └── index.css           # Tailwind CSS
├── firebase/
│   ├── firestore.rules         # Security rules
│   └── firebase.json           # Firebase config
└── package.json
```

### Available Scripts

- `npm start` - Run development server
- `npm run build` - Build for production
- `npm run deploy` - Build and deploy to Firebase
- `npm test` - Run test suite

### Key Technologies

- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Firebase v9** - Backend services and authentication
- **Lucide React** - Beautiful icons
- **PWA** - Progressive Web App capabilities

## 🔧 Configuration

### Timer Settings
```javascript
const defaultSettings = {
  preparationTime: 5,      // minutes
  presentationTime: 30,    // minutes
  qaTime: 10,              // minutes
  vibrationEnabled: true,
  warningThresholds: [5, 2, 1]  // minutes before phase ends
};
```

### Room Configuration
```javascript
const roomStructure = {
  name: "Conference Room A",
  capacity: 50,
  available: true,
  active: true,
  location: "Building A, Floor 2",
  equipment: ["projector", "whiteboard", "video_conference"]
};
```

## 🚀 Deployment Options

### Firebase Hosting (Recommended)
```bash
npm run build
npx firebase deploy
```

### Custom Domain
1. Add custom domain in Firebase Console
2. Update DNS settings
3. SSL certificates automatically provisioned

### Environment Variables
Create `.env` file for different environments:
```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
```

## 📊 Analytics & Monitoring

Presently automatically tracks:
- Session duration and phases
- Room utilization statistics
- User engagement metrics
- Error rates and performance

Access analytics through Firebase Console or build custom dashboards.

## 🔒 Security Features

- **Authentication required** for all operations
- **User-specific data isolation** in Firestore
- **Session ownership validation** in Realtime Database
- **HTTPS enforcement** in production
- **Content Security Policy** headers

## 🎯 Roadmap

### Phase 2 Features
- [ ] Calendar integration (Google Calendar API)
- [ ] Email notifications and reminders
- [ ] Admin dashboard for room management
- [ ] Advanced analytics and reporting
- [ ] Mobile app (React Native)
- [ ] Multi-language support

### Phase 3 Features
- [ ] Video conference integration
- [ ] Audience feedback system
- [ ] Presentation recording
- [ ] AI-powered speaking analytics
- [ ] Enterprise SSO integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow React best practices
- Use Tailwind CSS for styling
- Implement proper error handling
- Add tests for new features
- Update documentation

## 🐛 Troubleshooting

### Common Issues

**Firebase Connection Error**
- Verify Firebase configuration
- Check network connectivity
- Ensure Firebase services are enabled

**Authentication Failures**
- Confirm OAuth providers are configured
- Check domain whitelist in Firebase
- Verify API keys and permissions

**Timer Sync Issues**
- Check Realtime Database rules
- Verify network connection
- Clear browser cache

### Debug Mode
Set `REACT_APP_DEBUG=true` for detailed logging.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [@samuelrobingera](https://github.com/samuelrobingera)

## 🙏 Acknowledgments

- Firebase team for excellent backend services
- React community for amazing ecosystem
- Tailwind CSS for beautiful styling system
- Lucide for perfect icons

## 📞 Support

- **Documentation**: [Wiki](https://github.com/samuelrobingera/presently/wiki)
- **Issues**: [GitHub Issues](https://github.com/samuelrobingera/presently/issues)
- **Discussions**: [GitHub Discussions](https://github.com/samuelrobingera/presently/discussions)
- **Email**: samuelrobingera@gmail.com

---

**Made with ❤️ for speakers everywhere**

*Presently - Making presentations perfectly timed since 2024*
import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, Square, SkipForward, Calendar, Settings, User, LogOut, Vibrate, Database, Wifi, AlertTriangle } from 'lucide-react';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const PresentlyApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [error, setError] = useState(null);
  
  const [timerState, setTimerState] = useState({
    isRunning: false,
    timeRemaining: 1800000,
    totalTime: 1800000,
    phase: 'preparation',
    sessionId: null
  });
  
  const [rooms, setRooms] = useState([]);
  const [settings, setSettings] = useState({
    preparationTime: 5,
    presentationTime: 30,
    qaTime: 10,
    vibrationEnabled: true,
    warningThresholds: [5, 2, 1]
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [offlineMode, setOfflineMode] = useState(false);
  
  const timerRef = useRef(null);
  const dbRef = useRef(null);
  const unsubscribeAuth = useRef(null);
  const unsubscribeTimer = useRef(null);

  // Firebase initialization
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        setConnectionStatus('connecting');
        
        // Check if Firebase is available
        if (typeof window !== 'undefined' && window.firebase) {
          // Initialize Firebase if not already initialized
          if (!window.firebase.apps.length) {
            window.firebase.initializeApp(firebaseConfig);
          }
          
          setFirebaseInitialized(true);
          setConnectionStatus('connected');
          addNotification('Connected to Firebase', 'success');
          
          // Initialize auth listener
          initializeAuth(true);
          
          // Load rooms
          await loadRooms(true);
          
        } else {
          // Fallback to demo mode if Firebase is not available
          setConnectionStatus('demo');
          setOfflineMode(true);
          addNotification('Running in demo mode - Firebase not available', 'warning');
          loadDemoData();
        }
      } catch (error) {
        console.error('Firebase initialization error:', error);
        setError('Failed to initialize Firebase');
        setConnectionStatus('error');
        addNotification('Firebase connection failed - running in demo mode', 'error');
        loadDemoData();
      } finally {
        setLoading(false);
      }
    };

    initializeFirebase();

    // Cleanup on unmount
    return () => {
      if (unsubscribeAuth.current) unsubscribeAuth.current();
      if (unsubscribeTimer.current) unsubscribeTimer.current();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Initialize authentication
  const initializeAuth = (isInitialized = firebaseInitialized) => {
    if (!isInitialized || !window.firebase.auth) return;

    unsubscribeAuth.current = window.firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        setUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        });
        loadUserSettings(user.uid);
      } else {
        setUser(null);
        setCurrentRoom(null);
        stopTimer();
      }
      setLoading(false);
    });
  };

  // Load rooms from Firestore
  const loadRooms = async (isInitialized = firebaseInitialized) => {
    if (!isInitialized || offlineMode) {
      loadDemoData();
      return;
    }

    try {
      const db = window.firebase.firestore();
      const snapshot = await db.collection('rooms').where('active', '==', true).get();
      
      const roomsData = [];
      snapshot.forEach((doc) => {
        roomsData.push({ id: doc.id, ...doc.data() });
      });
      
      setRooms(roomsData);
    } catch (error) {
      console.error('Error loading rooms:', error);
      addNotification('Failed to load rooms', 'error');
      loadDemoData();
    }
  };

  // Load demo data for offline/demo mode
  const loadDemoData = () => {
    setRooms([
      { id: 'room1', name: 'Conference Room A', capacity: 50, available: true, active: true },
      { id: 'room2', name: 'Conference Room B', capacity: 25, available: true, active: true },
      { id: 'room3', name: 'Auditorium', capacity: 200, available: true, active: true },
      { id: 'room4', name: 'Meeting Room C', capacity: 12, available: false, active: true },
      { id: 'room5', name: 'Boardroom', capacity: 20, available: true, active: true }
    ]);
  };

  // Load user settings
  const loadUserSettings = async (userId) => {
    if (!firebaseInitialized || offlineMode) return;

    try {
      const db = window.firebase.firestore();
      const doc = await db.collection('users').doc(userId).get();
      
      if (doc.exists) {
        const userData = doc.data();
        if (userData.settings) {
          setSettings(prev => ({ ...prev, ...userData.settings }));
        }
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  // Save user settings
  const saveUserSettings = async (newSettings) => {
    if (!firebaseInitialized || offlineMode || !user) return;

    try {
      const db = window.firebase.firestore();
      await db.collection('users').doc(user.uid).set({
        settings: newSettings,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      addNotification('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      addNotification('Failed to save settings', 'error');
    }
  };

  // Authentication functions
  const handleLogin = async (provider) => {
    if (!firebaseInitialized) {
      // Demo mode login
      const demoUser = {
        uid: 'demo_user_' + Date.now(),
        displayName: provider === 'google' ? 'Demo User (Google)' : 'Demo User (Facebook)',
        email: `demo@${provider}.com`
      };
      setUser(demoUser);
      addNotification(`Signed in with ${provider} (Demo Mode)`, 'success');
      return;
    }

    try {
      setLoading(true);
      const auth = window.firebase.auth();
      let authProvider;

      if (provider === 'google') {
        authProvider = new window.firebase.auth.GoogleAuthProvider();
        authProvider.addScope('profile');
        authProvider.addScope('email');
      } else if (provider === 'facebook') {
        authProvider = new window.firebase.auth.FacebookAuthProvider();
        authProvider.addScope('email');
      }

      const result = await auth.signInWithPopup(authProvider);
      addNotification(`Successfully signed in with ${provider}!`, 'success');
      
      // Update user document
      const db = window.firebase.firestore();
      await db.collection('users').doc(result.user.uid).set({
        displayName: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL,
        lastLogin: window.firebase.firestore.FieldValue.serverTimestamp(),
        provider: provider
      }, { merge: true });

    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelled by user.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups and try again.';
      }
      
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await stopTimer();
      
      if (firebaseInitialized) {
        await window.firebase.auth().signOut();
      } else {
        setUser(null);
        setCurrentRoom(null);
      }
      
      addNotification('Signed out successfully', 'success');
    } catch (error) {
      console.error('Logout error:', error);
      addNotification('Logout failed', 'error');
    }
  };

  // Timer functions with real-time sync
  const startTimer = async () => {
    if (!currentRoom) {
      addNotification('Please select a room first', 'warning');
      return;
    }

    try {
      const sessionId = 'session_' + Date.now() + '_' + user.uid;
      const initialTimerState = {
        isRunning: true,
        timeRemaining: settings.preparationTime * 60000,
        totalTime: settings.preparationTime * 60000,
        phase: 'preparation',
        sessionId: sessionId,
        roomId: currentRoom.id,
        userId: user.uid,
        startedAt: Date.now()
      };

      if (firebaseInitialized && !offlineMode) {
        // Save to Firestore
        const db = window.firebase.firestore();
        await db.collection('sessions').doc(sessionId).set({
          ...initialTimerState,
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
          userEmail: user.email,
          userName: user.displayName,
          roomName: currentRoom.name
        });

        // Set up real-time listener
        setupTimerListener(sessionId);
        
        // Update room availability
        await db.collection('rooms').doc(currentRoom.id).update({
          available: false,
          currentSession: sessionId,
          occupiedBy: user.uid,
          occupiedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      setTimerState(initialTimerState);
      addNotification('Session started successfully!', 'success');

    } catch (error) {
      console.error('Error starting timer:', error);
      addNotification('Failed to start session', 'error');
    }
  };

  // Setup real-time timer listener
  const setupTimerListener = (sessionId) => {
    if (!firebaseInitialized || offlineMode) return;

    const rtdb = window.firebase.database();
    dbRef.current = rtdb.ref(`timers/${sessionId}`);
    
    unsubscribeTimer.current = dbRef.current.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTimerState(prev => ({
          ...prev,
          ...data,
          sessionId: sessionId
        }));
      }
    });
  };

  // Update timer in real-time database
  const updateTimerState = async (updates) => {
    if (firebaseInitialized && !offlineMode && timerState.sessionId) {
      try {
        const rtdb = window.firebase.database();
        await rtdb.ref(`timers/${timerState.sessionId}`).update({
          ...updates,
          updatedAt: window.firebase.database.ServerValue.TIMESTAMP
        });
      } catch (error) {
        console.error('Error updating timer state:', error);
      }
    }
    
    setTimerState(prev => ({ ...prev, ...updates }));
  };

  const toggleTimer = async () => {
    const newRunningState = !timerState.isRunning;
    await updateTimerState({ isRunning: newRunningState });
    addNotification(newRunningState ? 'Timer resumed' : 'Timer paused', 'info');
  };

  const stopTimer = async () => {
    if (timerState.sessionId) {
      try {
        if (firebaseInitialized && !offlineMode) {
          const db = window.firebase.firestore();
          
          // Update session as completed
          await db.collection('sessions').doc(timerState.sessionId).update({
            completedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            status: 'completed'
          });
          
          // Free up the room
          if (currentRoom) {
            await db.collection('rooms').doc(currentRoom.id).update({
              available: true,
              currentSession: null,
              occupiedBy: null,
              occupiedAt: null
            });
          }
          
          // Clean up real-time listener
          if (unsubscribeTimer.current) {
            dbRef.current.off('value', unsubscribeTimer.current);
            unsubscribeTimer.current = null;
          }
          
          // Remove from real-time database
          const rtdb = window.firebase.database();
          await rtdb.ref(`timers/${timerState.sessionId}`).remove();
        }
        
        addNotification('Session ended successfully', 'success');
      } catch (error) {
        console.error('Error stopping timer:', error);
        addNotification('Error ending session', 'error');
      }
    }

    setTimerState({
      isRunning: false,
      timeRemaining: settings.preparationTime * 60000,
      totalTime: settings.preparationTime * 60000,
      phase: 'preparation',
      sessionId: null
    });
  };

  const skipPhase = async () => {
    const phases = ['preparation', 'presentation', 'q&a', 'overtime'];
    const currentIndex = phases.indexOf(timerState.phase);
    const nextPhase = phases[Math.min(currentIndex + 1, phases.length - 1)];
    
    let newTime;
    switch (nextPhase) {
      case 'presentation':
        newTime = settings.presentationTime * 60000;
        break;
      case 'q&a':
        newTime = settings.qaTime * 60000;
        break;
      case 'overtime':
        newTime = 0;
        break;
      default:
        newTime = timerState.timeRemaining;
    }

    const updates = {
      phase: nextPhase,
      timeRemaining: newTime,
      totalTime: newTime
    };

    await updateTimerState(updates);
    addNotification(`Skipped to ${nextPhase} phase`, 'info');
  };

  // Notification system
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Format time display
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get phase color
  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'preparation': return 'bg-blue-500';
      case 'presentation': return 'bg-green-500';
      case 'q&a': return 'bg-yellow-500';
      case 'overtime': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Timer countdown effect
  useEffect(() => {
    if (timerState.isRunning && timerState.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        const newTime = Math.max(0, timerState.timeRemaining - 1000);
        
        // Check for warnings
        const minutesLeft = Math.floor(newTime / 60000);
        if (settings.warningThresholds.includes(minutesLeft) && settings.vibrationEnabled) {
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          addNotification(`${minutesLeft} minute${minutesLeft === 1 ? '' : 's'} remaining!`, 'warning');
        }
        
        // Auto-transition phases
        if (newTime === 0 && timerState.phase !== 'overtime') {
          const phases = ['preparation', 'presentation', 'q&a', 'overtime'];
          const currentIndex = phases.indexOf(timerState.phase);
          if (currentIndex < phases.length - 1) {
            const nextPhase = phases[currentIndex + 1];
            let nextTime;
            switch (nextPhase) {
              case 'presentation':
                nextTime = settings.presentationTime * 60000;
                break;
              case 'q&a':
                nextTime = settings.qaTime * 60000;
                break;
              case 'overtime':
                nextTime = 0;
                break;
              default:
                nextTime = 0;
            }
            
            const updates = {
              phase: nextPhase,
              timeRemaining: nextTime,
              totalTime: nextTime
            };
            
            updateTimerState(updates);
            addNotification(`Automatically transitioned to ${nextPhase} phase`, 'info');
            return;
          }
        }
        
        updateTimerState({ timeRemaining: newTime });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [timerState.isRunning, timerState.timeRemaining, timerState.phase, settings]);

  // Settings update handler
  const handleSettingsUpdate = (newSettings) => {
    setSettings(newSettings);
    saveUserSettings(newSettings);
    setShowSettings(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="text-center text-white">
          <Clock className="w-16 h-16 mx-auto mb-4 animate-spin" />
          <div className="text-xl mb-2">
            {firebaseInitialized ? 'Connecting to Firebase...' : 'Initializing Presently...'}
          </div>
          <div className="text-sm opacity-75">Status: {connectionStatus}</div>
          {error && (
            <div className="mt-4 p-3 bg-red-500 bg-opacity-20 rounded-lg">
              <AlertTriangle className="w-5 h-5 inline mr-2" />
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Presently</h1>
            <p className="text-gray-600">Professional presentation timing for speakers</p>
            
            <div className="flex items-center justify-center mt-4 space-x-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'demo' ? 'bg-yellow-500' : 
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
              }`}></div>
              <span className="text-gray-500">
                {connectionStatus === 'connected' ? 'Firebase Connected' :
                 connectionStatus === 'demo' ? 'Demo Mode' :
                 connectionStatus === 'error' ? 'Connection Error' : 'Connecting...'}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => handleLogin('google')}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              disabled={loading}
            >
              Sign in with Google
            </button>
            <button
              onClick={() => handleLogin('facebook')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              disabled={loading}
            >
              Sign in with Facebook
            </button>
            
            <div className="text-center mt-6 text-xs text-gray-500">
              <p>🔥 {firebaseInitialized ? 'Firebase Connected' : 'Demo Mode Active'}</p>
              <p>📱 Real-time Synchronization</p>
              <p>🔐 Secure Authentication</p>
              {offlineMode && (
                <p className="text-yellow-600 font-medium">⚠️ Running in offline mode</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg shadow-lg text-white text-sm max-w-sm ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' :
              notification.type === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Presently</h1>
              
              <div className="ml-4 flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'demo' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <Wifi className="w-4 h-4 text-gray-400" />
                {offlineMode && <span className="text-xs text-yellow-600">Demo</span>}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <Settings className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-6 h-6 rounded-full" />
                ) : (
                  <User className="w-5 h-5 text-gray-400" />
                )}
                <span className="text-sm text-gray-700">{user.displayName || user.email}</span>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Room Selection */}
        {!currentRoom && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-6 h-6 mr-2" />
              Select a Room
              <Database className="w-5 h-5 ml-2 text-blue-500" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map(room => (
                <div
                  key={room.id}
                  onClick={() => room.available && setCurrentRoom(room)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition duration-200 ${
                    room.available
                      ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">{room.name}</h3>
                  <p className="text-sm text-gray-600">Capacity: {room.capacity}</p>
                  <p className={`text-sm font-medium ${
                    room.available ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {room.available ? 'Available' : 'Occupied'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Timer Interface */}
        {currentRoom && (
          <div className="space-y-8">
            {/* Current Room Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{currentRoom.name}</h2>
                  <p className="text-gray-600">Capacity: {currentRoom.capacity} people</p>
                  {timerState.sessionId && (
                    <p className="text-sm text-blue-600 flex items-center">
                      <Database className="w-4 h-4 mr-1" />
                      Session ID: {timerState.sessionId}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setCurrentRoom(null)}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                  disabled={timerState.isRunning}
                >
                  Change Room
                </button>
              </div>
            </div>

            {/* Timer Display */}
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="mb-6">
                <div className={`inline-block ${getPhaseColor(timerState.phase)} text-white px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide mb-4`}>
                  {timerState.phase} Phase
                </div>
                <div className="text-6xl font-mono font-bold text-gray-900 mb-4">
                  {timerState.phase === 'overtime' && timerState.timeRemaining === 0
                    ? '∞'
                    : formatTime(timerState.timeRemaining)
                  }
                </div>
                {timerState.phase !== 'overtime' && (
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                    <div
                      className={`h-3 rounded-full transition-all duration-1000 ${getPhaseColor(timerState.phase)}`}
                      style={{
                        width: `${timerState.totalTime > 0 ? ((timerState.totalTime - timerState.timeRemaining) / timerState.totalTime) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Timer Controls */}
              <div className="flex justify-center space-x-4">
                {!timerState.isRunning && !timerState.sessionId ? (
                  <button
                    onClick={startTimer}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start
                  </button>
                ) : (
                  <button
                    onClick={toggleTimer}
                    className={`${timerState.isRunning ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center`}
                  >
                    {timerState.isRunning ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Resume
                      </>
                    )}
                  </button>
                )}
                
                <button
                  onClick={stopTimer}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center"
                  disabled={!timerState.sessionId}
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop
                </button>
                
                <button
                  onClick={skipPhase}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center"
                  disabled={timerState.phase === 'overtime' || !timerState.sessionId}
                >
                  <SkipForward className="w-5 h-5 mr-2" />
                  Skip
                </button>
              </div>
            </div>

            {/* Phase Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${timerState.phase === 'preparation' ? 'bg-blue-100 border-2 border-blue-300' : 'bg-gray-100'}`}>
                <h3 className="font-semibold text-gray-900">Preparation</h3>
                <p className="text-sm text-gray-600">{settings.preparationTime} minutes</p>
              </div>
              <div className={`p-4 rounded-lg ${timerState.phase === 'presentation' ? 'bg-green-100 border-2 border-green-300' : 'bg-gray-100'}`}>
                <h3 className="font-semibold text-gray-900">Presentation</h3>
                <p className="text-sm text-gray-600">{settings.presentationTime} minutes</p>
              </div>
              <div className={`p-4 rounded-lg ${timerState.phase === 'q&a' ? 'bg-yellow-100 border-2 border-yellow-300' : 'bg-gray-100'}`}>
                <h3 className="font-semibold text-gray-900">Q&A</h3>
                <p className="text-sm text-gray-600">{settings.qaTime} minutes</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Timer Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preparation Time (minutes)
                </label>
                <input
                  type="number"
                  value={settings.preparationTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, preparationTime: parseInt(e.target.value) || 5 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="60"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Presentation Time (minutes)
                </label>
                <input
                  type="number"
                  value={settings.presentationTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, presentationTime: parseInt(e.target.value) || 30 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="180"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Q&A Time (minutes)
                </label>
                <input
                  type="number"
                  value={settings.qaTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, qaTime: parseInt(e.target.value) || 10 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="60"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="vibration"
                  checked={settings.vibrationEnabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, vibrationEnabled: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="vibration" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                  <Vibrate className="w-4 h-4 mr-1" />
                  Enable Vibration Alerts
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warning Thresholds (minutes before end)
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 5, 10].map(threshold => (
                    <label key={threshold} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.warningThresholds.includes(threshold)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings(prev => ({
                              ...prev,
                              warningThresholds: [...prev.warningThresholds, threshold].sort((a, b) => b - a)
                            }));
                          } else {
                            setSettings(prev => ({
                              ...prev,
                              warningThresholds: prev.warningThresholds.filter(t => t !== threshold)
                            }));
                          }
                        }}
                        className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-1 text-xs text-gray-600">{threshold}m</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSettingsUpdate(settings)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentlyApp;
import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, Square, SkipForward, Calendar, Settings, User, LogOut, Vibrate, Database, Wifi, AlertTriangle, Shield } from 'lucide-react';
import LandingPage from './LandingPage';

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
  const [userRole, setUserRole] = useState('member'); // 'owner', 'admin', or 'member'
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('landing'); // 'landing', 'app', or 'org'
  const [orgTab, setOrgTab] = useState('rooms'); // 'rooms', 'billing', 'integrations', 'analytics', 'team', 'security'
  const [currentRoom, setCurrentRoom] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState(null);
  const [bookingForm, setBookingModalForm] = useState({
    userName: '',
    startTime: '',
    preparationTime: 5,
    presentationTime: 30,
    qaTime: 10
  });
  const [notifications, setNotifications] = useState([]);
  const [offlineMode, setOfflineMode] = useState(false);
  
  const timerRef = useRef(null);
  const dbRef = useRef(null);
  const unsubscribeAuth = useRef(null);
  const unsubscribeTimer = useRef(null);

  // Firebase initialization (Run once)
  useEffect(() => {
    // Improved Firebase init: validate config, wait for SDK, fail-fast to demo mode with clear logs.
    const requiredFirebaseKeys = [
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_AUTH_DOMAIN',
      'REACT_APP_FIREBASE_DATABASE_URL',
      'REACT_APP_FIREBASE_PROJECT_ID',
      'REACT_APP_FIREBASE_STORAGE_BUCKET',
      'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
      'REACT_APP_FIREBASE_APP_ID'
    ];

    const validateFirebaseConfig = (cfg) => {
      const missing = [];
      if (!cfg || typeof cfg !== 'object') return requiredFirebaseKeys.slice();
      if (!cfg.apiKey) missing.push('apiKey (REACT_APP_FIREBASE_API_KEY)');
      if (!cfg.projectId) missing.push('projectId (REACT_APP_FIREBASE_PROJECT_ID)');
      if (!cfg.authDomain) missing.push('authDomain (REACT_APP_FIREBASE_AUTH_DOMAIN)');
      if (!cfg.databaseURL) missing.push('databaseURL (REACT_APP_FIREBASE_DATABASE_URL)');
      if (!cfg.storageBucket) missing.push('storageBucket (REACT_APP_FIREBASE_STORAGE_BUCKET)');
      if (!cfg.messagingSenderId) missing.push('messagingSenderId (REACT_APP_FIREBASE_MESSAGING_SENDER_ID)');
      if (!cfg.appId) missing.push('appId (REACT_APP_FIREBASE_APP_ID)');
      return missing;
    };

    const waitForFirebaseGlobal = (timeout = 5000, pollInterval = 100) =>
      new Promise((resolve, reject) => {
        const start = Date.now();
        (function check() {
          if (typeof window !== 'undefined' && window.firebase && typeof window.firebase.initializeApp === 'function') {
            return resolve();
          }
          if (Date.now() - start >= timeout) {
            return reject(new Error('Timed out waiting for Firebase SDK to load on window.'));
          }
          setTimeout(check, pollInterval);
        })();
      });

    const initializeFirebase = async () => {
      try {
        setConnectionStatus('connecting');

        // Validate config first
        const missing = validateFirebaseConfig(firebaseConfig);
        if (missing.length) {
          console.error('Missing Firebase config keys:', missing);
          setError(`Missing Firebase configuration (${missing.join(', ')}). Running in demo mode.`);
          setConnectionStatus('demo');
          setOfflineMode(true);
          addNotification('Firebase config incomplete - running in demo mode', 'warning');
          // Still initialize auth listener in demo mode so tests and auth-dependent UI can react to mocked auth.
          initializeAuth(true);
          loadRooms(true);
          setLoading(false);
          return;
        }

        // Wait for the firebase global provided by public/index.html to be available
        try {
          await waitForFirebaseGlobal(5000);
        } catch (err) {
          console.error('Firebase SDK not available on window:', err);
          setError('Firebase SDK failed to load. Running in demo mode.');
          setConnectionStatus('demo');
          setOfflineMode(true);
          addNotification('Firebase SDK not loaded - running in demo mode', 'warning');
          // Initialize auth listener even when SDK or config is unavailable so tests using window.firebase.auth mock can set user.
          initializeAuth(true);
          loadRooms(true);
          setLoading(false);
          return;
        }

        // Initialize Firebase if not already initialized
        if (!window.firebase.apps || !window.firebase.apps.length) {
          window.firebase.initializeApp(firebaseConfig);
        }

        setFirebaseInitialized(true);
        setConnectionStatus('connected');
        addNotification('Connected to Firebase', 'success');

        // Initialize auth listener and load rooms
        initializeAuth(true);
        loadRooms(true);

      } catch (error) {
        console.error('Firebase initialization error:', error);
        setError('Failed to initialize Firebase: ' + (error && error.message ? error.message : String(error)));
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

  // Re-load rooms when organization changes
  useEffect(() => {
    if (firebaseInitialized || offlineMode) {
      loadRooms();
    }
  }, [organization, firebaseInitialized, offlineMode]);

  // Initialize authentication
  // Accept a 'force' flag to initialize auth even if firebaseInitialized is not true
  const initializeAuth = (force = false) => {
    const shouldInit = force || firebaseInitialized;
    if (!shouldInit) return;

    // Defensive guards for tests and environments where window.firebase may be mocked in different shapes.
    if (typeof window === 'undefined' || !window.firebase) return;
    if (typeof window.firebase.auth !== 'function') return;

    let auth;
    try {
      auth = window.firebase.auth();
    } catch (err) {
      console.error('Error calling window.firebase.auth():', err);
      // Ensure loading state doesn't hang in tests
      setLoading(false);
      return;
    }

    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
      // If auth object does not expose onAuthStateChanged, nothing to subscribe to.
      setLoading(false);
      return;
    }

    unsubscribeAuth.current = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        });
        
        // Lookup organization based on email domain
        await lookupOrganization(user.email);
        loadUserSettings(user.uid);
      } else {
        setUser(null);
        setCurrentRoom(null);
        setOrganization(null);
        setUpcomingBookings([]);
        stopTimer();
      }
      setLoading(false);
    });
  };

  // Lookup organization based on email domain
  const lookupOrganization = async (email) => {
    if (!email) return;

    try {
      const domain = email.split('@')[1];
      
      // Demo Mode logic: Map 'acme.com' to a mock organization
      if (!firebaseInitialized || offlineMode) {
        if (domain === 'acme.com') {
          const mockOrg = {
            id: 'org1',
            name: 'Acme Corp',
            domain: 'acme.com',
            ownerId: user.uid, // Make current user the owner for demo
            adminIds: [],
            settings: { ssoEnabled: true },
            subscription: { plan: 'Enterprise Pro', status: 'active', nextBillingDate: '2026-06-01' },
            paymentHistory: [{ id: 'inv_1', date: '2026-05-01', amount: 499.00, status: 'paid' }]
          };
          setOrganization(mockOrg);
          setUserRole('owner');
          addNotification('Organization detected: Acme Corp (Demo Owner)', 'success');
        }
        return;
      }

      const db = window.firebase.firestore();
      const snapshot = await db.collection('organizations').where('domain', '==', domain).get();
      
      if (!snapshot.empty) {
        const orgDoc = snapshot.docs[0];
        const orgData = { id: orgDoc.id, ...orgDoc.data() };
        setOrganization(orgData);
        
        // Determine role
        if (orgData.ownerId === user.uid) {
          setUserRole('owner');
        } else if (orgData.adminIds && orgData.adminIds.includes(user.uid)) {
          setUserRole('admin');
        } else {
          setUserRole('member');
        }
        
        addNotification(`Organization detected: ${orgData.name}`, 'success');
      } else {
        setOrganization(null);
        setUserRole('member');
      }
    } catch (error) {
      console.error('Error looking up organization:', error);
    }
  };

  // Load rooms from Firestore
  const loadRooms = async (isInitialized = firebaseInitialized) => {
    if (!isInitialized || offlineMode) {
      loadDemoData();
      return;
    }

    try {
      if (!window || !window.firebase || typeof window.firebase.firestore !== 'function') {
        loadDemoData();
        return;
      }

      const db = window.firebase.firestore();
      const roomsMap = new Map();
      
      // 1. Fetch organization rooms if applicable
      if (organization) {
        const orgSnapshot = await db.collection('rooms')
          .where('active', '==', true)
          .where('orgId', '==', organization.id)
          .get();
        
        orgSnapshot.forEach(doc => {
          roomsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
      }

      // 2. Fetch rooms assigned to user's email
      if (user && user.email) {
        const assignedSnapshot = await db.collection('rooms')
          .where('active', '==', true)
          .where('allowedEmails', 'array-contains', user.email)
          .get();
        
        assignedSnapshot.forEach(doc => {
          roomsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
      }

      const roomsData = Array.from(roomsMap.values());
      
      // If no rooms found and no organization, we'll stay in "Personal Mode" (empty rooms list)
      setRooms(roomsData);
      
      // Load bookings for these rooms
      if (roomsData.length > 0) {
        loadUpcomingBookings(roomsData.map(r => r.id));
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      setOfflineMode(true);
      loadDemoData();
    }
  };

  // Load upcoming bookings for the relevant rooms
  const loadUpcomingBookings = async (roomIds) => {
    if (!firebaseInitialized || offlineMode || !roomIds.length) return;

    try {
      const db = window.firebase.firestore();
      const now = window.firebase.firestore.Timestamp.now();
      
      // Firestore 'in' query limit is 10, but for demo this is fine.
      const snapshot = await db.collection('bookings')
        .where('roomId', 'in', roomIds.slice(0, 10))
        .where('status', '==', 'scheduled')
        .where('startTime', '>=', now)
        .orderBy('startTime', 'asc')
        .get();
      
      const bookingsData = [];
      snapshot.forEach(doc => {
        bookingsData.push({ id: doc.id, ...doc.data() });
      });
      
      setUpcomingBookings(bookingsData);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  // Load demo data for offline/demo mode
  const loadDemoData = () => {
    const demoRooms = [
      { id: 'room1', name: 'Conference Room A', capacity: 50, available: true, active: true, orgId: 'org1' },
      { id: 'room2', name: 'Conference Room B', capacity: 25, available: true, active: true, orgId: 'org1' },
      { id: 'room3', name: 'Auditorium', capacity: 200, available: true, active: true, orgId: 'org1' },
      { id: 'room4', name: 'Meeting Room C', capacity: 12, available: false, active: true, orgId: 'org1' },
      { id: 'room5', name: 'Boardroom', capacity: 20, available: true, active: true, orgId: 'org1' }
    ];
    setRooms(demoRooms);

    // Add demo bookings
    const now = new Date();
    const startTime = new Date(now.getTime() + 10 * 60000); // 10 mins from now
    setUpcomingBookings([
      {
        id: 'demo-booking-1',
        roomId: 'room1',
        orgId: 'org1',
        userName: 'John Doe',
        startTime: { toDate: () => startTime },
        status: 'scheduled',
        phaseConfig: { preparationTime: 5, presentationTime: 30, qaTime: 10 }
      }
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
        startedAt: Date.now(),
        isVirtual: !!currentRoom.isVirtual
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
        
        // Update room availability (only if NOT a virtual room)
        if (!currentRoom.isVirtual) {
          await db.collection('rooms').doc(currentRoom.id).update({
            available: false,
            currentSession: sessionId,
            occupiedBy: user.uid,
            occupiedAt: window.firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      }

      setTimerState(initialTimerState);
      addNotification('Session started successfully!', 'success');
      
      // Notify Integrations (Slack/Teams foundation)
      notifyIntegrations(`🚀 Session started in ${currentRoom.name} by ${user.displayName}`);

    } catch (error) {
      console.error('Error starting timer:', error);
      addNotification('Failed to start session', 'error');
    }
  };

  // Setup real-time timer listener
  const setupTimerListener = (sessionId) => {
    if (!firebaseInitialized || offlineMode) return;
    if (!window || !window.firebase || typeof window.firebase.database !== 'function') return;

    const rtdb = window.firebase.database();
    if (!rtdb || typeof rtdb.ref !== 'function') return;

    dbRef.current = rtdb.ref(`timers/${sessionId}`);
    if (!dbRef.current || typeof dbRef.current.on !== 'function') return;
    
    unsubscribeTimer.current = dbRef.current.on('value', (snapshot) => {
      const data = snapshot && typeof snapshot.val === 'function' ? snapshot.val() : (snapshot || null);
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
  const updateTimerState = (updates) => {
    // Update local state immediately for responsive UI
    setTimerState(prev => {
      const newState = { ...prev, ...updates };
      
      // Sync with RTDB in the background if available and we have a session
      if (firebaseInitialized && !offlineMode && newState.sessionId) {
        try {
          const rtdb = window.firebase.database();
          rtdb.ref(`timers/${newState.sessionId}`).update({
            ...updates,
            updatedAt: window.firebase.database.ServerValue.TIMESTAMP
          }).catch(error => {
            console.error('Error updating timer state:', error);
          });
        } catch (error) {
          console.error('Error initiating RTDB sync:', error);
        }
      }
      
      return newState;
    });
  };

  const toggleTimer = async () => {
    const newRunningState = !timerState.isRunning;
    updateTimerState({ isRunning: newRunningState });
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
          
          // Free up the room (only if NOT a virtual room)
          if (currentRoom && !currentRoom.isVirtual) {
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
    setFiredThresholds([]);
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

    updateTimerState(updates);
    setFiredThresholds([]);
    addNotification(`Skipped to ${nextPhase} phase`, 'info');
  };

  // Notification system
  const addNotification = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  // Notify Integrations (Slack/Teams/Webhooks foundation)
  const notifyIntegrations = async (message) => {
    console.log('INTEGRATION ALERT:', message);
    // In a real scenario, this would be a fetch() call to a serverless function or webhook URL
    // For demo, we just add a notification to show it works
    addNotification('Webhook alert sent to organization channels', 'info');
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

  const [firedThresholds, setFiredThresholds] = useState([]);

  // Timer countdown effect
  useEffect(() => {
    if (timerState.isRunning && timerState.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        const newTime = Math.max(0, timerState.timeRemaining - 1000);
        
        // Check for warnings - Trigger when entering the minute
        const minutesLeft = Math.ceil(newTime / 60000);
        if (settings.warningThresholds.includes(minutesLeft) && 
            settings.vibrationEnabled && 
            !firedThresholds.includes(`${timerState.phase}-${minutesLeft}`)) {
          
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          addNotification(`${minutesLeft} minute${minutesLeft === 1 ? '' : 's'} remaining!`, 'warning');
          setFiredThresholds(prev => [...prev, `${timerState.phase}-${minutesLeft}`]);
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
            setFiredThresholds([]);
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
  }, [timerState.isRunning, timerState.timeRemaining, timerState.phase, settings, firedThresholds]);

  // Check for auto-start bookings every minute
  useEffect(() => {
    if (!firebaseInitialized || offlineMode || !currentRoom || timerState.isRunning) return;

    const checkAutoStart = () => {
      const now = Date.now();
      const nextBooking = upcomingBookings.find(b => {
        const startTime = b.startTime.toDate().getTime();
        // Trigger if we are within 30 seconds of start time or up to 2 minutes late
        return b.roomId === currentRoom.id && 
               b.status === 'scheduled' &&
               now >= startTime - 30000 && 
               now <= startTime + 120000;
      });

      if (nextBooking) {
        console.log('Auto-starting session for booking:', nextBooking.id);
        addNotification(`Scheduled session starting: ${nextBooking.userName || 'Upcoming Speaker'}`, 'success');
        
        // Start timer with booking's configuration
        const startSession = async () => {
          try {
            const sessionId = 'session_' + Date.now() + '_' + user.uid;
            const prepTime = nextBooking.phaseConfig?.preparationTime || settings.preparationTime;
            
            const initialTimerState = {
              isRunning: true,
              timeRemaining: prepTime * 60000,
              totalTime: prepTime * 60000,
              phase: 'preparation',
              sessionId: sessionId,
              roomId: currentRoom.id,
              userId: user.uid,
              startedAt: Date.now(),
              bookingId: nextBooking.id
            };

            const db = window.firebase.firestore();
            
            // Mark booking as active
            await db.collection('bookings').doc(nextBooking.id).update({
              status: 'active',
              actualStartTime: window.firebase.firestore.FieldValue.serverTimestamp()
            });

            // Save session
            await db.collection('sessions').doc(sessionId).set({
              ...initialTimerState,
              createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
              userEmail: user.email,
              userName: user.displayName,
              roomName: currentRoom.name,
              isAutoStarted: true
            });

            setupTimerListener(sessionId);
            
            // Update room
            await db.collection('rooms').doc(currentRoom.id).update({
              available: false,
              currentSession: sessionId,
              occupiedBy: user.uid,
              occupiedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            });

            setTimerState(initialTimerState);
          } catch (error) {
            console.error('Error auto-starting timer:', error);
          }
        };

        startSession();
      }
    };

    const interval = setInterval(checkAutoStart, 30000); // Check every 30 seconds
    checkAutoStart(); // Initial check

    return () => clearInterval(interval);
  }, [upcomingBookings, currentRoom, timerState.isRunning, firebaseInitialized, offlineMode]);

  // Settings update handler
  const handleSettingsUpdate = (newSettings) => {
    setSettings(newSettings);
    saveUserSettings(newSettings);
    setShowSettings(false);
  };

  // CSV Room Upload logic
  const handleCSVUpload = async (event) => {
    // ... (rest of CSV logic)
  };

  const handleAddBooking = async (e) => {
    e.preventDefault();
    if (!selectedRoomForBooking || !organization) return;

    try {
      const startTimeDate = new Date(bookingForm.startTime);
      const endTimeDate = new Date(startTimeDate.getTime() + 
        (bookingForm.preparationTime + bookingForm.presentationTime + bookingForm.qaTime) * 60000);

      const bookingData = {
        roomId: selectedRoomForBooking.id,
        orgId: organization.id,
        userId: user.uid,
        userName: bookingForm.userName || user.displayName,
        startTime: window.firebase.firestore.Timestamp.fromDate(startTimeDate),
        endTime: window.firebase.firestore.Timestamp.fromDate(endTimeDate),
        phaseConfig: {
          preparationTime: parseInt(bookingForm.preparationTime),
          presentationTime: parseInt(bookingForm.presentationTime),
          qaTime: parseInt(bookingForm.qaTime)
        },
        status: 'scheduled',
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };

      if (!firebaseInitialized || offlineMode) {
        setUpcomingBookings(prev => [...prev, { id: 'demo-' + Date.now(), ...bookingData }]);
        addNotification('Booking scheduled (Demo Mode)', 'success');
      } else {
        const db = window.firebase.firestore();
        await db.collection('bookings').add(bookingData);
        addNotification('Session scheduled successfully!', 'success');
        loadUpcomingBookings([selectedRoomForBooking.id]);
      }

      setShowBookingModal(false);
      setSelectedRoomForBooking(null);
    } catch (error) {
      console.error('Error adding booking:', error);
      addNotification('Failed to schedule session', 'error');
    }
  };

  if (view === 'landing') {
    return <LandingPage onLaunch={() => setView('app')} user={user} />;
  }

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background blobs for consistent styling with landing page */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md relative z-10 border border-gray-100">
          <div className="text-center mb-10">
            <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Clock className="w-12 h-12 text-blue-600" />
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Welcome back</h1>
            <p className="text-gray-500 font-medium">Continue to your presentation dashboard</p>
            
            <div className="flex items-center justify-center mt-6 space-x-2 bg-gray-50 inline-flex px-4 py-2 rounded-full border border-gray-100">
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'demo' ? 'bg-yellow-500' : 
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-blue-400'
              }`}></div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {connectionStatus === 'connected' ? 'Live Cloud' :
                 connectionStatus === 'demo' ? 'Demo Environment' :
                 connectionStatus === 'error' ? 'Offline Mode' : 'Connecting...'}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => handleLogin('google')}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-4 px-4 rounded-2xl border-2 border-gray-100 transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center shadow-sm"
              disabled={loading}
            >
              <div className="w-6 h-6 bg-red-500 rounded-full mr-3"></div>
              Sign in with Google
            </button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-4 bg-white text-gray-400 font-bold uppercase tracking-widest">Enterprise</span>
              </div>
            </div>

            <div className="bg-blue-600 p-1 rounded-2xl shadow-lg shadow-blue-200">
              <button
                onClick={() => {
                   // For demo, we simulate an Acme Corp SSO login
                   if (!firebaseInitialized || offlineMode) {
                     const demoUser = {
                       uid: 'acme_user_' + Date.now(),
                       displayName: 'Acme Admin',
                       email: 'admin@acme.com'
                     };
                     setUser(demoUser);
                     lookupOrganization(demoUser.email);
                     addNotification('Signed in via Acme SSO (Demo)', 'success');
                   } else {
                     handleLogin('google');
                   }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-xl transition-all flex items-center justify-center group"
              >
                <Shield className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                Organization SSO Login
              </button>
            </div>
            
            <p className="text-center text-gray-400 text-xs mt-8 px-6 leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Organization Dashboard View
  if (view === 'org') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-xl mr-4 shadow-blue-200 shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">Organization Admin</h1>
                <p className="text-sm text-blue-600 font-bold uppercase tracking-wider">{organization?.name}</p>
              </div>
            </div>
            <button
              onClick={() => setView('app')}
              className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
            >
              Back to App
            </button>
          </div>
        </header>

        <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          {/* Dashboard Tabs */}
          <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-2xl mb-8 w-fit">
            <button
              onClick={() => setOrgTab('rooms')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                orgTab === 'rooms' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Rooms
            </button>
            <button
              onClick={() => setOrgTab('billing')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                orgTab === 'billing' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              SaaS Billing
            </button>
            <button
              onClick={() => setOrgTab('integrations')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                orgTab === 'integrations' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Integrations
            </button>
            <button
              onClick={() => setOrgTab('analytics')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                orgTab === 'analytics' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setOrgTab('team')}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                orgTab === 'team' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Team
            </button>
            {userRole === 'owner' && (
              <button
                onClick={() => setOrgTab('security')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                  orgTab === 'security' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Security & SSO
              </button>
            )}
          </div>

          {orgTab === 'rooms' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* Enhanced Rooms with Access Oversight */}
               {rooms.map(room => (
                 <div key={room.id} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <Database className="w-6 h-6 text-blue-600" />
                      </div>
                      <button className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all">Edit Access</button>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{room.name}</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase mb-6 tracking-widest">{room.capacity} Capacity</p>
                    
                    <div className="space-y-3">
                       <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">External Access</p>
                       <div className="flex -space-x-2">
                          {(room.allowedEmails || []).slice(0, 3).map(email => (
                            <div key={email} title={email} className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                               {email.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {(room.allowedEmails || []).length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px] text-gray-500 font-bold">
                               +{(room.allowedEmails || []).length - 3}
                            </div>
                          )}
                          {(room.allowedEmails || []).length === 0 && (
                            <span className="text-xs font-medium text-gray-300 italic">No external guests assigned</span>
                          )}
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {orgTab === 'security' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
                 <div className="flex items-center mb-8">
                    <Shield className="w-10 h-10 text-blue-600 mr-4" />
                    <div>
                      <h2 className="text-3xl font-black text-gray-900 tracking-tight">Security & SSO</h2>
                      <p className="text-gray-500 font-medium">Configure enterprise-grade authentication for your organization.</p>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100">
                       <div className="flex justify-between items-center mb-6">
                          <div>
                            <h3 className="font-bold text-gray-900">SAML 2.0 / OIDC Configuration</h3>
                            <p className="text-xs text-gray-500">Connect to Okta, Azure AD, or Auth0</p>
                          </div>
                          <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                             organization?.settings?.ssoEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                          }`}>
                             {organization?.settings?.ssoEnabled ? 'Active' : 'Disabled'}
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">SSO Provider</label>
                             <input type="text" defaultValue={organization?.ssoConfig?.provider || 'SAML Provider'} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold" />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Issuer (Entity ID)</label>
                             <input type="text" defaultValue={organization?.ssoConfig?.issuer || 'http://www.okta.com/...'} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold" />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                             <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">SSO Entry Point URL</label>
                             <input type="text" defaultValue={organization?.ssoConfig?.entryPoint || 'https://...'} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold" />
                          </div>
                       </div>

                       <div className="mt-8 flex justify-end">
                          <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg shadow-blue-200">Save Security Policy</button>
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          )}

          {orgTab === 'billing' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
                 <h2 className="text-3xl font-black text-gray-900 mb-2">Subscription & Billing</h2>
                 <p className="text-gray-500 mb-8 font-medium">Manage your organization's SaaS subscription and payment history.</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="p-8 rounded-3xl border-2 border-blue-600 bg-blue-50/50 relative overflow-hidden">
                       <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl">Current Plan</div>
                       <h3 className="text-xl font-black text-gray-900 mb-1 text-blue-600">{organization?.subscription?.plan || 'Enterprise Pro'}</h3>
                       <p className="text-4xl font-black text-gray-900 mb-4">$499<span className="text-sm text-gray-400 font-bold">/mo</span></p>
                       <p className="text-xs font-bold text-gray-500 mb-8">Next billing date: **{organization?.subscription?.nextBillingDate || '2026-06-01'}**</p>
                       <button className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-all">Update Payment Method</button>
                    </div>

                    <div className="p-8 rounded-3xl border border-gray-100 bg-gray-50">
                       <h3 className="text-xl font-black text-gray-900 mb-6">Subscription Status</h3>
                       <div className="space-y-4">
                          <div className="flex justify-between items-center">
                             <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Account Status</span>
                             <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Payment Method</span>
                             <span className="text-sm font-black text-gray-900">{organization?.subscription?.paymentMethod || 'Visa ending in 4242'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Seats Occupied</span>
                             <span className="text-sm font-black text-gray-900">42 / ∞</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <h3 className="text-xl font-black text-gray-900 mb-6">Payment History</h3>
                 <div className="overflow-hidden rounded-3xl border border-gray-100">
                    <table className="w-full text-left">
                       <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                             <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Date</th>
                             <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Invoice ID</th>
                             <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Amount</th>
                             <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {(organization?.paymentHistory || []).map(payment => (
                            <tr key={payment.id} className="hover:bg-gray-50/50">
                               <td className="px-6 py-4 text-sm font-bold text-gray-900">{payment.date}</td>
                               <td className="px-6 py-4 text-sm font-bold text-gray-500">{payment.id}</td>
                               <td className="px-6 py-4 text-sm font-black text-gray-900">${payment.amount.toFixed(2)}</td>
                               <td className="px-6 py-4">
                                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Paid</span>
                               </td>
                            </tr>
                          ))}
                          {(organization?.paymentHistory || []).length === 0 && (
                            <tr>
                               <td colSpan="4" className="px-6 py-10 text-center text-sm font-medium text-gray-300 italic">No payment history available</td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
               </div>
            </div>
          )}

          {orgTab === 'integrations' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
                 <h2 className="text-3xl font-black text-gray-900 mb-2">Ecosystem Integrations</h2>
                 <p className="text-gray-500 mb-8 font-medium">Connect Presently with your organization's communication stack.</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { name: 'Microsoft Teams', desc: 'Sync timers directly with Teams meetings', status: 'connected', color: 'bg-indigo-600' },
                      { name: 'Slack', desc: 'Send automated session alerts to channels', status: 'available', color: 'bg-orange-500' },
                      { name: 'Google Meet', desc: 'Chrome extension for meeting overlay', status: 'available', color: 'bg-green-600' },
                      { name: 'Discord', desc: 'Real-time room status bot', status: 'available', color: 'bg-blue-500' }
                    ].map(app => (
                      <div key={app.name} className="p-6 rounded-3xl border border-gray-100 hover:border-blue-200 transition-all flex items-start group">
                         <div className={`${app.color} w-12 h-12 rounded-2xl mr-4 flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}></div>
                         <div className="flex-grow">
                            <h3 className="font-bold text-gray-900">{app.name}</h3>
                            <p className="text-xs text-gray-500 mb-4">{app.desc}</p>
                            <button className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${
                              app.status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}>
                              {app.status === 'connected' ? 'Connected' : 'Connect'}
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
               </div>
            </div>
          )}

          {orgTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
                 <h3 className="text-xl font-black text-gray-900 mb-8">Room Utilization</h3>
                 <div className="space-y-6">
                    {rooms.slice(0, 4).map((room, idx) => {
                      const util = [85, 62, 45, 30][idx];
                      return (
                        <div key={room.id}>
                          <div className="flex justify-between text-xs font-bold uppercase text-gray-400 mb-2">
                             <span>{room.name}</span>
                             <span>{util}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
                             <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${util}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                 </div>
               </div>

               <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
                 <h3 className="text-xl font-black text-gray-900 mb-8">Speaker Punctuality</h3>
                 <div className="flex items-end justify-between h-48 gap-4 px-4">
                    {[
                      { day: 'Mon', val: 92 },
                      { day: 'Tue', val: 88 },
                      { day: 'Wed', val: 95 },
                      { day: 'Thu', val: 78 },
                      { day: 'Fri', val: 90 }
                    ].map(d => (
                      <div key={d.day} className="flex-grow flex flex-col items-center group">
                        <div 
                          className="w-full bg-purple-100 rounded-t-xl group-hover:bg-purple-600 transition-all duration-500 relative"
                          style={{ height: `${d.val}%` }}
                        >
                           <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                             {d.val}%
                           </div>
                        </div>
                        <span className="text-[10px] font-black uppercase text-gray-400 mt-4">{d.day}</span>
                      </div>
                    ))}
                 </div>
               </div>

               <div className="lg:col-span-2 bg-gray-900 rounded-3xl shadow-xl p-10 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-2">Insight: Peak Usage</h3>
                    <p className="text-gray-400 text-sm mb-6">Your organization's highest room demand occurs on **Tuesdays between 10:00 AM and 11:30 AM**.</p>
                    <div className="flex gap-2">
                       <button className="bg-white text-gray-900 px-6 py-2 rounded-xl font-bold text-sm">Download Full Report (PDF)</button>
                       <button className="bg-white/10 text-white px-6 py-2 rounded-xl font-bold text-sm border border-white/10 hover:bg-white/20 transition-all">Schedule Alert</button>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               </div>
            </div>
          )}
        </main>
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
              {offlineMode && !organization && (
                <button
                  onClick={() => {
                    const demoUser = {
                      uid: 'acme_admin_demo',
                      displayName: 'Acme Admin (Demo)',
                      email: 'admin@acme.com'
                    };
                    setUser(demoUser);
                    lookupOrganization(demoUser.email);
                  }}
                  className="px-3 py-1 text-xs font-bold text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50"
                >
                  Test Org Admin
                </button>
              )}
            {organization && (userRole === 'owner' || userRole === 'admin') && (
                <button
                  onClick={() => setView(view === 'org' ? 'app' : 'org')}
                  className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                    view === 'org' 
                      ? 'bg-gray-900 text-white shadow-lg' 
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100'
                  }`}
                >
                  {view === 'org' ? 'Exit Admin' : 'Org Dashboard'}
                </button>
              )}
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
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
                  {rooms.length === 0 && !organization ? 'Personal Workspace' : 'Select a Room'}
                </h2>
                <p className="text-gray-500 font-medium">
                  {rooms.length === 0 && !organization 
                    ? 'Start a private session with your personal stage timer' 
                    : 'Choose a venue to start or join a session'}
                </p>
              </div>
              
              {rooms.length > 0 && (
                <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-bold text-gray-700">{rooms.filter(r => r.available).length} Available Venues</span>
                </div>
              )}
            </div>

            {rooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map(room => {
                  const roomBookings = upcomingBookings.filter(b => b.roomId === room.id);
                  return (
                    <div
                      key={room.id}
                      onClick={() => {
                        if (room.available) {
                           setCurrentRoom(room);
                        } else {
                           setSelectedRoomForBooking(room);
                           setBookingModalForm({
                              ...bookingForm,
                              userName: user?.displayName || '',
                              startTime: new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16) // Default to 30 mins from now
                           });
                           setShowBookingModal(true);
                        }
                      }}
                      className={`group bg-white p-6 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden ${
                        room.available
                          ? 'border-transparent shadow-xl shadow-gray-200/50 hover:shadow-blue-100 hover:-translate-y-1 cursor-pointer'
                          : 'border-blue-100 bg-blue-50/30 shadow-md hover:border-blue-300 cursor-pointer'
                      }`}
                    >
                      {/* Status Badge */}
                      <div className="flex justify-between items-start mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                          room.available ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          <Calendar className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                          room.available ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {room.available ? 'Open' : 'Bookable'}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{room.name}</h3>
                      <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-6">{room.capacity} Seats Available</p>
                      
                      {roomBookings.length > 0 ? (
                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Next Scheduled</p>
                          {roomBookings.slice(0, 1).map(booking => (
                            <div key={booking.id} className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
                              <div className="flex items-center">
                                 <Clock className="w-4 h-4 text-blue-500 mr-3" />
                                 <span className="text-xs font-bold text-gray-700">{booking.userName || 'Speaker'}</span>
                              </div>
                              <span className="text-xs font-black text-blue-600">
                                {new Date(booking.startTime.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="pt-4 border-t border-gray-50 flex items-center text-gray-300">
                           <Wifi className="w-4 h-4 mr-2" />
                           <span className="text-xs font-bold uppercase tracking-wider">
                             {room.available ? 'Ready for instant start' : 'No upcoming sessions'}
                           </span>
                        </div>
                      )}

                      {!room.available && (
                        <div className="mt-4 text-[10px] font-black text-blue-600 uppercase text-center bg-blue-100 py-2 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                          Schedule Future Slot
                        </div>
                      )}

                      {/* Hover Effect Background */}
                      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl group-hover:bg-blue-600/10 transition-all"></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-[40px] shadow-2xl p-12 text-center border border-gray-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-blue-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-200 transform group-hover:scale-110 transition-transform duration-500">
                    <Play className="w-12 h-12 text-white fill-current" />
                  </div>
                  
                  <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Your Personal Timer</h3>
                  <p className="text-gray-500 max-w-md mx-auto mb-10 font-medium leading-relaxed">
                    Access Presently's professional stage timer for free. Perfect for practicing presentations, hosting remote webinars, or solo speaking engagements.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                      onClick={() => setCurrentRoom({
                        id: 'personal-room-' + user.uid,
                        name: 'Personal Workspace',
                        capacity: 1,
                        isVirtual: true,
                        available: true
                      })}
                      className="bg-gray-900 hover:bg-black text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-gray-200 flex items-center"
                    >
                      Launch Personal Timer
                      <SkipForward className="w-6 h-6 ml-3" />
                    </button>
                  </div>
                  
                  <div className="mt-12 pt-10 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="flex items-center justify-center sm:justify-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-green-600" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Free Forever</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Wifi className="w-5 h-5 text-purple-600" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cloud Sync</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                        <Vibrate className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Haptic Alerts</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-gray-100">
            <div className="flex justify-between items-center mb-8">
               <div className="bg-blue-50 p-2 rounded-xl mr-4 shadow-sm">
                 <Calendar className="w-6 h-6 text-blue-600" />
               </div>
               <h2 className="text-2xl font-black text-gray-900 flex-grow">Schedule Session</h2>
               <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-gray-600 font-black">✕</button>
            </div>

            <form onSubmit={handleAddBooking} className="space-y-6">
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                 <p className="text-xs font-bold uppercase text-gray-400 mb-1">Target Room</p>
                 <p className="text-lg font-bold text-gray-900">{selectedRoomForBooking?.name}</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Speaker Name</label>
                   <input
                     type="text"
                     value={bookingForm.userName}
                     onChange={(e) => setBookingModalForm({...bookingForm, userName: e.target.value})}
                     className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 font-bold focus:border-blue-500 outline-none transition-all"
                     placeholder="John Doe"
                     required
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Start Time</label>
                   <input
                     type="datetime-local"
                     value={bookingForm.startTime}
                     onChange={(e) => setBookingModalForm({...bookingForm, startTime: e.target.value})}
                     className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 font-bold focus:border-blue-500 outline-none transition-all"
                     required
                   />
                 </div>
               </div>

               <div className="grid grid-cols-3 gap-4">
                 <div>
                   <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Prep (m)</label>
                   <input
                     type="number"
                     value={bookingForm.preparationTime}
                     onChange={(e) => setBookingModalForm({...bookingForm, preparationTime: e.target.value})}
                     className="w-full bg-white border-2 border-gray-100 rounded-xl px-3 py-2 font-bold"
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Pres (m)</label>
                   <input
                     type="number"
                     value={bookingForm.presentationTime}
                     onChange={(e) => setBookingModalForm({...bookingForm, presentationTime: e.target.value})}
                     className="w-full bg-white border-2 border-gray-100 rounded-xl px-3 py-2 font-bold"
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Q&A (m)</label>
                   <input
                     type="number"
                     value={bookingForm.qaTime}
                     onChange={(e) => setBookingModalForm({...bookingForm, qaTime: e.target.value})}
                     className="w-full bg-white border-2 border-gray-100 rounded-xl px-3 py-2 font-bold"
                   />
                 </div>
               </div>

               <button
                 type="submit"
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1 active:translate-y-0"
               >
                 Confirm Booking
               </button>
            </form>
          </div>
        </div>
      )}

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
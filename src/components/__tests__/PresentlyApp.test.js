import React from 'react';
import { render, act, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// 1. Setup Firebase Global Mock with functional definitions
const mockFirestore = {
  collection: (name) => {
    const query = {
      where: jest.fn(() => query),
      orderBy: jest.fn(() => query),
      get: jest.fn(() => {
        if (name === 'organizations') {
          return Promise.resolve({
            empty: false,
            docs: [{ id: 'org1', data: () => ({ name: 'Acme Corp', domain: 'acme.com' }) }]
          });
        }
        if (name === 'rooms') {
          return Promise.resolve({
            forEach: (callback) => {
              callback({ id: 'room1', data: () => ({ name: 'Conference Room A', capacity: 50, available: true, active: true, orgId: 'org1' }) });
            }
          });
        }
        if (name === 'bookings') {
          return Promise.resolve({
            forEach: (callback) => {
              callback({ id: 'booking1', data: () => ({ roomId: 'room1', startTime: { toDate: () => new Date() }, status: 'scheduled' }) });
            }
          });
        }
        return Promise.resolve({ empty: true, docs: [], forEach: () => {} });
      })
    };
    return query;
  },
  doc: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve({ 
      exists: true, 
      data: () => ({ settings: { preparationTime: 5, presentationTime: 30, qaTime: 10 } }) 
    })),
    set: jest.fn(() => Promise.resolve()),
    update: jest.fn(() => Promise.resolve())
  })),
  add: jest.fn(() => Promise.resolve({ id: 'new-doc-id' }))
};

let capturedAuthCallbacks = [];
const mockAuthInstance = {
  onAuthStateChanged: jest.fn((cb) => {
    capturedAuthCallbacks.push(cb);
    // Initial state: no user
    cb(null);
    return () => {}; // Unsubscribe
  }),
  signInWithPopup: jest.fn(() => Promise.resolve({ 
    user: { 
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@acme.com',
      photoURL: 'https://example.com/photo.jpg'
    } 
  })),
  signOut: jest.fn(() => Promise.resolve())
};

class MockGoogleAuthProvider {
  constructor() {
    this.addScope = jest.fn();
  }
}

class MockFacebookAuthProvider {
  constructor() {
    this.addScope = jest.fn();
  }
}

const authMock = jest.fn(() => mockAuthInstance);
authMock.GoogleAuthProvider = MockGoogleAuthProvider;
authMock.FacebookAuthProvider = MockFacebookAuthProvider;

const firestoreFunc = () => mockFirestore;
firestoreFunc.FieldValue = { serverTimestamp: () => 'mock-timestamp' };
firestoreFunc.Timestamp = { 
  now: () => ({ toMillis: () => Date.now() }),
  fromDate: (date) => ({ toDate: () => date })
};

const mockDatabase = {
  ref: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    update: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve())
  }))
};

window.firebase = {
  apps: [],
  initializeApp: jest.fn(),
  auth: authMock,
  firestore: firestoreFunc,
  database: () => mockDatabase
};
window.firebase.database.ServerValue = { TIMESTAMP: 'mock-timestamp' };

// 2. Import the component AFTER mocks are set up
import PresentlyApp from '../PresentlyApp';
import { AuthProvider } from '../../context/AuthContext';
import { TimerProvider } from '../../context/TimerContext';

navigator.vibrate = jest.fn();

describe('PresentlyApp Timer Logic', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    capturedAuthCallbacks = [];
    authMock.mockReturnValue(mockAuthInstance);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('timer transitions phases correctly', async () => {
    // Render component with providers
    render(
      <AuthProvider>
        <TimerProvider>
          <PresentlyApp />
        </TimerProvider>
      </AuthProvider>
    );
    
    // Handle async initialization and waitForFirebaseGlobal
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Check Landing Page
    const launchButton = await screen.findByText(/Start Timing Now/i);
    expect(launchButton).toBeInTheDocument();

    // Click Launch App -> Switches view to 'app'
    fireEvent.click(launchButton);

    // Mock successful login by triggering the callback directly
    await act(async () => {
        for (const cb of capturedAuthCallbacks) {
            await cb({
                uid: 'test-uid',
                displayName: 'Test User',
                email: 'test@acme.com',
                photoURL: 'https://example.com/photo.jpg'
            });
        }
    });

    // Advance timers to trigger useEffects and async updates
    await act(async () => {
        jest.advanceTimersByTime(2000);
    });

    // Check for "Conference Room A" as evidence that loadRooms finished
    // We use waitFor here to be more resilient
    await waitFor(async () => {
        const room = screen.queryByText(/Conference Room A/i);
        if (!room) {
            await act(async () => {
                jest.advanceTimersByTime(1000);
            });
            throw new Error('Room not found yet');
        }
        expect(room).toBeInTheDocument();
    }, { timeout: 10000 });

    const room = screen.getByText(/Conference Room A/i);

    // Start timer
    fireEvent.click(room);
    const startButton = screen.getByText(/Start/i);
    fireEvent.click(startButton);

    expect(screen.getByText(/preparation Phase/i)).toBeInTheDocument();

    // Advance Time (5 mins)
    for (let i = 0; i < 300; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }

    expect(screen.getAllByText(/presentation Phase/i).length).toBeGreaterThan(0);
  });
});

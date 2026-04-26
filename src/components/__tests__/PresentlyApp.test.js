import React from 'react';
import { render, act, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// 1. Setup Firebase Global Mock with functional definitions
const mockFirestore = {
  collection: jest.fn(() => ({
    where: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({
        forEach: (callback) => {
          callback({ id: 'room1', data: () => ({ name: 'Conference Room A', capacity: 50, available: true, active: true }) });
        }
      }))
    })),
    doc: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve({ 
        exists: true, 
        data: () => ({ settings: { preparationTime: 5, presentationTime: 30, qaTime: 10 } }) 
      })),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve())
    }))
  })),
  FieldValue: { serverTimestamp: () => 'mock-timestamp' }
};

const mockAuth = {
  onAuthStateChanged: jest.fn((cb) => {
    // Force immediate login state
    cb({
      uid: 'test-uid',
      displayName: 'Test User',
      email: 'test@example.com',
      photoURL: 'https://example.com/photo.jpg'
    });
    return jest.fn(); // Unsubscribe
  }),
  signInWithPopup: jest.fn(() => Promise.resolve({ user: { uid: 'test-uid' } })),
  signOut: jest.fn(() => Promise.resolve()),
  GoogleAuthProvider: function() { this.addScope = jest.fn(); },
  FacebookAuthProvider: function() { this.addScope = jest.fn(); }
};

const mockDatabase = {
  ref: jest.fn(() => ({
    on: jest.fn(),
    off: jest.fn(),
    update: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve())
  })),
  ServerValue: { TIMESTAMP: 'mock-timestamp' }
};

// CRITICAL: Define functions that return the mock objects
const firebase = {
  apps: [],
  initializeApp: jest.fn(),
  auth: jest.fn(() => mockAuth),
  firestore: jest.fn(() => mockFirestore),
  database: jest.fn(() => mockDatabase)
};

// Add properties to the functions themselves
firebase.auth.GoogleAuthProvider = mockAuth.GoogleAuthProvider;
firebase.auth.FacebookAuthProvider = mockAuth.FacebookAuthProvider;
firebase.firestore.FieldValue = mockFirestore.FieldValue;
firebase.database.ServerValue = mockDatabase.ServerValue;

window.firebase = firebase;

// 2. Import the component AFTER mocks are set up
import PresentlyApp from '../PresentlyApp';

navigator.vibrate = jest.fn();

describe('PresentlyApp Timer Logic', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('timer transitions phases correctly', async () => {
    render(<PresentlyApp />);
    
    // Initial loading
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    // Room Selection
    const room = await screen.findByText(/Conference Room A/i);
    fireEvent.click(room);

    // Start timer
    const startButton = screen.getByText(/Start/i);
    fireEvent.click(startButton);

    expect(screen.getByText(/preparation Phase/i)).toBeInTheDocument();

    // Advance Time (5 mins)
    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(screen.getByText(/presentation Phase/i)).toBeInTheDocument();
  });
});

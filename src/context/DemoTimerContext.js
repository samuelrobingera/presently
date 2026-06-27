import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * DemoTimerContext
 *
 * Provides shared state management for demo mode timer sessions.
 * Replaces Firebase RTDB for demo mode, allowing components to share
 * timer state without backend dependencies.
 *
 * Usage:
 * - TimerContext creates/updates/terminates demo sessions
 * - DisplayView subscribes to demo session updates
 * - Both components stay in sync via React Context
 */

const DemoTimerContext = createContext();

export const useDemoTimer = () => {
  const context = useContext(DemoTimerContext);
  if (!context) {
    throw new Error('useDemoTimer must be used within DemoTimerProvider');
  }
  return context;
};

export const DemoTimerProvider = ({ children }) => {
  // Map of sessionId -> session data
  const [demoSessions, setDemoSessions] = useState({});

  // Map of sessionId -> Set of subscriber callbacks
  // Using useRef to avoid stale closure issues in notifySubscribers
  const subscribersRef = React.useRef({});
  const [subscribers, setSubscribers] = useState({});

  /**
   * Create a new demo session
   */
  const createDemoSession = useCallback((sessionId, sessionData) => {
    setDemoSessions(prev => ({
      ...prev,
      [sessionId]: {
        ...sessionData,
        createdAt: Date.now(),
        status: 'active'
      }
    }));

    // Notify subscribers
    notifySubscribers(sessionId, {
      ...sessionData,
      createdAt: Date.now(),
      status: 'active'
    });
  }, []);

  /**
   * Update an existing demo session
   */
  const updateDemoSession = useCallback((sessionId, updates) => {
    setDemoSessions(prev => {
      const existingSession = prev[sessionId];
      if (!existingSession) {
        console.warn(`Demo session ${sessionId} not found for update`);
        return prev;
      }

      const updatedSession = {
        ...existingSession,
        ...updates,
        updatedAt: Date.now()
      };

      // Notify subscribers
      notifySubscribers(sessionId, updatedSession);

      return {
        ...prev,
        [sessionId]: updatedSession
      };
    });
  }, []);

  /**
   * Terminate a demo session (removes it completely)
   */
  const terminateDemoSession = useCallback((sessionId) => {
    console.log(`[DemoTimer] Terminating session: ${sessionId}`);

    // Notify subscribers with null (session ended)
    notifySubscribers(sessionId, null);

    // Remove session from state
    setDemoSessions(prev => {
      const updated = { ...prev };
      delete updated[sessionId];
      return updated;
    });

    // Clean up subscribers from both ref and state
    if (subscribersRef.current[sessionId]) {
      delete subscribersRef.current[sessionId];
    }

    setSubscribers(prev => {
      const updated = { ...prev };
      delete updated[sessionId];
      return updated;
    });
  }, []);

  /**
   * Subscribe to demo session updates
   * Returns unsubscribe function
   */
  const subscribeToDemoSession = useCallback((sessionId, callback) => {
    // Add subscriber to ref (for immediate access in notifySubscribers)
    if (!subscribersRef.current[sessionId]) {
      subscribersRef.current[sessionId] = new Set();
    }
    subscribersRef.current[sessionId].add(callback);

    // Add subscriber to state (for React reactivity)
    setSubscribers(prev => ({
      ...prev,
      [sessionId]: new Set([...(prev[sessionId] || []), callback])
    }));

    // Immediately call with current data if session exists
    const currentSession = demoSessions[sessionId];
    if (currentSession) {
      callback(currentSession);
    }

    // Return unsubscribe function
    return () => {
      // Remove from ref
      if (subscribersRef.current[sessionId]) {
        subscribersRef.current[sessionId].delete(callback);
        if (subscribersRef.current[sessionId].size === 0) {
          delete subscribersRef.current[sessionId];
        }
      }

      // Remove from state
      setSubscribers(prev => {
        const sessionSubs = prev[sessionId];
        if (!sessionSubs) return prev;

        const updated = new Set(sessionSubs);
        updated.delete(callback);

        if (updated.size === 0) {
          const newState = { ...prev };
          delete newState[sessionId];
          return newState;
        }

        return {
          ...prev,
          [sessionId]: updated
        };
      });
    };
  }, [demoSessions]);

  /**
   * Get current session data (synchronous)
   */
  const getDemoSession = useCallback((sessionId) => {
    return demoSessions[sessionId] || null;
  }, [demoSessions]);

  /**
   * Check if a session exists
   */
  const hasDemoSession = useCallback((sessionId) => {
    return !!demoSessions[sessionId];
  }, [demoSessions]);

  /**
   * Notify all subscribers of a session update
   * Uses ref to access current subscribers without closure issues
   */
  const notifySubscribers = (sessionId, data) => {
    const sessionSubs = subscribersRef.current[sessionId];
    if (sessionSubs) {
      sessionSubs.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error notifying demo session subscriber:', error);
        }
      });
    }
  };

  /**
   * Get all active demo sessions (for debugging)
   */
  const getAllDemoSessions = useCallback(() => {
    return demoSessions;
  }, [demoSessions]);

  const value = {
    demoSessions,
    createDemoSession,
    updateDemoSession,
    terminateDemoSession,
    subscribeToDemoSession,
    getDemoSession,
    hasDemoSession,
    getAllDemoSessions
  };

  return (
    <DemoTimerContext.Provider value={value}>
      {children}
    </DemoTimerContext.Provider>
  );
};

export default DemoTimerContext;

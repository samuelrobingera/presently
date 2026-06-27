import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useDemoTimer } from './DemoTimerContext';
import { timerService } from '../services/timerService';
import { roomService } from '../services/roomService';
import { offlineStorage } from '../utils/offlineStorage';
import { syncService } from '../services/syncService';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { phaseConfigService } from '../services/phaseConfigService';

const TimerContext = createContext();

export const useTimer = () => useContext(TimerContext);

export const TimerProvider = ({ children }) => {
  const { user, organization, isDemo } = useAuth();
  const { isOnline, wasOffline } = useNetworkStatus();
  const demoTimerContext = useDemoTimer();
  const [currentRoom, setCurrentRoom] = useState(null);
  const [phaseConfig, setPhaseConfig] = useState(null);
  const [timerState, setTimerState] = useState({
    isRunning: false,
    timeRemaining: 300000,
    totalTime: 300000,
    phase: 'preparation',
    phaseIndex: 0,
    sessionId: null,
    overtimeSeconds: 0
  });

  const [settings, setSettings] = useState({
    preparationTime: 5,
    presentationTime: 30,
    qaTime: 10,
    vibrationEnabled: true,
    warningThresholds: [5, 2, 1]
  });

  const timerRef = useRef(null);
  const lastSyncTimeRef = useRef(0);
  const [firedThresholds, setFiredThresholds] = useState([]);
  const hasReconciledRef = useRef(false);

  // Restore state from offline storage on mount
  useEffect(() => {
    const restoreOfflineState = async () => {
      const savedState = await offlineStorage.getTimerState();
      if (savedState && savedState.sessionId) {
        setTimerState(prev => ({
          ...prev,
          ...savedState,
          lastUpdated: Date.now()
        }));
      }
    };

    restoreOfflineState();
  }, []);

  // Reconcile state when coming back online
  useEffect(() => {
    const reconcile = async () => {
      if (wasOffline && isOnline && !hasReconciledRef.current && timerState.sessionId) {
        hasReconciledRef.current = true;

        const result = await syncService.reconcileState(timerState, isDemo);

        if (result.success && result.adjustedState) {
          setTimerState(prev => ({
            ...prev,
            ...result.adjustedState
          }));
        }

        setTimeout(() => {
          hasReconciledRef.current = false;
        }, 5000);
      }
    };

    reconcile();
  }, [wasOffline, isOnline, timerState.sessionId, isDemo]);

  // Timer countdown effect
  useEffect(() => {
    if (timerState.isRunning && phaseConfig) {
      timerRef.current = setInterval(() => {
        setTimerState(prev => {
          let newTime = prev.timeRemaining;
          let newPhaseIndex = prev.phaseIndex;
          let newTotalTime = prev.totalTime;
          let newOvertimeSeconds = prev.overtimeSeconds;
          let shouldSync = false;

          const currentPhase = phaseConfig.phases[prev.phaseIndex];

          // Handle countdown
          if (currentPhase?.durationMinutes === 0) {
            // Infinite phase (overtime)
            newOvertimeSeconds += 1;
            newTime = 0;
          } else {
            newTime = Math.max(0, prev.timeRemaining - 1000);
          }

          // Auto-transition logic
          if (newTime === 0 && currentPhase?.autoAdvance && newPhaseIndex < phaseConfig.phases.length - 1) {
            newPhaseIndex += 1;
            const nextPhase = phaseConfig.phases[newPhaseIndex];
            setFiredThresholds([]);
            shouldSync = true; // Always sync on phase change

            if (nextPhase.durationMinutes === 0) {
              // Infinite phase (overtime)
              newTime = 0;
              newOvertimeSeconds = 0;
            } else {
              newTime = nextPhase.durationMinutes * 60000;
            }
            newTotalTime = newTime;
          }

          const updates = {
            timeRemaining: newTime,
            phaseIndex: newPhaseIndex,
            phase: phaseConfig.phases[newPhaseIndex]?.id || 'preparation',
            totalTime: newTotalTime,
            overtimeSeconds: newOvertimeSeconds,
            lastUpdated: Date.now()
          };

          // Persist to offline storage on every tick
          offlineStorage.saveTimerState({
            ...prev,
            ...updates,
            sessionId: prev.sessionId,
            roomId: prev.roomId,
            userId: prev.userId,
            startedAt: prev.startedAt
          });

          // Optimize Firebase writes: sync only every 5 seconds or on phase change
          const now = Date.now();
          const timeSinceLastSync = now - lastSyncTimeRef.current;

          if (prev.sessionId && (shouldSync || timeSinceLastSync >= 5000)) {
            if (isOnline) {
              timerService.updateTimer(prev.sessionId, updates, isDemo, demoTimerContext);
              lastSyncTimeRef.current = now;
            } else {
              // Queue update for later sync when offline
              syncService.queueUpdate(prev.sessionId, updates);
            }
          }

          return { ...prev, ...updates };
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerState.isRunning, isDemo, organization, settings, isOnline, phaseConfig]);

  const updateLocalAndRemoteTimer = (updates) => {
    setTimerState(prev => {
      const newState = { ...prev, ...updates, lastUpdated: Date.now() };
      offlineStorage.saveTimerState(newState);
      return newState;
    });

    if (timerState.sessionId) {
      if (isOnline) {
        timerService.updateTimer(timerState.sessionId, updates, isDemo, demoTimerContext);
      } else {
        syncService.queueUpdate(timerState.sessionId, updates);
      }
    }
  };

  const startTimer = async (room) => {
    // Load phase configuration for this room
    const config = await phaseConfigService.getRoomPhaseConfig(room.id, isDemo);
    setPhaseConfig(config);

    const firstPhase = config.phases[0];
    const initialTime = firstPhase.durationMinutes * 60000;

    const sessionId = `session_${Date.now()}_${user.uid}`;
    const initialState = {
      isRunning: true,
      timeRemaining: initialTime,
      totalTime: initialTime,
      phase: firstPhase.id,
      phaseIndex: 0,
      sessionId,
      roomId: room.id,
      userId: user.uid,
      startedAt: Date.now(),
      overtimeSeconds: 0,
      phaseConfigId: config.id
    };

    setCurrentRoom(room);
    setTimerState(initialState);

    // Pass demoTimerContext to timerService
    await timerService.createSession(sessionId, initialState, isDemo, demoTimerContext);

    if (!room.isVirtual) {
      await roomService.updateRoomStatus(room.id, {
        available: false,
        currentSession: sessionId,
        occupiedBy: user.uid
      }, isDemo);
    }
  };

  const stopTimer = async () => {
    if (timerState.sessionId) {
      // Analytics Telemetry: Track performance before completion
      const sessionDuration = Date.now() - timerState.startedAt;
      const isOvertime = phaseConfig && timerState.phaseIndex >= phaseConfig.phases.length - 1;
      const punctualityScore = isOvertime ? -timerState.overtimeSeconds : 100;

      console.log('Dispatching Telemetry:', {
        sessionId: timerState.sessionId,
        duration: sessionDuration,
        punctuality: punctualityScore,
        orgId: organization?.id || 'individual'
      });

      // Pass demoTimerContext to timerService
      await timerService.completeSession(timerState.sessionId, currentRoom?.id, isDemo, demoTimerContext);
      await offlineStorage.clearTimerState();
    }

    const defaultConfig = phaseConfigService.getDefaultConfig();
    const firstPhase = defaultConfig.phases[0];

    setTimerState({
      isRunning: false,
      timeRemaining: firstPhase.durationMinutes * 60000,
      totalTime: firstPhase.durationMinutes * 60000,
      phase: firstPhase.id,
      phaseIndex: 0,
      sessionId: null,
      overtimeSeconds: 0
    });
    setCurrentRoom(null);
    setPhaseConfig(null);
  };

  const skipPhase = () => {
    if (!phaseConfig) return;

    setTimerState(prev => {
      const nextPhaseIndex = prev.phaseIndex + 1;
      if (nextPhaseIndex >= phaseConfig.phases.length) return prev;

      const nextPhase = phaseConfig.phases[nextPhaseIndex];
      const newTime = nextPhase.durationMinutes === 0 ? 0 : nextPhase.durationMinutes * 60000;

      const updates = {
        phase: nextPhase.id,
        phaseIndex: nextPhaseIndex,
        timeRemaining: newTime,
        totalTime: newTime,
        overtimeSeconds: 0
      };

      if (prev.sessionId) timerService.updateTimer(prev.sessionId, updates, isDemo, demoTimerContext);
      setFiredThresholds([]);
      return { ...prev, ...updates };
    });
  };

  const addTime = (minutes) => {
    if (!phaseConfig) return;

    const currentPhase = phaseConfig.phases[timerState.phaseIndex];
    if (currentPhase?.durationMinutes === 0) return; // Can't add time to infinite phase

    const msToAdd = minutes * 60000;
    setTimerState(prev => {
      const newTime = prev.timeRemaining + msToAdd;
      const updates = { timeRemaining: newTime };
      if (prev.sessionId) timerService.updateTimer(prev.sessionId, updates, isDemo, demoTimerContext);
      return { ...prev, ...updates };
    });
  };

  const value = {
    timerState,
    currentRoom,
    phaseConfig,
    settings,
    setSettings,
    startTimer,
    stopTimer,
    skipPhase,
    addTime,
    setCurrentRoom,
    updateTimer: updateLocalAndRemoteTimer,
    isOnline
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimerContext = () => useContext(TimerContext);

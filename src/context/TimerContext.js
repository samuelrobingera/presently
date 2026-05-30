import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { timerService } from '../services/timerService';
import { roomService } from '../services/roomService';

const TimerContext = createContext();

export const useTimer = () => useContext(TimerContext);

export const TimerProvider = ({ children }) => {
  const { user, organization, isDemo } = useAuth();
  const [currentRoom, setCurrentRoom] = useState(null);
  const [timerState, setTimerState] = useState({
    isRunning: false,
    timeRemaining: 300000,
    totalTime: 300000,
    phase: 'preparation',
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
  const [firedThresholds, setFiredThresholds] = useState([]);

  // Timer countdown effect
  useEffect(() => {
    if (timerState.isRunning) {
      timerRef.current = setInterval(() => {
        setTimerState(prev => {
          let newTime = prev.timeRemaining;
          let newPhase = prev.phase;
          let newTotalTime = prev.totalTime;
          let newOvertimeSeconds = prev.overtimeSeconds;

          if (newPhase === 'overtime') {
            newOvertimeSeconds += 1;
            newTime = 0;
          } else {
            newTime = Math.max(0, prev.timeRemaining - 1000);
          }

          // Auto-transition logic
          if (newTime === 0 && newPhase !== 'overtime') {
            const phases = ['preparation', 'presentation', 'q&a', 'overtime'];
            const currentIndex = phases.indexOf(newPhase);
            if (currentIndex < phases.length - 1) {
              newPhase = phases[currentIndex + 1];
              setFiredThresholds([]);

              switch (newPhase) {
                case 'presentation':
                  newTime = (isDemo && !organization ? 20 : settings.presentationTime) * 60000;
                  break;
                case 'q&a':
                  newTime = (isDemo && !organization ? 5 : settings.qaTime) * 60000;
                  break;
                case 'overtime':
                  newTime = 0;
                  newOvertimeSeconds = 0;
                  break;
              }
              newTotalTime = newTime;
            }
          }

          const updates = { 
            timeRemaining: newTime, 
            phase: newPhase, 
            totalTime: newTotalTime,
            overtimeSeconds: newOvertimeSeconds
          };

          if (prev.sessionId) {
            timerService.updateTimer(prev.sessionId, updates, isDemo);
          }

          return { ...prev, ...updates };
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerState.isRunning, isDemo, organization, settings]);

  const updateLocalAndRemoteTimer = (updates) => {
    setTimerState(prev => ({ ...prev, ...updates }));
    if (timerState.sessionId) {
      timerService.updateTimer(timerState.sessionId, updates, isDemo);
    }
  };

  const startTimer = async (room) => {
    const isIndividual = isDemo && !organization;
    const prepTime = isIndividual ? 5 : settings.preparationTime;
    
    const sessionId = `session_${Date.now()}_${user.uid}`;
    const initialState = {
      isRunning: true,
      timeRemaining: prepTime * 60000,
      totalTime: prepTime * 60000,
      phase: 'preparation',
      sessionId,
      roomId: room.id,
      userId: user.uid,
      startedAt: Date.now(),
      overtimeSeconds: 0
    };

    setCurrentRoom(room);
    setTimerState(initialState);
    
    await timerService.createSession(sessionId, initialState, isDemo);
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
      const punctualityScore = timerState.phase === 'overtime' ? -timerState.overtimeSeconds : 100;
      
      console.log('Dispatching Telemetry:', {
        sessionId: timerState.sessionId,
        duration: sessionDuration,
        punctuality: punctualityScore,
        orgId: organization?.id || 'individual'
      });

      await timerService.completeSession(timerState.sessionId, currentRoom?.id, isDemo);
    }
    const isIndividual = isDemo && !organization;
    const prepTime = isIndividual ? 5 : settings.preparationTime;
    
    setTimerState({
      isRunning: false,
      timeRemaining: prepTime * 60000,
      totalTime: prepTime * 60000,
      phase: 'preparation',
      sessionId: null,
      overtimeSeconds: 0
    });
    setCurrentRoom(null);
  };

  const skipPhase = () => {
    setTimerState(prev => {
      const phases = ['preparation', 'presentation', 'q&a', 'overtime'];
      const currentIndex = phases.indexOf(prev.phase);
      if (currentIndex >= phases.length - 1) return prev;

      const nextPhase = phases[currentIndex + 1];
      const isIndividual = isDemo && !organization;
      
      let newTime = 0;
      switch (nextPhase) {
        case 'presentation': 
          newTime = (isIndividual ? 20 : settings.presentationTime) * 60000; 
          break;
        case 'q&a': 
          newTime = (isIndividual ? 5 : settings.qaTime) * 60000; 
          break;
        case 'overtime': 
          newTime = 0; 
          break;
      }
      
      const updates = {
        phase: nextPhase,
        timeRemaining: newTime,
        totalTime: newTime,
        overtimeSeconds: 0
      };
      
      if (prev.sessionId) timerService.updateTimer(prev.sessionId, updates, isDemo);
      setFiredThresholds([]);
      return { ...prev, ...updates };
    });
  };

  const addTime = (minutes) => {
    if (timerState.phase === 'overtime') return;
    const msToAdd = minutes * 60000;
    setTimerState(prev => {
      const newTime = prev.timeRemaining + msToAdd;
      const updates = { timeRemaining: newTime };
      if (prev.sessionId) timerService.updateTimer(prev.sessionId, updates, isDemo);
      return { ...prev, ...updates };
    });
  };

  const value = {
    timerState,
    currentRoom,
    settings,
    setSettings,
    startTimer,
    stopTimer,
    skipPhase,
    addTime,
    setCurrentRoom,
    updateTimer: updateLocalAndRemoteTimer
  };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimerContext = () => useContext(TimerContext);

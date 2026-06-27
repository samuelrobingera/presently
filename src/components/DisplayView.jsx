import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useDemoTimer } from '../context/DemoTimerContext';
import { timerService } from '../services/timerService';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatTime, formatOvertime, getPhaseStyles, shouldFlash as shouldFlashUtil } from '../utils/timerUtils';

const DisplayView = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const [timerState, setTimerState] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const demoTimerContext = useDemoTimer();

  const queryParams = new URLSearchParams(location.search);
  const layout = queryParams.get('layout') || 'dsm';
  const demoMode = queryParams.get('demo') === 'true';

  useEffect(() => {
    setIsDemo(demoMode);

    if (demoMode) {
      // Demo mode: no auth needed, mark as ready
      setIsAuthed(true);
    } else {
      // Production mode: require anonymous auth
      const initAuth = async () => {
        try {
          if (!auth.currentUser) {
            await signInAnonymously(auth);
          }
          setIsAuthed(true);
        } catch (error) {
          console.error('Anonymous auth failed:', error);
          // Fallback to demo mode if Firebase not configured
          setIsDemo(true);
          setIsAuthed(true);
        }
      };
      initAuth();
    }
  }, [demoMode]);

  useEffect(() => {
    if (!sessionId || !isAuthed) return;

    // Subscribe to timer updates (demo or production)
    const unsubscribe = timerService.subscribeToTimer(
      sessionId,
      (data) => {
        setTimerState(data);
      },
      isDemo,
      demoTimerContext
    );

    return () => unsubscribe();
  }, [sessionId, isAuthed, isDemo, demoTimerContext]);

  useEffect(() => {
    let flashInterval;
    if (!timerState) return;

    if (shouldFlashUtil(timerState.phase, timerState.timeRemaining, true)) {
      flashInterval = setInterval(() => {
        setIsFlashing(prev => !prev);
      }, 500);
    } else {
      setIsFlashing(false);
    }

    return () => clearInterval(flashInterval);
  }, [timerState]);

  if (!timerState) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-sans">
        <div className="text-center">
          <Clock className="w-20 h-20 mx-auto mb-6 animate-pulse text-rose-600" />
          <p className="text-xs font-black uppercase tracking-[0.4em] opacity-40">Awaiting Signal Transmission</p>
        </div>
      </div>
    );
  }

  // Timer Bar Layout
  if (layout === 'bar') {
    return (
      <div className={`fixed bottom-0 left-0 right-0 h-24 flex items-center justify-between px-16 transition-all duration-700 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] z-50 font-sans border-t border-white/5 ${getPhaseStyles(timerState.phase, timerState.timeRemaining, timerState.overtimeSeconds, isFlashing)}`}>
         <div className="flex items-center space-x-8">
            <div className="text-5xl font-black tabular-nums tracking-tighter drop-shadow-lg">
              {timerState.phase === 'overtime' ? formatOvertime(timerState.overtimeSeconds) : formatTime(timerState.timeRemaining)}
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 italic">{timerState.phase} PHASE ACTIVE</div>
         </div>
         <div className="flex-grow max-w-xl mx-16 h-3 bg-black/30 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-white transition-all duration-1000 linear shadow-[0_0_15px_rgba(255,255,255,0.4)]" 
              style={{ width: `${((timerState.totalTime - timerState.timeRemaining) / timerState.totalTime) * 100}%` }}
            ></div>
         </div>
         <div className="flex items-center space-x-6 opacity-40">
            <div className="text-right">
                <p className="text-[8px] font-black uppercase tracking-widest">System Status</p>
                <p className="text-[10px] font-black uppercase tracking-widest">Live Sync OK</p>
            </div>
            <Clock className="w-6 h-6" />
         </div>
      </div>
    );
  }

  // Full-Screen DSM Layout (Default)
  return (
    <div className={`min-h-screen flex items-center justify-center transition-all duration-700 font-sans ${getPhaseStyles(timerState.phase, timerState.timeRemaining, timerState.overtimeSeconds, isFlashing)}`}>
      <div className="text-center relative">
        <div className="text-[30vw] font-black leading-none tracking-tighter tabular-nums drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {timerState.phase === 'overtime' 
            ? formatOvertime(timerState.overtimeSeconds)
            : formatTime(timerState.timeRemaining)
          }
        </div>
        <div className="mt-8 inline-flex items-center px-12 py-4 rounded-full bg-black/10 backdrop-blur-md text-2xl font-black uppercase tracking-[0.4em] border border-white/5 shadow-xl">
          {timerState.phase}
        </div>
        
        {/* Decorative corner accents */}
        <div className="absolute -top-24 -left-24 w-48 h-48 border-t-4 border-l-4 border-white/10 rounded-tl-[64px]"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 border-b-4 border-r-4 border-white/10 rounded-br-[64px]"></div>
      </div>
    </div>
  );
};

export default DisplayView;

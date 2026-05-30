import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../config/firebase';
import { timerService } from '../services/timerService';
import { Clock, AlertTriangle } from 'lucide-react';

const DisplayView = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const [timerState, setTimerState] = useState(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const layout = queryParams.get('layout') || 'dsm';

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        setIsAuthed(true);
      } catch (error) {
        console.error('Anonymous auth failed:', error);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!sessionId || !isAuthed) return;
    const unsubscribe = timerService.subscribeToTimer(sessionId, (data) => {
      setTimerState(data);
    });
    return () => unsubscribe();
  }, [sessionId, isAuthed]);

  useEffect(() => {
    let flashInterval;
    if (!timerState) return;

    const minutesLeft = Math.ceil(timerState.timeRemaining / 60000);
    const shouldFlash = 
      (timerState.phase === 'preparation' && minutesLeft <= 2 && timerState.timeRemaining > 0) ||
      (timerState.phase === 'presentation' && timerState.timeRemaining === 0) ||
      (timerState.phase === 'q&a' && minutesLeft <= 1) ||
      (timerState.phase === 'overtime');

    if (shouldFlash) {
      flashInterval = setInterval(() => {
        setIsFlashing(prev => !prev);
      }, 500);
    } else {
      setIsFlashing(false);
    }

    return () => clearInterval(flashInterval);
  }, [timerState]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(Math.abs(totalSeconds) / 60);
    const seconds = Math.floor(Math.abs(totalSeconds) % 60);
    const sign = totalSeconds < 0 ? '-' : '';
    return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatOvertime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `-${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPhaseStyles = (phase, timeRemaining) => {
    const minutesLeft = Math.ceil(timeRemaining / 60000);
    switch (phase) {
      case 'preparation':
        if (timeRemaining === 0) return 'bg-rose-700 text-white';
        if (minutesLeft <= 2) return isFlashing ? 'bg-amber-400 text-black' : 'bg-slate-800 text-white';
        return 'bg-slate-800 text-white';
      case 'presentation':
        if (timeRemaining === 0) return isFlashing ? 'bg-rose-600 text-white' : 'bg-black text-white';
        if (minutesLeft <= 2 || minutesLeft <= 5) return 'bg-amber-400 text-black';
        return 'bg-slate-900 text-white';
      case 'q&a':
        if (timeRemaining === 0) return 'animate-pulse bg-rose-700 text-white';
        if (minutesLeft <= 1) return isFlashing ? 'bg-rose-500 text-white' : 'bg-rose-600 text-white';
        return 'bg-rose-600 text-white';
      case 'overtime':
        const pulseClass = Math.floor((timerState?.overtimeSeconds || 0) / 120) % 2 === 0 ? 'bg-rose-800' : 'bg-black';
        return `${pulseClass} text-white animate-pulse shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]`;
      default:
        return 'bg-black text-white';
    }
  };

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
      <div className={`fixed bottom-0 left-0 right-0 h-24 flex items-center justify-between px-16 transition-all duration-700 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] z-50 font-sans border-t border-white/5 ${getPhaseStyles(timerState.phase, timerState.timeRemaining)}`}>
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
    <div className={`min-h-screen flex items-center justify-center transition-all duration-700 font-sans ${getPhaseStyles(timerState.phase, timerState.timeRemaining)}`}>
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

import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, SkipForward, Database, Plus, Minus, AlertCircle, Share2, Check } from 'lucide-react';
import { useTimer } from '../context/TimerContext';
import { useAuth } from '../context/AuthContext';
import PairingModal from './ui/PairingModal';

const TimerInterface = () => {
  const { 
    timerState, 
    currentRoom, 
    settings, 
    startTimer, 
    stopTimer, 
    updateTimer, 
    setCurrentRoom,
    skipPhase,
    addTime
  } = useTimer();
  const { userRole, organization } = useAuth();
  const [isFlashing, setIsFlashing] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);

  const isAdmin = userRole === 'owner' || userRole === 'admin';

  const handleShare = () => {
    setShowPairingModal(true);
  };

  useEffect(() => {
    let flashInterval;
    const minutesLeft = Math.ceil(timerState.timeRemaining / 60000);

    const shouldFlash = 
      (timerState.phase === 'preparation' && minutesLeft <= 2 && timerState.timeRemaining > 0) ||
      (timerState.phase === 'presentation' && timerState.timeRemaining === 0) ||
      (timerState.phase === 'q&a' && minutesLeft <= 1) ||
      (timerState.phase === 'overtime');

    if (shouldFlash && timerState.isRunning) {
      flashInterval = setInterval(() => {
        setIsFlashing(prev => !prev);
      }, 500);
    } else {
      setIsFlashing(false);
    }

    return () => clearInterval(flashInterval);
  }, [timerState.phase, timerState.timeRemaining, timerState.isRunning]);

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
        if (timeRemaining === 0) return isFlashing ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-900';
        if (minutesLeft <= 2 || minutesLeft <= 5) return 'bg-amber-400 text-black';
        return 'bg-slate-900 text-white shadow-2xl shadow-slate-400';
      
      case 'q&a':
        if (timeRemaining === 0) return 'animate-pulse bg-rose-700 text-white';
        if (minutesLeft <= 1) return isFlashing ? 'bg-rose-500 text-white' : 'bg-rose-600 text-white';
        return 'bg-rose-600 text-white';
      
      case 'overtime':
        const pulseClass = Math.floor(timerState.overtimeSeconds / 120) % 2 === 0 ? 'bg-rose-800' : 'bg-black';
        return `${pulseClass} text-white animate-pulse shadow-2xl shadow-rose-900/50`;
      
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const toggleTimer = () => {
    updateTimer({ isRunning: !timerState.isRunning });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 h-full flex flex-col font-sans">
      <div className="space-y-10 flex-grow">
        {/* Session Header */}
        <div className="bg-white rounded-[40px] shadow-sm p-10 border border-slate-100 flex justify-between items-center">
          <div>
            <div className="flex items-center space-x-3 mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                    {organization ? 'Enterprise Terminal' : 'Personal Controller'}
                </span>
                {timerState.sessionId && (
                    <div className="flex items-center text-rose-600 font-black text-[10px] uppercase tracking-widest">
                        <Database className="w-3.5 h-3.5 mr-1.5" />
                        Live Sync: {timerState.sessionId.slice(-6).toUpperCase()}
                    </div>
                )}
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{currentRoom.name}</h2>
          </div>
          <button
            onClick={() => stopTimer()}
            className="bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 px-8 py-4 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all border border-slate-100 hover:border-rose-100"
          >
            Terminate Session
          </button>
        </div>

        {/* Main Timer Stage */}
        <div className={`rounded-[64px] shadow-2xl p-20 text-center transition-all duration-700 transform border-8 border-white/10 ${getPhaseStyles(timerState.phase, timerState.timeRemaining)}`}>
          <div className="mb-10">
            <div className="inline-flex items-center px-8 py-2.5 rounded-full bg-black/10 backdrop-blur-md text-[10px] font-black uppercase tracking-[0.3em] mb-12 border border-white/5">
              {timerState.phase} Phase {timerState.phase === 'overtime' && 'Critical'}
            </div>
            
            <div className="text-[14rem] font-black leading-none tracking-tighter tabular-nums mb-6 drop-shadow-2xl">
              {timerState.phase === 'overtime' 
                ? formatOvertime(timerState.overtimeSeconds)
                : formatTime(timerState.timeRemaining)
              }
            </div>

            {timerState.phase !== 'overtime' && timerState.timeRemaining > 0 && (
              <div className="w-full max-w-3xl mx-auto bg-black/10 rounded-full h-5 overflow-hidden mt-12 border border-white/5 shadow-inner">
                <div
                  className="h-full bg-white transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                  style={{ width: `${((timerState.totalTime - timerState.timeRemaining) / timerState.totalTime) * 100}%` }}
                ></div>
              </div>
            )}
          </div>

          {/* Admin Mid-Flight Controls */}
          {isAdmin && timerState.phase !== 'overtime' && (
            <div className="flex justify-center items-center space-x-8 mt-16 bg-black/5 p-6 rounded-[32px] backdrop-blur-sm inline-flex border border-white/5">
              <button onClick={() => addTime(-1)} className="p-4 hover:bg-black/10 rounded-2xl transition-all active:scale-90">
                <Minus className="w-10 h-10" />
              </button>
              <div className="text-sm font-black uppercase tracking-[0.2em] px-6 border-x border-white/10">Adjust Phase Clock</div>
              <button onClick={() => addTime(1)} className="p-4 hover:bg-black/10 rounded-2xl transition-all active:scale-90">
                <Plus className="w-10 h-10" />
              </button>
            </div>
          )}
        </div>

        {/* Playback Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <button
             onClick={toggleTimer}
             className={`p-10 rounded-[40px] font-black text-2xl flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-2xl border-4 border-white ${
               timerState.isRunning 
                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200' 
                : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200'
             }`}
           >
             {timerState.isRunning ? <Pause className="w-12 h-12 mb-3 fill-current" /> : <Play className="w-12 h-12 mb-3 fill-current" />}
             <span className="uppercase tracking-widest">{timerState.isRunning ? 'Pause Engine' : 'Resume Engine'}</span>
           </button>

           <button
             onClick={skipPhase}
             className="bg-white p-10 rounded-[40px] border border-slate-100 font-black text-2xl flex flex-col items-center justify-center hover:bg-slate-50 transition-all transform active:scale-95 group shadow-xl shadow-slate-200/50"
             disabled={timerState.phase === 'overtime'}
           >
             <SkipForward className="w-12 h-12 mb-3 text-slate-900 group-hover:translate-x-2 transition-transform" />
             <span className="uppercase tracking-widest">Skip Phase</span>
           </button>

           <div className="bg-slate-900 p-10 rounded-[40px] border border-slate-800 flex flex-col justify-center items-center shadow-2xl shadow-black/20">
              <div className="flex items-center space-x-3 mb-6">
                 <AlertCircle className="w-6 h-6 text-rose-500" />
                 <span className="text-xs font-black text-white uppercase tracking-widest">Display Terminal</span>
              </div>
              <button 
                onClick={handleShare}
                className="w-full flex items-center justify-center space-x-3 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest transition-all bg-white text-slate-900 hover:bg-rose-50 hover:text-rose-600 border border-white"
              >
                <Share2 className="w-5 h-5" /> 
                <span>Pair Monitors</span>
              </button>
           </div>
        </div>
      </div>

      {showPairingModal && (
        <PairingModal 
          sessionId={timerState.sessionId} 
          onClose={() => setShowPairingModal(false)} 
        />
      )}
    </div>
  );
};

export default TimerInterface;

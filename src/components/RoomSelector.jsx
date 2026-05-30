import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Wifi, Play, SkipForward, Shield, Vibrate, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTimer } from '../context/TimerContext';
import { roomService } from '../services/roomService';

const RoomSelector = () => {
  const { user, organization, isDemo } = useAuth();
  const { startTimer, timerState } = useTimer();
  const [rooms, setRooms] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const fetchedRooms = await roomService.getRooms(organization, user, isDemo);
        setRooms(fetchedRooms);
        
        if (fetchedRooms.length > 0) {
          const bookings = await roomService.getUpcomingBookings(fetchedRooms.map(r => r.id), isDemo);
          setUpcomingBookings(bookings);
        }
      } catch (error) {
        console.error('Error loading rooms data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [organization, user, isDemo]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-rose-600 rounded-full animate-spin"></div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Loading Registry</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-sans">
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
              {rooms.length === 0 && !organization ? 'Personal Terminal' : 'Venue Registry'}
            </h2>
            <p className="text-slate-500 font-bold text-lg mt-1">
              {rooms.length === 0 && !organization 
                ? 'Launch your private high-precision stage clock.' 
                : 'Select an active venue to begin transmission.'}
            </p>
          </div>
          
          {rooms.length > 0 && (
            <div className="bg-slate-900 px-6 py-3 rounded-2xl shadow-xl shadow-slate-200 flex items-center space-x-4 border border-slate-800">
              <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{rooms.filter(r => r.available).length} Open Venues</span>
            </div>
          )}
        </div>

        {rooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map(room => {
              const roomBookings = upcomingBookings.filter(b => b.roomId === room.id);
              return (
                <div
                  key={room.id}
                  onClick={() => room.available && startTimer(room)}
                  className={`group p-1 rounded-[40px] transition-all duration-500 ${
                    room.available
                      ? 'bg-gradient-to-br from-slate-100 to-white hover:from-rose-500 hover:to-rose-600 shadow-xl shadow-slate-200/50 hover:shadow-rose-200 hover:-translate-y-2 cursor-pointer'
                      : 'bg-slate-100 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="bg-white p-8 rounded-[38px] h-full transition-colors duration-500 group-hover:bg-transparent">
                    <div className="flex justify-between items-start mb-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${
                        room.available ? 'bg-slate-50 text-slate-900 group-hover:bg-white/20 group-hover:text-white' : 'bg-slate-200 text-slate-400'
                      }`}>
                        <Calendar className="w-7 h-7" />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border transition-all ${
                        room.available 
                            ? 'bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-white group-hover:text-rose-600 group-hover:border-white shadow-sm' 
                            : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        {room.available ? 'Ready' : 'In Use'}
                      </span>
                    </div>

                    <h3 className="text-2xl font-black text-slate-900 mb-2 transition-colors group-hover:text-white uppercase tracking-tight">{room.name}</h3>
                    <div className="flex items-center text-slate-400 font-bold text-xs uppercase tracking-widest group-hover:text-rose-100">
                        <Users className="w-3.5 h-3.5 mr-2" />
                        {room.capacity} SEAT CAPACITY
                    </div>
                    
                    {roomBookings.length > 0 && (
                      <div className="mt-8 pt-8 border-t border-slate-50 group-hover:border-white/10 space-y-4">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] group-hover:text-rose-200">Scheduled Transmission</p>
                        {roomBookings.slice(0, 1).map(booking => (
                          <div key={booking.id} className="bg-slate-50 group-hover:bg-white/10 rounded-2xl p-4 flex items-center justify-between border border-slate-100 group-hover:border-white/10">
                            <span className="text-xs font-black text-slate-700 group-hover:text-white">{booking.userName}</span>
                            <span className="text-xs font-black text-rose-600 group-hover:text-white bg-white group-hover:bg-rose-500 px-3 py-1 rounded-lg shadow-sm">
                              {new Date(booking.startTime.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900 rounded-[64px] shadow-2xl p-20 text-center border border-slate-800 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-24 h-24 bg-rose-600 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-rose-900/50 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                <Play className="w-12 h-12 text-white fill-current" />
              </div>
              <h3 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase italic">Private Stage Engine</h3>
              <p className="text-slate-400 max-w-md mx-auto mb-12 font-bold text-lg leading-relaxed">
                Access Presently's industrial-grade stage timer for individual high-stakes sessions.
              </p>
              <button
                onClick={() => startTimer({
                  id: 'personal-room-' + user.uid,
                  name: 'Personal Workspace',
                  capacity: 1,
                  isVirtual: true,
                  available: true
                })}
                className="bg-white hover:bg-rose-50 text-slate-900 hover:text-rose-600 px-12 py-6 rounded-[24px] font-black text-xl transition-all shadow-2xl flex items-center mx-auto group/btn uppercase tracking-widest"
              >
                Launch Controller
                <ArrowRight className="w-6 h-6 ml-4 group-hover/btn:translate-x-2 transition-transform" />
              </button>
            </div>
            {/* Background Texture */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-100/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomSelector;

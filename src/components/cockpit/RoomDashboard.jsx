import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  Activity,
  Calendar,
  ChevronRight,
  Play,
  Pause,
  SkipForward
} from 'lucide-react';
import { roomService } from '../../services/roomService';
import { eventScheduler } from '../../services/eventScheduler';
import { useAuth } from '../../context/AuthContext';
import EventTimeline from './EventTimeline';

/**
 * RoomDashboard - Epic 4 Tabular Live Cockpit
 * Provides event admins with centralized room overview and schedule management
 */
const RoomDashboard = () => {
  const { organization, isDemo } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [eventsMap, setEventsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [error, setError] = useState(null);

  // Load rooms and events
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const roomsData = await roomService.getRooms(organization, null, isDemo);
        setRooms(roomsData);

        const roomIds = roomsData.map(r => r.id);
        const events = await eventScheduler.getAllEvents(roomIds, isDemo);
        setEventsMap(events);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up real-time listeners for each room (in production)
    if (!isDemo && rooms.length > 0) {
      const unsubscribers = rooms.map(room =>
        eventScheduler.subscribeToRoomEvents(room.id, (events) => {
          setEventsMap(prev => ({
            ...prev,
            [room.id]: events
          }));
        })
      );

      return () => unsubscribers.forEach(unsub => unsub());
    }
  }, [organization, isDemo]);

  // Get current event for a room
  const getCurrentEvent = (roomId) => {
    const events = eventsMap[roomId] || [];
    return events.find(e => e.status === 'active');
  };

  // Get next event for a room
  const getNextEvent = (roomId) => {
    const events = eventsMap[roomId] || [];
    const now = new Date();
    return events.find(e => e.status === 'scheduled' && e.scheduledStartTime > now);
  };

  // Get phase color
  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'preparation':
        return 'bg-blue-500';
      case 'presentation':
        return 'bg-green-500';
      case 'q&a':
        return 'bg-purple-500';
      case 'overtime':
        return 'bg-red-600';
      default:
        return 'bg-gray-400';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'scheduled':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'delayed':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'completed-overtime':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <Activity className="w-12 h-12 text-rose-600 animate-pulse" />
          <p className="text-slate-600 font-semibold">Loading cockpit dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-600" />
          <p className="text-red-600 font-semibold">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Live Cockpit
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Real-time room monitoring and schedule management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-2 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-700 font-bold text-xs uppercase tracking-wider">
              Live Sync
            </span>
          </div>
          <div className="bg-slate-100 rounded-2xl px-4 py-2">
            <span className="text-slate-700 font-bold text-xs">
              {rooms.length} {rooms.length === 1 ? 'Room' : 'Rooms'}
            </span>
          </div>
        </div>
      </div>

      {/* Room Grid */}
      {!selectedRoom ? (
        <div className="grid grid-cols-1 gap-4">
          {rooms.map(room => {
            const currentEvent = getCurrentEvent(room.id);
            const nextEvent = getNextEvent(room.id);
            const roomEvents = eventsMap[room.id] || [];
            const activeCount = roomEvents.filter(e => e.status === 'active').length;
            const delayedCount = roomEvents.filter(e => e.status === 'delayed').length;

            return (
              <div
                key={room.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedRoom(room)}
              >
                <div className="flex items-start justify-between">
                  {/* Room Info */}
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 rounded-2xl ${currentEvent ? 'bg-green-100' : 'bg-slate-100'}`}>
                      <Monitor className={`w-6 h-6 ${currentEvent ? 'text-green-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-slate-900">{room.name}</h3>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1 text-slate-500 text-sm">
                          <Users className="w-4 h-4" />
                          <span>Capacity: {room.capacity}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-slate-500 text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{roomEvents.length} events today</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center space-x-2">
                    {delayedCount > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                        <span className="text-amber-700 font-bold text-xs uppercase tracking-wider">
                          {delayedCount} Delayed
                        </span>
                      </div>
                    )}
                    {currentEvent ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
                        <span className="text-green-700 font-bold text-xs uppercase tracking-wider">
                          Active
                        </span>
                      </div>
                    ) : (
                      <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5">
                        <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">
                          Available
                        </span>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>

                {/* Current Event */}
                {currentEvent && (
                  <div className="mt-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-green-600" />
                        <span className="text-green-900 font-bold text-xs uppercase tracking-wider">
                          Now Playing
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getPhaseColor('presentation')}`} />
                        <span className="text-green-700 font-semibold text-xs capitalize">
                          {currentEvent.phase || 'Presentation'}
                        </span>
                      </div>
                    </div>
                    <h4 className="text-lg font-black text-slate-900 mb-1">
                      {currentEvent.title}
                    </h4>
                    <p className="text-slate-600 text-sm font-medium">
                      Speaker: {currentEvent.speaker}
                    </p>
                    <div className="flex items-center space-x-4 mt-3 text-xs">
                      <div className="flex items-center space-x-1 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Started {formatTime(currentEvent.actualStartTime || currentEvent.scheduledStartTime)}
                        </span>
                      </div>
                      {currentEvent.overtimeMinutes > 0 && (
                        <div className="flex items-center space-x-1 text-red-600 font-bold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>+{currentEvent.overtimeMinutes} min overtime</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Next Event */}
                {!currentEvent && nextEvent && (
                  <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">
                        Next Up
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-1">
                      {nextEvent.title}
                    </h4>
                    <p className="text-slate-600 text-sm">
                      {formatTime(nextEvent.scheduledStartTime)} • {nextEvent.speaker}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Detail View with Timeline
        <EventTimeline
          room={selectedRoom}
          events={eventsMap[selectedRoom.id] || []}
          onBack={() => setSelectedRoom(null)}
          isDemo={isDemo}
        />
      )}
    </div>
  );
};

// Helper function to format time
const formatTime = (date) => {
  if (!date) return '--:--';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default RoomDashboard;

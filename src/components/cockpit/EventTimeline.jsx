import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  GripVertical,
  Play,
  Square,
  SkipForward,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { eventScheduler } from '../../services/eventScheduler';

/**
 * EventTimeline - Drag-and-drop event scheduling interface
 * Epic 4 R4.2: Interactive event reordering with drag gestures
 */
const EventTimeline = ({ room, events: initialEvents, onBack, isDemo }) => {
  const [events, setEvents] = useState(initialEvents);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // Handle drag start
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(index);
  };

  // Handle drop
  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();

    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    // Reorder the events array
    const newEvents = [...events];
    const [draggedEvent] = newEvents.splice(draggedItem, 1);
    newEvents.splice(dropIndex, 0, draggedEvent);

    setEvents(newEvents);
    setDraggedItem(null);
    setDragOverItem(null);

    // Save to backend
    try {
      setIsSaving(true);
      await eventScheduler.reorderEvents(room.id, newEvents, isDemo);
      showNotification('Schedule updated successfully', 'success');
    } catch (error) {
      console.error('Error reordering events:', error);
      showNotification('Failed to update schedule', 'error');
      // Revert on error
      setEvents(initialEvents);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Start an event
  const handleStartEvent = async (eventId) => {
    try {
      await eventScheduler.startEvent(eventId, isDemo);
      showNotification('Event started', 'success');

      // Update local state
      setEvents(prev => prev.map(e =>
        e.id === eventId ? { ...e, status: 'active', actualStartTime: new Date() } : e
      ));
    } catch (error) {
      console.error('Error starting event:', error);
      showNotification('Failed to start event', 'error');
    }
  };

  // Complete an event
  const handleCompleteEvent = async (eventId, overtimeMinutes = 0) => {
    try {
      const result = await eventScheduler.completeEvent(eventId, overtimeMinutes, isDemo);

      if (result.cascade && result.cascade.affectedCount > 0) {
        showNotification(
          `Event completed. ${result.cascade.affectedCount} subsequent events delayed by ${overtimeMinutes} minutes.`,
          'warning'
        );
      } else {
        showNotification('Event completed on time', 'success');
      }

      // Refresh events to show cascade effect
      const updatedEvents = await eventScheduler.getEventsByRoom(room.id, isDemo);
      setEvents(updatedEvents);
    } catch (error) {
      console.error('Error completing event:', error);
      showNotification('Failed to complete event', 'error');
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'border-green-500 bg-green-50';
      case 'scheduled':
        return 'border-blue-400 bg-white';
      case 'delayed':
        return 'border-amber-500 bg-amber-50';
      case 'completed-ontime':
        return 'border-slate-300 bg-slate-50';
      case 'completed-overtime':
        return 'border-red-400 bg-red-50';
      default:
        return 'border-slate-300 bg-white';
    }
  };

  // Calculate duration
  const calculateDuration = (start, end) => {
    const diff = end - start;
    return Math.round(diff / (1000 * 60)); // minutes
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900">{room.name}</h2>
            <p className="text-slate-500 text-sm font-medium">
              Drag events to reorder • Changes sync automatically
            </p>
          </div>
        </div>
        {isSaving && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
            <span className="text-blue-700 font-semibold text-sm">Saving...</span>
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-2xl border-2 flex items-center space-x-3 animate-in slide-in-from-top ${
            notification.type === 'success'
              ? 'bg-green-50 border-green-500'
              : notification.type === 'warning'
              ? 'bg-amber-50 border-amber-500'
              : 'bg-red-50 border-red-500'
          }`}
        >
          {notification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
          {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
          {notification.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
          <span
            className={`font-bold text-sm ${
              notification.type === 'success'
                ? 'text-green-900'
                : notification.type === 'warning'
                ? 'text-amber-900'
                : 'text-red-900'
            }`}
          >
            {notification.message}
          </span>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl p-12 text-center">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-400 mb-2">No Events Scheduled</h3>
            <p className="text-slate-500 text-sm">Add events to this room to start scheduling.</p>
          </div>
        ) : (
          events.map((event, index) => {
            const duration = calculateDuration(event.scheduledStartTime, event.scheduledEndTime);
            const isActive = event.status === 'active';
            const isDelayed = event.status === 'delayed';
            const isDragging = draggedItem === index;
            const isDragOver = dragOverItem === index;

            return (
              <div
                key={event.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  border-2 rounded-3xl p-6 transition-all cursor-move
                  ${getStatusColor(event.status)}
                  ${isDragging ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}
                  ${isDragOver ? 'border-rose-500 shadow-xl' : ''}
                  ${isActive ? 'ring-4 ring-green-200' : ''}
                  hover:shadow-lg
                `}
              >
                <div className="flex items-start justify-between">
                  {/* Drag Handle & Info */}
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="pt-1">
                      <GripVertical className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1">
                      {/* Title & Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-black text-slate-900 mb-1">
                            {event.title}
                          </h3>
                          <p className="text-slate-600 text-sm font-medium">
                            Speaker: {event.speaker}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {isActive && (
                            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1">
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                              <span>Live</span>
                            </div>
                          )}
                          {isDelayed && (
                            <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>+{event.delayMinutes} min</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Time Info */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-white/50 rounded-xl p-3 border border-slate-200">
                          <div className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">
                            Scheduled Start
                          </div>
                          <div className="text-slate-900 font-black text-sm">
                            {formatTime(event.scheduledStartTime)}
                          </div>
                        </div>
                        <div className="bg-white/50 rounded-xl p-3 border border-slate-200">
                          <div className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">
                            Duration
                          </div>
                          <div className="text-slate-900 font-black text-sm">
                            {duration} min
                          </div>
                        </div>
                        <div className="bg-white/50 rounded-xl p-3 border border-slate-200">
                          <div className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">
                            Scheduled End
                          </div>
                          <div className="text-slate-900 font-black text-sm">
                            {formatTime(event.scheduledEndTime)}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {event.status === 'scheduled' && (
                          <button
                            onClick={() => handleStartEvent(event.id)}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center space-x-2"
                          >
                            <Play className="w-3.5 h-3.5" />
                            <span>Start Event</span>
                          </button>
                        )}
                        {event.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleCompleteEvent(event.id, 0)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center space-x-2"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete On Time</span>
                            </button>
                            <button
                              onClick={() => handleCompleteEvent(event.id, 5)}
                              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center space-x-2"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>+5 Min Overtime</span>
                            </button>
                            <button
                              onClick={() => handleCompleteEvent(event.id, 10)}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors flex items-center space-x-2"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>+10 Min Overtime</span>
                            </button>
                          </>
                        )}
                      </div>

                      {/* Delay Warning */}
                      {isDelayed && (
                        <div className="mt-3 bg-amber-100 border border-amber-300 rounded-xl p-3 flex items-start space-x-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-amber-900 font-bold text-xs mb-1">
                              Cascading Delay Applied
                            </p>
                            <p className="text-amber-700 text-xs">
                              This event has been pushed back by {event.delayMinutes} minutes due to a previous event running overtime.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
        <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider mb-4">
          Event Status Legend
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded border-2 border-green-600" />
            <span className="text-xs text-slate-600 font-semibold">Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-400 rounded border-2 border-blue-500" />
            <span className="text-xs text-slate-600 font-semibold">Scheduled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-amber-500 rounded border-2 border-amber-600" />
            <span className="text-xs text-slate-600 font-semibold">Delayed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-slate-300 rounded border-2 border-slate-400" />
            <span className="text-xs text-slate-600 font-semibold">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-400 rounded border-2 border-red-500" />
            <span className="text-xs text-slate-600 font-semibold">Overtime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format time
const formatTime = (date) => {
  if (!date) return '--:--';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default EventTimeline;

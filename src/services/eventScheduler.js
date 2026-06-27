import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * EventScheduler Service
 * Manages event scheduling, cascading delays, and real-time sync for Epic 4
 */

export const eventScheduler = {
  /**
   * Get all scheduled events for a specific room
   * @param {string} roomId - The room ID
   * @param {boolean} isDemo - Demo mode flag
   * @returns {Promise<Array>} Array of events sorted by scheduled start time
   */
  getEventsByRoom: async (roomId, isDemo = false) => {
    if (isDemo) {
      return generateDemoEvents(roomId);
    }

    try {
      const q = query(
        collection(db, 'events'),
        where('roomId', '==', roomId),
        where('status', 'in', ['scheduled', 'active', 'delayed']),
        orderBy('scheduledStartTime', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledStartTime: doc.data().scheduledStartTime?.toDate(),
        scheduledEndTime: doc.data().scheduledEndTime?.toDate(),
        actualStartTime: doc.data().actualStartTime?.toDate(),
        actualEndTime: doc.data().actualEndTime?.toDate()
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  /**
   * Get all events across all rooms for the cockpit dashboard
   * @param {Array<string>} roomIds - Array of room IDs
   * @param {boolean} isDemo - Demo mode flag
   * @returns {Promise<Object>} Map of roomId to events array
   */
  getAllEvents: async (roomIds, isDemo = false) => {
    if (isDemo) {
      const eventsMap = {};
      roomIds.forEach(roomId => {
        eventsMap[roomId] = generateDemoEvents(roomId);
      });
      return eventsMap;
    }

    try {
      const eventsMap = {};

      // Fetch events for each room (Firestore 'in' query is limited to 10)
      for (const roomId of roomIds) {
        const events = await eventScheduler.getEventsByRoom(roomId, isDemo);
        eventsMap[roomId] = events;
      }

      return eventsMap;
    } catch (error) {
      console.error('Error fetching all events:', error);
      throw error;
    }
  },

  /**
   * Subscribe to real-time event updates for a room
   * @param {string} roomId - The room ID
   * @param {Function} callback - Callback function receiving events array
   * @returns {Function} Unsubscribe function
   */
  subscribeToRoomEvents: (roomId, callback) => {
    const q = query(
      collection(db, 'events'),
      where('roomId', '==', roomId),
      where('status', 'in', ['scheduled', 'active', 'delayed']),
      orderBy('scheduledStartTime', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledStartTime: doc.data().scheduledStartTime?.toDate(),
        scheduledEndTime: doc.data().scheduledEndTime?.toDate(),
        actualStartTime: doc.data().actualStartTime?.toDate(),
        actualEndTime: doc.data().actualEndTime?.toDate()
      }));
      callback(events);
    });
  },

  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @param {boolean} isDemo - Demo mode flag
   * @returns {Promise<Object>} Created event
   */
  createEvent: async (eventData, isDemo = false) => {
    if (isDemo) {
      return { id: 'demo-event-' + Date.now(), ...eventData };
    }

    try {
      const docRef = await addDoc(collection(db, 'events'), {
        ...eventData,
        status: 'scheduled',
        delayMinutes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { id: docRef.id, ...eventData };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  /**
   * Update event order (drag-and-drop reordering)
   * @param {string} roomId - The room ID
   * @param {Array} reorderedEvents - Array of events in new order
   * @param {boolean} isDemo - Demo mode flag
   * @returns {Promise<void>}
   */
  reorderEvents: async (roomId, reorderedEvents, isDemo = false) => {
    if (isDemo) return;

    try {
      const batch = writeBatch(db);

      // Calculate new start/end times based on order
      let currentTime = reorderedEvents[0].scheduledStartTime;

      reorderedEvents.forEach((event, index) => {
        const eventRef = doc(db, 'events', event.id);
        const duration = event.scheduledEndTime - event.scheduledStartTime;
        const newStartTime = new Date(currentTime);
        const newEndTime = new Date(currentTime.getTime() + duration);

        batch.update(eventRef, {
          scheduledStartTime: Timestamp.fromDate(newStartTime),
          scheduledEndTime: Timestamp.fromDate(newEndTime),
          orderIndex: index,
          updatedAt: serverTimestamp()
        });

        currentTime = newEndTime;
      });

      await batch.commit();
    } catch (error) {
      console.error('Error reordering events:', error);
      throw error;
    }
  },

  /**
   * Calculate cascading delays when an event runs overtime
   * @param {string} roomId - The room ID
   * @param {string} eventId - The event that ran overtime
   * @param {number} delayMinutes - Delay in minutes
   * @param {boolean} isDemo - Demo mode flag
   * @returns {Promise<Object>} Result with affected events count
   */
  applyCascadingDelay: async (roomId, eventId, delayMinutes, isDemo = false) => {
    if (isDemo) {
      return { success: true, affectedCount: 2 };
    }

    try {
      // Get all events for this room
      const events = await eventScheduler.getEventsByRoom(roomId, isDemo);

      // Find the index of the delayed event
      const delayedEventIndex = events.findIndex(e => e.id === eventId);
      if (delayedEventIndex === -1) {
        throw new Error('Event not found');
      }

      // Get all subsequent events
      const subsequentEvents = events.slice(delayedEventIndex + 1);

      if (subsequentEvents.length === 0) {
        return { success: true, affectedCount: 0 };
      }

      // Apply cascade using batch write
      const batch = writeBatch(db);
      const delayMs = delayMinutes * 60 * 1000;

      subsequentEvents.forEach(event => {
        const eventRef = doc(db, 'events', event.id);
        const newStartTime = new Date(event.scheduledStartTime.getTime() + delayMs);
        const newEndTime = new Date(event.scheduledEndTime.getTime() + delayMs);

        batch.update(eventRef, {
          scheduledStartTime: Timestamp.fromDate(newStartTime),
          scheduledEndTime: Timestamp.fromDate(newEndTime),
          delayMinutes: (event.delayMinutes || 0) + delayMinutes,
          status: 'delayed',
          updatedAt: serverTimestamp()
        });
      });

      // Update the original event status
      const originalEventRef = doc(db, 'events', eventId);
      batch.update(originalEventRef, {
        status: 'completed-overtime',
        actualEndTime: serverTimestamp(),
        overtimeMinutes: delayMinutes,
        updatedAt: serverTimestamp()
      });

      await batch.commit();

      return {
        success: true,
        affectedCount: subsequentEvents.length,
        delayMinutes
      };
    } catch (error) {
      console.error('Error applying cascading delay:', error);
      throw error;
    }
  },

  /**
   * Start an event (mark as active)
   * @param {string} eventId - The event ID
   * @param {boolean} isDemo - Demo mode flag
   * @returns {Promise<void>}
   */
  startEvent: async (eventId, isDemo = false) => {
    if (isDemo) return;

    try {
      await updateDoc(doc(db, 'events', eventId), {
        status: 'active',
        actualStartTime: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error starting event:', error);
      throw error;
    }
  },

  /**
   * Complete an event
   * @param {string} eventId - The event ID
   * @param {number} overtimeMinutes - Minutes of overtime (0 if on-time)
   * @param {boolean} isDemo - Demo mode flag
   * @returns {Promise<Object>} Result with cascade info if overtime occurred
   */
  completeEvent: async (eventId, overtimeMinutes = 0, isDemo = false) => {
    if (isDemo) {
      return { success: true, overtimeMinutes };
    }

    try {
      const eventDoc = await getDocs(
        query(collection(db, 'events'), where('__name__', '==', eventId))
      );

      if (eventDoc.empty) {
        throw new Error('Event not found');
      }

      const event = { id: eventDoc.docs[0].id, ...eventDoc.docs[0].data() };

      // Update the event as completed
      await updateDoc(doc(db, 'events', eventId), {
        status: overtimeMinutes > 0 ? 'completed-overtime' : 'completed-ontime',
        actualEndTime: serverTimestamp(),
        overtimeMinutes,
        updatedAt: serverTimestamp()
      });

      // If there's overtime, apply cascading delay
      if (overtimeMinutes > 0) {
        const cascadeResult = await eventScheduler.applyCascadingDelay(
          event.roomId,
          eventId,
          overtimeMinutes,
          isDemo
        );
        return { success: true, overtimeMinutes, cascade: cascadeResult };
      }

      return { success: true, overtimeMinutes: 0 };
    } catch (error) {
      console.error('Error completing event:', error);
      throw error;
    }
  },

  /**
   * Update an existing event
   * @param {string} eventId - The event ID
   * @param {Object} updates - Fields to update
   * @param {boolean} isDemo - Demo mode flag
   * @returns {Promise<void>}
   */
  updateEvent: async (eventId, updates, isDemo = false) => {
    if (isDemo) return;

    try {
      await updateDoc(doc(db, 'events', eventId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  /**
   * Delete an event
   * @param {string} eventId - The event ID
   * @param {boolean} isDemo - Demo mode flag
   * @returns {Promise<void>}
   */
  deleteEvent: async (eventId, isDemo = false) => {
    if (isDemo) return;

    try {
      await deleteDoc(doc(db, 'events', eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }
};

/**
 * Generate demo events for testing
 * @param {string} roomId - The room ID
 * @returns {Array} Array of demo events
 */
function generateDemoEvents(roomId) {
  const now = new Date();
  const events = [];

  // Create 5 demo events for the room
  for (let i = 0; i < 5; i++) {
    const startTime = new Date(now.getTime() + (i * 45 * 60 * 1000)); // 45 min apart
    const endTime = new Date(startTime.getTime() + (30 * 60 * 1000)); // 30 min duration

    events.push({
      id: `demo-event-${roomId}-${i}`,
      roomId,
      title: `Session ${i + 1}: ${['Keynote', 'Workshop', 'Panel Discussion', 'Q&A Session', 'Networking'][i]}`,
      speaker: ['Dr. Jane Smith', 'Prof. John Doe', 'Alice Johnson', 'Bob Williams', 'Carol Davis'][i],
      scheduledStartTime: startTime,
      scheduledEndTime: endTime,
      actualStartTime: i === 0 ? now : null,
      actualEndTime: null,
      status: i === 0 ? 'active' : 'scheduled',
      delayMinutes: 0,
      overtimeMinutes: 0,
      phaseConfig: {
        preparationTime: 5,
        presentationTime: 20,
        qaTime: 5
      }
    });
  }

  return events;
}

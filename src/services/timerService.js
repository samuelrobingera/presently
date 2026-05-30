import { 
  ref, 
  onValue, 
  off, 
  update, 
  remove, 
  serverTimestamp as rtdbTimestamp 
} from 'firebase/database';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp as firestoreTimestamp 
} from 'firebase/firestore';
import { db, rtdb } from '../config/firebase';

export const timerService = {
  createSession: async (sessionId, sessionData, isDemo = false) => {
    // 1. Initialize session in RTDB for real-time sync (Always do this for pairing to work)
    try {
      await update(ref(rtdb, `timers/${sessionId}`), {
        ...sessionData,
        updatedAt: rtdbTimestamp()
      });
    } catch (rtdbError) {
      console.error('RTDB session creation failed:', rtdbError);
    }

    if (isDemo) return;

    try {
      // 2. Create session in Firestore for long-term persistence
      await setDoc(doc(db, 'sessions', sessionId), {
        ...sessionData,
        createdAt: firestoreTimestamp(),
        status: 'active'
      });
    } catch (error) {
      console.error('Error creating Firestore session:', error);
      throw error;
    }
  },

  subscribeToTimer: (sessionId, callback, isDemo = false) => {
    if (isDemo || !sessionId) return () => {};

    const timerRef = ref(rtdb, `timers/${sessionId}`);
    const listener = onValue(timerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        callback(data);
      }
    });

    return () => off(timerRef, 'value', listener);
  },

  updateTimer: async (sessionId, updates, isDemo = false) => {
    if (!sessionId) return;

    try {
      // RTDB sync must always happen for pairing/syncing to work
      await update(ref(rtdb, `timers/${sessionId}`), {
        ...updates,
        updatedAt: rtdbTimestamp()
      });
    } catch (error) {
      console.error('Error updating timer in RTDB:', error);
    }
  },

  completeSession: async (sessionId, roomId, isDemo = false) => {
    if (!sessionId) return;

    try {
      // 1. Clear session in RTDB (Always do this to stop pairing views)
      await remove(ref(rtdb, `timers/${sessionId}`));

      if (isDemo) return;

      // 2. Update Firestore session for archival
      await updateDoc(doc(db, 'sessions', sessionId), {
        completedAt: firestoreTimestamp(),
        status: 'completed'
      });

      // 3. Clear room status in Firestore (skip for personal/virtual rooms)
      if (roomId && !roomId.startsWith('personal-room-')) {
        await updateDoc(doc(db, 'rooms', roomId), {
          available: true,
          currentSession: null,
          occupiedBy: null,
          occupiedAt: null
        });
      }
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  }
};

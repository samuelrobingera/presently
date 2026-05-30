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
    if (isDemo) return;

    try {
      // 1. Create session in Firestore for persistence
      await setDoc(doc(db, 'sessions', sessionId), {
        ...sessionData,
        createdAt: firestoreTimestamp(),
        status: 'active'
      });

      // 2. Initialize session in RTDB for real-time sync
      await update(ref(rtdb, `timers/${sessionId}`), {
        ...sessionData,
        updatedAt: rtdbTimestamp()
      });
    } catch (error) {
      console.error('Error creating session:', error);
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
    if (isDemo || !sessionId) return;

    try {
      await update(ref(rtdb, `timers/${sessionId}`), {
        ...updates,
        updatedAt: rtdbTimestamp()
      });
    } catch (error) {
      console.error('Error updating timer:', error);
    }
  },

  completeSession: async (sessionId, roomId, isDemo = false) => {
    if (isDemo || !sessionId) return;

    try {
      // 1. Update Firestore session
      await updateDoc(doc(db, 'sessions', sessionId), {
        completedAt: firestoreTimestamp(),
        status: 'completed'
      });

      // 2. Clear room status in Firestore if needed (skip for personal/virtual rooms)
      if (roomId && !roomId.startsWith('personal-room-')) {
        await updateDoc(doc(db, 'rooms', roomId), {
          available: true,
          currentSession: null,
          occupiedBy: null,
          occupiedAt: null
        });
      }

      // 3. Remove from RTDB
      await remove(ref(rtdb, `timers/${sessionId}`));
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  }
};

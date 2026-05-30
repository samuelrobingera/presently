import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  Timestamp, 
  addDoc, 
  serverTimestamp,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '../config/firebase';

const DEMO_ROOMS = [
  { id: 'room1', name: 'Conference Room A', capacity: 50, available: true, active: true, orgId: 'org1' },
  { id: 'room2', name: 'Conference Room B', capacity: 25, available: true, active: true, orgId: 'org1' },
  { id: 'room3', name: 'Auditorium', capacity: 200, available: true, active: true, orgId: 'org1' },
  { id: 'room4', name: 'Meeting Room C', capacity: 12, available: false, active: true, orgId: 'org1' },
  { id: 'room5', name: 'Boardroom', capacity: 20, available: true, active: true, orgId: 'org1' }
];

export const roomService = {
  getRooms: async (organization, user, isDemo = false) => {
    if (isDemo) return DEMO_ROOMS;

    try {
      const roomsMap = new Map();
      
      // 1. Fetch organization rooms
      if (organization) {
        const orgQ = query(
          collection(db, 'rooms'), 
          where('active', '==', true), 
          where('orgId', '==', organization.id)
        );
        const orgSnapshot = await getDocs(orgQ);
        orgSnapshot.forEach(doc => {
          roomsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
      }

      // 2. Fetch rooms assigned to user's email
      if (user && user.email) {
        const assignedQ = query(
          collection(db, 'rooms'), 
          where('active', '==', true), 
          where('allowedEmails', 'array-contains', user.email)
        );
        const assignedSnapshot = await getDocs(assignedQ);
        assignedSnapshot.forEach(doc => {
          roomsMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
      }

      return Array.from(roomsMap.values());
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  },

  getUpcomingBookings: async (roomIds, isDemo = false) => {
    if (isDemo) {
      const now = new Date();
      const startTime = new Date(now.getTime() + 10 * 60000);
      return [{
        id: 'demo-booking-1',
        roomId: 'room1',
        orgId: 'org1',
        userName: 'John Doe',
        startTime: Timestamp.fromDate(startTime),
        status: 'scheduled',
        phaseConfig: { preparationTime: 5, presentationTime: 30, qaTime: 10 }
      }];
    }

    if (!roomIds.length) return [];

    try {
      // Firestore 'in' query limit is 10
      const q = query(
        collection(db, 'bookings'),
        where('roomId', 'in', roomIds.slice(0, 10)),
        where('status', '==', 'scheduled'),
        where('startTime', '>=', Timestamp.now()),
        orderBy('startTime', 'asc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  addBooking: async (bookingData, isDemo = false) => {
    if (isDemo) {
      return { id: 'demo-' + Date.now(), ...bookingData };
    }

    try {
      const docRef = await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...bookingData };
    } catch (error) {
      console.error('Error adding booking:', error);
      throw error;
    }
  },

  updateRoomStatus: async (roomId, updates, isDemo = false) => {
    if (isDemo) return;
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating room status:', error);
      throw error;
    }
  },

  createRoom: async (roomData, isDemo = false) => {
    if (isDemo) return { id: 'demo-' + Date.now(), ...roomData };
    try {
      const docRef = await addDoc(collection(db, 'rooms'), {
        ...roomData,
        active: true,
        available: true,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id, ...roomData };
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  },

  updateRoom: async (roomId, roomData, isDemo = false) => {
    if (isDemo) return;
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        ...roomData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  },

  deleteRoom: async (roomId, isDemo = false) => {
    if (isDemo) return;
    try {
      // Soft delete
      await updateDoc(doc(db, 'rooms', roomId), {
        active: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }
};

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Super-Admin Service
 *
 * Provides CRUD operations for managing organizations.
 * Only accessible by super-admin users.
 */

const DEMO_ORGANIZATIONS = [
  {
    id: 'org1',
    name: 'Acme Corp',
    domain: 'acme.com',
    domains: ['acme.com', 'acme.net'],
    ownerEmail: 'admin@acme.com',
    ownerId: null,
    adminEmails: ['manager@acme.com', 'tech@acme.com'],
    adminIds: [],
    subscription: {
      plan: 'Enterprise Pro',
      status: 'active',
      roomLicenses: 50,
      pricePerMonth: 499.00,
      startDate: '2026-06-01',
      nextBillingDate: '2026-07-01'
    },
    settings: {
      ssoEnabled: false,
      brandingEnabled: true
    },
    createdAt: new Date('2026-01-15'),
    active: true
  },
  {
    id: 'org2',
    name: 'TechStart Inc',
    domain: 'techstart.io',
    domains: ['techstart.io'],
    ownerEmail: 'founder@techstart.io',
    ownerId: null,
    adminEmails: ['ops@techstart.io'],
    adminIds: [],
    subscription: {
      plan: 'Startup',
      status: 'active',
      roomLicenses: 10,
      pricePerMonth: 99.00,
      startDate: '2026-05-01',
      nextBillingDate: '2026-06-01'
    },
    settings: {
      ssoEnabled: false,
      brandingEnabled: false
    },
    createdAt: new Date('2026-05-01'),
    active: true
  }
];

export const superAdminService = {
  /**
   * Get all organizations
   */
  getAllOrganizations: async (isDemo = false) => {
    if (isDemo) {
      return DEMO_ORGANIZATIONS;
    }

    try {
      const q = query(
        collection(db, 'organizations'),
        where('active', '==', true),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting all organizations:', error);
      throw error;
    }
  },

  /**
   * Get organization by ID
   */
  getOrganization: async (orgId, isDemo = false) => {
    if (isDemo) {
      return DEMO_ORGANIZATIONS.find(org => org.id === orgId) || null;
    }

    try {
      const docRef = doc(db, 'organizations', orgId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }

      return null;
    } catch (error) {
      console.error('Error getting organization:', error);
      throw error;
    }
  },

  /**
   * Create new organization
   */
  createOrganization: async (orgData, isDemo = false) => {
    if (isDemo) {
      return {
        id: 'demo-org-' + Date.now(),
        ...orgData,
        createdAt: new Date(),
        active: true
      };
    }

    try {
      const docRef = await addDoc(collection(db, 'organizations'), {
        ...orgData,
        ownerId: null, // Set when owner first logs in
        adminIds: [], // Populated as admins log in
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        active: true
      });

      return {
        id: docRef.id,
        ...orgData
      };
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  },

  /**
   * Update organization
   */
  updateOrganization: async (orgId, updates, isDemo = false) => {
    if (isDemo) {
      return;
    }

    try {
      await updateDoc(doc(db, 'organizations', orgId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  },

  /**
   * Delete organization (soft delete)
   */
  deleteOrganization: async (orgId, isDemo = false) => {
    if (isDemo) {
      return;
    }

    try {
      await updateDoc(doc(db, 'organizations', orgId), {
        active: false,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting organization:', error);
      throw error;
    }
  },

  /**
   * Search organizations by name or domain
   */
  searchOrganizations: async (searchTerm, isDemo = false) => {
    if (isDemo) {
      const term = searchTerm.toLowerCase();
      return DEMO_ORGANIZATIONS.filter(org =>
        org.name.toLowerCase().includes(term) ||
        org.domain.toLowerCase().includes(term)
      );
    }

    try {
      // Firestore doesn't support full-text search natively
      // This is a simple implementation - consider Algolia for production
      const q = query(
        collection(db, 'organizations'),
        where('active', '==', true)
      );
      const snapshot = await getDocs(q);

      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(org => {
          const term = searchTerm.toLowerCase();
          return (
            org.name.toLowerCase().includes(term) ||
            org.domain.toLowerCase().includes(term) ||
            org.ownerEmail?.toLowerCase().includes(term)
          );
        });

      return results;
    } catch (error) {
      console.error('Error searching organizations:', error);
      throw error;
    }
  },

  /**
   * Validate organization data
   */
  validateOrganization: (orgData) => {
    const errors = [];

    if (!orgData.name || orgData.name.trim() === '') {
      errors.push('Organization name is required');
    }

    if (!orgData.domain || orgData.domain.trim() === '') {
      errors.push('Primary domain is required');
    }

    if (!orgData.ownerEmail || orgData.ownerEmail.trim() === '') {
      errors.push('Owner email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (orgData.ownerEmail && !emailRegex.test(orgData.ownerEmail)) {
      errors.push('Owner email is invalid');
    }

    if (orgData.adminEmails) {
      orgData.adminEmails.forEach((email, index) => {
        if (email && !emailRegex.test(email)) {
          errors.push(`Admin email ${index + 1} is invalid`);
        }
      });
    }

    // Validate subscription if provided
    if (orgData.subscription) {
      if (!orgData.subscription.plan) {
        errors.push('Subscription plan is required');
      }
      if (orgData.subscription.roomLicenses && orgData.subscription.roomLicenses < 1) {
        errors.push('Room licenses must be at least 1');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Get organization statistics
   */
  getOrganizationStats: async (orgId, isDemo = false) => {
    if (isDemo) {
      return {
        totalRooms: 12,
        activeSessions: 3,
        totalSessions: 847,
        totalUsers: 25
      };
    }

    try {
      // Get rooms count
      const roomsQuery = query(
        collection(db, 'rooms'),
        where('orgId', '==', orgId),
        where('active', '==', true)
      );
      const roomsSnapshot = await getDocs(roomsQuery);
      const totalRooms = roomsSnapshot.size;

      // Get active sessions
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('orgId', '==', orgId),
        where('status', '==', 'active')
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const activeSessions = sessionsSnapshot.size;

      // Get total sessions count (limit to recent for performance)
      const totalSessionsQuery = query(
        collection(db, 'sessions'),
        where('orgId', '==', orgId),
        firestoreLimit(1000)
      );
      const totalSessionsSnapshot = await getDocs(totalSessionsQuery);
      const totalSessions = totalSessionsSnapshot.size;

      return {
        totalRooms,
        activeSessions,
        totalSessions,
        totalUsers: 0 // TODO: Implement user counting
      };
    } catch (error) {
      console.error('Error getting organization stats:', error);
      return {
        totalRooms: 0,
        activeSessions: 0,
        totalSessions: 0,
        totalUsers: 0
      };
    }
  }
};

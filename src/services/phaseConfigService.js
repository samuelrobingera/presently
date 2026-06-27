import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Default phase configuration matching the original hardcoded behavior
 */
const DEFAULT_PHASE_CONFIG = {
  id: 'default',
  name: 'Standard 3-Phase',
  description: 'Classic Prep → Present → Q&A → Overtime sequence',
  phases: [
    {
      id: 'preparation',
      name: 'Preparation',
      order: 0,
      durationMinutes: 5,
      color: {
        normal: '#1e293b', // slate-800
        warning: '#fbbf24', // amber-400
        critical: '#be123c', // rose-700
      },
      warningThresholds: [
        { minutesRemaining: 2, action: 'flash', color: '#fbbf24' }
      ],
      criticalThreshold: { minutesRemaining: 0, action: 'solid', color: '#be123c' },
      pulseEffect: false,
      autoAdvance: true
    },
    {
      id: 'presentation',
      name: 'Presentation',
      order: 1,
      durationMinutes: 20,
      color: {
        normal: '#0f172a', // slate-900
        warning: '#fbbf24', // amber-400
        critical: '#dc2626', // rose-600
      },
      warningThresholds: [
        { minutesRemaining: 5, action: 'solid', color: '#fbbf24' },
        { minutesRemaining: 2, action: 'solid', color: '#fbbf24' }
      ],
      criticalThreshold: { minutesRemaining: 0, action: 'flash', color: '#dc2626' },
      pulseEffect: false,
      autoAdvance: true
    },
    {
      id: 'q&a',
      name: 'Q&A',
      order: 2,
      durationMinutes: 5,
      color: {
        normal: '#dc2626', // rose-600
        warning: '#ef4444', // rose-500
        critical: '#be123c', // rose-700
      },
      warningThresholds: [
        { minutesRemaining: 1, action: 'flash', color: '#ef4444' }
      ],
      criticalThreshold: { minutesRemaining: 0, action: 'pulse', color: '#be123c' },
      pulseEffect: true,
      autoAdvance: true
    },
    {
      id: 'overtime',
      name: 'Overtime',
      order: 3,
      durationMinutes: 0, // Infinite
      color: {
        normal: '#7f1d1d', // rose-800
        warning: '#000000', // black
        critical: '#7f1d1d', // rose-800
      },
      warningThresholds: [],
      criticalThreshold: null,
      pulseEffect: true,
      pulseInterval: 120, // seconds
      autoAdvance: false
    }
  ],
  isDefault: true
};

/**
 * Demo phase configurations for testing
 */
const DEMO_PHASE_CONFIGS = [
  DEFAULT_PHASE_CONFIG,
  {
    id: 'demo-2phase',
    name: '2-Phase Sprint',
    description: 'Quick Talk → Discussion',
    phases: [
      {
        id: 'talk',
        name: 'Quick Talk',
        order: 0,
        durationMinutes: 10,
        color: { normal: '#1e40af', warning: '#fbbf24', critical: '#dc2626' },
        warningThresholds: [{ minutesRemaining: 2, action: 'flash', color: '#fbbf24' }],
        criticalThreshold: { minutesRemaining: 0, action: 'solid', color: '#dc2626' },
        pulseEffect: false,
        autoAdvance: true
      },
      {
        id: 'discussion',
        name: 'Discussion',
        order: 1,
        durationMinutes: 15,
        color: { normal: '#059669', warning: '#f59e0b', critical: '#dc2626' },
        warningThresholds: [{ minutesRemaining: 3, action: 'solid', color: '#f59e0b' }],
        criticalThreshold: { minutesRemaining: 0, action: 'pulse', color: '#dc2626' },
        pulseEffect: true,
        autoAdvance: false
      }
    ],
    isDefault: false
  }
];

export const phaseConfigService = {
  /**
   * Get all phase configurations for an organization or user
   */
  getPhaseConfigs: async (orgId, userId, isDemo = false) => {
    if (isDemo) return DEMO_PHASE_CONFIGS;

    try {
      const configs = [];

      // Get organization configs
      if (orgId) {
        const orgQ = query(
          collection(db, 'phaseConfigs'),
          where('orgId', '==', orgId),
          where('active', '==', true)
        );
        const orgSnapshot = await getDocs(orgQ);
        orgSnapshot.forEach(doc => {
          configs.push({ id: doc.id, ...doc.data() });
        });
      }

      // Get user configs
      if (userId) {
        const userQ = query(
          collection(db, 'phaseConfigs'),
          where('userId', '==', userId),
          where('active', '==', true)
        );
        const userSnapshot = await getDocs(userQ);
        userSnapshot.forEach(doc => {
          configs.push({ id: doc.id, ...doc.data() });
        });
      }

      // Always include default if no configs exist
      if (configs.length === 0) {
        configs.push(DEFAULT_PHASE_CONFIG);
      }

      return configs;
    } catch (error) {
      console.error('Error fetching phase configs:', error);
      return [DEFAULT_PHASE_CONFIG];
    }
  },

  /**
   * Get a specific phase configuration by ID
   */
  getPhaseConfig: async (configId, isDemo = false) => {
    if (isDemo || configId === 'default') {
      return DEFAULT_PHASE_CONFIG;
    }

    try {
      const docRef = doc(db, 'phaseConfigs', configId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }

      return DEFAULT_PHASE_CONFIG;
    } catch (error) {
      console.error('Error fetching phase config:', error);
      return DEFAULT_PHASE_CONFIG;
    }
  },

  /**
   * Create a new phase configuration
   */
  createPhaseConfig: async (configData, isDemo = false) => {
    if (isDemo) {
      return {
        id: 'demo-' + Date.now(),
        ...configData,
        active: true,
        createdAt: new Date()
      };
    }

    try {
      const docRef = await addDoc(collection(db, 'phaseConfigs'), {
        ...configData,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { id: docRef.id, ...configData };
    } catch (error) {
      console.error('Error creating phase config:', error);
      throw error;
    }
  },

  /**
   * Update an existing phase configuration
   */
  updatePhaseConfig: async (configId, updates, isDemo = false) => {
    if (isDemo || configId === 'default') {
      return;
    }

    try {
      await updateDoc(doc(db, 'phaseConfigs', configId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating phase config:', error);
      throw error;
    }
  },

  /**
   * Delete a phase configuration (soft delete)
   */
  deletePhaseConfig: async (configId, isDemo = false) => {
    if (isDemo || configId === 'default') {
      return;
    }

    try {
      await updateDoc(doc(db, 'phaseConfigs', configId), {
        active: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error deleting phase config:', error);
      throw error;
    }
  },

  /**
   * Assign a phase configuration to a room
   */
  assignPhaseConfigToRoom: async (roomId, configId, isDemo = false) => {
    if (isDemo) return;

    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        phaseConfigId: configId,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error assigning phase config to room:', error);
      throw error;
    }
  },

  /**
   * Get the phase configuration assigned to a room
   */
  getRoomPhaseConfig: async (roomId, isDemo = false) => {
    if (isDemo) return DEFAULT_PHASE_CONFIG;

    try {
      const roomDoc = await getDoc(doc(db, 'rooms', roomId));

      if (roomDoc.exists()) {
        const roomData = roomDoc.data();
        const configId = roomData.phaseConfigId;

        if (configId) {
          return await phaseConfigService.getPhaseConfig(configId, isDemo);
        }
      }

      return DEFAULT_PHASE_CONFIG;
    } catch (error) {
      console.error('Error getting room phase config:', error);
      return DEFAULT_PHASE_CONFIG;
    }
  },

  /**
   * Validate phase configuration structure
   */
  validatePhaseConfig: (config) => {
    const errors = [];

    if (!config.name || config.name.trim() === '') {
      errors.push('Configuration name is required');
    }

    if (!config.phases || config.phases.length === 0) {
      errors.push('At least one phase is required');
    }

    config.phases?.forEach((phase, index) => {
      if (!phase.name || phase.name.trim() === '') {
        errors.push(`Phase ${index + 1}: Name is required`);
      }
      if (phase.durationMinutes === undefined || phase.durationMinutes < 0) {
        errors.push(`Phase ${index + 1}: Valid duration is required`);
      }
      if (!phase.color || !phase.color.normal) {
        errors.push(`Phase ${index + 1}: Color configuration is required`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Get default phase configuration
   */
  getDefaultConfig: () => DEFAULT_PHASE_CONFIG
};

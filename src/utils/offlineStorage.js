const DB_NAME = 'presently-offline';
const DB_VERSION = 1;
const STORE_NAME = 'timer-state';

class OfflineStorage {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
      };
    });
  }

  async ensureDB() {
    if (!this.db) {
      await this.initPromise;
    }
    return this.db;
  }

  async saveTimerState(state) {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await store.put({
        key: 'current-timer',
        ...state,
        lastUpdated: Date.now()
      });

      // Fallback to localStorage for browsers without IndexedDB
      localStorage.setItem('presently-timer-state', JSON.stringify({
        ...state,
        lastUpdated: Date.now()
      }));

      return true;
    } catch (error) {
      console.error('Error saving timer state:', error);
      // Fallback to localStorage only
      try {
        localStorage.setItem('presently-timer-state', JSON.stringify({
          ...state,
          lastUpdated: Date.now()
        }));
        return true;
      } catch (lsError) {
        console.error('LocalStorage also failed:', lsError);
        return false;
      }
    }
  }

  async getTimerState() {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.get('current-timer');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error reading from IndexedDB, trying localStorage:', error);
      // Fallback to localStorage
      try {
        const data = localStorage.getItem('presently-timer-state');
        return data ? JSON.parse(data) : null;
      } catch (lsError) {
        console.error('LocalStorage read failed:', lsError);
        return null;
      }
    }
  }

  async clearTimerState() {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await store.delete('current-timer');

      localStorage.removeItem('presently-timer-state');
      return true;
    } catch (error) {
      console.error('Error clearing timer state:', error);
      try {
        localStorage.removeItem('presently-timer-state');
        return true;
      } catch (lsError) {
        return false;
      }
    }
  }

  async savePendingSync(syncData) {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const existing = await new Promise((resolve) => {
        const req = store.get('pending-syncs');
        req.onsuccess = () => resolve(req.result || { key: 'pending-syncs', syncs: [] });
        req.onerror = () => resolve({ key: 'pending-syncs', syncs: [] });
      });

      existing.syncs.push({
        ...syncData,
        timestamp: Date.now()
      });

      await store.put(existing);
      return true;
    } catch (error) {
      console.error('Error saving pending sync:', error);
      return false;
    }
  }

  async getPendingSyncs() {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve) => {
        const request = store.get('pending-syncs');
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.syncs : []);
        };
        request.onerror = () => resolve([]);
      });
    } catch (error) {
      console.error('Error getting pending syncs:', error);
      return [];
    }
  }

  async clearPendingSyncs() {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await store.delete('pending-syncs');
      return true;
    } catch (error) {
      console.error('Error clearing pending syncs:', error);
      return false;
    }
  }
}

export const offlineStorage = new OfflineStorage();

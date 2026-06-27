import { timerService } from './timerService';
import { offlineStorage } from '../utils/offlineStorage';

export const syncService = {
  async reconcileState(localState, isDemo = false) {
    if (isDemo || !localState || !localState.sessionId) {
      return { success: false, reason: 'No valid session to sync' };
    }

    try {
      // Calculate time drift while offline
      const now = Date.now();
      const timeSinceLastUpdate = now - (localState.lastUpdated || now);

      // Adjust timeRemaining based on offline duration
      let adjustedState = { ...localState };

      if (localState.isRunning && timeSinceLastUpdate > 0) {
        const secondsElapsed = Math.floor(timeSinceLastUpdate / 1000);

        if (localState.phase === 'overtime') {
          adjustedState.overtimeSeconds = (localState.overtimeSeconds || 0) + secondsElapsed;
          adjustedState.timeRemaining = 0;
        } else {
          adjustedState.timeRemaining = Math.max(0, localState.timeRemaining - (secondsElapsed * 1000));

          // Check if phase should have transitioned during offline period
          if (adjustedState.timeRemaining === 0) {
            const phases = ['preparation', 'presentation', 'q&a', 'overtime'];
            const currentIndex = phases.indexOf(localState.phase);

            if (currentIndex < phases.length - 1) {
              adjustedState.phase = phases[currentIndex + 1];
              // Note: Phase timing will be handled by the timer engine on reconnect
            }
          }
        }
      }

      // Sync adjusted state to Firebase
      await timerService.updateTimer(adjustedState.sessionId, {
        timeRemaining: adjustedState.timeRemaining,
        phase: adjustedState.phase,
        isRunning: adjustedState.isRunning,
        overtimeSeconds: adjustedState.overtimeSeconds,
        lastSyncedAt: now
      }, isDemo);

      // Process pending sync queue
      const pendingSyncs = await offlineStorage.getPendingSyncs();

      for (const sync of pendingSyncs) {
        try {
          await timerService.updateTimer(sync.sessionId, sync.updates, isDemo);
        } catch (syncError) {
          console.error('Failed to sync queued update:', syncError);
        }
      }

      // Clear pending syncs after successful reconciliation
      await offlineStorage.clearPendingSyncs();

      return {
        success: true,
        adjustedState,
        syncedUpdates: pendingSyncs.length
      };
    } catch (error) {
      console.error('State reconciliation failed:', error);
      return {
        success: false,
        reason: error.message
      };
    }
  },

  async queueUpdate(sessionId, updates) {
    return await offlineStorage.savePendingSync({
      sessionId,
      updates
    });
  }
};

/**
 * Timer Utility Functions
 * Shared utilities for timer display and formatting
 */

/**
 * Format milliseconds to MM:SS display
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string (MM:SS)
 */
export const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(Math.abs(totalSeconds) / 60);
  const seconds = Math.floor(Math.abs(totalSeconds) % 60);
  const sign = totalSeconds < 0 ? '-' : '';
  return `${sign}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format overtime seconds to -MM:SS display
 * @param {number} totalSeconds - Total overtime seconds
 * @returns {string} Formatted overtime string (-MM:SS)
 */
export const formatOvertime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `-${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Get inline styles for phase-based styling with custom colors
 * @param {object} phaseConfig - Phase configuration object
 * @param {number} timeRemaining - Time remaining in milliseconds
 * @param {number} overtimeSeconds - Overtime seconds (for infinite phases)
 * @param {boolean} isFlashing - Whether the display is currently flashing
 * @returns {object} Inline style object with backgroundColor and color
 */
export const getPhaseStyles = (phaseConfig, timeRemaining, overtimeSeconds = 0, isFlashing = false) => {
  if (!phaseConfig) {
    return { backgroundColor: '#475569', color: '#fff' }; // slate-600
  }

  const minutesLeft = Math.ceil(timeRemaining / 60000);
  let backgroundColor = phaseConfig.color.normal;
  let shouldPulse = phaseConfig.pulseEffect;

  // Check for critical threshold (usually 0 minutes)
  if (phaseConfig.criticalThreshold && minutesLeft <= phaseConfig.criticalThreshold.minutesRemaining) {
    backgroundColor = phaseConfig.criticalThreshold.color;
    shouldPulse = phaseConfig.criticalThreshold.action === 'pulse';

    if (phaseConfig.criticalThreshold.action === 'flash' && isFlashing) {
      backgroundColor = phaseConfig.color.normal; // Alternate with normal for flash effect
    }
  } else {
    // Check warning thresholds
    const activeThreshold = phaseConfig.warningThresholds
      ?.sort((a, b) => a.minutesRemaining - b.minutesRemaining)
      .find(t => minutesLeft <= t.minutesRemaining);

    if (activeThreshold) {
      backgroundColor = activeThreshold.color;

      if (activeThreshold.action === 'flash' && isFlashing) {
        backgroundColor = phaseConfig.color.normal;
      }
    }
  }

  // Handle infinite phases (overtime) with pulse interval
  if (phaseConfig.durationMinutes === 0 && phaseConfig.pulseInterval) {
    const pulseToggle = Math.floor(overtimeSeconds / phaseConfig.pulseInterval) % 2 === 0;
    backgroundColor = pulseToggle ? phaseConfig.color.normal : phaseConfig.color.critical;
    shouldPulse = true;
  }

  // Determine text color based on background brightness
  const textColor = getContrastColor(backgroundColor);

  return {
    backgroundColor,
    color: textColor,
    ...(shouldPulse && { animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' })
  };
};

/**
 * Get contrast text color for a background
 * @param {string} hexColor - Hex color string
 * @returns {string} '#fff' or '#000'
 */
const getContrastColor = (hexColor) => {
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000' : '#fff';
};

/**
 * Get Tailwind CSS classes for phase-based styling (legacy)
 * @deprecated Use getPhaseStyles with phaseConfig instead
 */
export const getLegacyPhaseStyles = (phase, timeRemaining, overtimeSeconds = 0, isFlashing = false) => {
  const minutesLeft = Math.ceil(timeRemaining / 60000);

  switch (phase) {
    case 'preparation':
      if (timeRemaining === 0) return 'bg-rose-700 text-white';
      if (minutesLeft <= 2) return isFlashing ? 'bg-amber-400 text-black' : 'bg-slate-800 text-white';
      return 'bg-slate-800 text-white';

    case 'presentation':
      if (timeRemaining === 0) return isFlashing ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-900';
      if (minutesLeft <= 2 || minutesLeft <= 5) return 'bg-amber-400 text-black';
      return 'bg-slate-900 text-white shadow-2xl shadow-slate-400';

    case 'q&a':
      if (timeRemaining === 0) return 'animate-pulse bg-rose-700 text-white';
      if (minutesLeft <= 1) return isFlashing ? 'bg-rose-500 text-white' : 'bg-rose-600 text-white';
      return 'bg-rose-600 text-white';

    case 'overtime':
      const pulseClass = Math.floor(overtimeSeconds / 120) % 2 === 0 ? 'bg-rose-800' : 'bg-black';
      return `${pulseClass} text-white animate-pulse shadow-2xl shadow-rose-900/50`;

    default:
      return 'bg-slate-500 text-white';
  }
};

/**
 * Determine if timer should flash based on phase config and time remaining
 * @param {object} phaseConfig - Phase configuration object
 * @param {number} timeRemaining - Time remaining in milliseconds
 * @param {boolean} isRunning - Whether timer is currently running
 * @returns {boolean} Whether display should flash
 */
export const shouldFlash = (phaseConfig, timeRemaining, isRunning = true) => {
  if (!isRunning || !phaseConfig) return false;

  const minutesLeft = Math.ceil(timeRemaining / 60000);

  // Check if critical threshold has flash action
  if (phaseConfig.criticalThreshold &&
      minutesLeft <= phaseConfig.criticalThreshold.minutesRemaining &&
      phaseConfig.criticalThreshold.action === 'flash') {
    return true;
  }

  // Check if any warning threshold has flash action
  const flashingThreshold = phaseConfig.warningThresholds?.find(
    t => t.action === 'flash' && minutesLeft <= t.minutesRemaining
  );

  return !!flashingThreshold;
};

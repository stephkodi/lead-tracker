/**
 * Subtle native haptic feedback utility for mobile browsers.
 * Uses the HTML5 Vibration API with graceful fallback.
 */

export type HapticType = 'light' | 'medium' | 'success' | 'warning' | 'selection';

export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof window === 'undefined' || !('navigator' in window) || !navigator.vibrate) {
    return;
  }

  try {
    switch (type) {
      case 'light':
      case 'selection':
        navigator.vibrate(8);
        break;
      case 'medium':
        navigator.vibrate(15);
        break;
      case 'success':
        navigator.vibrate([10, 30, 15]);
        break;
      case 'warning':
        navigator.vibrate([20, 40, 20]);
        break;
    }
  } catch {
    // Graceful silent fail on unsupported platforms
  }
}

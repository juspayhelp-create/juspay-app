/**
 * Haptic Feedback Utility
 * Native hardware vibration support (navigator.vibrate).
 * Tactile sound feedback system has been removed per specification.
 */

export type HapticType = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'selection' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'impact';

export type SoundActionType =
  | 'confirm'
  | 'cancel'
  | 'switch'
  | 'success'
  | 'tick'
  | 'error'
  | 'pop';

// Clean up any legacy tactile sound local storage key
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('juspay_tactile_sound_feedback');
  } catch {}
}

/**
 * Native hardware vibration feedback
 */
export const triggerHaptic = (type: HapticType = 'light'): void => {
  if (typeof window === 'undefined') return;

  if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      switch (type) {
        case 'selection':
          navigator.vibrate(8);
          break;
        case 'light':
          navigator.vibrate(15);
          break;
        case 'medium':
          navigator.vibrate(28);
          break;
        case 'heavy':
          navigator.vibrate(45);
          break;
        case 'impact':
          navigator.vibrate([18, 30, 18]);
          break;
        case 'success':
          navigator.vibrate([12, 40, 25]);
          break;
        case 'warning':
          navigator.vibrate([30, 60, 30]);
          break;
        case 'error':
          navigator.vibrate([40, 50, 40, 50, 40]);
          break;
        default:
          navigator.vibrate(15);
          break;
      }
    } catch {
      // Ignore vibration errors if blocked by browser policy
    }
  }
};

export const haptic = {
  trigger: triggerHaptic,
  playSound: (_action: SoundActionType) => {},
  action: (action: SoundActionType) => {
    switch (action) {
      case 'confirm':
        triggerHaptic('medium');
        break;
      case 'cancel':
        triggerHaptic('light');
        break;
      case 'switch':
        triggerHaptic('selection');
        break;
      case 'success':
        triggerHaptic('success');
        break;
      case 'tick':
        triggerHaptic('selection');
        break;
      case 'pop':
        triggerHaptic('light');
        break;
      case 'error':
        triggerHaptic('error');
        break;
    }
  },
  toggleSound: () => false,
  isSoundEnabled: () => false,
  setSoundEnabled: (_enabled: boolean) => {}
};

// No-op sound stubs to maintain compatibility with existing call sites
export const triggerSound = (_action: SoundActionType) => {};
export const triggerActionFeedback = (action: SoundActionType) => {
  haptic.action(action);
};
export const triggerConfirmSound = () => {};
export const triggerCancelSound = () => {};
export const triggerSwitchSound = () => {};
export const triggerSuccessSound = () => {};
export const triggerTickSound = () => {};
export const toggleSoundFeedback = (): boolean => false;
export const isSoundFeedbackEnabled = (): boolean => false;
export const setSoundFeedbackEnabled = (_enabled: boolean): void => {};

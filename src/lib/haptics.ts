import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

export const hapticImpact = async (style: 'LIGHT' | 'MEDIUM' | 'HEAVY' = 'LIGHT') => {
  try {
    if (Capacitor.isNativePlatform()) {
      let impactStyle = ImpactStyle.Light;
      if (style === 'MEDIUM') impactStyle = ImpactStyle.Medium;
      if (style === 'HEAVY') impactStyle = ImpactStyle.Heavy;
      await Haptics.impact({ style: impactStyle });
    } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      const duration = style === 'LIGHT' ? 10 : style === 'MEDIUM' ? 20 : 35;
      navigator.vibrate(duration);
    }
  } catch {
    // Ignore errors on unsupported platforms
  }
};

export const hapticNotification = async (type: 'SUCCESS' | 'WARNING' | 'ERROR' = 'SUCCESS') => {
  try {
    if (Capacitor.isNativePlatform()) {
      let notificationType = NotificationType.Success;
      if (type === 'WARNING') notificationType = NotificationType.Warning;
      if (type === 'ERROR') notificationType = NotificationType.Error;
      await Haptics.notification({ type: notificationType });
    } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'SUCCESS') navigator.vibrate([15, 30, 15]);
      else if (type === 'WARNING') navigator.vibrate([30, 50, 30]);
      else navigator.vibrate([50, 100, 50]);
    }
  } catch {
    // Ignore errors on unsupported platforms
  }
};

export const hapticSelection = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
  } catch {
    // Ignore errors on unsupported platforms
  }
};

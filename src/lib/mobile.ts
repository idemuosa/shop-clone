import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapacitorApp } from '@capacitor/app';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Share } from '@capacitor/share';
import { setupPushNotifications } from './notifications';
import { toast } from 'sonner';

export const isNativeMobile = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const shareProduct = async (product: { name: string; description?: string; id?: string }) => {
  const title = `Check out ${product.name} on Vivi Store!`;
  const text = product.description || `Discover ${product.name} and exclusive deals on Vivi Store!`;
  const url = typeof window !== 'undefined' ? `${window.location.origin}/?product=${product.id || ''}` : '';

  try {
    if (Capacitor.isNativePlatform()) {
      await Share.share({
        title,
        text,
        url,
        dialogTitle: `Share ${product.name}`,
      });
    } else if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({
        title,
        text,
        url,
      });
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${title}\n${url}`);
      toast.success('Product link copied to clipboard!');
    }
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.warn('Share action cancelled or failed:', err);
    }
  }
};

export const useCapacitorMobile = (userId?: string, onHardwareBack?: () => boolean) => {
  const [networkStatus, setNetworkStatus] = useState<ConnectionStatus | null>(null);

  useEffect(() => {
    const initNativeFeatures = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#ea580c' });
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (err) {
        console.warn('StatusBar configuration error:', err);
      }

      try {
        await SplashScreen.hide();
      } catch (err) {
        console.warn('SplashScreen hide error:', err);
      }

      try {
        await setupPushNotifications(userId);
      } catch (err) {
        console.warn('Push Notifications setup error:', err);
      }
    };

    initNativeFeatures();
  }, [userId]);

  useEffect(() => {
    let networkListener: any = null;

    const setupNetwork = async () => {
      try {
        const status = await Network.getStatus();
        setNetworkStatus(status);

        networkListener = await Network.addListener('networkStatusChange', (status) => {
          setNetworkStatus(status);
        });
      } catch (err) {
        console.warn('Network listener setup error:', err);
      }
    };

    setupNetwork();

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
    };
  }, []);

  useEffect(() => {
    let backButtonListener: any = null;

    const setupBackButton = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        backButtonListener = await CapacitorApp.addListener('backButton', () => {
          if (onHardwareBack) {
            const handled = onHardwareBack();
            if (handled) return;
          }
          CapacitorApp.minimizeApp();
        });
      } catch (err) {
        console.warn('BackButton listener setup error:', err);
      }
    };

    setupBackButton();

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [onHardwareBack]);

  return { networkStatus };
};

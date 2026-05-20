import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { db } from './firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export const setupPushNotifications = async (userId?: string) => {
  if (Capacitor.getPlatform() === 'web') {
    return;
  }

  let permStatus = await PushNotifications.checkPermissions();

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions();
  }

  if (permStatus.receive !== 'granted') {
    console.error('User denied permissions!');
    return;
  }

  await PushNotifications.register();

  PushNotifications.addListener('registration', async (token) => {
    console.log('Push registration success, token: ' + token.value);

    // Save token to Firestore if userId is provided
    if (userId) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          pushTokens: arrayUnion(token.value)
        });
        console.log('Push token saved to Firestore');
      } catch (err) {
        console.error('Error saving push token:', err);
      }
    }
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('Error on registration: ' + JSON.stringify(error));
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('Push received: ' + JSON.stringify(notification));
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('Push action performed: ' + JSON.stringify(notification));
  });
};

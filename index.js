globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true; // Optional: silence warnings

const setupBase64Polyfills = () => {
  const base64 = require('base-64');
  
  if (typeof global !== 'undefined') {
    global.atob = base64.decode;
    global.btoa = base64.encode;
  }
  
  if (typeof globalThis !== 'undefined') {
    globalThis.atob = base64.decode;
    globalThis.btoa = base64.encode;
  }
};

setupBase64Polyfills();

// ✅ v22 Modular API
import { getApp } from '@react-native-firebase/app';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

const app = getApp();
const messaging = getMessaging(app);

setBackgroundMessageHandler(messaging, async remoteMessage => {
  console.log('📱 Background message received:', remoteMessage);
  
  if (remoteMessage.data) {
    console.log('📋 Background notification data:', remoteMessage.data);
  }
});

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);

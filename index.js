/**
 * @format
 */

// Aggressive polyfill for Hermes engine compatibility
console.log('[POLYFILL] Setting up base64 polyfills for Hermes release build...');

const setupBase64Polyfills = () => {
  const base64 = require('base-64');
  
  // Multiple assignment approaches for maximum Hermes compatibility
  if (typeof global !== 'undefined') {
    global.atob = base64.decode;
    global.btoa = base64.encode;
  }
  
  if (typeof globalThis !== 'undefined') {
    globalThis.atob = base64.decode;
    globalThis.btoa = base64.encode;
  }
  
  // Force assignment for Hermes engine
  try {
    // Direct global assignment
    this.atob = base64.decode;
    this.btoa = base64.encode;
  } catch (e) {
    console.warn('[POLYFILL] Direct assignment failed:', e);
  }
  
  console.log('[POLYFILL] Base64 polyfills installed successfully for Hermes');
};

// Execute immediately before anything else
setupBase64Polyfills();

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);

// src/utils/polyfills.js - Create this file
import 'react-native-get-random-values';
import { decode, encode } from 'base-64';

// Setup polyfills for release builds
const setupPolyfills = () => {
  // Base64 polyfills
  if (typeof global.atob === 'undefined') {
    global.atob = decode;
    console.log('🔧 atob polyfill installed');
  }
  
  if (typeof global.btoa === 'undefined') {
    global.btoa = encode;
    console.log('🔧 btoa polyfill installed');
  }
  
  // Additional global polyfills
  if (typeof global.self === 'undefined') {
    global.self = global;
  }
  
  // Buffer polyfill if needed
  if (typeof global.Buffer === 'undefined') {
    try {
      const { Buffer } = require('buffer');
      global.Buffer = Buffer;
      console.log('🔧 Buffer polyfill installed');
    } catch (e) {
      console.warn('Buffer polyfill not available:', e.message);
    }
  }
  
  console.log('✅ Polyfills setup complete');
};

// Run polyfills setup immediately
setupPolyfills();

export default setupPolyfills;
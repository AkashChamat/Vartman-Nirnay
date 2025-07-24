// src/utils/jwtUtils.js - Create this new file
import { decode } from 'base-64';

/**
 * Safer JWT decode that works in both debug and release builds
 */
export const safeJwtDecode = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token provided');
    }

    // Split JWT token
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Get payload (second part)
    let payload = parts[1];
    
    // Add padding if needed (JWT base64 doesn't use padding)
    while (payload.length % 4) {
      payload += '=';
    }

    // Replace URL-safe characters
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');

    // Decode base64
    let decoded;
    if (global.atob) {
      decoded = global.atob(payload);
    } else {
      decoded = decode(payload);
    }

    // Parse JSON
    return JSON.parse(decoded);
  } catch (error) {
    console.error('JWT decode error:', error);
    throw new Error(`Failed to decode JWT: ${error.message}`);
  }
};

/**
 * Check if JWT token is expired
 */
export const isJwtExpired = (token) => {
  try {
    if (!token) return true;
    
    const decoded = safeJwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000);
    
    return decoded.exp ? decoded.exp < currentTime : false;
  } catch (error) {
    console.error('Token expiry check failed:', error);
    return true; // Treat invalid tokens as expired
  }
};
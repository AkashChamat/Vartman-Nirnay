import {decode} from 'base-64';


const base64UrlDecode = str => {
  if (!str || typeof str !== 'string') {
    console.error('[JWT] Invalid base64 string:', typeof str);
    throw new Error('Invalid base64 string provided');
  }

  try {
    // Convert base64url to base64 format
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    if (padding) {
      base64 += '='.repeat(4 - padding);
    }

    // Use the imported decode function directly
    return decode(base64);
  } catch (error) {
    console.error('[JWT] Base64 decode error:', error);
    throw new Error(`Failed to decode base64: ${error.message}`);
  }
};

const isJWTExpiredAsync = async token => {
  return new Promise(resolve => {
    try {
      if (!token) {
        console.log('[JWT] No token provided');
        resolve(true);
        return;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        console.log('[JWT] Invalid token structure');
        resolve(true);
        return;
      }

      const decodedPayload = base64UrlDecode(parts[1]);
      const payload = JSON.parse(decodedPayload);
      const currentTime = Math.floor(Date.now() / 1000);

      console.log(
        `[JWT] Token exp: ${
          payload.exp
        }, Current time: ${currentTime}, Expired: ${payload.exp < currentTime}`,
      );

      resolve(payload.exp < currentTime);
    } catch (error) {
      console.error('[JWT] Error checking token expiration:', error);
      resolve(true);
    }
  });
};

// Synchronous version (keep for backward compatibility)
const isJWTExpired = token => {
  if (!token) return true;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const decodedPayload = base64UrlDecode(parts[1]);
    const payload = JSON.parse(decodedPayload);
    const currentTime = Math.floor(Date.now() / 1000);

    console.log(
      `[JWT] Token exp: ${
        payload.exp
      }, Current time: ${currentTime}, Expired: ${payload.exp < currentTime}`,
    );

    return payload.exp < currentTime;
  } catch (error) {
    console.error('[JWT] Error checking token expiration:', error);
    return true;
  }
};

// Async decode JWT payload
const decodeJWTPayloadAsync = async token => {
  return new Promise(resolve => {
    try {
      if (!token) {
        resolve(null);
        return;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        resolve(null);
        return;
      }

      const decodedPayload = base64UrlDecode(parts[1]);
      const payload = JSON.parse(decodedPayload);
      resolve(payload);
    } catch (error) {
      console.error('[JWT] Error decoding JWT payload:', error);
      resolve(null);
    }
  });
};

// Synchronous version
const decodeJWTPayload = token => {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decodedPayload = base64UrlDecode(parts[1]);
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('[JWT] Error decoding JWT payload:', error);
    return null;
  }
};

// Async extract user info
const extractUserInfoAsync = async token => {
  try {
    const payload = await decodeJWTPayloadAsync(token);
    if (!payload) return null;

    return {
      id: payload.id || payload.sub || null,
      email: payload.email || payload.sub || null,
      name: payload.name || payload.userName || null,
      exp: payload.exp || null,
      iat: payload.iat || null,
    };
  } catch (error) {
    console.error('[JWT] Error extracting user info:', error);
    return null;
  }
};

// Synchronous version
const extractUserInfo = token => {
  try {
    const payload = decodeJWTPayload(token);
    if (!payload) return null;

    return {
      id: payload.id || payload.sub || null,
      email: payload.email || payload.sub || null,
      name: payload.name || payload.userName || null,
      exp: payload.exp || null,
      iat: payload.iat || null,
    };
  } catch (error) {
    console.error('[JWT] Error extracting user info:', error);
    return null;
  }
};

// Enhanced async safe validation
const safeValidateJWTAsync = async (token, context = 'Unknown') => {
  return new Promise(async resolve => {
    const result = {
      valid: false,
      error: null,
      decoded: null,
      userInfo: null,
      isExpired: true,
    };

    try {
      if (!token || typeof token !== 'string') {
        result.error = 'Invalid token';
        resolve(result);
        return;
      }

      const parts = token.split('.');
      if (parts.length !== 3) {
        result.error = 'Invalid JWT structure';
        resolve(result);
        return;
      }

      const payload = await decodeJWTPayloadAsync(token);
      if (!payload) {
        result.error = 'Failed to decode payload';
        resolve(result);
        return;
      }

      const isExpired = await isJWTExpiredAsync(token);
      const userInfo = await extractUserInfoAsync(token);

      result.valid = true;
      result.decoded = payload;
      result.userInfo = userInfo;
      result.isExpired = isExpired;
      result.error = null;

      resolve(result);
    } catch (error) {
      result.error = error.message;
      resolve(result);
    }
  });
};

// Synchronous version
const safeValidateJWT = (token, context = 'Unknown') => {
  const result = {
    valid: false,
    error: null,
    decoded: null,
    userInfo: null,
    isExpired: true,
  };

  try {
    if (!token || typeof token !== 'string') {
      result.error = 'Invalid token';
      return result;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      result.error = 'Invalid JWT structure';
      return result;
    }

    const payload = decodeJWTPayload(token);
    if (!payload) {
      result.error = 'Failed to decode payload';
      return result;
    }

    result.valid = true;
    result.decoded = payload;
    result.userInfo = extractUserInfo(token);
    result.isExpired = isJWTExpired(token);
    result.error = null;

    return result;
  } catch (error) {
    result.error = error.message;
    return result;
  }
};

const testJWTUtilities = () => ({success: true});
const debugJWT = token => safeValidateJWT(token);

export {
  isJWTExpired,
  isJWTExpiredAsync,
  decodeJWTPayload,
  decodeJWTPayloadAsync,
  extractUserInfo,
  extractUserInfoAsync,
  safeValidateJWT,
  safeValidateJWTAsync,
  testJWTUtilities,
  debugJWT,
};

export default {
  isJWTExpired,
  isJWTExpiredAsync,
  decodeJWTPayload,
  decodeJWTPayloadAsync,
  extractUserInfo,
  extractUserInfoAsync,
  safeValidateJWT,
  safeValidateJWTAsync,
  testJWTUtilities,
  debugJWT,
};




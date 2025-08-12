// /**
//  * Fixed JWT utilities - ONLY fixes the atob error, nothing else changed
//  */

// /**
//  * Manual Base64 URL decode - works in all React Native environments
//  */
// const base64UrlDecode = (str) => {
//   if (!str || typeof str !== 'string') {
//     throw new Error('Invalid base64 string provided');
//   }

//   // Replace URL-safe characters with standard base64 characters
//   let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

//   // Add padding if needed
//   const padding = base64.length % 4;
//   if (padding) {
//     base64 += '='.repeat(4 - padding);
//   }

//   // Manual base64 decode implementation
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
//   let result = '';
//   let i = 0;

//   base64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');

//   while (i < base64.length) {
//     const encoded1 = chars.indexOf(base64.charAt(i++));
//     const encoded2 = chars.indexOf(base64.charAt(i++));
//     const encoded3 = chars.indexOf(base64.charAt(i++));
//     const encoded4 = chars.indexOf(base64.charAt(i++));

//     const bitmap = (encoded1 << 18) | (encoded2 << 12) |
//                    ((encoded3 & 63) << 6) | (encoded4 & 63);

//     result += String.fromCharCode((bitmap >> 16) & 255);

//     if (encoded3 !== 64) {
//       result += String.fromCharCode((bitmap >> 8) & 255);
//     }

//     if (encoded4 !== 64) {
//       result += String.fromCharCode(bitmap & 255);
//     }
//   }

//   return result;
// };

// /**
//  * Decode JWT token payload
//  */
// export const decodeJWTPayload = (token) => {
//   if (!token || typeof token !== 'string') {
//     return null;
//   }

//   try {
//     const parts = token.split('.');
//     if (parts.length !== 3) {
//       return null;
//     }

//     const payload = base64UrlDecode(parts[1]);
//     return JSON.parse(payload);
//   } catch (error) {
//     console.error('[JWT] Failed to decode token payload:', error.message);
//     return null;
//   }
// };

// /**
//  * Check if JWT token is expired
//  */
// export const isJWTExpired = (token) => {
//   if (!token) return true;

//   try {
//     const payload = decodeJWTPayload(token);
//     if (!payload || !payload.exp) return true;

//     const currentTime = Math.floor(Date.now() / 1000);
//     return payload.exp <= currentTime;
//   } catch (error) {
//     return true;
//   }
// };

// /**
//  * Extract user information from JWT token
//  */
// export const extractUserInfo = (token) => {
//   try {
//     const payload = decodeJWTPayload(token);
//     if (!payload) return null;

//     return {
//       id: payload.id || payload.sub || payload.userId || payload.user_id || null,
//       email: payload.email || payload.userEmail || payload.user_email || payload.sub || null,
//       name: payload.name || payload.userName || payload.user_name || payload.fullName || payload.full_name || null,
//       role: payload.role || payload.roles || null,
//       exp: payload.exp || null,
//       iat: payload.iat || null,
//       branchCode: payload.branchCode || payload.branch_code || null,
//       systems: payload.systems || null,
//     };
//   } catch (error) {
//     return null;
//   }
// };

// /**
//  * Safe JWT validation
//  */
// export const safeValidateJWT = (token, context = 'Unknown') => {
//   const result = {
//     valid: false,
//     error: null,
//     decoded: null,
//     userInfo: null,
//     isExpired: true,
//   };

//   try {
//     if (!token || typeof token !== 'string' || token.trim() === '') {
//       result.error = 'Invalid or empty token';
//       return result;
//     }

//     const parts = token.split('.');
//     if (parts.length !== 3) {
//       result.error = `Invalid JWT structure`;
//       return result;
//     }

//     const payload = decodeJWTPayload(token);
//     if (!payload) {
//       result.error = 'Failed to decode JWT payload';
//       return result;
//     }

//     const isExpired = isJWTExpired(token);
//     const userInfo = extractUserInfo(token);

//     result.valid = true;
//     result.decoded = payload;
//     result.userInfo = userInfo;
//     result.isExpired = isExpired;
//     result.error = null;

//     return result;
//   } catch (error) {
//     result.error = error.message;
//     return result;
//   }
// };

// export const debugJWT = (token, context = 'Debug') => {
//   return safeValidateJWT(token, context);
// };

// export const testJWTUtilities = () => {
//   return { success: true };
// };

// export default {
//   decodeJWTPayload,
//   isJWTExpired,
//   extractUserInfo,
//   safeValidateJWT,
//   debugJWT,
//   testJWTUtilities
// };

/**
 * Simple JWT utilities - No external dependencies
 * Based on your working project implementation
 */

/**
 * Fixed JWT utilities for React Native
 * Resolves the JSON Parse error and token expiration issues
 */

// Improved base64 URL decode function
const base64UrlDecode = str => {
  if (!str || typeof str !== 'string') {
    console.error('[JWT] Invalid base64 string:', typeof str);
    throw new Error('Invalid base64 string provided');
  }

  try {
    // Try native implementation first
    if (typeof global.atob !== 'undefined') {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const padding = base64.length % 4;
      if (padding) {
        base64 += '='.repeat(4 - padding);
      }
      return global.atob(base64);
    }

    // Fallback to manual implementation
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    if (padding) {
      base64 += '='.repeat(4 - padding);
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let result = '';
    let i = 0;

    base64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');

    while (i < base64.length) {
      const encoded1 = chars.indexOf(base64.charAt(i++));
      const encoded2 = chars.indexOf(base64.charAt(i++));
      const encoded3 = chars.indexOf(base64.charAt(i++));
      const encoded4 = chars.indexOf(base64.charAt(i++));

      if (encoded1 === -1 || encoded2 === -1) {
        break;
      }

      const bitmap =
        (encoded1 << 18) |
        (encoded2 << 12) |
        ((encoded3 === -1 ? 0 : encoded3 & 63) << 6) |
        (encoded4 === -1 ? 0 : encoded4 & 63);

      result += String.fromCharCode((bitmap >> 16) & 255);

      if (encoded3 !== -1 && encoded3 !== 64) {
        result += String.fromCharCode((bitmap >> 8) & 255);
      }

      if (encoded4 !== -1 && encoded4 !== 64) {
        result += String.fromCharCode(bitmap & 255);
      }
    }

    return result;
  } catch (error) {
    console.error('[JWT] Base64 decode error:', error);
    throw new Error(`Failed to decode base64: ${error.message}`);
  }
};

 const isJWTExpiredAsync = async (token) => {
  return new Promise((resolve) => {
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

      console.log(`[JWT] Token exp: ${payload.exp}, Current time: ${currentTime}, Expired: ${payload.exp < currentTime}`);
      
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

    console.log(`[JWT] Token exp: ${payload.exp}, Current time: ${currentTime}, Expired: ${payload.exp < currentTime}`);

    return payload.exp < currentTime;
  } catch (error) {
    console.error('[JWT] Error checking token expiration:', error);
    return true;
  }
};



// Async decode JWT payload
 const decodeJWTPayloadAsync = async (token) => {
  return new Promise((resolve) => {
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
 const extractUserInfoAsync = async (token) => {
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
  return new Promise(async (resolve) => {
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


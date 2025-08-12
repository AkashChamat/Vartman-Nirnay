// src/util/debugHelper.js
// Add this to help debug production issues

export const debugToken = (token, context = 'Unknown') => {
  if (!token) {
    console.log(`[DEBUG-${context}] No token provided`);
    return;
  }
  
  console.log(`[DEBUG-${context}] Token info:`, {
    length: token.length,
    starts_with: token.substring(0, 20) + '...',
    parts_count: token.split('.').length,
    parts_lengths: token.split('.').map(part => part.length),
    has_special_chars: /[^A-Za-z0-9._-]/.test(token)
  });
};

export const debugEnvironment = (context = 'Unknown') => {
  const env = {
    Buffer: typeof global.Buffer,
    atob: typeof global.atob,
    btoa: typeof global.btoa,
    platform: require('react-native').Platform.OS,
    __DEV__: typeof __DEV__ !== 'undefined' ? __DEV__ : 'undefined'
  };
  
  console.log(`[DEBUG-${context}] Environment:`, env);
  return env;
};

// Use this in your login function
export const safeValidateJWT = (token, context = 'Login') => {
  try {
    debugToken(token, context);
    debugEnvironment(context);
    
    // Import here to avoid circular dependencies
    const { validateJWT } = require('./jwtUtils');
    const result = validateJWT(token);
    
    console.log(`[DEBUG-${context}] Validation result:`, {
      valid: result.valid,
      error: result.error || 'none',
      has_header: !!result.header,
      has_payload: !!result.payload
    });
    
    return result;
  } catch (error) {
    console.error(`[DEBUG-${context}] Validation crashed:`, error.message);
    return { valid: false, error: error.message };
  }
};
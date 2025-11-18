import React, {createContext, useContext, useReducer, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert} from 'react-native';
import {login as loginAPI} from '../util/apiCall';
import {
  isJWTExpiredAsync,
  decodeJWTPayloadAsync,
  extractUserInfoAsync,
  safeValidateJWTAsync,
  // Keep sync versions as backup
  extractUserInfo,
  isJWTExpired,
} from '../util/jwtUtils';
import {
  getMessaging,
  getToken,
  onTokenRefresh,
} from '@react-native-firebase/messaging';
import {updateUserFcmToken} from '../util/apiCall';

const AuthContext = createContext();

const initialState = {
  isLoading: true,
  isAuthenticated: false,
  token: null,
  user: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        token: action.token,
        user: action.user,
        isAuthenticated: !!action.token,
        isLoading: false,
      };
    case 'SIGN_IN':
      return {
        ...state,
        isAuthenticated: true,
        token: action.token,
        user: action.user,
        isLoading: false,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        user: null,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({children}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ⭐ ENHANCED FCM TOKEN UPDATE WITH RETRY LOGIC
  const updateFCMTokenWithRetry = async (fcmToken, retryCount = 3, context = 'Unknown') => {
    console.log(`🔄 Attempting to update FCM token (${context})...`);
    
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        await updateUserFcmToken(fcmToken);
        console.log(`✅ FCM token updated successfully on attempt ${attempt} (${context})`);
        return true;
      } catch (error) {
        console.log(`❌ FCM token update failed (attempt ${attempt}/${retryCount}) - ${context}:`, error.message);
        
        if (attempt === retryCount) {
          // Final attempt failed - log for monitoring but don't break the flow
          console.error(`🚨 FCM token update completely failed after ${retryCount} attempts (${context})`);
          console.error('🚨 Error details:', error);
          return false;
        }
        
        // Wait before retry with exponential backoff
        const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return false;
  };

  // ⭐ ENHANCED TOKEN VALIDATION AND REFRESH
  const validateAndRefreshFCMToken = async () => {
    try {
      console.log('🔍 Validating FCM token...');
      const messaging = getMessaging();
      
      // Get current token
      const currentToken = await getToken(messaging);
      if (!currentToken) {
        console.error('❌ No FCM token available for validation');
        return null;
      }
      
      console.log('✅ FCM token validated:', currentToken.substring(0, 20) + '...');
      
      // Update token on server (with retry logic)
      await updateFCMTokenWithRetry(currentToken, 2, 'TokenValidation');
      
      return currentToken;
    } catch (error) {
      console.error('❌ FCM token validation failed:', error);
      
      // Try to force refresh token
      try {
        const messaging = getMessaging();
        console.log('🔄 Attempting to force refresh FCM token...');
        
        // Delete current token and get new one
        await messaging.deleteToken();
        const newToken = await getToken(messaging);
        
        if (newToken) {
          console.log('✅ FCM token force refreshed successfully');
          await updateFCMTokenWithRetry(newToken, 2, 'ForceRefresh');
          return newToken;
        }
      } catch (refreshError) {
        console.error('❌ Force refresh also failed:', refreshError);
      }
    }
    return null;
  };

  // ⭐ ENHANCED TOKEN REFRESH LISTENER
  useEffect(() => {
    if (state.isAuthenticated && state.user?.id) {
      console.log('👤 User authenticated, setting up enhanced FCM token refresh listener...');

      const messaging = getMessaging();

      const unsubscribeTokenRefresh = onTokenRefresh(messaging, async newToken => {
        console.log('🔄 FCM token refreshed:', newToken.substring(0, 20) + '...');
        
        // Use retry logic for token refresh
        const success = await updateFCMTokenWithRetry(newToken, 3, 'TokenRefresh');
        
        if (success) {
          console.log('✅ Refreshed FCM token updated successfully with retry logic');
        } else {
          console.error('🚨 Failed to update refreshed FCM token after all retries');
          // You could trigger an alert or analytics event here
        }
      });

      // ⭐ PERIODIC TOKEN VALIDATION (every 24 hours)
      const tokenValidationInterval = setInterval(async () => {
        console.log('⏰ Performing periodic FCM token validation...');
        await validateAndRefreshFCMToken();
      }, 24 * 60 * 60 * 1000); // 24 hours

      return () => {
        console.log('🧹 Cleaning up FCM token refresh listener and validation interval');
        unsubscribeTokenRefresh();
        clearInterval(tokenValidationInterval);
      };
    }
  }, [state.isAuthenticated, state.user?.id]);

  useEffect(() => {
    const restoreAuth = async () => {
      try {
        // Add small delay to ensure AsyncStorage is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Get stored data
        const [token, userData] = await Promise.all([
          AsyncStorage.getItem('userToken'),
          AsyncStorage.getItem('userData'),
        ]);

        if (token && userData) {
          // ACTUALLY USE the async validation function
          const validation = await safeValidateJWTAsync(token, 'AuthRestore');

          if (validation.valid && !validation.isExpired) {
            const user = JSON.parse(userData);

            dispatch({
              type: 'RESTORE_TOKEN',
              token,
              user,
            });

            // ⭐ VALIDATE FCM TOKEN ON APP RESTORE
            setTimeout(async () => {
              console.log('🔄 Validating FCM token after auth restore...');
              await validateAndRefreshFCMToken();
            }, 2000);

            return;
          }
        }

        // Clear invalid/expired/missing data
        await AsyncStorage.multiRemove(['userToken', 'userData']);
        dispatch({type: 'SIGN_OUT'});
      } catch (error) {
        console.error('[AUTH] Error restoring auth state:', error);
        try {
          await AsyncStorage.multiRemove(['userToken', 'userData']);
        } catch (clearError) {
          console.error('[AUTH] Error clearing storage:', clearError);
        }
        dispatch({type: 'SIGN_OUT'});
      }
    };

    restoreAuth();
  }, []);

  // ⭐ ENHANCED LOGIN WITH BETTER FCM HANDLING
  const login = async (email, password) => {
    try {
      dispatch({type: 'SET_LOADING', isLoading: true});

      const response = await loginAPI({email, password});

      if (response && response.token) {
        // ACTUALLY USE the async validation function
        const validation = await safeValidateJWTAsync(response.token, 'Login');

        if (!validation.valid || validation.isExpired) {
          console.error('[AUTH] Received invalid or expired token:', validation.error);
          Alert.alert('Error', 'Received invalid token from server');
          dispatch({type: 'SET_LOADING', isLoading: false});
          return {success: false, message: 'Invalid token'};
        }

        console.log('🟢 FULL JWT Token:', response.token);

        // ACTUALLY USE the async user info extraction
        const userInfo = await extractUserInfoAsync(response.token);

        const userData = {
          id: response.id || userInfo?.id || null,
          email: response.email || userInfo?.email || null,
          userName: response.userName || userInfo?.name || null,
          ...response,
        };

        // Store data
        await Promise.all([
          AsyncStorage.setItem('userToken', response.token),
          AsyncStorage.setItem('userData', JSON.stringify(userData)),
        ]);

        dispatch({
          type: 'SIGN_IN',
          token: response.token,
          user: userData,
        });

        // ⭐ ENHANCED FCM TOKEN HANDLING
        try {
          console.log('🔑 Getting FCM token after successful login...');
          const messaging = getMessaging();
          const fcmToken = await getToken(messaging);

          if (fcmToken) {
            console.log('📱 FULL FCM Token:', fcmToken);
            console.log('📱 FCM Token (first 50 chars):', fcmToken.substring(0, 50) + '...');

            // CRITICAL: Test this token
            console.log('🧪 COPY THIS TOKEN AND TEST IN FIREBASE CONSOLE:');
            console.log('🧪', fcmToken);

            // ⭐ USE RETRY LOGIC FOR LOGIN FCM UPDATE
            const success = await updateFCMTokenWithRetry(fcmToken, 3, 'Login');
            
            if (success) {
              console.log('✅ FCM token updated successfully on server during login');
            } else {
              console.error('🚨 FCM token update failed during login - user will still be logged in');
              // Login continues even if FCM fails - don't break the login flow
            }
          } else {
            console.error('❌ NO FCM TOKEN RECEIVED - FCM NOT WORKING!');
            // Still allow login to continue
          }
        } catch (fcmError) {
          console.error('❌ FCM token handling failed during login:', fcmError);
          console.error('❌ FCM Error details:', fcmError.message);
          // Don't break login flow due to FCM issues
          console.log('⚠️  Login will continue despite FCM issues');
        }

        return {success: true};
      } else if (response && response.message) {
        // If backend returns a meaningful message (e.g. "Invalid email." or "Invalid password."), show it
        const serverMsg = response.message || 'Invalid credentials';
        console.warn('[AUTH] Login failed:', serverMsg);
        Alert.alert('Login Error', serverMsg);
        dispatch({type: 'SET_LOADING', isLoading: false});
        return {success: false, message: serverMsg};
      } else {
        console.error('[AUTH] Invalid response from server', response);
        Alert.alert('Login Error', 'Invalid response from server');
        dispatch({type: 'SET_LOADING', isLoading: false});
        return {success: false, message: 'Invalid response'};
      }
    } catch (error) {
      console.error('❌ [AUTH] Login error details:');

      // Basic error info
      console.error('   - Message:', error.message);
      console.error('   - Code:', error.code);

      // If the server responded but with error (4xx/5xx)
      if (error.response) {
        console.error('   - Status:', error.response.status);
        console.error('   - Headers:', error.response.headers);
        console.error('   - Data:', error.response.data);
      }
      // If request was sent but no response
      else if (error.request) {
        console.error('   - No response received, raw request object:', error.request);
      }
      // Something else (config, setup issue, etc.)
      else {
        console.error('   - Config:', error.config);
      }

      // If server returned a JSON body with a message (e.g. Invalid email/password), surface it
      if (error.response && error.response.data && error.response.data.message) {
        const serverMsg = error.response.data.message;
        console.warn('[AUTH] Server login error:', serverMsg);
        Alert.alert('Login Error', serverMsg);
        dispatch({type: 'SET_LOADING', isLoading: false});
        return {success: false, message: serverMsg};
      }

      Alert.alert('Login Error', 'Network error or invalid credentials');

      dispatch({type: 'SET_LOADING', isLoading: false});
      return {success: false, message: error.message};
    }
  };

  // Enhanced logout function
  const logout = async (isAutomatic = false) => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      dispatch({type: 'SIGN_OUT'});

      if (isAutomatic) {
        Alert.alert('Session Expired', 'Please login again.');
      }
    } catch (error) {
      console.error('[AUTH] Logout error:', error);
    }
  };

  // Getter functions
  const getUserEmail = () => state.user?.email || null;
  const getUserId = () => state.user?.id || null;
  const getUserName = () => state.user?.userName || null;
  const getFullUser = () => state.user || null;

  // ⭐ NEW: Expose FCM utilities
  const refreshFCMToken = () => validateAndRefreshFCMToken();

  const value = {
    ...state,
    login,
    logout,
    getUserEmail,
    getUserId,
    getUserName,
    getFullUser,
    refreshFCMToken, // ⭐ NEW: Allow manual FCM refresh
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

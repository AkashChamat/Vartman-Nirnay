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
  isJWTExpired
} from '../util/jwtUtils';

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

  // FIXED: Actually use async validation
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

  // FIXED: Actually use async validation in login
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

        return {success: true};
      } else {
        console.error('[AUTH] Invalid response from server');
        Alert.alert('Login Error', 'Invalid response from server');
        dispatch({type: 'SET_LOADING', isLoading: false});
        return {success: false, message: 'Invalid response'};
      }
    } catch (error) {
      console.error('[AUTH] Login error:', error);
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

  const value = {
    ...state,
    login,
    logout,
    getUserEmail,
    getUserId,
    getUserName,
    getFullUser,
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




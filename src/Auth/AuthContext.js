// import { createContext, useContext, useState, useEffect, useCallback } from "react"
// import AsyncStorage from "@react-native-async-storage/async-storage"
// import { isJWTExpired, extractUserInfo } from "../util/jwtUtils"

// const AuthContext = createContext()

// // Add the useAuth hook
// export const useAuth = () => {
//   const context = useContext(AuthContext)
//   if (!context) {
//     throw new Error("useAuth must be used within AuthProvider")
//   }
//   return context
// }

// export const AuthProvider = ({ children }) => {
//   const [isAuthenticated, setIsAuthenticated] = useState(false)
//   const [token, setToken] = useState(null)
//   const [user, setUser] = useState(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const loadToken = async () => {
//       try {
//         const storedToken = await AsyncStorage.getItem("userToken")
//         const storedUserData = await AsyncStorage.getItem("userData")

//         if (storedToken) {
//           if (!isJWTExpired(storedToken)) {
//             setToken(storedToken)
//             setIsAuthenticated(true)
//             if (storedUserData) {
//               setUser(JSON.parse(storedUserData))
//             }
//           } else {
//             await AsyncStorage.removeItem("userToken")
//             await AsyncStorage.removeItem("userData")
//             setToken(null)
//             setIsAuthenticated(false)
//             setUser(null)
//           }
//         }
//       } catch (error) {
//         console.error("[AUTH-CONTEXT] Token loading error:", error.message)
//       } finally {
//         setLoading(false)
//       }
//     }

//     loadToken()
//   }, [])

//   const login = useCallback(async (authToken, apiResponse) => {
//     try {
//       await AsyncStorage.setItem("userToken", authToken)

//       // Extract user info from JWT token as backup
//       const tokenUserInfo = extractUserInfo(authToken)

//       const userData = {
//         id: apiResponse.id || tokenUserInfo?.id,
//         email: apiResponse.email || tokenUserInfo?.email,
//         userName: apiResponse.userName || tokenUserInfo?.name,
//         contact: apiResponse.contact,
//         examName: apiResponse.examName,
//       }

//       await AsyncStorage.setItem("userData", JSON.stringify(userData))

//       setToken(authToken)
//       setUser(userData)
//       setIsAuthenticated(true)
//     } catch (error) {
//       console.error("[AUTH-CONTEXT] Login error:", error.message)
//       throw error
//     }
//   }, [])

//   const logout = useCallback(async () => {
//     try {
//       await AsyncStorage.removeItem("userToken")
//       await AsyncStorage.removeItem("userData")
//       setToken(null)
//       setUser(null)
//       setIsAuthenticated(false)
//     } catch (error) {
//       console.error("[AUTH-CONTEXT] Logout error:", error.message)
//     }
//   }, [])

//   const checkTokenValidity = useCallback(async () => {
//     if (token && isJWTExpired(token)) {
//       await logout()
//       return false
//     }
//     return !!token
//   }, [token, logout])

//   const getUserId = useCallback(() => {
//     return user?.id || null
//   }, [user])

//   const getUserEmail = useCallback(() => {
//     return user?.email || null
//   }, [user])

//   const value = {
//     isAuthenticated,
//     token,
//     user,
//     loading,
//     login,
//     logout,
//     checkTokenValidity,
//     getUserId,
//     getUserEmail,
//   }

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }

// import { createContext, useContext, useState, useEffect, useCallback } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { isJWTExpired, extractUserInfo } from "../util/jwtUtils";

// const AuthContext = createContext();

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error("useAuth must be used within AuthProvider");
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [token, setToken] = useState(null);
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const loadToken = async () => {
//       try {
//         const storedToken = await AsyncStorage.getItem("userToken");
//         const storedUserData = await AsyncStorage.getItem("userData");

//         if (storedToken) {
//           if (!isJWTExpired(storedToken)) {
//             setToken(storedToken);
//             setIsAuthenticated(true);

//             if (storedUserData) {
//               try {
//                 setUser(JSON.parse(storedUserData));
//               } catch (parseErr) {
//                 console.warn("[AUTH-CONTEXT] Failed to parse stored userData:", parseErr.message);
//                 await AsyncStorage.removeItem("userData");
//               }
//             }
//           } else {
//             await AsyncStorage.multiRemove(["userToken", "userData"]);
//             setToken(null);
//             setIsAuthenticated(false);
//             setUser(null);
//           }
//         }
//       } catch (error) {
//         console.error("[AUTH-CONTEXT] Token loading error:", error.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadToken();
//   }, []);

//   const login = useCallback(async (authToken, apiResponse) => {
//     try {
//       const tokenUserInfo = extractUserInfo(authToken);
//       if (!tokenUserInfo) {
//         console.warn("[AUTH-CONTEXT] Could not decode JWT, using only API response");
//       }

//       const userData = {
//         id: apiResponse.id || tokenUserInfo?.id || null,
//         email: apiResponse.email || tokenUserInfo?.email || null,
//         userName: apiResponse.userName || tokenUserInfo?.name || null,
//         contact: apiResponse.contact || null,
//         examName: apiResponse.examName || null,
//       };

//       await Promise.all([
//         AsyncStorage.setItem("userToken", authToken),
//         AsyncStorage.setItem("userData", JSON.stringify(userData)),
//       ]);

//       setToken(authToken);
//       setUser(userData);
//       setIsAuthenticated(true);
//     } catch (error) {
//       console.error("[AUTH-CONTEXT] Login error:", error.message);
//       throw error;
//     }
//   }, []);

//   const logout = useCallback(async () => {
//     try {
//       await AsyncStorage.multiRemove(["userToken", "userData"]);
//       setToken(null);
//       setUser(null);
//       setIsAuthenticated(false);
//     } catch (error) {
//       console.error("[AUTH-CONTEXT] Logout error:", error.message);
//     }
//   }, []);

//   const checkTokenValidity = useCallback(async () => {
//     if (token && isJWTExpired(token)) {
//       await logout();
//       return false;
//     }
//     return !!token;
//   }, [token, logout]);

//   const getUserId = useCallback(() => user?.id || null, [user]);
// const getUserEmail = useCallback(() => user?.email || null, [user]);

//   return (
//     <AuthContext.Provider
//       value={{
//         isAuthenticated,
//         token,
//         user,
//         loading,
//         login,
//         logout,
//         checkTokenValidity,
//         getUserId,
//         getUserEmail,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// import React, {
//   createContext,
//   useContext,
//   useState,
//   useEffect,
//   useCallback,
//   useRef,
// } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {isJWTExpired, extractUserInfo, safeValidateJWT} from '../util/jwtUtils';

// const AuthContext = createContext();

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({children}) => {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [token, setToken] = useState(null);
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const isMountedRef = useRef(true);

//   // Initialize authentication state on app start
//   useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         console.log('[AUTH-CONTEXT] Initializing authentication...');

//         const storedToken = await AsyncStorage.getItem('userToken');

//         if (storedToken) {
//           console.log('[AUTH-CONTEXT] Found stored token, validating...');

//           // Validate token
//           const validation = safeValidateJWT(storedToken, 'AppInitialization');

//           if (validation.valid && !validation.isExpired) {
//             console.log('[AUTH-CONTEXT] Token is valid, restoring session');

//             // Get stored user data
//             const storedUserData = await AsyncStorage.getItem('userData');
//             let userData = null;

//             if (storedUserData) {
//               try {
//                 userData = JSON.parse(storedUserData);
//               } catch (error) {
//                 console.warn(
//                   '[AUTH-CONTEXT] Invalid stored user data, extracting from token',
//                 );
//               }
//             }

//             // If no valid user data, extract from token
//             if (!userData) {
//               const tokenUserInfo = extractUserInfo(storedToken);
//               if (tokenUserInfo) {
//                 userData = {
//                   id: tokenUserInfo.id,
//                   email: tokenUserInfo.email,
//                   userName: tokenUserInfo.name,
//                 };
//                 // Save the extracted user data
//                 await AsyncStorage.setItem(
//                   'userData',
//                   JSON.stringify(userData),
//                 );
//               }
//             }

//             // Update state to restore session
//             if (isMountedRef.current) {
//               setToken(storedToken);
//               setUser(userData);
//               setIsAuthenticated(true);
//               console.log('[AUTH-CONTEXT] Session restored successfully');
//             }
//           } else {
//             console.log(
//               '[AUTH-CONTEXT] Token invalid/expired, clearing storage',
//             );
//             await AsyncStorage.multiRemove(['userToken', 'userData']);
//           }
//         } else {
//           console.log('[AUTH-CONTEXT] No stored token found');
//         }
//       } catch (error) {
//         console.error('[AUTH-CONTEXT] Error initializing auth:', error.message);
//         // Clear potentially corrupted data
//         try {
//           await AsyncStorage.multiRemove(['userToken', 'userData']);
//         } catch (clearError) {
//           console.error(
//             '[AUTH-CONTEXT] Error clearing storage:',
//             clearError.message,
//           );
//         }
//       } finally {
//         if (isMountedRef.current) {
//           setLoading(false);
//         }
//       }
//     };

//     initializeAuth();
//   }, []);

//   const login = useCallback(async (authToken, apiResponse) => {
//     try {
//       console.log('[AUTH-CONTEXT] Starting login process');

//       // Validate token
//       const validation = safeValidateJWT(authToken, 'Login');

//       if (!validation.valid) {
//         throw new Error(`Invalid authentication token: ${validation.error}`);
//       }

//       if (validation.isExpired) {
//         throw new Error('Authentication token has expired');
//       }

//       // Build user data - FIX THE EMAIL EXTRACTION
//       const tokenUserInfo = extractUserInfo(authToken);
//       const userData = {
//         id: apiResponse.id || tokenUserInfo?.id || null,
//         // FIX: Use 'sub' field from token for email if email not in API response
//         email:
//           apiResponse.email ||
//           tokenUserInfo?.email ||
//           validation.decoded?.sub ||
//           null,
//         userName: apiResponse.userName || tokenUserInfo?.name || null,
//         examName: apiResponse.examName || null,
//         ...Object.keys(apiResponse).reduce((acc, key) => {
//           if (
//             !['id', 'email', 'userName', 'contact', 'examName'].includes(key)
//           ) {
//             acc[key] = apiResponse[key];
//           }
//           return acc;
//         }, {}),
//       };

//       console.log('[AUTH-CONTEXT] Storing authentication data');
//       console.log('[AUTH-CONTEXT] User data to store:', userData);

//       // Store data
//       await Promise.all([
//         AsyncStorage.setItem('userToken', authToken),
//         AsyncStorage.setItem('userData', JSON.stringify(userData)),
//       ]);

//       console.log(
//         '[AUTH-CONTEXT] Updating state - setting authenticated to true',
//       );

//       // Update state - CRITICAL: Make sure this happens
//       if (isMountedRef.current) {
//         setToken(authToken);
//         setUser(userData);
//         setIsAuthenticated(true); // This is the key line that should trigger navigation
//         console.log(
//           '[AUTH-CONTEXT] State updated successfully - user should be authenticated now',
//         );
//       }
//     } catch (error) {
//       console.error('[AUTH-CONTEXT] Login error:', error.message);
//       await AsyncStorage.multiRemove(['userToken', 'userData']);
//       // Make sure to clear loading state on error
//       throw error;
//     }
//   }, []);

//   const logout = useCallback(async () => {
//     try {
//       console.log('[AUTH-CONTEXT] Logging out...');
//       await AsyncStorage.multiRemove(['userToken', 'userData']);

//       if (isMountedRef.current) {
//         setToken(null);
//         setUser(null);
//         setIsAuthenticated(false);
//       }

//       console.log('[AUTH-CONTEXT] Logout successful');
//     } catch (error) {
//       console.error('[AUTH-CONTEXT] Logout error:', error.message);
//     }
//   }, []);

//   const checkTokenValidity = useCallback(async () => {
//     if (!token) return false;

//     try {
//       const validation = safeValidateJWT(token, 'TokenCheck');

//       if (!validation.valid || validation.isExpired) {
//         console.log('[AUTH-CONTEXT] Token invalid, logging out');
//         await logout();
//         return false;
//       }

//       return true;
//     } catch (error) {
//       console.error('[AUTH-CONTEXT] Token check error:', error.message);
//       await logout();
//       return false;
//     }
//   }, [token, logout]);

//   // Cleanup
//   useEffect(() => {
//     return () => {
//       isMountedRef.current = false;
//     };
//   }, []);

//     const getUserEmail = useCallback(() => user?.email || null, [user]);

//   const value = {
//     isAuthenticated,
//     token,
//     user,
//     loading,
//     login,
//     logout,
//     checkTokenValidity,
//     getUserEmail
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// import React, {createContext, useContext, useReducer, useEffect} from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {Alert} from 'react-native';
// import {login as loginAPI} from '../util/apiCall'; // Adjust import path as needed
// import {
//   isJWTExpired,
//   decodeJWTPayload,
//   extractUserInfo,
// } from '../util/jwtUtils';

// const AuthContext = createContext();

// const initialState = {
//   isLoading: true,
//   isAuthenticated: false,
//   token: null,
//   user: null,
// };

// const authReducer = (state, action) => {
//   switch (action.type) {
//     case 'RESTORE_TOKEN':
//       return {
//         ...state,
//         token: action.token,
//         user: action.user,
//         isAuthenticated: !!action.token,
//         isLoading: false,
//       };
//     case 'SIGN_IN':
//       return {
//         ...state,
//         isAuthenticated: true,
//         token: action.token,
//         user: action.user,
//         isLoading: false,
//       };
//     case 'SIGN_OUT':
//       return {
//         ...state,
//         isAuthenticated: false,
//         token: null,
//         user: null,
//         isLoading: false,
//       };
//     case 'SET_LOADING':
//       return {
//         ...state,
//         isLoading: action.isLoading,
//       };
//     default:
//       return state;
//   }
// };

// export const AuthProvider = ({children}) => {
//   const [state, dispatch] = useReducer(authReducer, initialState);

//   // Restore authentication state
//   useEffect(() => {
//     const restoreAuth = async () => {
//       try {
//         const token = await AsyncStorage.getItem('userToken');
//         const userData = await AsyncStorage.getItem('userData');

//         if (token && userData && !isJWTExpired(token)) {
//           const user = JSON.parse(userData);
//           dispatch({
//             type: 'RESTORE_TOKEN',
//             token,
//             user,
//           });
//         } else {
//           // Token expired or doesn't exist, clear storage
//           await AsyncStorage.multiRemove(['userToken', 'userData']);
//           dispatch({type: 'SIGN_OUT'});
//         }
//       } catch (error) {
//         console.error('Error restoring auth state:', error);
//         dispatch({type: 'SIGN_OUT'});
//       }
//     };

//     restoreAuth();
//   }, []);

//   // Login function
//   const login = async (email, password) => {
//     try {
//       dispatch({type: 'SET_LOADING', isLoading: true});

//       const response = await loginAPI({email, password});

//       if (response && response.token) {
//         console.log('[AUTH] Checking token expiration...');

//         // Fix: Check token expiration properly
//         const tokenExpired = isJWTExpired(response.token);
//         console.log(`[AUTH] Token expired: ${tokenExpired}`);

//         if (tokenExpired) {
//           Alert.alert('Error', 'Received expired token');
//           dispatch({type: 'SET_LOADING', isLoading: false});
//           return {success: false, message: 'Expired token'};
//         }

//         // Extract user info
//         const userInfo = extractUserInfo(response.token);
//         const userData = {
//           id: response.id || userInfo?.id || null,
//           email: response.email || userInfo?.email || null,
//           userName: response.userName || userInfo?.name || null,
//           ...response, // Include other response data
//         };

//         console.log('[AUTH] Storing token and user data...');

//         // Store data
//         await AsyncStorage.setItem('userToken', response.token);
//         await AsyncStorage.setItem('userData', JSON.stringify(userData));

//         dispatch({
//           type: 'SIGN_IN',
//           token: response.token,
//           user: userData,
//         });

//         console.log('[AUTH] Login successful!');
//         return {success: true};
//       } else {
//         Alert.alert('Login Error', 'Invalid response from server');
//         dispatch({type: 'SET_LOADING', isLoading: false});
//         return {success: false, message: 'Invalid response'};
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       Alert.alert('Login Error', 'Network error or invalid credentials');
//       dispatch({type: 'SET_LOADING', isLoading: false});
//       return {success: false, message: error.message};
//     }
//   };

//   // Logout function
//   const logout = async (isAutomatic = false) => {
//     try {
//       await AsyncStorage.multiRemove(['userToken', 'userData']);
//       dispatch({type: 'SIGN_OUT'});

//       if (isAutomatic) {
//         Alert.alert('Session Expired', 'Please login again.');
//       }
//     } catch (error) {
//       console.error('Logout error:', error);
//     }
//   };

//   // Getter functions
//   const getUserEmail = () => state.user?.email || null;
//   const getUserId = () => state.user?.id || null;
//   const getUserName = () => state.user?.userName || null;
//   const getFullUser = () => state.user || null;

//   const value = {
//     ...state,
//     login,
//     logout,
//     getUserEmail,
//     getUserId,
//     getUserName,
//     getFullUser,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// import React, {createContext, useContext, useReducer, useEffect} from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {Alert} from 'react-native';
// import {login as loginAPI} from '../util/apiCall';
// import {
//   isJWTExpiredAsync,
//   decodeJWTPayloadAsync,
//   extractUserInfoAsync,
//   safeValidateJWTAsync,
//   extractUserInfo,
//   isJWTExpired
// } from '../util/jwtUtils';

// const AuthContext = createContext();

// const initialState = {
//   isLoading: true,
//   isAuthenticated: false,
//   token: null,
//   user: null,
// };

// const authReducer = (state, action) => {
//   switch (action.type) {
//     case 'RESTORE_TOKEN':
//       return {
//         ...state,
//         token: action.token,
//         user: action.user,
//         isAuthenticated: !!action.token,
//         isLoading: false,
//       };
//     case 'SIGN_IN':
//       return {
//         ...state,
//         isAuthenticated: true,
//         token: action.token,
//         user: action.user,
//         isLoading: false,
//       };
//     case 'SIGN_OUT':
//       return {
//         ...state,
//         isAuthenticated: false,
//         token: null,
//         user: null,
//         isLoading: false,
//       };
//     case 'SET_LOADING':
//       return {
//         ...state,
//         isLoading: action.isLoading,
//       };
//     default:
//       return state;
//   }
// };

// export const AuthProvider = ({children}) => {
//   const [state, dispatch] = useReducer(authReducer, initialState);

//   // Enhanced restore authentication state with async validation
//   useEffect(() => {
//     const restoreAuth = async () => {
//       try {
//         console.log('[AUTH] Starting auth restore...');

//         // Add small delay to ensure AsyncStorage is ready
//         await new Promise(resolve => setTimeout(resolve, 100));

//         // Get stored data
//         const [token, userData] = await Promise.all([
//           AsyncStorage.getItem('userToken'),
//           AsyncStorage.getItem('userData'),
//         ]);

//         console.log('[AUTH] Retrieved data:', {
//           hasToken: !!token,
//           hasUserData: !!userData,
//           tokenLength: token ? token.length : 0,
//         });

//         if (token && userData) {
//           // Use async validation if available, fallback to sync
//           let isTokenExpired = false;

//           try {
//             if (typeof safeValidateJWTAsync === 'function') {
//               console.log('[AUTH] Using async token validation...');
//               const validation = await safeValidateJWTAsync(
//                 token,
//                 'AuthRestore',
//               );
//               isTokenExpired = !validation.valid || validation.isExpired;
//               console.log('[AUTH] Async validation result:', validation);
//             } else {
//               console.log('[AUTH] Falling back to sync validation...');
//               isTokenExpired = isJWTExpired(token);
//               console.log(
//                 '[AUTH] Sync validation result - expired:',
//                 isTokenExpired,
//               );
//             }
//           } catch (validationError) {
//             console.error('[AUTH] Validation error:', validationError);
//             isTokenExpired = true;
//           }

//           if (!isTokenExpired) {
//             const user = JSON.parse(userData);
//             console.log(
//               '[AUTH] Restoring authenticated session for:',
//               user.email,
//             );

//             dispatch({
//               type: 'RESTORE_TOKEN',
//               token,
//               user,
//             });
//             return;
//           } else {
//             console.log('[AUTH] Token invalid or expired, clearing storage...');
//           }
//         }

//         // Clear invalid/expired/missing data
//         await AsyncStorage.multiRemove(['userToken', 'userData']);
//         dispatch({type: 'SIGN_OUT'});
//       } catch (error) {
//         console.error('[AUTH] Error restoring auth state:', error);
//         try {
//           await AsyncStorage.multiRemove(['userToken', 'userData']);
//         } catch (clearError) {
//           console.error('[AUTH] Error clearing storage:', clearError);
//         }
//         dispatch({type: 'SIGN_OUT'});
//       }
//     };

//     restoreAuth();
//   }, []);

//   // Enhanced login function with async token validation
//   const login = async (email, password) => {
//     try {
//       dispatch({type: 'SET_LOADING', isLoading: true});
//       console.log('[AUTH] Starting login process...');

//       const response = await loginAPI({email, password});

//       if (response && response.token) {
//         console.log('[AUTH] Login API successful, validating token...');

//         // Use async validation if available, fallback to sync
//         let isTokenValid = false;
//         let isTokenExpired = true;

//         try {
//           if (typeof safeValidateJWTAsync === 'function') {
//             console.log('[AUTH] Using async token validation...');
//             const validation = await safeValidateJWTAsync(
//               response.token,
//               'Login',
//             );
//             isTokenValid = validation.valid;
//             isTokenExpired = validation.isExpired;
//             console.log('[AUTH] Async validation result:', validation);
//           } else {
//             console.log('[AUTH] Falling back to sync validation...');
//             isTokenExpired = isJWTExpired(response.token);
//             isTokenValid = !isTokenExpired;
//             console.log('[AUTH] Sync validation - expired:', isTokenExpired);
//           }
//         } catch (validationError) {
//           console.error('[AUTH] Validation error:', validationError);
//           isTokenValid = false;
//           isTokenExpired = true;
//         }

//         if (!isTokenValid || isTokenExpired) {
//           console.error('[AUTH] Received invalid or expired token');
//           Alert.alert('Error', 'Received invalid token from server');
//           dispatch({type: 'SET_LOADING', isLoading: false});
//           return {success: false, message: 'Invalid token'};
//         }

//         // Extract user info (with fallback)
//         let userInfo = null;
//         try {
//           if (typeof extractUserInfoAsync === 'function') {
//             userInfo = await extractUserInfoAsync(response.token);
//           } else {
//             // Import the sync version at the top of the file
//             const {extractUserInfo} = require('../util/jwtUtils');
//             userInfo = extractUserInfo(response.token);
//           }
//         } catch (extractError) {
//           console.error('[AUTH] Error extracting user info:', extractError);
//         }

//         const userData = {
//           id: response.id || userInfo?.id || null,
//           email: response.email || userInfo?.email || null,
//           userName: response.userName || userInfo?.name || null,
//           ...response,
//         };

//         console.log('[AUTH] Storing authenticated session...');

//         // Store data
//         await Promise.all([
//           AsyncStorage.setItem('userToken', response.token),
//           AsyncStorage.setItem('userData', JSON.stringify(userData)),
//         ]);

//         dispatch({
//           type: 'SIGN_IN',
//           token: response.token,
//           user: userData,
//         });

//         console.log('[AUTH] Login completed successfully!');
//         return {success: true};
//       } else {
//         console.error('[AUTH] Invalid response from server');
//         Alert.alert('Login Error', 'Invalid response from server');
//         dispatch({type: 'SET_LOADING', isLoading: false});
//         return {success: false, message: 'Invalid response'};
//       }
//     } catch (error) {
//       console.error('[AUTH] Login error:', error);
//       Alert.alert('Login Error', 'Network error or invalid credentials');
//       dispatch({type: 'SET_LOADING', isLoading: false});
//       return {success: false, message: error.message};
//     }
//   };

//   // Enhanced logout function
//   const logout = async (isAutomatic = false) => {
//     try {
//       console.log('[AUTH] Logging out...');
//       await AsyncStorage.multiRemove(['userToken', 'userData']);
//       dispatch({type: 'SIGN_OUT'});

//       if (isAutomatic) {
//         Alert.alert('Session Expired', 'Please login again.');
//       }
//     } catch (error) {
//       console.error('[AUTH] Logout error:', error);
//     }
//   };

//   // Getter functions
//   const getUserEmail = () => state.user?.email || null;
//   const getUserId = () => state.user?.id || null;
//   const getUserName = () => state.user?.userName || null;
//   const getFullUser = () => state.user || null;

//   const value = {
//     ...state,
//     login,
//     logout,
//     getUserEmail,
//     getUserId,
//     getUserName,
//     getFullUser,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };










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

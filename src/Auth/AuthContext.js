// import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { jwtDecode } from 'jwt-decode';

// const AuthContext = createContext({});

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [token, setToken] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [user, setUser] = useState(null);

//   // Check if token is expired
//   const isTokenExpired = useCallback((token) => {
//     try {
//       if (!token) return true;
//       const decoded = jwtDecode(token);
//       const currentTime = Date.now() / 1000;
//       return decoded.exp < currentTime;
//     } catch (error) {
//       return true;
//     }
//   }, []);

//   // Logout function
//   const logout = useCallback(async () => {
//     try {
//       await AsyncStorage.removeItem('userToken');
//       await AsyncStorage.removeItem('userData');
      
//       setToken(null);
//       setIsAuthenticated(false);
//       setUser(null);
      
//     } catch (error) {
//     }
//   }, []);

//   // Load token and user data from storage on app start
//   const loadToken = useCallback(async () => {
//     try {
//       const storedToken = await AsyncStorage.getItem('userToken');
//       const storedUserData = await AsyncStorage.getItem('userData');
      
//       if (storedToken && !isTokenExpired(storedToken)) {
//         let userData = null;
        
//         if (storedUserData) {
//           try {
//             userData = JSON.parse(storedUserData);
//           } catch (error) {
//           }
//         }
        
//         if (userData) {
//           setToken(storedToken);
//           setUser(userData);
//           setIsAuthenticated(true);
//         } else {
//           await logout();
//         }
//       } else {
//         await logout();
//       }
//     } catch (error) {
//     } finally {
//       setLoading(false);
//     }
//   }, [isTokenExpired, logout]);

//   // Simified login function - directly use API response data
//   const login = useCallback(async (authToken, apiResponse) => {
    
//     try {
//       await AsyncStorage.setItem('userToken', authToken);
      
//       const userData = {
//         id: apiResponse.id,           
//         email: apiResponse.email,    
//         // Add any other fields from API response
//         userName: apiResponse.userName,
//         contact: apiResponse.contact,
//         examName: apiResponse.examName,
//       };
      
//       await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
//       setToken(authToken);
//       setUser(userData);
//       setIsAuthenticated(true);
      
      
//     } catch (error) {
//       throw error;
//     }
//   }, []);

//   const checkTokenValidity = useCallback(async () => {
//     if (token && isTokenExpired(token)) {
//       await logout();
//       return false;
//     }
//     return !!token;
//   }, [token, isTokenExpired, logout]);

//   const getUserId = useCallback(() => {
//     return user?.id || null;
//   }, [user]);

//   const getUserEmail = useCallback(() => {
//     return user?.email || null;
//   }, [user]);

//   useEffect(() => {
//     loadToken();
//   }, [loadToken]);

//   // Periodic token check
//   useEffect(() => {
//     let interval;
    
//     if (isAuthenticated && token && !loading) {
//       interval = setInterval(checkTokenValidity, 5 * 60 * 1000);
//     }
    
//     return () => {
//       if (interval) {
//         clearInterval(interval);
//       }
//     };
//   }, [isAuthenticated, token, loading, checkTokenValidity]);

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
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeJwtDecode, isJwtExpired } from '../util/jwtUtils'; // Import our safer JWT utils

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Check if token is expired using our safer method
  const isTokenExpired = useCallback((token) => {
    return isJwtExpired(token);
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      
      setToken(null);
      setIsAuthenticated(false);
      setUser(null);
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  // Load token and user data from storage on app start
  const loadToken = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUserData = await AsyncStorage.getItem('userData');
      
      if (storedToken && !isTokenExpired(storedToken)) {
        let userData = null;
        
        if (storedUserData) {
          try {
            userData = JSON.parse(storedUserData);
          } catch (error) {
            console.error('Failed to parse stored user data:', error);
          }
        }
        
        if (userData) {
          setToken(storedToken);
          setUser(userData);
          setIsAuthenticated(true);
          console.log('User authenticated from storage');
        } else {
          console.log('No valid user data found, logging out');
          await logout();
        }
      } else {
        console.log('No valid token found or token expired, logging out');
        await logout();
      }
    } catch (error) {
      console.error('Load token error:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  }, [isTokenExpired, logout]);

  // Enhanced login function with better error handling
  const login = useCallback(async (authToken, apiResponse) => {
    try {
      // Validate token before storing
      const decoded = safeJwtDecode(authToken);
      const currentTime = Math.floor(Date.now() / 1000);
      
      if (decoded.exp && decoded.exp <= currentTime) {
        throw new Error('Received expired token');
      }
      
      await AsyncStorage.setItem('userToken', authToken);
      
      const userData = {
        id: apiResponse.id,           
        email: apiResponse.email,    
        userName: apiResponse.userName,
        contact: apiResponse.contact,
        examName: apiResponse.examName,
      };
      
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('User logged in successfully');
      
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(`Login failed: ${error.message}`);
    }
  }, []);

  const checkTokenValidity = useCallback(async () => {
    if (token && isTokenExpired(token)) {
      console.log('Token expired, logging out');
      await logout();
      return false;
    }
    return !!token;
  }, [token, isTokenExpired, logout]);

  const getUserId = useCallback(() => {
    return user?.id || null;
  }, [user]);

  const getUserEmail = useCallback(() => {
    return user?.email || null;
  }, [user]);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  // Periodic token check
  useEffect(() => {
    let interval;
    
    if (isAuthenticated && token && !loading) {
      interval = setInterval(checkTokenValidity, 5 * 60 * 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAuthenticated, token, loading, checkTokenValidity]);

  const value = {
    isAuthenticated,
    token,
    user,
    loading,
    login,
    logout,
    checkTokenValidity,
    getUserId,
    getUserEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

import React, {useEffect, useState} from 'react';
import {
  StatusBar,
  SafeAreaView,
  StyleSheet,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthProvider} from './src/Auth/AuthContext';
import AuthNavigator from './src/Auth/AuthNavigator';
// ✅ v22 Modular API imports
import {getToken} from '@react-native-firebase/messaging';
import {getApp} from '@react-native-firebase/app';
import {
  getMessaging,
  requestPermission,
  AuthorizationStatus,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
} from '@react-native-firebase/messaging';
import {navigateToNotifications} from './src/Components/NavigationService';

const App = () => {
  const [notificationPermission, setNotificationPermission] = useState('unknown');

  // ⭐ DYNAMIC USER ID RETRIEVAL
  const getCurrentUserId = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        return userData.id || userData.userId || null;
      }
      return null;
    } catch (error) {
      console.error('❌ Error getting user ID:', error);
      return null;
    }
  };

  // ⭐ ENHANCED PERMISSION REQUEST
  async function requestUserPermission() {
    const app = getApp();
    const messaging = getMessaging(app);
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    const status = enabled ? 'granted' : 'denied';
    setNotificationPermission(status);
    
    if (enabled) {
      console.log('✅ FCM Authorization status:', authStatus);
    } else {
      console.log('❌ FCM Authorization denied:', authStatus);
    }
    return enabled;
  }

  // ⭐ ENHANCED FCM TEST WITH DYNAMIC USER ID
  const testFCMDirectly = async () => {
    try {
      console.log('🧪 Testing FCM setup...');

      const app = getApp();
      const messaging = getMessaging(app);
      const currentToken = await getToken(messaging);

      if (!currentToken) {
        console.error('❌ No FCM token available!');
        return;
      }

      console.log('📱 Current FCM Token:', currentToken);
      console.log('🧪 Copy this token and test in Firebase Console:');
      console.log('🧪', currentToken);

      // ⭐ GET DYNAMIC USER ID
      const userId = await getCurrentUserId();
      if (userId) {
        console.log(`🔍 Testing notification for user ID: ${userId}`);
        console.log('✅ FCM token available for authenticated user');
      } else {
        console.log('⚠️  No user logged in - FCM token available but not linked to user');
      }

    } catch (error) {
      console.error('❌ FCM Test Error:', error);
    }
  };

  // ⭐ ENHANCED FOREGROUND MESSAGE HANDLER
  const handleForegroundMessage = (remoteMessage) => {
    console.log('📱 Foreground FCM message received:', remoteMessage);
    
    // Track notification received
    if (remoteMessage.notification) {
      console.log('🔔 Notification details:', {
        title: remoteMessage.notification.title,
        body: remoteMessage.notification.body
      });
    }
    
    // Let FCM handle the display automatically
    // Or add custom in-app notification logic here if needed
  };

  // ⭐ ENHANCED BACKGROUND MESSAGE HANDLER
  const handleBackgroundMessageOpen = (remoteMessage) => {
    console.log('📱 App opened from background via notification:', remoteMessage);
    
    // Handle deep linking based on notification data
    if (remoteMessage.data?.screen) {
      setTimeout(() => {
        navigateToNotifications();
      }, 1000);
    } else {
      // Default action - open notifications screen
      setTimeout(() => {
        navigateToNotifications();
      }, 1000);
    }
  };

  // ⭐ TOKEN VALIDATION FUNCTION
  const validateFCMSetup = async () => {
    try {
      const hasPermission = notificationPermission === 'granted';
      const userId = await getCurrentUserId();
      const app = getApp();
      const messaging = getMessaging(app);
      const token = await getToken(messaging);

      console.log('🔍 FCM Setup Validation:');
      console.log(`   - Permission: ${hasPermission ? '✅' : '❌'}`);
      console.log(`   - User Logged In: ${userId ? '✅' : '❌'}`);
      console.log(`   - FCM Token: ${token ? '✅' : '❌'}`);
      
      if (hasPermission && userId && token) {
        console.log('🎉 FCM Setup is complete and ready!');
      } else {
        console.log('⚠️  FCM Setup incomplete - some features may not work');
      }
    } catch (error) {
      console.error('❌ FCM validation error:', error);
    }
  };

  useEffect(() => {
    const initializeFCM = async () => {
      // Request FCM permissions
      const hasPermission = await requestUserPermission();

      // Request Android notification permission for API 33+
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'This app needs permission to show notifications',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          console.log('🔔 Android notification permission result:', granted);
        } catch (error) {
          console.error('❌ Permission error:', error);
        }
      }

      if (hasPermission) {
        console.log('🚀 FCM initialized successfully');
        
        // Test FCM setup after initialization
        setTimeout(() => {
          testFCMDirectly();
        }, 3000);
        
        // Validate complete setup after user might be loaded
        setTimeout(() => {
          validateFCMSetup();
        }, 5000);
      }
    };

    initializeFCM();

    // ✅ FCM Message Listeners
    const app = getApp();
    const messaging = getMessaging(app);

    // Enhanced message listeners
    const unsubscribeForeground = onMessage(messaging, handleForegroundMessage);
    const unsubscribeBackground = onNotificationOpenedApp(messaging, handleBackgroundMessageOpen);

    // Handle app opened from quit state
    getInitialNotification(messaging).then(remoteMessage => {
      if (remoteMessage) {
        console.log('📱 App opened from quit state via notification:', remoteMessage);
        setTimeout(() => {
          navigateToNotifications();
        }, 2000);
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
    };
  }, []);

  // ⭐ PERIODIC FCM HEALTH CHECK
  useEffect(() => {
    const healthCheckInterval = setInterval(() => {
      if (notificationPermission === 'granted') {
        validateFCMSetup();
      }
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(healthCheckInterval);
  }, [notificationPermission]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent={true} />
      <AuthProvider>
        <AuthNavigator />
      </AuthProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#5B9EED',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});

export default App;

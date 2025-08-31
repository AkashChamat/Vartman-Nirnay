import React, {useEffect, useRef} from 'react';
import {
  StatusBar,
  SafeAreaView,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  AppState,
} from 'react-native';
import {AuthProvider} from './src/Auth/AuthContext';
import AuthNavigator from './src/Auth/AuthNavigator';
import NotificationHelper from './src/Components/NotificationHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getTodayNotifications} from './src/util/apiCall';

const App = () => {
  const intervalRef = useRef(null);
  const appState = useRef(AppState.currentState);

  // Simple notification checker
  const checkForNewNotifications = async () => {
    try {
      console.log('🔍 Checking for new notifications...');
      
      const notifications = await getTodayNotifications();
      const filteredNotifications = Array.isArray(notifications)
        ? notifications.filter(
            notification =>
              notification.channels &&
              notification.channels.toUpperCase().includes('NOTIFICATION'),
          )
        : [];

      // Get previously shown notifications
      const lastChecked = await AsyncStorage.getItem('lastNotificationIds');
      const lastNotificationIds = lastChecked ? JSON.parse(lastChecked) : [];

      // Find new notifications
      const newNotifications = filteredNotifications.filter(
        notification => !lastNotificationIds.includes(notification.id),
      );

      if (newNotifications.length > 0) {
        console.log(`📱 Found ${newNotifications.length} new notifications`);
        NotificationHelper.showMultipleNotifications(newNotifications);

        // Update stored notification IDs
        const currentIds = filteredNotifications.map(n => n.id);
        await AsyncStorage.setItem(
          'lastNotificationIds',
          JSON.stringify(currentIds),
        );
      }
    } catch (error) {
      console.error('❌ Error checking notifications:', error);
    }
  };

  // Start simple interval
  const startNotificationChecker = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      checkForNewNotifications();
    }, 30000); // Check every 30 seconds
    
    console.log('✅ Notification checker started');
  };

  // Stop interval
  const stopNotificationChecker = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    console.log('⏹️ Notification checker stopped');
  };

  useEffect(() => {
    // Configure notifications
    NotificationHelper.configure();

    // Request permissions and start
    const initializeApp = async () => {
      let hasPermission = true;

      // Request notification permission for Android 13+
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        try {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          hasPermission = result === 'granted';
          console.log('🔔 Notification permission:', result);
        } catch (error) {
          console.log('❌ Permission error:', error);
          hasPermission = false;
        }
      }

      if (hasPermission) {
        // Start checking for notifications
        startNotificationChecker();
        
        // Do initial check after 3 seconds
        setTimeout(() => {
          checkForNewNotifications();
        }, 3000);
      }
    };

    // Handle app state changes
    const handleAppStateChange = (nextAppState) => {
      console.log('📱 App state:', appState.current, '→', nextAppState);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        console.log('🔄 App became active - restarting checker');
        startNotificationChecker();
        checkForNewNotifications();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - keep running (will work for a limited time)
        console.log('🔄 App went to background - keeping checker active');
      }
      
      appState.current = nextAppState;
    };

    // Initialize everything
    initializeApp();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      subscription?.remove();
      stopNotificationChecker();
    };
  }, []);

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

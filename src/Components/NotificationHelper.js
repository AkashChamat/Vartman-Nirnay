import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

class NotificationHelper {
  constructor() {
    this.configure();
    this.shownNotifications = new Set();
  }

  configure() {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('📱 Local push notification token:', token);
      },
      onNotification: function (notification) {
        console.log('🔔 Local notification received:', notification);
        if (notification.userInteraction) {
          console.log('👆 User tapped notification');
        }
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channel for Android
    PushNotification.createChannel(
      {
        channelId: "app-notifications",
        channelName: "App Notifications", 
        channelDescription: "General notifications from the app",
        playSound: true,
        soundName: "default",
        importance: 4,
        vibrate: true,
      },
      (created) => console.log(`📢 Notification channel created: ${created}`)
    );
  }

  // Handle both FCM remoteMessage objects and direct parameters
  showNotification(titleOrRemoteMessage, message, data = {}) {
    let title, body, notificationData;
    
    // Check if first parameter is an FCM remoteMessage object
    if (typeof titleOrRemoteMessage === 'object' && titleOrRemoteMessage.notification) {
      // FCM remoteMessage format
      title = titleOrRemoteMessage.notification.title || 'Notification';
      body = titleOrRemoteMessage.notification.body || '';
      notificationData = titleOrRemoteMessage.data || {};
      
      console.log('🔔 Showing FCM notification:', { title, body });
    } else {
      // Direct parameters format
      title = titleOrRemoteMessage || 'Notification';
      body = message || '';
      notificationData = data;
      
      console.log('🔔 Showing direct notification:', { title, body });
    }

    const notificationId = notificationData.id || `${Date.now()}`;
    
    // Prevent duplicate notifications
    if (this.shownNotifications.has(notificationId)) {
      console.log('⚠️ Duplicate notification prevented:', notificationId);
      return;
    }

    // Show local notification
    PushNotification.localNotification({
      channelId: "app-notifications",
      title: title,
      message: body,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
      vibrate: true,
      vibration: 300,
      userInfo: notificationData,
      actions: ['View'],
    });

    // Mark as shown
    this.shownNotifications.add(notificationId);
    
    // Clean up old notification IDs (keep last 100)
    if (this.shownNotifications.size > 100) {
      const oldIds = Array.from(this.shownNotifications).slice(0, 50);
      oldIds.forEach(id => this.shownNotifications.delete(id));
    }
  }

  showMultipleNotifications(notifications) {
    console.log(`📬 Showing ${notifications.length} notifications`);
    notifications.forEach((notification, index) => {
      setTimeout(() => {
        this.showNotification(
          notification.title || 'New Notification',
          notification.description || notification.message || 'You have a new notification',
          {
            id: notification.id,
            type: notification.channels,
            createdDate: notification.createdDate
          }
        );
      }, index * 100); 
    });
  }

  // Clear notification history
  clearNotificationHistory() {
    this.shownNotifications.clear();
    console.log('🧹 Notification history cleared');
  }
}

export default new NotificationHelper();

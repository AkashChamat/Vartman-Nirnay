import PushNotification from 'react-native-push-notification';
import { Platform } from 'react-native';

class NotificationHelper {
  constructor() {
    this.configure();
    this.shownNotifications = new Set(); // Track shown notifications
  }

  configure() {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
        if (notification.userInteraction) {
          console.log('User tapped notification');
        }
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });
    
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
      (created) => console.log(`Notification channel created: ${created}`)
    );
  }

  showNotification(title, message, data = {}) {
    const notificationId = data.id;
    
    // Prevent duplicate notifications
    if (notificationId && this.shownNotifications.has(notificationId)) {
      return;
    }

    PushNotification.localNotification({
      channelId: "app-notifications",
      title: title,
      message: message,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
      vibrate: true,
      vibration: 300,
      userInfo: data,
      actions: ['View'],
    });

    // Mark as shown
    if (notificationId) {
      this.shownNotifications.add(notificationId);
    }
  }

  showMultipleNotifications(notifications) {
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

  // Clear notification history (call when needed)
  clearNotificationHistory() {
    this.shownNotifications.clear();
  }
}

export default new NotificationHelper();

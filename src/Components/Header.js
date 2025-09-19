import {StyleSheet, Text, View, TouchableOpacity, Image} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import Menu from '../Components/Menu';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {getTodayNotifications} from '../util/apiCall';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Header = () => {
  const navigation = useNavigation();
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadReadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('readNotifications');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      console.error('Error loading read notifications:', error);
      return new Set();
    }
  };

  const fetchNotificationCount = async () => {
    try {
      setLoading(true);
      const response = await getTodayNotifications();
      
      const filteredNotifications = Array.isArray(response) 
        ? response.filter(notification => 
            notification.channels && 
            notification.channels.toUpperCase().includes('NOTIFICATION')
          )
        : [];

      const readNotifications = await loadReadNotifications();
      const unreadCount = filteredNotifications.filter(notification => 
        notification.id && !readNotifications.has(notification.id)
      ).length;

      setNotificationCount(unreadCount);
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setNotificationCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPress = () => {
    navigation.navigate('Notification');
  };

  useEffect(() => {
    fetchNotificationCount();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchNotificationCount();
    }, [])
  );

  return (
    <>
      <LinearGradient colors={['#ffffff', '#ffffff']} style={styles.header}>
        <TouchableOpacity style={styles.menuContainer}>
          <Menu />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
          />
        </View>
        <TouchableOpacity
          style={styles.notifications}
          onPress={handleNotificationPress}>
          <Ionicons name="notifications" size={28} color="#0288D1" />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {notificationCount > 99 ? '99+' : notificationCount.toString()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.notifications}
          onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle" size={32} color="#0288D1" />
        </TouchableOpacity>
      </LinearGradient>
    </>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    width: 180,
    height: 55,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  menuContainer: {
    padding: 5,
  },
  notifications: {
    padding: 5,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

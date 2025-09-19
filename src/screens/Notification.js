import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {getTodayNotifications, getAllNotifications} from '../util/apiCall';
import {showInfoMessage} from '../Components/SubmissionMessage';
import NotificationHelper from '../Components/NotificationHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Notification = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [error, setError] = useState(null);
  const [readNotifications, setReadNotifications] = useState(new Set());

  // Load read notifications from AsyncStorage - FIXED: Now properly called
  const loadReadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('readNotifications');
      if (stored) {
        const readIds = JSON.parse(stored);
        setReadNotifications(new Set(readIds));
      } else {
        setReadNotifications(new Set());
      }
    } catch (error) {
      console.error('Error loading read notifications:', error);
      setReadNotifications(new Set());
    }
  };

  const saveReadNotifications = async readSet => {
    try {
      const readArray = [...readSet];
      await AsyncStorage.setItem(
        'readNotifications',
        JSON.stringify(readArray),
      );
    } catch (error) {
      console.error('Error saving read notifications:', error);
    }
  };

  const markAsRead = async notificationId => {
    if (!readNotifications.has(notificationId)) {
      const newReadSet = new Set([...readNotifications, notificationId]);
      setReadNotifications(newReadSet);
      await saveReadNotifications(newReadSet);
    }
  };

  const markAllAsRead = async () => {
    const allIds = notifications.map(n => n.id).filter(id => id);
    if (allIds.length > 0) {
      const newReadSet = new Set([...readNotifications, ...allIds]);
      setReadNotifications(newReadSet);
      await saveReadNotifications(newReadSet);
    }
  };

  const fetchNotifications = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);

      let response;
      if (activeTab === 'today') {
        response = await getTodayNotifications();
      } else {
        response = await getAllNotifications();
      }

      const filteredNotifications = Array.isArray(response)
        ? response.filter(
            notification =>
              notification.channels &&
              notification.channels.toUpperCase().includes('NOTIFICATION'),
          )
        : [];

      setNotifications(filteredNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.message || 'Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // FIXED: Load read notifications on component mount
  useEffect(() => {
    const initializeScreen = async () => {
      await loadReadNotifications();
      await fetchNotifications();
    };
    initializeScreen();
  }, []);

  // Fetch notifications when tab changes
  useEffect(() => {
    if (readNotifications.size >= 0) {
      // Only fetch after read notifications are loaded
      fetchNotifications();
    }
  }, [activeTab]);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const refreshScreen = async () => {
        await loadReadNotifications(); // Always reload read state
        await fetchNotifications(false);
      };
      refreshScreen();
    }, [activeTab]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReadNotifications();
    await fetchNotifications(false);
  };

  const handleTabChange = tab => {
    setActiveTab(tab);
  };

  const handleNotificationPress = async item => {
    if (item.id && !readNotifications.has(item.id)) {
      await markAsRead(item.id);
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'No date';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        return 'Today';
      } else if (diffDays === 2) {
        return 'Yesterday';
      } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
      } else {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(n => n.id && !readNotifications.has(n.id))
      .length;
  };

  const renderNotificationItem = ({item, index}) => {
    const isRead = item.id ? readNotifications.has(item.id) : false;

    return (
      <TouchableOpacity
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
        style={styles.notificationTouchable}>
        <View
          style={[
            styles.notificationCard,
            !isRead && styles.unreadNotificationCard,
          ]}>
          {/* Unread indicator dot - IMPROVED POSITION */}
          {!isRead && <View style={styles.unreadIndicator} />}

          <View style={styles.notificationContent}>
            {item.image ? (
              <Image
                source={{uri: item.image}}
                style={styles.notificationImage}
              />
            ) : (
              <View style={styles.notificationImagePlaceholder}>
                <Ionicons name="image-outline" size={24} color="#ccc" />
              </View>
            )}
            <View style={styles.notificationTextContainer}>
              <Text
                style={[
                  styles.notificationTitle,
                  !isRead && styles.unreadNotificationTitle,
                ]}>
                {item.title || 'No Title'}
              </Text>
              <Text
                style={[
                  styles.notificationDescription,
                  !isRead && styles.unreadNotificationDescription,
                ]}
                numberOfLines={3}>
                {item.description || 'No description available'}
              </Text>
              <View style={styles.notificationFooter}>
                <Text style={styles.notificationDate}>
                  {formatDate(item.createdDate)}
                </Text>
                <View
                  style={[
                    styles.channelBadge,
                    !isRead && styles.unreadChannelBadge,
                  ]}>
                  <Text style={styles.channelText}>
                    {item.channels || 'NOTIFICATION'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.chevronContainer}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={isRead ? '#ccc' : '#0288D1'}
              style={styles.chevronIcon}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyDescription}>
        {activeTab === 'today'
          ? "You don't have any notifications for today"
          : "You don't have any notifications yet"}
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={80} color="#ff6b6b" />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorDescription}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => fetchNotifications()}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0288D1', '#0277BD']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Notifications {getUnreadCount() > 0 && `(${getUnreadCount()})`}
        </Text>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={markAllAsRead}
          disabled={getUnreadCount() === 0}>
          <Text
            style={[
              styles.markAllReadText,
              getUnreadCount() === 0 && styles.markAllReadTextDisabled,
            ]}>
            Mark All Read
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'today' && styles.activeTabButton,
          ]}
          onPress={() => handleTabChange('today')}>
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'today' && styles.activeTabButtonText,
            ]}>
            Today
          </Text>
          {activeTab === 'today' && getUnreadCount() > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{getUnreadCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'all' && styles.activeTabButton,
          ]}
          onPress={() => handleTabChange('all')}>
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'all' && styles.activeTabButtonText,
            ]}>
            All
          </Text>
          {activeTab === 'all' && getUnreadCount() > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{getUnreadCount()}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0288D1" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : error ? (
          renderErrorState()
        ) : notifications.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item, index) =>
              item.id ? item.id.toString() : `notification-${index}`
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#0288D1']}
                tintColor="#0288D1"
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}
      </View>
    </View>
  );
};

export default Notification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  notificationTouchable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  unreadNotificationCard: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: 4,
    borderLeftColor: '#0288D1',
    elevation: 3,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff4444',
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
    elevation: 5,
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
  },
  notificationImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  notificationTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 22,
  },
  unreadNotificationTitle: {
    fontWeight: '700',
    color: '#000',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  unreadNotificationDescription: {
    color: '#333',
    fontWeight: '500',
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
  channelBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  unreadChannelBadge: {
    backgroundColor: '#0288D1',
  },
  channelText: {
    fontSize: 10,
    color: '#0288D1',
    fontWeight: '600',
  },
  chevronContainer: {
    justifyContent: 'center',
    paddingLeft: 8,
  },
  chevronIcon: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  markAllButton: {
    padding: 8,
    marginLeft: 8,
  },
  markAllReadText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  markAllReadTextDisabled: {
    opacity: 0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  activeTabButton: {
    borderBottomColor: '#0288D1',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  activeTabButtonText: {
    color: '#0288D1',
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  separator: {
    height: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0288D1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});

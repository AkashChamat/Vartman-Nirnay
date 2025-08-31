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

const Notification = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'all'
  const [error, setError] = useState(null);

  const fetchNotificationsOnFocus = async () => {
    try {
      setError(null);
      setLoading(false);

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
      setRefreshing(false);
    }
  };

  // Fetch notifications based on active tab
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

      // Filter notifications to show only those with channels containing 'NOTIFICATION'
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

  // Fetch notifications when component mounts or tab changes
  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  useFocusEffect(
    React.useCallback(() => {
      fetchNotificationsOnFocus();
    }, [activeTab]),
  );

  // Pull to refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotificationsOnFocus(); 
  };

  // Handle tab change
  const handleTabChange = tab => {
    setActiveTab(tab);
  };

  // Format date for display
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

  // Render individual notification item
  const renderNotificationItem = ({item, index}) => (
    <TouchableOpacity
      style={styles.notificationCard}
      onPress={() => {
        // Handle notification tap - you can navigate to detail screen or show alert
        showInfoMessage(
          item.title || 'Notification',
          item.description || 'No description available',
        );
      }}
      activeOpacity={0.7}>
      <View style={styles.notificationContent}>
        {item.image && (
          <Image source={{uri: item.image}} style={styles.notificationImage} />
        )}
        <View style={styles.notificationTextContainer}>
          <Text style={styles.notificationTitle} numberOfLines={2}>
            {item.title || 'No Title'}
          </Text>
          <Text style={styles.notificationDescription} numberOfLines={3}>
            {item.description || 'No description available'}
          </Text>
          <View style={styles.notificationFooter}>
            <Text style={styles.notificationDate}>
              {formatDate(item.createdDate)}
            </Text>
            <View style={styles.channelBadge}>
              <Text style={styles.channelText}>
                {item.channels || 'NOTIFICATION'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color="#666"
        style={styles.chevronIcon}
      />
    </TouchableOpacity>
  );

  // Render empty state
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

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={80} color="#ff6b6b" />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorDescription}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#fff" />
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
              item.id ? item.id.toString() : index.toString()
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Account for status bar
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
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
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
  },
  notificationImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
  },
  channelBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  channelText: {
    fontSize: 10,
    color: '#0288D1',
    fontWeight: '500',
  },
  chevronIcon: {
    marginLeft: 8,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
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
    fontSize: 24,
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
});

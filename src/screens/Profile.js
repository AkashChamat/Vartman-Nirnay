import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,

  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../Auth/AuthContext';
import { getUserByEmail } from '../util/apiCall';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { showErrorMessage } from '../Components/SubmissionMessage';

const ProfilePage = () => {
  const { getUserEmail, isAuthenticated } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to safely convert any value to string
  const safeString = (value) => {
    if (value === null || value === undefined || value === '') {
      return 'Not provided';
    }
    if (typeof value === 'number' && value === 0) {
      return 'Not provided';
    }
    return String(value);
  };

  // Function to fetch user data
  const fetchUserData = async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      setError(null);

      const userEmail = getUserEmail();

      if (!userEmail) {
        throw new Error('No email found. Please login again.');
      }

      const response = await getUserByEmail(userEmail);
      
      if (response && response.data) {
        setUserData(response.data);
      } else if (response) {
        setUserData(response);
      } else {
        throw new Error('No user data received');
      }
    } catch (err) {
      console.error('❌ Error fetching user data:', err);
      const errorMessage = err.message || 'Failed to load user data';
      setError(errorMessage);

      showErrorMessage('Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Function to handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData(false);
  };

  // Function to retry loading
  const retryLoading = () => {
    fetchUserData(true);
  };

  // Load user data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserData();
    }
  }, [isAuthenticated]);

  // Show loading spinner
  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
        <Footer />
      </View>
    );
  }

  // Show error state
  if (error && !userData) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{safeString(error)}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryLoading}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <Footer />
      </View>
    );
  }

  // Render user profile
  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']}
            tintColor="#4f46e5"
          />
        }>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>My Profile</Text>
        </View>

        {userData ? (
          <View style={styles.profileContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>
                  {safeString(userData.userName)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>
                  {safeString(userData.email)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Contact:</Text>
                <Text style={styles.value}>
                  {safeString(userData.contact)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Exam:</Text>
                <Text style={styles.value}>
                  {safeString(userData.examName)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>District:</Text>
                <Text style={styles.value}>
                  {safeString(userData.district)}
                </Text>
              </View>
            </View>

            {userData.addresses && Array.isArray(userData.addresses) && userData.addresses.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Addresses</Text>
                {userData.addresses.map((address, index) => {
                  if (!address || typeof address !== 'object') {
                    return null;
                  }
                  
                  return (
                    <View key={index} style={styles.addressCard}>
                      <Text style={styles.addressTitle}>
                        Address {index + 1}
                      </Text>
                      
                      {address.address && address.address.trim() !== '' && (
                        <Text style={styles.addressText}>
                          {safeString(address.address)}
                        </Text>
                      )}
                      
                      {address.area && address.area.trim() !== '' && (
                        <Text style={styles.addressText}>
                          Area: {safeString(address.area)}
                        </Text>
                      )}
                      
                      {address.city && address.city.trim() !== '' && (
                        <Text style={styles.addressText}>
                          City: {safeString(address.city)}
                        </Text>
                      )}
                      
                      {address.district && address.district.trim() !== '' && (
                        <Text style={styles.addressText}>
                          District: {safeString(address.district)}
                        </Text>
                      )}
                      
                      {address.state && address.state.trim() !== '' && (
                        <Text style={styles.addressText}>
                          State: {safeString(address.state)}
                        </Text>
                      )}

                      
                      {address.landmark && address.landmark.trim() !== '' && (
                        <Text style={styles.addressText}>
                          Landmark: {safeString(address.landmark)}
                        </Text>
                      )}
                      
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Details</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Member Since:</Text>
                <Text style={styles.value}>
                  {safeString(userData.createdDate)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>No user data available</Text>
            <TouchableOpacity style={styles.retryButton} onPress={retryLoading}>
              <Text style={styles.retryButtonText}>Reload</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
      
      <Footer />
    </View>
  );
};

export default ProfilePage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  titleContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  profileContainer: {
    padding: 20,
    paddingTop: 0,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    width: 90,
    flexShrink: 0,
  },
  value: {
    fontSize: 14,
    color: '#1f2937',
    flex: 1,
    fontWeight: '400',
    lineHeight: 20,
  },
  addressCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4f46e5',
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4f46e5',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
    lineHeight: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#4f46e5',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import {useAuth} from '../Auth/AuthContext';
import {
  getUserByEmail,
  addAddress,
  updateAddress,
  deleteAddress,
} from '../util/apiCall';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import {
  showErrorMessage,
  showSuccessMessage,
} from '../Components/SubmissionMessage';
import {useNavigation} from '@react-navigation/native';
import {Picker} from '@react-native-picker/picker';

// Indian States Array
const indianStates = [
  'Select State',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Puducherry',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep',
  'Andaman and Nicobar Islands',
];

// Modal Styles for the form
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 22,
    width: '90%',
    maxHeight: '80%',
  },
  title: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 18,
    textAlign: 'center',
  },
  input: {
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
  },
  requiredInput: {
    borderWidth: 1.5,
  },
  pickerContainer: {
    borderColor: '#e5e7eb',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  requiredPickerContainer: {
    borderWidth: 1.5,
  },
  picker: {
    height: 50,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6b7280',
    borderRadius: 6,
  },
  saveButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#4f46e5',
    borderRadius: 6,
    alignItems: 'center',
    marginLeft: 10,
  },
  requiredText: {
    fontSize: 12,
    color: '#dc2626',
    marginBottom: 15,
    textAlign: 'center',
  },
});

// Enhanced Success Popup Modal
// Enhanced Success Popup Modal with Improved Button Design
const SuccessModal = ({visible, onCancel, onGoToBookstore}) => (
  <Modal visible={visible} animationType="fade" transparent>
    <View style={modalStyles.overlay}>
      <View
        style={[
          modalStyles.container,
          {alignItems: 'center', paddingVertical: 30},
        ]}>
        {/* Success Icon */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#d1fae5',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
          }}>
          <Text style={{fontSize: 40, color: '#10b981'}}>✓</Text>
        </View>

        <Text
          style={[
            modalStyles.title,
            {fontSize: 22, marginBottom: 15, color: '#1f2937'},
          ]}>
          Address Added Successfully!
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: 30,
            lineHeight: 22,
            paddingHorizontal: 10,
          }}>
          Your address has been saved. Would you like to browse our bookstore?
        </Text>

        {/* Improved Button Container */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
            paddingHorizontal: 10,
            gap: 15, // Modern gap property for spacing
          }}>
          {/* Cancel Button - Improved Design */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#f8f9fa',
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: '#e9ecef',
              alignItems: 'center',
              justifyContent: 'center',
              // Shadow for depth
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 1,
              },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
            onPress={onCancel}>
            <Text
              style={{
                color: '#495057',
                fontWeight: '600',
                fontSize: 16,
                letterSpacing: 0.3,
              }}>
              Cancel
            </Text>
          </TouchableOpacity>

          {/* Go to Bookstore Button - Improved Design */}
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#4f46e5',
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              // Enhanced shadow for primary button
              shadowColor: '#4f46e5',
              shadowOffset: {
                width: 0,
                height: 3,
              },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}
            onPress={onGoToBookstore}>
            <Text
              style={{
                color: 'white',
                fontWeight: '600',
                fontSize: 16,
                letterSpacing: 0.3,
              }}>
              Go to Bookstore
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const AddressForm = ({visible, onClose, onSubmit, initialValues = {}}) => {
  const [address, setAddress] = useState(initialValues.address || '');
  const [area, setArea] = useState(initialValues.area || '');
  const [city, setCity] = useState(initialValues.city || '');
  const [district, setDistrict] = useState(initialValues.district || '');
  const [stateVal, setStateVal] = useState(
    initialValues.state || 'Select State',
  );
  const [landmark, setLandmark] = useState(initialValues.landmark || '');
  const [pincode, setPincode] = useState(
    initialValues.pincode ? initialValues.pincode.toString() : '',
  );

  useEffect(() => {
    if (visible) {
      setAddress(initialValues.address || '');
      setArea(initialValues.area || '');
      setCity(initialValues.city || '');
      setDistrict(initialValues.district || '');
      setStateVal(initialValues.state || 'Select State');
      setLandmark(initialValues.landmark || '');
      setPincode(initialValues.pincode ? initialValues.pincode.toString() : '');
    }
  }, [visible, initialValues]);

  const validateAndSubmit = () => {
    // Validate required fields
    const requiredFields = [
      {value: address.trim(), name: 'Address'},
      {value: area.trim(), name: 'Area'},
      {value: city.trim(), name: 'City'},
      {value: district.trim(), name: 'District'},
      {
        value: stateVal !== 'Select State' ? stateVal.trim() : '',
        name: 'State',
      },
      {value: pincode.trim(), name: 'Pincode'},
    ];

    const emptyFields = requiredFields.filter(field => !field.value);

    if (emptyFields.length > 0) {
      Alert.alert(
        'Required Fields Missing',
        `Please fill in the following required fields: ${emptyFields
          .map(f => f.name)
          .join(', ')}`,
        [{text: 'OK'}],
      );
      return;
    }

    // Validate pincode format
    if (!/^\d{6}$/.test(pincode.trim())) {
      Alert.alert('Invalid Pincode', 'Please enter a valid 6-digit pincode', [
        {text: 'OK'},
      ]);
      return;
    }

    // Submit the form
    onSubmit({
      address: address.trim(),
      area: area.trim(),
      city: city.trim(),
      district: district.trim(),
      state: stateVal.trim(),
      landmark: landmark.trim(),
      pincode: parseInt(pincode.trim(), 10),
      id: initialValues.id,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={modalStyles.title}>
              {initialValues.id ? 'Update Address' : 'Add Address'}
            </Text>

            <Text style={modalStyles.requiredText}>
              * Fields marked are required (except Landmark)
            </Text>

            <TextInput
              style={[
                modalStyles.input,
                !address.trim() && modalStyles.requiredInput,
              ]}
              placeholder="Address *"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />

            <TextInput
              style={[
                modalStyles.input,
                !area.trim() && modalStyles.requiredInput,
              ]}
              placeholder="Area *"
              value={area}
              onChangeText={setArea}
            />

            <TextInput
              style={[
                modalStyles.input,
                !city.trim() && modalStyles.requiredInput,
              ]}
              placeholder="City *"
              value={city}
              onChangeText={setCity}
            />

            <TextInput
              style={[
                modalStyles.input,
                !district.trim() && modalStyles.requiredInput,
              ]}
              placeholder="District *"
              value={district}
              onChangeText={setDistrict}
            />

            {/* State Picker */}
            <View
              style={[
                modalStyles.pickerContainer,
                stateVal === 'Select State' &&
                  modalStyles.requiredPickerContainer,
              ]}>
              <Picker
                selectedValue={stateVal}
                onValueChange={itemValue => setStateVal(itemValue)}
                style={modalStyles.picker}
                mode="dropdown">
                {indianStates.map((state, index) => (
                  <Picker.Item
                    key={index}
                    label={state}
                    value={state}
                    color={state === 'Select State' ? '#9ca3af' : '#1f2937'}
                  />
                ))}
              </Picker>
            </View>

            <TextInput
              style={modalStyles.input}
              placeholder="Landmark (Optional)"
              value={landmark}
              onChangeText={setLandmark}
            />

            <TextInput
              style={[
                modalStyles.input,
                (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) &&
                  modalStyles.requiredInput,
              ]}
              placeholder="Pincode *"
              value={pincode}
              onChangeText={setPincode}
              keyboardType="numeric"
              maxLength={6}
            />

            <View style={modalStyles.buttonGroup}>
              <TouchableOpacity
                style={modalStyles.cancelButton}
                onPress={onClose}>
                <Text style={{color: '#6b7280', fontWeight: '600'}}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={modalStyles.saveButton}
                onPress={validateAndSubmit}>
                <Text style={{color: 'white', fontWeight: '600'}}>
                  {initialValues.id ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const ProfilePage = () => {
  const {getUserEmail, isAuthenticated} = useAuth();
  const navigation = useNavigation();

  const {height} = Dimensions.get('window');

  const isLargeScreen = height > 700;
  const hasHomeButton = Platform.OS === 'android' && height < 750; // Likely has home button/navigation bar

  const scrollBottomPadding = hasHomeButton ? 100 : isLargeScreen ? 90 : 80;
  const footerHeight = hasHomeButton ? 70 : 60;

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editAddress, setEditAddress] = useState(null);

  // For showing success modal after adding address
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const safeString = value => {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    if (typeof value === 'number' && value === 0) {
      return 'N/A';
    }
    return String(value);
  };

  // Fetch User
  const fetchUserData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setError(null);
      const userEmail = getUserEmail();
      if (!userEmail) throw new Error('No email found. Please login again.');
      const response = await getUserByEmail(userEmail);
      if (response && response.data) setUserData(response.data);
      else if (response) setUserData(response);
      else throw new Error('No user data received');
    } catch (err) {
      setError(err.message || 'Failed to load user data');
      showErrorMessage('Error', err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData(false);
  };

  const retryLoading = () => {
    fetchUserData(true);
  };

  // -------- FIXED Address CRUD Handlers -----------
  const handleAddOrUpdateAddress = async addressObj => {
    try {
      if (!userData?.id) {
        showErrorMessage('Error', 'User not available');
        return;
      }

      if (addressObj.id) {
        // Create payload that EXACTLY matches your working web version
        const addressData = {
          address: addressObj.address,
          area: addressObj.area,
          landmark: addressObj.landmark || '', // Use empty string instead of null
          city: addressObj.city,
          district: addressObj.district,
          state: addressObj.state,
          pincode: addressObj.pincode,
          vuser: {
            id: userData.id,
          },
        };

        try {
          const updateResult = await updateAddress(addressObj.id, addressData);

          showErrorMessage('Success', 'Address updated successfully');
          setModalVisible(false);
          setEditAddress(null);
          fetchUserData(false);
        } catch (updateError) {
          throw updateError;
        }
      } else {
        // ADD operation remains the same
        const addPayload = {
          address: addressObj.address,
          area: addressObj.area,
          landmark: addressObj.landmark || '',
          city: addressObj.city,
          district: addressObj.district,
          state: addressObj.state,
          pincode: addressObj.pincode,
          vuser: {
            id: userData.id,
          },
        };

        await addAddress(addPayload);
        setModalVisible(false);
        setEditAddress(null);
        setShowSuccessModal(true);
        fetchUserData(false);
      }
    } catch (err) {
      showErrorMessage('Error', err.message || 'Operation failed');
    }
  };

  const handleDeleteAddress = async addressId => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!userData?.id || !addressId) {
                showErrorMessage('Error', 'User or address not available');
                return;
              }

              const result = await deleteAddress(addressId);
              console.log('Delete result:', result); // This should log the response

              // Show success message - you can use result.message or a custom message
              showSuccessMessage(
                'Success',
                result?.message || 'Address deleted successfully',
              );
              fetchUserData(false);
            } catch (err) {
              console.error('Delete error:', err);
              showErrorMessage('Error', err.message || 'Delete failed');
            }
          },
        },
      ],
    );
  };

  useEffect(() => {
    if (isAuthenticated) fetchUserData();
  }, [isAuthenticated]);

  // --- Handlers for Success Modal
  const onSuccessCancel = () => setShowSuccessModal(false);
  const onSuccessGoToBookstore = () => {
    setShowSuccessModal(false);
    navigation.navigate('Books'); // Navigate to Books page
  };

  // Loading...
  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0288D1" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
        <Footer />
      </View>
    );
  }

  // Error...
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

  // Main Profile
  return (
    <View style={styles.container}>
      <Header />

      <ScrollView
        style={[styles.scrollContainer, { marginBottom: footerHeight }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4f46e5']}
            tintColor="#4f46e5"
          />
        }contentContainerStyle={{ paddingBottom: scrollBottomPadding }}>
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
                <Text style={styles.value}>{safeString(userData.email)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Contact:</Text>
                <Text style={styles.value}>{safeString(userData.contact)}</Text>
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

            <View style={styles.section}>
              {/* Header row with add btn */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}>
                <Text style={styles.sectionTitle}>Addresses</Text>
                <TouchableOpacity
                  onPress={() => {
                    setEditAddress(null);
                    setModalVisible(true);
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: '#4f46e5',
                    borderRadius: 6,
                  }}>
                  <Text style={{color: 'white', fontWeight: '600'}}>
                    + ADD ADDRESS
                  </Text>
                </TouchableOpacity>
              </View>

              {userData.addresses &&
              Array.isArray(userData.addresses) &&
              userData.addresses.length > 0 ? (
                userData.addresses.map((address, index) => {
                  if (!address || typeof address !== 'object') return null;
                  return (
                    <View key={address.id || index} style={styles.addressCard}>
                      <Text style={styles.addressTitle}>
                        Address {index + 1}
                      </Text>

                      <View style={styles.addressField}>
                        <Text style={styles.fieldLabel}>Street Address</Text>
                        <Text style={styles.fieldValue}>
                          {safeString(address.address)}
                        </Text>
                      </View>

                      <View style={styles.addressField}>
                        <Text style={styles.fieldLabel}>Area</Text>
                        <Text style={styles.fieldValue}>
                          {safeString(address.area)}
                        </Text>
                      </View>

                      {address.landmark && address.landmark.trim() !== '' && (
                        <View style={styles.addressField}>
                          <Text style={styles.fieldLabel}>Landmark</Text>
                          <Text style={styles.fieldValue}>
                            {safeString(address.landmark)}
                          </Text>
                        </View>
                      )}

                      <View style={styles.addressField}>
                        <Text style={styles.fieldLabel}>
                          City, District, State
                        </Text>
                        <Text style={styles.fieldValue}>
                          {safeString(address.city)},{' '}
                          {safeString(address.district)},{' '}
                          {safeString(address.state)}
                        </Text>
                      </View>

                      <View style={styles.addressField}>
                        <Text style={styles.fieldLabel}>Pincode</Text>
                        <Text
                          style={[
                            styles.fieldValue,
                            {fontWeight: '600', color: '#4f46e5'},
                          ]}>
                          {safeString(address.pincode)}
                        </Text>
                      </View>

                      {/* Edit/Delete Buttons */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'flex-end',
                          marginTop: 12,
                          paddingTop: 8,
                          borderTopWidth: 1,
                          borderTopColor: '#e5e7eb',
                        }}>
                        <TouchableOpacity
                          style={{
                            marginRight: 16,
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                          }}
                          onPress={() => {
                            setEditAddress(address);
                            setModalVisible(true);
                          }}>
                          <Text style={{color: '#0ea5e9', fontWeight: '600'}}>
                            Edit
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{paddingVertical: 4, paddingHorizontal: 8}}
                          onPress={() => handleDeleteAddress(address.id)}>
                          <Text style={{color: '#dc2626', fontWeight: '600'}}>
                            Delete
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View
                  style={{
                    padding: 20,
                    backgroundColor: '#f8fafc',
                    borderRadius: 8,
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: '#e2e8f0',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={[
                      styles.addressText,
                      {color: '#64748b', fontStyle: 'italic', fontSize: 16},
                    ]}>
                    No addresses added yet
                  </Text>
                  <Text style={{color: '#94a3b8', fontSize: 14, marginTop: 4}}>
                    Add your first address to get started
                  </Text>
                </View>
              )}
            </View>

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

      {/* Modal for Add/Edit Address */}
      <AddressForm
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditAddress(null);
        }}
        onSubmit={handleAddOrUpdateAddress}
        initialValues={editAddress || {}}
      />

      {/* Enhanced Address Added Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        onCancel={onSuccessCancel}
        onGoToBookstore={onSuccessGoToBookstore}
      />

      <Footer />
    </View>
  );
};

export default ProfilePage;

// Updated styles (same as before)
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
    marginBottom: 12,
  },
  addressField: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
    lineHeight: 18,
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
    color: '#0288D1',
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

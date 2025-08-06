import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import React, {useState, useEffect} from 'react';
import {getAllBooks, getUserByEmail} from '../../util/apiCall';
import {useAuth} from '../../Auth/AuthContext';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';

const Books = () => {
  const navigation = useNavigation();
  const {getUserEmail} = useAuth();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // Address selection modal states
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);

  // Function to fetch books from API
  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAllBooks();
      setBooks(data);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError(err.message);
      Alert.alert('Error', 'Failed to fetch books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch user data
  const fetchUserData = async () => {
    try {
      const email = await getUserEmail();
      if (!email) return null;

      const response = await getUserByEmail(email);
      return response;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Fetch books when component mounts
  useEffect(() => {
    fetchBooks();
  }, []);

  // Refresh user data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadUserData = async () => {
        const user = await fetchUserData();
        setUserData(user);
      };
      loadUserData();
    }, [])
  );

  // Handle book press
  const handleBookPress = async (book) => {
    if (book.price === 0) {
      // Handle free book - navigate to reading screen
      console.log('Opening free book:', book.bookName);
      // Add your navigation logic here for free books
      // navigation.navigate('BookReader', { book });
      Alert.alert('Free Book', 'This feature will be available soon!');
    } else {
      // Handle paid book - check user data and show address selection
      setSelectedBook(book);
      setAddressLoading(true);
      setShowAddressModal(true);

      // Fetch fresh user data
      const user = await fetchUserData();
      setUserData(user);
      setAddressLoading(false);

      if (!user) {
        setShowAddressModal(false);
        Alert.alert('Error', 'Please login to continue with the purchase.');
        return;
      }

      if (!user.contact) {
        setShowAddressModal(false);
        Alert.alert(
          'Phone Number Required',
          'Please add your phone number in profile to continue with the purchase.',
          [
            {
              text: 'Go to Profile',
              onPress: () => navigation.navigate('Profile'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        return;
      }

      if (!user.addresses || user.addresses.length === 0) {
        setShowAddressModal(false);
        Alert.alert(
          'No Address Found',
          'Please add an address in your profile to continue with the payment.',
          [
            {
              text: 'Go to Profile',
              onPress: () => navigation.navigate('Profile'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
        return;
      }
    }
  };

  // Handle address selection
  const handleAddressSelection = (address) => {
    setSelectedAddress(address);
  };

  // Proceed to payment with selected address
  const proceedToPayment = () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select an address to continue.');
      return;
    }

    setShowAddressModal(false);
    
    // Navigate to payment screen with book and address data
    navigation.navigate('BookPaymentScreen', {
      book: selectedBook,
      addressId: selectedAddress.id,
      userData: userData,
    });

    // Reset states
    setSelectedBook(null);
    setSelectedAddress(null);
  };

  // Close address modal
  const closeAddressModal = () => {
    setShowAddressModal(false);
    setSelectedBook(null);
    setSelectedAddress(null);
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0';
    return `₹${Number.parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
    })}`;
  };

  // Render address selection modal
  const renderAddressModal = () => (
    <Modal
      visible={showAddressModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeAddressModal}>
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={closeAddressModal} style={modalStyles.closeButton}>
            <Text style={modalStyles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={modalStyles.headerTitle}>Select Address</Text>
          <View style={modalStyles.headerSpacer} />
        </View>

        {addressLoading ? (
          <View style={modalStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={modalStyles.loadingText}>Loading addresses...</Text>
          </View>
        ) : (
          <ScrollView style={modalStyles.content} showsVerticalScrollIndicator={false}>
            {/* Book Summary */}
            {selectedBook && (
              <View style={modalStyles.bookSummary}>
                <Text style={modalStyles.summaryTitle}>Book Purchase</Text>
                <View style={modalStyles.summaryRow}>
                  <Text style={modalStyles.summaryLabel}>Book:</Text>
                  <Text style={modalStyles.summaryValue}>{selectedBook.bookName}</Text>
                </View>
                <View style={modalStyles.summaryRow}>
                  <Text style={modalStyles.summaryLabel}>Price:</Text>
                  <Text style={modalStyles.summaryValue}>{formatCurrency(selectedBook.price)}</Text>
                </View>
                {userData && (
                  <View style={modalStyles.summaryRow}>
                    <Text style={modalStyles.summaryLabel}>Email:</Text>
                    <Text style={modalStyles.summaryValue}>{userData.email}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Address Selection */}
            <View style={modalStyles.addressSection}>
              <Text style={modalStyles.addressTitle}>Select Delivery Address</Text>
              {userData?.addresses?.map((address, index) => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    modalStyles.addressCard,
                    selectedAddress?.id === address.id && modalStyles.selectedAddressCard,
                  ]}
                  onPress={() => handleAddressSelection(address)}>
                  <View style={modalStyles.addressHeader}>
                    <View
                      style={[
                        modalStyles.radioButton,
                        selectedAddress?.id === address.id && modalStyles.selectedRadioButton,
                      ]}>
                      {selectedAddress?.id === address.id && (
                        <View style={modalStyles.radioButtonInner} />
                      )}
                    </View>
                    <Text style={modalStyles.addressLabel}>Address {index + 1}</Text>
                  </View>
                  
                  <View style={modalStyles.addressDetails}>
                    {address.address && (
                      <Text style={modalStyles.addressText}>{address.address}</Text>
                    )}
                    {address.area && (
                      <Text style={modalStyles.addressText}>{address.area}</Text>
                    )}
                    <Text style={modalStyles.addressText}>
                      {address.city && `${address.city}, `}
                      {address.district}
                      {address.pincode ? ` - ${address.pincode}` : ''}
                    </Text>
                    {address.state && (
                      <Text style={modalStyles.addressText}>{address.state}</Text>
                    )}
                    {address.landmark && (
                      <Text style={modalStyles.landmarkText}>
                        Landmark: {address.landmark}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={modalStyles.addAddressButton}
                onPress={() => {
                  closeAddressModal();
                  navigation.navigate('Profile');
                }}>
                <Text style={modalStyles.addAddressButtonText}>+ Add New Address</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                modalStyles.proceedButton,
                !selectedAddress && modalStyles.proceedButtonDisabled,
              ]}
              onPress={proceedToPayment}
              disabled={!selectedAddress}>
              <Text
                style={[
                  modalStyles.proceedButtonText,
                  !selectedAddress && modalStyles.proceedButtonTextDisabled,
                ]}>
                Proceed to Payment
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  // Render individual book item
  const renderBookItem = ({item}) => (
    <View style={styles.bookCard}>
      <Image
        source={{uri: item.uploadThumbnail}}
        style={styles.bookThumbnail}
        resizeMode="cover"
      />

      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.bookName}
        </Text>

        <Text style={styles.bookDescription} numberOfLines={1}>
          {item.description}
        </Text>

        <View style={styles.bookMeta}>
          <Text style={styles.publisher}>Author: {item.writerName}</Text>
          <Text style={styles.category}>Publisher: {item.publisherName}</Text>
        </View>
{/* 
        {item.price > 0 && (
          <Text style={styles.price}>{formatCurrency(item.price)}</Text>
        )} */}

        <TouchableOpacity
          style={[
            styles.actionButton,
            item.price === 0 ? styles.freeButton : styles.paidButton,
          ]}
          onPress={() => handleBookPress(item)}>
          <Text
            style={[
              styles.actionButtonText,
              item.price === 0 ? styles.freeButtonText : styles.paidButtonText,
            ]}>
            {item.price === 0 ? 'Read' : 'Get Access'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading books...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading books</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBooks}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (books.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>No books available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      <Footer />
      {renderAddressModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  bookCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    padding: 12,
  },
  bookThumbnail: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  bookInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  bookDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bookMeta: {
    marginBottom: 8,
  },
  publisher: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: '#888',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  freeButton: {
    backgroundColor: '#34C759',
  },
  paidButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  freeButtonText: {
    color: '#ffffff',
  },
  paidButtonText: {
    color: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f3f4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#5f6368',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  bookSummary: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  addressSection: {
    marginBottom: 20,
  },
  addressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e1e5e9',
  },
  selectedAddressCard: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioButton: {
    borderColor: '#007AFF',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  addressDetails: {
    marginLeft: 32,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  landmarkText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  addAddressButton: {
    backgroundColor: '#f1f3f4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderStyle: 'dashed',
  },
  addAddressButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  proceedButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  proceedButtonDisabled: {
    backgroundColor: '#ccc',
  },
  proceedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  proceedButtonTextDisabled: {
    color: '#999',
  },
});

export default Books;
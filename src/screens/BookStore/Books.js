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
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import React, {useState, useEffect, useRef} from 'react';
import {Picker} from '@react-native-picker/picker';
import {
  getAllBooks,
  getUserByEmail,
  getBookCategories,
  getBookSubCategories,
} from '../../util/apiCall';
import {useAuth} from '../../Auth/AuthContext';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';

const Books = () => {
  const navigation = useNavigation();
  const {getUserEmail} = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(26);
  const [paginatedBooks, setPaginatedBooks] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // Pagination functions
  const calculatePagination = books => {
    const total = Math.ceil(books.length / itemsPerPage);
    setTotalPages(total);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = books.slice(startIndex, endIndex);

    setPaginatedBooks(paginated);
  };

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Book and user states
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  // Filter states
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(false);

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);

  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoBook, setDemoBook] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);

  const {width, height} = Dimensions.get('window');
  const isLargeScreen = height > 700;
  const hasHomeButton = Platform.OS === 'android' && height < 750;
  const scrollBottomPadding = hasHomeButton ? 40 : isLargeScreen ? 40 : 50;
  const footerHeight = hasHomeButton ? 70 : 60;

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllBooks();
      setBooks(data);
      setFilteredBooks(data);
    } catch (err) {
      console.error('Error fetching books:', err);
      setError(err.message);
      Alert.alert('Error', 'Failed to fetch books. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await getBookCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchSubCategories = async categoryId => {
    try {
      setSubCategoriesLoading(true);
      const data = await getBookSubCategories(categoryId);
      setSubCategories(data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    } finally {
      setSubCategoriesLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const email = await getUserEmail();
      if (!email) return null;
      return await getUserByEmail(email);
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  useEffect(() => {
    calculatePagination(filteredBooks);
  }, [currentPage, filteredBooks]);

  // Filter logic
  const applyFilters = () => {
    let filtered = books;

    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(
        book => book.categoryId?.toString() === selectedCategory,
      );
    }

    if (selectedSubCategory && selectedSubCategory !== 'all') {
      filtered = filtered.filter(
        book => book.subCategoryId?.toString() === selectedSubCategory,
      );
    }

    setFilteredBooks(filtered);
    setCurrentPage(1); // Reset to first page when filters change
    calculatePagination(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [selectedCategory, selectedSubCategory, books]);

  // Handle category selection
  const handleCategoryChange = async categoryId => {
    setSelectedCategory(categoryId);
    setSelectedSubCategory(''); // Reset subcategory
    setSubCategories([]); // Clear previous subcategories

    if (categoryId && categoryId !== 'all') {
      await fetchSubCategories(categoryId);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSubCategory('');
    setSubCategories([]);
    setFilteredBooks(books);
    setCurrentPage(1);
  };

  // Demo modal handlers
  const handleDemoPress = book => {
    setDemoBook(book);
    setShowDemoModal(true);
  };

  const handleViewDemoPdf = (pdfUrl, bookName) => {
    setShowDemoModal(false);
    navigation.navigate('PdfViewer', {
      pdfUrl: pdfUrl,
      title: bookName,
    });
  };

  const closeDemoModal = () => {
    setShowDemoModal(false);
    setDemoBook(null);
    setDemoLoading(false);
  };

  // Book purchase handlers
  const handleBookPress = async book => {
    if (book.price === 0) {
      Alert.alert('Free Book', 'This feature will be available soon!');
      return;
    }

    setSelectedBook(book);
    setAddressLoading(true);
    setShowAddressModal(true);

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
          {text: 'Cancel', style: 'cancel'},
        ],
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
          {text: 'Cancel', style: 'cancel'},
        ],
      );
    }
  };

  const handleAddressSelection = address => {
    setSelectedAddress(address);
  };

  const proceedToPayment = () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Please select an address to continue.');
      return;
    }

    setShowAddressModal(false);
    navigation.navigate('BookPaymentScreen', {
      book: selectedBook,
      addressId: selectedAddress.id,
      userData: userData,
    });

    setSelectedBook(null);
    setSelectedAddress(null);
  };

  const closeAddressModal = () => {
    setShowAddressModal(false);
    setSelectedBook(null);
    setSelectedAddress(null);
  };

  const formatCurrency = amount => {
    if (!amount) return '₹0';
    return `₹${Number.parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
    })}`;
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadUserData = async () => {
        const user = await fetchUserData();
        setUserData(user);
      };
      loadUserData();
    }, []),
  );

  // Render Filter Section
  const renderFilterSection = () => (
    <View style={styles.filterSection}>
      <View style={styles.filterHeader}>
        {(selectedCategory || selectedSubCategory) && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={clearFilters}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active Filters Display */}
      {(selectedCategory || selectedSubCategory) && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersLabel}>Active Filters:</Text>
          <View style={styles.activeFiltersRow}>
            {selectedCategory && selectedCategory !== 'all' && (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>
                  {
                    categories.find(c => c.id.toString() === selectedCategory)
                      ?.category
                  }
                </Text>
                <TouchableOpacity onPress={() => handleCategoryChange('')}>
                  <Text style={styles.filterTagClose}>×</Text>
                </TouchableOpacity>
              </View>
            )}
            {selectedSubCategory && selectedSubCategory !== 'all' && (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>
                  {
                    subCategories.find(
                      s => s.id.toString() === selectedSubCategory,
                    )?.subcategory
                  }
                </Text>
                <TouchableOpacity onPress={() => setSelectedSubCategory('')}>
                  <Text style={styles.filterTagClose}>×</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Filter Pickers */}
      <View style={styles.filtersContainer}>
        {/* Category Picker */}
        <View style={styles.pickerWrapper}>
          <Text style={styles.pickerLabel}>Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCategory}
              onValueChange={handleCategoryChange}
              style={styles.picker}
              enabled={!categoriesLoading}
              dropdownIconColor="#007AFF"
              mode="dropdown">
              <Picker.Item
                label="All Categories"
                value=""
                style={styles.pickerItem}
              />
              {categories.map(category => (
                <Picker.Item
                  key={category.id}
                  label={category.category}
                  value={category.id.toString()}
                  style={styles.pickerItem}
                />
              ))}
            </Picker>
            {categoriesLoading && (
              <View style={styles.pickerLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            )}
          </View>
        </View>

        {/* Subcategory Picker */}
        <View style={styles.pickerWrapper}>
          <Text
            style={[
              styles.pickerLabel,
              (!selectedCategory || selectedCategory === 'all') &&
                styles.disabledLabel,
            ]}>
            Subcategory
          </Text>
          <View
            style={[
              styles.pickerContainer,
              (!selectedCategory || selectedCategory === 'all') &&
                styles.disabledPickerContainer,
            ]}>
            <Picker
              selectedValue={selectedSubCategory}
              onValueChange={setSelectedSubCategory}
              style={styles.picker}
              enabled={
                !subCategoriesLoading &&
                subCategories.length > 0 &&
                selectedCategory &&
                selectedCategory !== 'all'
              }
              dropdownIconColor={
                !selectedCategory || selectedCategory === 'all'
                  ? '#ccc'
                  : '#007AFF'
              }
              mode="dropdown">
              <Picker.Item
                label={
                  !selectedCategory || selectedCategory === 'all'
                    ? 'Select Category First'
                    : 'All Subcategories'
                }
                value=""
                style={styles.pickerItem}
              />
              {subCategories.map(subCategory => (
                <Picker.Item
                  key={subCategory.id}
                  label={subCategory.subcategory}
                  value={subCategory.id.toString()}
                  style={styles.pickerItem}
                />
              ))}
            </Picker>
            {subCategoriesLoading && (
              <View style={styles.pickerLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  // Render Demo Modal
  const renderDemoModal = () => (
    <Modal
      visible={showDemoModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeDemoModal}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={closeDemoModal} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Book Demo</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}>
          {demoBook && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Book Preview</Text>
                <Image
                  source={{uri: demoBook.uploadThumbnail}}
                  style={styles.thumbnailImage}
                  resizeMode="contain"
                />
              </View>

              {demoBook.uploadDemoPdf && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Demo Content</Text>
                  <TouchableOpacity
                    style={[styles.button, styles.pdfButton]}
                    onPress={() =>
                      handleViewDemoPdf(
                        demoBook.uploadDemoPdf,
                        demoBook.bookName,
                      )
                    }
                    disabled={demoLoading}>
                    {demoLoading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>📄</Text>
                        <Text style={styles.buttonText}>View Demo PDF</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.noteText}>
                    This will open a preview of the book content
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  const BlinkingBadge = ({text, style}) => {
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      const startBlinking = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.3,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      };

      startBlinking();
    }, [opacity]);

    return (
      <Animated.View style={[style, {opacity}]}>
        <Text style={styles.blinkingText}>{text}</Text>
      </Animated.View>
    );
  };

  // Render Address Modal
  const renderAddressModal = () => (
    <Modal
      visible={showAddressModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeAddressModal}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={closeAddressModal}
            style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Address</Text>
          <View style={styles.headerSpacer} />
        </View>

        {addressLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading addresses...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}>
            {selectedBook && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Book Purchase</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Book:</Text>
                  <Text style={styles.value}>{selectedBook.bookName}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Price:</Text>
                  <Text style={styles.value}>
                    {formatCurrency(selectedBook.price)}
                  </Text>
                </View>
                {userData && (
                  <View style={styles.row}>
                    <Text style={styles.label}>Email:</Text>
                    <Text style={styles.value}>{userData.email}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Delivery Address</Text>
              {userData?.addresses?.map((address, index) => (
                <TouchableOpacity
                  key={address.id}
                  style={[
                    styles.addressCard,
                    selectedAddress?.id === address.id && styles.selectedCard,
                  ]}
                  onPress={() => handleAddressSelection(address)}>
                  <View style={styles.addressHeader}>
                    <View
                      style={[
                        styles.radioButton,
                        selectedAddress?.id === address.id &&
                          styles.selectedRadio,
                      ]}>
                      {selectedAddress?.id === address.id && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <Text style={styles.addressLabel}>Address {index + 1}</Text>
                  </View>

                  <View style={styles.addressDetails}>
                    {address.address && (
                      <Text style={styles.addressText}>{address.address}</Text>
                    )}
                    {address.area && (
                      <Text style={styles.addressText}>{address.area}</Text>
                    )}
                    <Text style={styles.addressText}>
                      {address.city && `${address.city}, `}
                      {address.district}
                      {address.pincode ? ` - ${address.pincode}` : ''}
                    </Text>
                    {address.state && (
                      <Text style={styles.addressText}>{address.state}</Text>
                    )}
                    {address.landmark && (
                      <Text style={styles.landmarkText}>
                        Landmark: {address.landmark}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.addAddressButton}
                onPress={() => {
                  closeAddressModal();
                  navigation.navigate('Profile');
                }}>
                <Text style={styles.addAddressText}>+ Add New Address</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                !selectedAddress && styles.disabledButton,
              ]}
              onPress={proceedToPayment}
              disabled={!selectedAddress}>
              <Text
                style={[
                  styles.buttonText,
                  !selectedAddress && styles.disabledButtonText,
                ]}>
                Proceed to Payment
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const renderPagination = () => {
    if (filteredBooks.length <= itemsPerPage) {
      return null; // Don't show pagination if total books <= 26
    }

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.disabledPaginationButton,
          ]}
          onPress={goToPreviousPage}
          disabled={currentPage === 1}>
          <Text
            style={[
              styles.paginationButtonText,
              currentPage === 1 && styles.disabledPaginationText,
            ]}>
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.pageNumbersContainer}>
          {pageNumbers.map(number => (
            <TouchableOpacity
              key={number}
              style={[
                styles.pageNumberButton,
                number === currentPage && styles.activePageButton,
              ]}
              onPress={() => handlePageChange(number)}>
              <Text
                style={[
                  styles.pageNumberText,
                  number === currentPage && styles.activePageText,
                ]}>
                {number}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.disabledPaginationButton,
          ]}
          onPress={goToNextPage}
          disabled={currentPage === totalPages}>
          <Text
            style={[
              styles.paginationButtonText,
              currentPage === totalPages && styles.disabledPaginationText,
            ]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render Book Item
  const renderBookItem = ({item}) => (
    <View style={styles.bookCard}>
      <Image
        source={{uri: item.uploadThumbnail}}
        style={styles.bookThumbnail}
      />

      {/* Add blinking text only for paid books */}
      {item.price > 0 && (
        <BlinkingBadge
          text="🚚 Free Delivery"
          style={styles.blinkingTextContainer}
        />
      )}

      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.bookName}
        </Text>

        <View style={styles.category}>
          <Text style={styles.categorytext}>{item.category.category}</Text>
        </View>

        {/* Author and Publisher */}
        <View style={styles.bookMeta}>
          <Text style={styles.authorText} numberOfLines={1}>
            Author: {item.writerName}
          </Text>
          <Text style={styles.publisherText} numberOfLines={1}>
            Publisher: {item.publisherName}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {/* Show View Demo button only if uploadDemoPdf exists */}
          {item.uploadDemoPdf && (
            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => handleDemoPress(item)}>
              <Text style={styles.demoButtonText}>View Demo</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionButton,
              // If no demo button, make this button full width
              !item.uploadDemoPdf && styles.fullWidthButton,
              item.price === 0 ? styles.freeButton : styles.paidButton,
            ]}
            onPress={() => handleBookPress(item)}>
            <Text
              style={[
                styles.actionButtonText,
                item.price === 0
                  ? styles.freeButtonText
                  : styles.paidButtonText,
              ]}>
              {item.price === 0 ? 'Read' : 'Buy Now'}
            </Text>
          </TouchableOpacity>
        </View>
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
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={fetchBooks}>
          <Text style={styles.buttonText}>Retry</Text>
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

      {/* Filter Section */}
      {renderFilterSection()}

      <View style={[styles.scrollContainer, {marginBottom: footerHeight}]}>
        <FlatList
          data={paginatedBooks} // Changed from filteredBooks
          renderItem={renderBookItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={[
            styles.listContainer,
            {paddingBottom: scrollBottomPadding},
          ]}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.listRow}
          ListEmptyComponent={() => (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>
                No books found for selected filters
              </Text>
              <TouchableOpacity
                style={styles.resetFilterButton}
                onPress={clearFilters}>
                <Text style={styles.resetFilterButtonText}>View All Books</Text>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={renderPagination}
        />
      </View>
     
      <Footer />

      {/* Modals */}
      {renderAddressModal()}
      {renderDemoModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  // Base containers
  scrollContainer: {
    flex: 1,
  },
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
    paddingHorizontal: 8,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  listRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },

  // Filter Section Styles
  filterSection: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    paddingVertical: 12,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  clearAllButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  clearAllText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  activeFiltersContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  activeFiltersLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  filterTagText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
    marginRight: 6,
  },
  filterTagClose: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 12,
  },
  pickerWrapper: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  disabledLabel: {
    color: '#999',
  },
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e1e5e9',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 1,
    minHeight: 42,
    position: 'relative',
  },
  disabledPickerContainer: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  picker: {
    height: 42,
    color: '#333',
    fontSize: 12,
  },
  pickerItem: {
    fontSize: 12,
    color: '#333',
  },
  pickerLoader: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{translateY: -10}],
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  resetFilterButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resetFilterButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Book cards
  bookCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    width: '48%',
    height: 340, // Fixed height for consistent alignment
    flexDirection: 'column',
  },
  bookThumbnail: {
    width: '100%',
    height: 180,
    resizeMode: 'contain',
  },
  bookInfo: {
    flex: 1,
    padding: 8,
    justifyContent: 'space-between',
    flexDirection: 'column',
  },
  bookTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 6,
    lineHeight: 16,
    height: 32,
    textAlignVertical: 'top',
  },
  bookDescription: {
    fontSize: 10,
    color: '#666',
    marginBottom: 12,
  },
  bookMeta: {
    marginBottom: 8,
    minHeight: 46,
  },
  category: {
    backgroundColor: 'orange',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categorytext: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  authorText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  publisherText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '400',
  },
  metaText: {
    fontSize: 10,
    color: '#888',
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 'auto',
    paddingTop: 8,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledButtonText: {
    color: '#888',
  },
  demoButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#007AFF',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  freeButton: {
    backgroundColor: '#34C759',
  },
  freeButtonText: {
    color: '#ffffff',
  },
  paidButton: {
    backgroundColor: '#007AFF',
  },
  paidButtonText: {
    color: '#ffffff',
  },
  pdfButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  fullWidthButton: {
    flex: 0,
    width: '100%',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerSpacer: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },

  // Section styles
  section: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },

  // Address styles
  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e1e5e9',
  },
  selectedCard: {
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
  selectedRadio: {
    borderColor: '#007AFF',
  },
  radioInner: {
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
    paddingLeft: 32,
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
    lineHeight: 20,
  },
  landmarkText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
  },
  addAddressButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addAddressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },

  // Misc styles
  thumbnailImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#007AFF',
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

  blinkingTextContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(52, 199, 89, 0.95)', // Green background for free delivery
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  blinkingText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 8,
    marginHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paginationButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledPaginationButton: {
    backgroundColor: '#ccc',
  },
  paginationButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledPaginationText: {
    color: '#888',
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageNumberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  activePageButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  pageNumberText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  activePageText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default Books;

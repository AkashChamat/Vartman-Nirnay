import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import {testseries, fetchVTCategories} from '../../util/apiCall';
import {useNavigation} from '@react-navigation/native';
import TouchableScale from '../../Components/TouchableScale';

const {width: screenWidth} = Dimensions.get('window');
const ITEMS_PER_PAGE = 10;

const TestSeries = () => {
  const navigation = useNavigation();

  const [testPapers, setTestPapers] = useState([]);
  const [allTestPapers, setAllTestPapers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedFeatures, setExpandedFeatures] = useState({});

  // Dropdown state
  const [open, setOpen] = useState(false);
  const [dropdownItems, setDropdownItems] = useState([
    {label: 'All Categories', value: 'all'},
  ]);

  // Fetch categories from API with fallback
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);

      const response = await fetchVTCategories();

      if (Array.isArray(response)) {
        setCategories(response);
        updateDropdownItems(response);
      } else if (response && Array.isArray(response.data)) {
        setCategories(response.data);
        updateDropdownItems(response.data);
      } else {
        console.warn(
          '⚠️ Categories response is not in expected format:',
          response,
        );
        if (allTestPapers.length > 0) {
          extractCategoriesFromTestSeries();
        }
      }
    } catch (err) {
      console.error('❌ Error fetching categories:', err);

      if (allTestPapers.length > 0) {
        extractCategoriesFromTestSeries();
      }
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Update dropdown items when categories change
  const updateDropdownItems = categoryData => {
    const items = [
      {label: 'All Categories', value: 'all'},
      ...categoryData.map(cat => ({
        label: cat.category,
        value: cat.category,
      })),
    ];
    setDropdownItems(items);
  };

  // Fallback function to extract categories from test series data
  const extractCategoriesFromTestSeries = () => {
    const uniqueCategories = [
      ...new Set(
        allTestPapers
          .filter(item => item.category && item.category.trim() !== '')
          .map(item => item.category.trim()),
      ),
    ];

    const categoryObjects = uniqueCategories.map((category, index) => ({
      id: index + 1,
      category: category,
    }));

    setCategories(categoryObjects);
    updateDropdownItems(categoryObjects);
    
  };

  const fetchTestSeries = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!testseries || typeof testseries !== 'function') {
        throw new Error('testseries function is not properly imported');
      }

      const response = await testseries();

      let testData = [];
      if (response && response.data) {
        testData = response.data;
      } else if (Array.isArray(response)) {
        testData = response;
      } else {
        throw new Error('Invalid response format');
      }

      const activePapers = testData
        .filter(paper => paper && paper.status === true)
        .sort((a, b) => b.id - a.id);

      setAllTestPapers(activePapers);
      filterTestPapers(activePapers, selectedCategory);
      setError(null);
    } catch (err) {
      const errorMessage = err.message || 'Failed to load test papers';
      setError(errorMessage);
      console.error('❌ ==> Error in fetchTestPapers:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        stack: err.stack,
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter test papers based on selected category
  const filterTestPapers = (papers, categoryFilter) => {
    let filteredPapers = papers;

    if (categoryFilter !== 'all') {
      filteredPapers = papers.filter(
        paper =>
          paper.category &&
          paper.category.toLowerCase() === categoryFilter.toLowerCase(),
      );
    }

    setTestPapers(filteredPapers);
    setTotalPages(Math.ceil(filteredPapers.length / ITEMS_PER_PAGE));
    setCurrentPage(1);
  };

  // Handle category selection
  const handleCategoryChange = categoryValue => {
    setSelectedCategory(categoryValue);
    filterTestPapers(allTestPapers, categoryValue);
  };

  // Toggle features visibility
  const toggleFeatures = itemId => {
    setExpandedFeatures(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Get appropriate button text based on pricing
  const getButtonText = item => {
    if (item.pricing === 0 || item.pricing === 0.0) {
      return 'View Papers';
    } else {
      return 'Explore';
    }
  };

  useEffect(() => {
    fetchTestSeries();
  }, []);

  useEffect(() => {
    if (allTestPapers.length > 0) {
      fetchCategories();
    }
  }, [allTestPapers]);

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return testPapers.slice(startIndex, endIndex);
  };

  const renderTestItem = ({item}) => {
    const isExpanded = expandedFeatures[item.id];
    const hasFeatures =
      item.testFeatureOne || item.testFeatureTwo || item.testFeatureThree;
    const buttonText = getButtonText(item);
    const isFree = item.pricing === 0 || item.pricing === 0.0;

    return (
      <View style={styles.testCard}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{uri: item.image}}
            style={styles.testImage}
            resizeMode="contain"
          />

          {/* Category Badge */}
          {/* <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View> */}
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <Text style={styles.testTitle} numberOfLines={2}>
            {item.examTitle}
          </Text>

          {/* Features Section */}
          {/* {hasFeatures && (
            <View style={styles.featuresSection}>
              <TouchableScale
                style={styles.featuresHeader}
                onPress={() => toggleFeatures(item.id)}>
                <Text style={styles.featuresTitle}>Features</Text>
                <MaterialIcons
                  name={
                    isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'
                  }
                  size={20}
                  color="#666"
                />
              </TouchableScale>

              {isExpanded && (
                <View style={styles.featuresList}>
                  {item.testFeatureOne && (
                    <View style={styles.featureItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={14}
                        color="#4CAF50"
                      />
                      <Text style={styles.featureText}>
                        {item.testFeatureOne}
                      </Text>
                    </View>
                  )}
                  {item.testFeatureTwo && (
                    <View style={styles.featureItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={14}
                        color="#4CAF50"
                      />
                      <Text style={styles.featureText}>
                        {item.testFeatureTwo}
                      </Text>
                    </View>
                  )}
                  {item.testFeatureThree && (
                    <View style={styles.featureItem}>
                      <MaterialIcons
                        name="check-circle"
                        size={14}
                        color="#4CAF50"
                      />
                      <Text style={styles.featureText}>
                        {item.testFeatureThree}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )} */}

          {/* Action Section */}
          <View style={styles.bottomSection}>
            <TouchableScale
              style={[styles.actionButton, isFree && styles.freeActionButton]}
              onPress={() => handleTestPress(item)}>
              <Text
                style={[
                  styles.actionButtonText,
                  isFree && styles.freeActionButtonText,
                ]}>
                {buttonText}
              </Text>
             
            </TouchableScale>
          </View>
        </View>
      </View>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <View style={styles.paginationContainer}>
        <TouchableScale
          style={[
            styles.pageButton,
            currentPage === 1 && styles.pageButtonDisabled,
          ]}
          onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}>
          <MaterialIcons
            name="chevron-left"
            size={20}
            color={currentPage === 1 ? '#999' : '#333'}
          />
        </TouchableScale>

        <View style={styles.pageNumbers}>
          {pageNumbers.map(pageNum => (
            <TouchableScale
              key={pageNum}
              style={[
                styles.pageNumber,
                currentPage === pageNum && styles.activePageNumber,
              ]}
              onPress={() => setCurrentPage(pageNum)}>
              <Text
                style={[
                  styles.pageNumberText,
                  currentPage === pageNum && styles.activePageNumberText,
                ]}>
                {pageNum}
              </Text>
            </TouchableScale>
          ))}
        </View>

        <TouchableScale
          style={[
            styles.pageButton,
            currentPage === totalPages && styles.pageButtonDisabled,
          ]}
          onPress={() =>
            currentPage < totalPages && setCurrentPage(currentPage + 1)
          }
          disabled={currentPage === totalPages}>
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={currentPage === totalPages ? '#999' : '#333'}
          />
        </TouchableScale>
      </View>
    );
  };

  const handleTestPress = item => {
    navigation.navigate('TestPaper', {
      seriesId: item.id,
      seriesData: item,
    });
  };


  const handleRetry = () => {
    fetchTestSeries();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#42A5F5" />
          <Text style={styles.loadingText}>Loading Test Series...</Text>
        </View>
        <Footer />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={60} color="#F44336" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableScale style={styles.retryButton} onPress={handleRetry}>
            <MaterialIcons name="refresh" size={18} color="#FFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableScale>
        </View>
        <Footer />
      </View>
    );
  }

  if (allTestPapers.length === 0) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.centerContainer}>
          <MaterialIcons name="school" size={60} color="#42A5F5" />
          <Text style={styles.title}>No Test Series Available</Text>
          <Text style={styles.subtitle}>
            Check back later for new test series
          </Text>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        {/* Category Filter */}
        <View style={styles.filterContainer}>
          
          <View style={styles.dropdownContainer}>
            <View style={{position: 'relative', zIndex: 3000}}>
              {(open || selectedCategory !== 'all') && (
                <Text style={styles.floatingLabelText}>Category</Text>
              )}
              <DropDownPicker
                open={open}
                value={selectedCategory}
                items={dropdownItems}
                setOpen={setOpen}
                setValue={setSelectedCategory}
                setItems={setDropdownItems}
                onChangeValue={handleCategoryChange}
                placeholder="Category"
                placeholderStyle={styles.dropdownPlaceholder}
                style={styles.dropdown}
                textStyle={styles.dropdownText}
                dropDownContainerStyle={styles.dropdownList}
                zIndex={3000}
                zIndexInverse={1000}
              />
            </View>
          </View>
        </View>

        {testPapers.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <MaterialIcons name="search-off" size={60} color="#999" />
            <Text style={styles.noResultsText}>No test series found</Text>
            <Text style={styles.noResultsSubtext}>
              Try selecting a different category
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={getCurrentPageData()}
              renderItem={renderTestItem}
              keyExtractor={item => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />

            {renderPagination()}
          </>
        )}
      </View>
      <Footer />
    </View>
  );
};

export default TestSeries;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 0,
  },
  filterContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 3000,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  dropdownContainer: {
    flex: 2,
    zIndex: 4000,
  },

  // DropDownPicker Styles
  dropdown: {
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    minHeight: 50,
  },
  dropdownPlaceholder: {
    color: '#999',
    fontSize: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    marginTop: 5,
  },
  dropdownArrow: {
    width: 20,
    height: 20,
    tintColor: '#42A5F5',
  },
  dropdownTick: {
    width: 20,
    height: 20,
    tintColor: '#42A5F5',
  },
  dropdownLabel: {
    fontSize: 14,
    color: '#333',
  },
  selectedDropdownLabel: {
    color: '#42A5F5',
    fontWeight: '600',
  },
  listItemLabel: {
    fontSize: 14,
    color: '#333',
  },
  customItemContainer: {
    paddingVertical: 12,
  },
  customItemLabel: {
    fontSize: 14,
    color: '#333',
  },
  floatingLabel: {
    color: '#42A5F5',
    fontSize: 12,
  },

  // Rest of your existing styles...
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    paddingBottom: 80,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  testCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  testImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#42A5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: 16,
  },
  featuresHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featuresTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  featuresList: {
    marginTop: 8,
    gap: 6,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#555',
    marginLeft: 8,
    flex: 1,
  },
  bottomSection: {
    alignItems: 'flex-end',
    
  },
  actionButton: {
    backgroundColor: '#42A5F5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 25,
    gap: 8,
  },
  freeActionButton: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  freeActionButtonText: {
    color: '#4CAF50',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  pageButton: {
    padding: 8,
    borderRadius: 6,
  },
  pageButtonDisabled: {
    opacity: 0.3,
  },
  pageNumbers: {
    flexDirection: 'row',
    marginHorizontal: 16,
  },
  pageNumber: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 6,
  },
  activePageNumber: {
    backgroundColor: '#42A5F5',
  },
  pageNumberText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  activePageNumberText: {
    color: '#FFF',
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 16,
    color: '#42A5F5',
    fontWeight: '500',
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#42A5F5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  floatingLabelText: {
    position: 'absolute',
    top: -10,
    left: 12,
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    fontSize: 12,
    color: '#42A5F5',
    fontWeight: '600',
    zIndex: 9999,
  },
});

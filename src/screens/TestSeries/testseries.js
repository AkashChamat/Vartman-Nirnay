import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import { testseries } from '../../util/apiCall';
import { useNavigation } from '@react-navigation/native';


const ITEMS_PER_PAGE = 10;

const TestSeries = () => {
const navigation = useNavigation();

  const [testPapers, setTestPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchTestSeries = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!testseries || typeof testseries !== 'function') {
        throw new Error('testseries function is not properly imported');
      }

      const response = await testseries();
      console.log('✅ API Response:', response);

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

      setTestPapers(activePapers);
      setTotalPages(Math.ceil(activePapers.length / ITEMS_PER_PAGE));
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

  useEffect(() => {
    fetchTestSeries();
  }, []);

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return testPapers.slice(startIndex, endIndex);
  };

  const renderTestItem = ({ item }) => (
    <View style={styles.testCard}>
      <View style={styles.cardContent}>
        <View style={styles.leftContent}>
          <Text style={styles.testTitle} numberOfLines={2}>{item.examTitle}</Text>
          <Text style={styles.category}>{item.category}</Text>
          
          <View style={styles.featuresRow}>
            {item.testFeatureOne && (
              <View style={styles.featureChip}>
                <MaterialIcons name="check" size={12} color="#4CAF50" />
                <Text style={styles.featureText} numberOfLines={1}>{item.testFeatureOne}</Text>
              </View>
            )}
            {item.testFeatureTwo && (
              <View style={styles.featureChip}>
                <MaterialIcons name="analytics" size={12} color="#2196F3" />
                <Text style={styles.featureText} numberOfLines={1}>{item.testFeatureTwo}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.rightContent}>
          <View style={styles.priceContainer}>
            {item.pricing === 0 ? (
              <Text style={styles.freePrice}>FREE</Text>
            ) : (
              <View>
                <Text style={styles.price}>₹{item.sellingPrice || item.pricing}</Text>
                {item.mrp > 0 && item.mrp !== item.pricing && (
                  <Text style={styles.mrp}>₹{item.mrp}</Text>
                )}
              </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.viewButton} onPress={() => handleTestPress(item)}>
            <MaterialIcons name="description" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity 
          style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
          onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <MaterialIcons name="chevron-left" size={20} color={currentPage === 1 ? "#999" : "#333"} />
        </TouchableOpacity>

        <View style={styles.pageNumbers}>
          {pageNumbers.map(pageNum => (
            <TouchableOpacity
              key={pageNum}
              style={[styles.pageNumber, currentPage === pageNum && styles.activePageNumber]}
              onPress={() => setCurrentPage(pageNum)}
            >
              <Text style={[styles.pageNumberText, currentPage === pageNum && styles.activePageNumberText]}>
                {pageNum}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
          onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <MaterialIcons name="chevron-right" size={20} color={currentPage === totalPages ? "#999" : "#333"} />
        </TouchableOpacity>
      </View>
    );
  };

const handleTestPress = (item) => {
  navigation.navigate('TestPaper', {
    seriesId: item.id,
    seriesData: item, // optional: if you want to pass the whole series
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
          <Text style={styles.loadingText}>Loading...</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <MaterialIcons name="refresh" size={18} color="#FFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <Footer />
      </View>
    );
  }

  if (testPapers.length === 0) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.centerContainer}>
          <MaterialIcons name="hourglass-empty" size={60} color="#42A5F5" />
          <Text style={styles.title}>No Test Series Available</Text>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Test Series</Text>
          <Text style={styles.resultCount}>
            {testPapers.length} series • Page {currentPage} of {totalPages}
          </Text>
        </View>
        
        <FlatList
          data={getCurrentPageData()}
          renderItem={renderTestItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
        
        {renderPagination()}
      </View>
      <Footer />
    </View>
  );
};

export default TestSeries;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    paddingBottom: 16,
  },
  testCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  leftContent: {
    flex: 1,
    marginRight: 12,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#42A5F5',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 6,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 100,
  },
  featureText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 60,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  freePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  mrp: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  viewButton: {
    backgroundColor: '#42A5F5',
    justifyContent: 'center',
    alignItems: 'center',
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginTop: 8,
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
    fontSize: 14,
    color: '#42A5F5',
    fontWeight:'500',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#42A5F5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
});
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {getAllResults} from '../util/apiCall';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import {showMessage} from 'react-native-flash-message';
import {generateAllResultsPDF} from '../Components/AllResultsPDFGenerator'; // Add this import

const AllResults = ({route, navigation}) => {
  const {testId, testTitle, pdfUrl, testStartDate, noOfQuestions, totalMarks} =
    route.params;
    // console.log('date',testStartDate)

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false); // Add download state

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(20);

  // Download PDF function
  const handleDownloadPdf = async () => {
    if (!results || results.length === 0) {
      showMessage({
        message: 'Error',
        description: 'No results available to download.',
        type: 'danger',
        icon: 'auto',
      });
      return;
    }

    try {
      setIsDownloading(true);

      // Prepare test info object
      const testInfo = {
        testTitle,
        testStartDate,
        noOfQuestions,
        totalMarks,
      };

      // Generate PDF using the same pattern as ChampionSeries
      const result = await generateAllResultsPDF(
        results,
        testInfo,
       
      );

      if (result.success) {
        showMessage({
          message: 'Download complete',
          description: 'Your results PDF has been saved.',
          type: 'success',
        });
      } else {
        throw new Error(result.error || 'PDF generation failed');
      }
    } catch (error) {
      console.error('Download failed:', error);
      showMessage({
        message: 'Download Failed',
        description: error.message || 'An unexpected error occurred.',
        type: 'danger',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Fetch all results data
  const fetchAllResults = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getAllResults(testId);

      // Handle different response structures
      let resultsData = [];
      if (response && response.data && Array.isArray(response.data)) {
        resultsData = response.data;
      } else if (response && Array.isArray(response)) {
        resultsData = response;
      } else if (
        response &&
        response.results &&
        Array.isArray(response.results)
      ) {
        resultsData = response.results;
      }

      // Sort results by score (highest first) and then by rank
      const sortedResults = resultsData.sort((a, b) => {
        // First sort by totalScore (descending) - consistent with render
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore;
        }
        // If scores are equal, sort by rank (ascending)
        return a.rank - b.rank;
      });

      setResults(sortedResults);
      setCurrentPage(1); // Reset to first page when new data is loaded
    } catch (err) {
      // ... existing error handling code remains the same
    } finally {
      setLoading(false);
    }
  };

  const getTestDetailsFromResults = () => {
    if (results.length === 0) {
      return {
        totalMarks: totalMarks || 'N/A',
        noOfQuestions: noOfQuestions || 'N/A',
      };
    }

    // Get values from the first result item (they should be same for all)
    const firstResult = results[0];
    return {
      totalMarks: firstResult.totalMarks || totalMarks || 'N/A',
      noOfQuestions: firstResult.noOfQuestions || noOfQuestions || 'N/A',
    };
  };

  const testDetails = getTestDetailsFromResults();

  useEffect(() => {
    fetchAllResults();
  }, [testId]);

  // Pagination calculations
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = results.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = page => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Format date
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Get rank suffix (1st, 2nd, 3rd, etc.)
  const getRankSuffix = rank => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  };

  // Get rank color based on position
  const getRankColor = rank => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#8B9DC3'; // Default
  };

  // Format time duration
  const formatTime = timeString => {
    if (!timeString) return '00:00:00';
    return timeString;
  };

  // Render individual result item
  const renderResultItem = ({item, index}) => {
    const serialNumber = startIndex + index + 1; // Global serial number
    const rankSuffix = getRankSuffix(item.rank || serialNumber);
    const rankColor = getRankColor(item.rank || serialNumber);

    return (
      <View style={styles.resultRow}>
        <Text style={styles.serialNumber}>{serialNumber}</Text>

        <View style={styles.nameContainer}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name || item.userName || 'Anonymous'}
          </Text>
        </View>

        <View
          style={[styles.rankContainer, {backgroundColor: rankColor + '20'}]}>
          <MaterialIcons name="star" size={12} color={rankColor} />
          <Text style={[styles.rankText, {color: rankColor}]}>
            {rankSuffix}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreValue}>{item.totalScore || 0}</Text>
        </View>
      </View>
    );
  };

  // Render header row
  const renderHeader = () => (
    <View style={styles.headerRow}>
      <Text style={styles.headerText}>Sr. No</Text>
      <Text style={styles.headerTextName}>Name</Text>
      <Text style={styles.headerText}>Rank</Text>
      <Text style={styles.headerText}>Score</Text>
    </View>
  );

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <View style={styles.paginationContainer}>
        <View style={styles.paginationInfo}>
          <Text style={styles.paginationText}>
            Showing {startIndex + 1}-{Math.min(endIndex, results.length)} of{' '}
            {results.length} results
          </Text>
        </View>

        <View style={styles.paginationControls}>
          {/* Previous Button */}
          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === 1 && styles.paginationButtonDisabled,
            ]}
            onPress={goToPreviousPage}
            disabled={currentPage === 1}>
            <MaterialIcons
              name="chevron-left"
              size={20}
              color={currentPage === 1 ? '#CBD5E0' : '#0288D1'}
            />
          </TouchableOpacity>

          {/* Page Numbers */}
          {startPage > 1 && (
            <>
              <TouchableOpacity
                style={styles.paginationButton}
                onPress={() => goToPage(1)}>
                <Text style={styles.paginationButtonText}>1</Text>
              </TouchableOpacity>
              {startPage > 2 && (
                <Text style={styles.paginationEllipsis}>...</Text>
              )}
            </>
          )}

          {pageNumbers.map(page => (
            <TouchableOpacity
              key={page}
              style={[
                styles.paginationButton,
                currentPage === page && styles.paginationButtonActive,
              ]}
              onPress={() => goToPage(page)}>
              <Text
                style={[
                  styles.paginationButtonText,
                  currentPage === page && styles.paginationButtonTextActive,
                ]}>
                {page}
              </Text>
            </TouchableOpacity>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <Text style={styles.paginationEllipsis}>...</Text>
              )}
              <TouchableOpacity
                style={styles.paginationButton}
                onPress={() => goToPage(totalPages)}>
                <Text style={styles.paginationButtonText}>{totalPages}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Next Button */}
          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === totalPages && styles.paginationButtonDisabled,
            ]}
            onPress={goToNextPage}
            disabled={currentPage === totalPages}>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={currentPage === totalPages ? '#CBD5E0' : '#0288D1'}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="assessment" size={60} color="#DFE3E8" />
      <Text style={styles.emptyTitle}>No Results Available</Text>
      <Text style={styles.emptySubtitle}>
        Results will be displayed once they are available
      </Text>
    </View>
  );

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0288D1" />
          <Text style={styles.loadingText}>Loading ranks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <View style={styles.content}>
        {/* Title Section - Updated to show test title and details */}
        <View style={styles.titleSection}>
          {/* Test Title Display */}
          {testTitle && (
            <View style={styles.testTitleContainer}>
              <Text style={styles.testTitle} numberOfLines={2}>
                {testTitle}
              </Text>
            </View>
          )}

          {/* Test Details Row */}
          <View style={styles.testDetailsContainer}>
            <View style={styles.testDetailItem}>
              <MaterialIcons name="event" size={16} color="#0288D1" />
              <Text style={styles.testDetailLabel}>Start Date</Text>
              <Text style={styles.testDetailValue}>
                {formatDate(testStartDate)}
              </Text>
            </View>

            <View style={styles.testDetailItem}>
              <MaterialIcons name="quiz" size={16} color="#0288D1" />
              <Text style={styles.testDetailLabel}>Questions</Text>
              <Text style={styles.testDetailValue}>
                {testDetails.noOfQuestions}
              </Text>
            </View>

            <View style={styles.testDetailItem}>
              <MaterialIcons name="star" size={16} color="#0288D1" />
              <Text style={styles.testDetailLabel}>Total Marks</Text>
              <Text style={styles.testDetailValue}>
                {testDetails.totalMarks}
              </Text>
            </View>
          </View>

          {/* Download Button - Add this after test details */}
          {results.length > 0 && (
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={handleDownloadPdf}
              disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>
                    Generating PDF...
                  </Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="download" size={20} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>
                    Download Results PDF
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Ranking Header */}
          <View style={styles.titleHeader}>
            <MaterialIcons name="emoji-events" size={24} color="#FFD700" />
            <Text style={styles.pageTitle}>Rankingwise Results</Text>
          </View>
        </View>

        {/* Results Section */}
        <View style={styles.resultsContainer}>
          {results.length > 0 ? (
            <>
              {renderHeader()}
              <FlatList
                data={currentResults}
                renderItem={renderResultItem}
                keyExtractor={(item, index) =>
                  `${item.id || item.userId || index}`
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
              {renderPagination()}
            </>
          ) : (
            renderEmptyState()
          )}
        </View>

        {/* Retry Button for Error State */}
        {error && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchAllResults}>
            <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  titleSection: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  // Test title styles
  testTitleContainer: {
    marginBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  // Test details styles
  testDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  testDetailItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#8B9DC3',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  testDetailLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  testDetailValue: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },

  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#0288D1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#8B9DC3',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignSelf: 'stretch',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0288D1',
    marginLeft: 8,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#8B9DC3',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F7FAFC',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
    textAlign: 'center',
    width: 60,
  },
  headerTextName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
    flex: 1,
    textAlign: 'center',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  serialNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3748',
    width: 60,
    textAlign: 'center',
  },
  nameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  userName: {
    fontSize: 12,
    color: '#2D3748',
    fontWeight: '500',
    flex: 1,
  },
  scoreContainer: {
    width: 60,
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38A169',
    backgroundColor: '#C6F6D5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textAlign: 'center',
    minWidth: 36,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
    minWidth: 60,
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#0288D1',
    marginTop: 12,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8B9DC3',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    backgroundColor: '#0288D1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    alignSelf: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Pagination Styles
  paginationContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FAFBFD',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  paginationInfo: {
    marginBottom: 12,
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  paginationButton: {
    minWidth: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    marginVertical: 2,
  },
  paginationButtonActive: {
    backgroundColor: '#0288D1',
    borderColor: '#0288D1',
  },
  paginationButtonDisabled: {
    backgroundColor: '#F7FAFC',
    borderColor: '#E2E8F0',
  },
  paginationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
  },
  paginationButtonTextActive: {
    color: '#FFFFFF',
  },
  paginationEllipsis: {
    fontSize: 13,
    color: '#4A5568',
    marginHorizontal: 4,
    fontWeight: '600',
  },
  flashContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    margin: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  flashTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  flashDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  flashButton: {
    backgroundColor: '#0288D1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  flashButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  flashButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  flashButtonTextSecondary: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 14,
  },
  flashButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
});

export default AllResults;

// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   ActivityIndicator,
//   TouchableOpacity,
//   SafeAreaView,
//   ScrollView
// } from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import { getAllResults } from '../util/apiCall';
// import Header from '../Components/Header';
// import Footer from '../Components/Footer';
// import { showMessage } from 'react-native-flash-message';

// const AllResults = ({ route, navigation }) => {
//   const { testId, testTitle, pdfUrl } = route.params;

//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Pagination states
//   const [currentPage, setCurrentPage] = useState(1);
//   const [resultsPerPage] = useState(20);

//   // Fetch all results data
//   const fetchAllResults = async () => {
//     try {
//       setLoading(true);
//       setError(null);

//       const response = await getAllResults(testId);

//       // Handle different response structures
//       let resultsData = [];
//       if (response && response.data && Array.isArray(response.data)) {
//         resultsData = response.data;
//       } else if (response && Array.isArray(response)) {
//         resultsData = response;
//       } else if (response && response.results && Array.isArray(response.results)) {
//         resultsData = response.results;
//       }

//       // Sort results by score (highest first) and then by rank
//       const sortedResults = resultsData.sort((a, b) => {
//         // First sort by score (descending)
//         if (b.totalScore !== a.totalScore) {
//           return b.totalScore - a.totalScore;
//         }
//         // If scores are equal, sort by rank (ascending)
//         return a.rank - b.rank;
//       });

//       setResults(sortedResults);
//       setCurrentPage(1); // Reset to first page when new data is loaded

//     } catch (err) {
//       const errorMessage = err.message || 'Failed to load results';
//       setError(errorMessage);
//       console.error('❌ ==> Error in fetchAllResults:', {
//         message: err.message,
//         status: err.response?.status,
//         data: err.response?.data,
//       });

//       showMessage({
//       message: 'Error',
//       description: errorMessage,
//       type: 'danger',
//       floating: true,
//       autoHide: false,
//       renderCustomContent: () => (
//         <View style={styles.flashContainer}>
//           <Text style={styles.flashTitle}>Error</Text>
//           <Text style={styles.flashDescription}>{errorMessage}</Text>
//           <View style={styles.flashButtonsRow}>
//             <TouchableOpacity
//               style={styles.flashButton}
//               onPress={() => {
//                 showMessage({ message: '', type: 'none' });
//                 fetchAllResults();
//               }}
//             >
//               <Text style={styles.flashButtonText}>Retry</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.flashButton, styles.flashButtonSecondary]}
//               onPress={() => {
//                 showMessage({ message: '', type: 'none' });
//                 navigation.goBack();
//               }}
//             >
//               <Text style={styles.flashButtonTextSecondary}>Go Back</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       ),
//     });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchAllResults();
//   }, [testId]);

//   // Pagination calculations
//   const totalPages = Math.ceil(results.length / resultsPerPage);
//   const startIndex = (currentPage - 1) * resultsPerPage;
//   const endIndex = startIndex + resultsPerPage;
//   const currentResults = results.slice(startIndex, endIndex);

//   const goToNextPage = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage(currentPage + 1);
//     }
//   };

//   const goToPreviousPage = () => {
//     if (currentPage > 1) {
//       setCurrentPage(currentPage - 1);
//     }
//   };

//   const goToPage = (page) => {
//     if (page >= 1 && page <= totalPages) {
//       setCurrentPage(page);
//     }
//   };

//   // Get rank suffix (1st, 2nd, 3rd, etc.)
//   const getRankSuffix = (rank) => {
//     if (rank === 1) return '1st';
//     if (rank === 2) return '2nd';
//     if (rank === 3) return '3rd';
//     return `${rank}th`;
//   };

//   // Get rank color based on position
//   const getRankColor = (rank) => {
//     if (rank === 1) return '#FFD700'; // Gold
//     if (rank === 2) return '#C0C0C0'; // Silver
//     if (rank === 3) return '#CD7F32'; // Bronze
//     return '#8B9DC3'; // Default
//   };

//   // Format time duration
//   const formatTime = (timeString) => {
//     if (!timeString) return '00:00:00';
//     return timeString;
//   };

//   // Render individual result item
//   const renderResultItem = ({ item, index }) => {
//     const serialNumber = startIndex + index + 1; // Global serial number
//     const rankSuffix = getRankSuffix(item.rank || serialNumber);
//     const rankColor = getRankColor(item.rank || serialNumber);

//     return (
//       <View style={styles.resultRow}>
//         <Text style={styles.serialNumberCell}>{serialNumber}</Text>

//         <View style={styles.nameCell}>
//           <Text style={styles.userName}>
//             {item.userName || item.name || 'Anonymous'}
//           </Text>
//         </View>

//         <View style={styles.scoreCell}>
//           <Text style={styles.scoreValue}>{item.totalScore || 0}</Text>
//         </View>

//         <View style={styles.correctCell}>
//           <Text style={styles.correctValue}>{item.correctQuestions || 0}</Text>
//         </View>

//         <View style={styles.timeCell}>
//           <Text style={styles.timeValue}>
//             {formatTime(item.totalTime)}
//           </Text>
//         </View>

//         <View style={[styles.rankCell, { backgroundColor: rankColor + '20' }]}>
//           <MaterialIcons name="star" size={14} color={rankColor} />
//           <Text style={[styles.rankText, { color: rankColor }]}>
//             {rankSuffix}
//           </Text>
//         </View>
//       </View>
//     );
//   };

//   // Render header row
//   const renderHeader = () => (
//     <View style={styles.headerRow}>
//       <Text style={styles.headerTextSerial}>Sr. No</Text>
//       <Text style={styles.headerTextName}>Name</Text>
//       <Text style={styles.headerTextScore}>Score</Text>
//       <Text style={styles.headerTextCorrect}>Correct Questions</Text>
//       <Text style={styles.headerTextTime}>Total Time</Text>
//       <Text style={styles.headerTextRank}>Rank</Text>
//     </View>
//   );

//   // Render pagination controls
//   const renderPagination = () => {
//     if (totalPages <= 1) return null;

//     const pageNumbers = [];
//     const maxVisiblePages = 5;
//     let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
//     let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

//     // Adjust start page if we're near the end
//     if (endPage - startPage + 1 < maxVisiblePages) {
//       startPage = Math.max(1, endPage - maxVisiblePages + 1);
//     }

//     for (let i = startPage; i <= endPage; i++) {
//       pageNumbers.push(i);
//     }

//     return (
//       <View style={styles.paginationContainer}>
//         <View style={styles.paginationInfo}>
//           <Text style={styles.paginationText}>
//             Showing {startIndex + 1}-{Math.min(endIndex, results.length)} of {results.length} results
//           </Text>
//         </View>

//         <View style={styles.paginationControls}>
//           {/* Previous Button */}
//           <TouchableOpacity
//             style={[
//               styles.paginationButton,
//               currentPage === 1 && styles.paginationButtonDisabled
//             ]}
//             onPress={goToPreviousPage}
//             disabled={currentPage === 1}
//           >
//             <MaterialIcons
//               name="chevron-left"
//               size={20}
//               color={currentPage === 1 ? '#CBD5E0' : '#0288D1'}
//             />
//           </TouchableOpacity>

//           {/* Page Numbers */}
//           {startPage > 1 && (
//             <>
//               <TouchableOpacity
//                 style={styles.paginationButton}
//                 onPress={() => goToPage(1)}
//               >
//                 <Text style={styles.paginationButtonText}>1</Text>
//               </TouchableOpacity>
//               {startPage > 2 && (
//                 <Text style={styles.paginationEllipsis}>...</Text>
//               )}
//             </>
//           )}

//           {pageNumbers.map((page) => (
//             <TouchableOpacity
//               key={page}
//               style={[
//                 styles.paginationButton,
//                 currentPage === page && styles.paginationButtonActive
//               ]}
//               onPress={() => goToPage(page)}
//             >
//               <Text style={[
//                 styles.paginationButtonText,
//                 currentPage === page && styles.paginationButtonTextActive
//               ]}>
//                 {page}
//               </Text>
//             </TouchableOpacity>
//           ))}

//           {endPage < totalPages && (
//             <>
//               {endPage < totalPages - 1 && (
//                 <Text style={styles.paginationEllipsis}>...</Text>
//               )}
//               <TouchableOpacity
//                 style={styles.paginationButton}
//                 onPress={() => goToPage(totalPages)}
//               >
//                 <Text style={styles.paginationButtonText}>{totalPages}</Text>
//               </TouchableOpacity>
//             </>
//           )}

//           {/* Next Button */}
//           <TouchableOpacity
//             style={[
//               styles.paginationButton,
//               currentPage === totalPages && styles.paginationButtonDisabled
//             ]}
//             onPress={goToNextPage}
//             disabled={currentPage === totalPages}
//           >
//             <MaterialIcons
//               name="chevron-right"
//               size={20}
//               color={currentPage === totalPages ? '#CBD5E0' : '#0288D1'}
//             />
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   };

//   // Render empty state
//   const renderEmptyState = () => (
//     <View style={styles.emptyState}>
//       <MaterialIcons name="assessment" size={60} color="#DFE3E8" />
//       <Text style={styles.emptyTitle}>No Results Available</Text>
//       <Text style={styles.emptySubtitle}>
//         Results will be displayed once they are available
//       </Text>
//     </View>
//   );

//   // Render loading state
//   if (loading) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <Header />
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#0288D1" />
//           <Text style={styles.loadingText}>Loading ranks...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <Header />

//       <View style={styles.content}>
//         {/* Title Section - Updated to show test title */}
//         <View style={styles.titleSection}>
//           {/* Test Title Display */}
//           {testTitle && (
//             <View style={styles.testTitleContainer}>
//               <Text style={styles.testTitle} numberOfLines={2}>
//                 {testTitle}
//               </Text>
//             </View>
//           )}

//           {/* Ranking Header */}
//           <View style={styles.titleHeader}>
//             <MaterialIcons name="emoji-events" size={24} color="#FFD700" />
//             <Text style={styles.pageTitle}>Rankingwise Results</Text>
//           </View>
//         </View>

//         {/* Results Section */}
//         <View style={styles.resultsContainer}>
//           {results.length > 0 ? (
//             <>
//               <ScrollView
//                 horizontal={true}
//                 showsHorizontalScrollIndicator={true}
//                 style={styles.tableScrollView}
//                 contentContainerStyle={styles.tableContentContainer}
//               >
//                 <View style={styles.tableWrapper}>
//                   {renderHeader()}
//                   <FlatList
//                     data={currentResults}
//                     renderItem={renderResultItem}
//                     keyExtractor={(item, index) => `${item.id || item.userId || index}`}
//                     showsVerticalScrollIndicator={false}
//                     contentContainerStyle={styles.listContainer}
//                     ItemSeparatorComponent={() => <View style={styles.separator} />}
//                     scrollEnabled={false}
//                   />
//                 </View>
//               </ScrollView>
//               {renderPagination()}
//             </>
//           ) : (
//             renderEmptyState()
//           )}
//         </View>

//         {/* Retry Button for Error State */}
//         {error && (
//           <TouchableOpacity style={styles.retryButton} onPress={fetchAllResults}>
//             <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
//             <Text style={styles.retryText}>Retry</Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       <Footer />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FAFBFD',
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 16,
//     paddingBottom: 50,
//   },
//   titleSection: {
//     paddingVertical: 16,
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   // New styles for test title
//   testTitleContainer: {
//     marginBottom: 12,
//     paddingHorizontal: 20,
//     alignItems: 'center',
//   },
//   testTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#2D3748',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 4,
//   },
//   titleHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   pageTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#0288D1',
//     marginLeft: 8,
//   },
//   resultsContainer: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     elevation: 2,
//     shadowColor: '#8B9DC3',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     marginBottom: 20,
//   },
//   headerRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//     backgroundColor: '#F7FAFC',
//     borderTopLeftRadius: 12,
//     borderTopRightRadius: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E2E8F0',
//     minWidth: 600, // Ensure minimum width for horizontal scroll
//   },
//   headerTextSerial: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#4A5568',
//     textAlign: 'center',
//     width: 60,
//   },
//   headerTextName: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#4A5568',
//     textAlign: 'center',
//     width: 120,
//   },
//   headerTextScore: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#4A5568',
//     textAlign: 'center',
//     width: 80,
//   },
//   headerTextCorrect: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#4A5568',
//     textAlign: 'center',
//     width: 120,
//   },
//   headerTextTime: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#4A5568',
//     textAlign: 'center',
//     width: 100,
//   },
//   headerTextRank: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#4A5568',
//     textAlign: 'center',
//     width: 80,
//   },
//   resultRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     minWidth: 600, // Ensure minimum width for horizontal scroll
//   },
//   serialNumberCell: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#2D3748',
//     width: 60,
//     textAlign: 'center',
//   },
//   nameCell: {
//     width: 120,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   userName: {
//     fontSize: 12,
//     color: '#2D3748',
//     fontWeight: '500',
//     textAlign: 'center',
//   },
//   scoreCell: {
//     width: 80,
//     alignItems: 'center',
//   },
//   scoreValue: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#38A169',
//     backgroundColor: '#C6F6D5',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//     textAlign: 'center',
//     minWidth: 36,
//   },
//   correctCell: {
//     width: 120,
//     alignItems: 'center',
//   },
//   correctValue: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#3182CE',
//     backgroundColor: '#BEE3F8',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 6,
//     textAlign: 'center',
//     minWidth: 36,
//   },
//   timeCell: {
//     width: 100,
//     alignItems: 'center',
//   },
//   timeValue: {
//     fontSize: 11,
//     fontWeight: '600',
//     color: '#805AD5',
//     backgroundColor: '#E9D8FD',
//     paddingHorizontal: 6,
//     paddingVertical: 4,
//     borderRadius: 6,
//     textAlign: 'center',
//   },
//   rankCell: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 16,
//     width: 80,
//     justifyContent: 'center',
//   },
//   rankText: {
//     fontSize: 12,
//     fontWeight: '600',
//     marginLeft: 4,
//   },
//   // Table scroll styles
//   tableScrollView: {
//     flex: 1,
//   },
//   tableContentContainer: {
//     flexGrow: 1,
//   },
//   tableWrapper: {
//     flex: 1,
//     minWidth: 600,
//   },
//   separator: {
//     height: 1,
//     backgroundColor: '#F1F5F9',
//     marginHorizontal: 16,
//     width: 568, // Adjusted to match table width minus padding
//   },
//   listContainer: {
//     paddingBottom: 16,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#0288D1',
//     marginTop: 12,
//     fontWeight: '500',
//   },
//   emptyState: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 32,
//   },
//   emptyTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#4A5568',
//     marginTop: 12,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   emptySubtitle: {
//     fontSize: 14,
//     color: '#8B9DC3',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
//   retryButton: {
//     flexDirection: 'row',
//     backgroundColor: '#0288D1',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginVertical: 16,
//     alignSelf: 'center',
//   },
//   retryText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//     marginLeft: 8,
//   },
//   // Pagination Styles
//   paginationContainer: {
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     borderTopWidth: 1,
//     borderTopColor: '#E2E8F0',
//     backgroundColor: '#FAFBFD',
//     borderBottomLeftRadius: 12,
//     borderBottomRightRadius: 12,
//   },
//   paginationInfo: {
//     marginBottom: 12,
//     alignItems: 'center',
//   },
//   paginationText: {
//     fontSize: 12,
//     color: '#4A5568',
//     fontWeight: '500',
//   },
//   paginationControls: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     flexWrap: 'wrap',
//   },
//   paginationButton: {
//     minWidth: 36,
//     height: 36,
//     borderRadius: 8,
//     backgroundColor: '#FFFFFF',
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginHorizontal: 2,
//     marginVertical: 2,
//   },
//   paginationButtonActive: {
//     backgroundColor: '#0288D1',
//     borderColor: '#0288D1',
//   },
//   paginationButtonDisabled: {
//     backgroundColor: '#F7FAFC',
//     borderColor: '#E2E8F0',
//   },
//   paginationButtonText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#4A5568',
//   },
//   paginationButtonTextActive: {
//     color: '#FFFFFF',
//   },
//   paginationEllipsis: {
//     fontSize: 13,
//     color: '#4A5568',
//     marginHorizontal: 4,
//     fontWeight: '600',
//   },
//    flashContainer: {
//     backgroundColor: '#FFFFFF',
//     padding: 20,
//     borderRadius: 12,
//     margin: 10,
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 4},
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   flashTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1F2937',
//     marginBottom: 8,
//   },
//   flashDescription: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginBottom: 16,
//     lineHeight: 20,
//   },
//   flashButton: {
//     backgroundColor: '#0288D1',
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 8,
//   },
//   flashButtonSecondary: {
//     backgroundColor: '#FFFFFF',
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//   },
//   flashButtonText: {
//     color: '#FFFFFF',
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   flashButtonTextSecondary: {
//     color: '#6B7280',
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   flashButtonsRow: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     gap: 10,
//   },
// });

// export default AllResults;

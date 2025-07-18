import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  Alert,
  FlatList,
  Modal,
  Platform,
  PermissionsAndroid,
  Animated,
} from 'react-native';
import {jobalert} from '../util/apiCall';
import FilterPicker from '../Components/FilterPicker';
import MonthYearPicker from '../Components/MonthYearPicker';
import fs from 'react-native-fs';
import Header from '../Components/Header';
import Footer from '../Components/Footer';

// Get device dimensions for responsive design
const {width, height} = Dimensions.get('window');
const ITEMS_PER_PAGE = 10;

// Determine if device is tablet
const isTablet = width >= 768;

// Helper functions for responsive sizes
const wp = (percentage) => {
  const value = width * (percentage / 100);
  return Math.round(value);
};

const hp = (percentage) => {
  const value = height * (percentage / 100);
  return Math.round(value);
};

// Responsive font scaling
const fontScale = width / (isTablet ? 768 : 375);
const getFontSize = (size) => {
  const scaledSize = size * fontScale;
  return Math.round(Math.max(scaledSize, size * 0.8)); // Minimum font size
};

// Responsive spacing
const getSpacing = (size) => {
  return isTablet ? size * 1.5 : size;
};

const JobAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedExamCategory, setSelectedExamCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMonthYear, setSelectedMonthYear] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // New state for download progress
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [showDownloadProgress, setShowDownloadProgress] = useState(false);
  const progressAnimation = new Animated.Value(0);

  const fetchJobAlerts = async () => {
    try {
      setLoading(true);
      const response = await jobalert();
      if (response && Array.isArray(response)) {
        setAlerts(response);
        setFilteredAlerts(response);
        setTotalPages(Math.ceil(response.length / ITEMS_PER_PAGE));
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      setError('Failed to fetch job alerts');
      console.error('Error fetching job alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobAlerts();
  }, []);

  useEffect(() => {
    if (alerts.length === 0) return;

    let filtered = [...alerts];

    if (selectedExamCategory) {
      filtered = filtered.filter(
        alert => alert.adsExamCategory === selectedExamCategory.adsExamCategory,
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        alert => alert.adsCategory === selectedCategory.adsCategory,
      );
    }

    if (selectedMonthYear) {
      const {month, year} = selectedMonthYear;
      filtered = filtered.filter(alert => {
        const dateParts = alert.lastDateToApply.split(/[\/\-]/);
        if (dateParts.length === 3) {
          const alertMonth = parseInt(dateParts[1]) - 1;
          const alertYear = parseInt(dateParts[2]);
          return alertMonth === month && alertYear === year;
        }
        return false;
      });
    }

    setFilteredAlerts(filtered);
    setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
    setCurrentPage(1);
  }, [selectedExamCategory, selectedCategory, selectedMonthYear, alerts]);

  const handleExamCategoryChange = category => {
    setSelectedExamCategory(category);
  };

  const handleCategoryChange = category => {
    setSelectedCategory(category);
  };

  const handleMonthYearChange = ({month, year}) => {
    setSelectedMonthYear({month, year});
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedExamCategory(null);
    setSelectedMonthYear(null);
  };

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAlerts.slice(startIndex, endIndex);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission',
          message:
            'Application needs access to your storage to download PDF files',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Error requesting storage permission:', err);
      return false;
    }
  };

  // Enhanced download function with progress tracking
  const handleDownloadPdf = async pdfUrl => {
    if (!pdfUrl) {
      Alert.alert('Error', 'PDF not available for this job alert');
      return;
    }

    // Prevent multiple downloads
    if (downloading) {
      Alert.alert('Download in Progress', 'Please wait for the current download to complete.');
      return;
    }

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Storage permission is required to download PDF files',
      );
      return;
    }

    // Initialize download states
    setDownloading(true);
    setShowDownloadProgress(true);
    setDownloadProgress(0);
    setDownloadStatus('Preparing download...');
    
    // Animate progress bar appearance
    Animated.timing(progressAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();

    try {
      const fileName =
        pdfUrl.substring(pdfUrl.lastIndexOf('/') + 1) ||
        `${selectedJob.title.replace(/\s+/g, '_')}.pdf`;

      const downloadPath =
        Platform.OS === 'ios'
          ? `${fs.DocumentDirectoryPath}/${fileName}`
          : `${fs.DownloadDirectoryPath}/${fileName}`;

      setDownloadStatus('Downloading...');

      const downloadOptions = {
        fromUrl: pdfUrl,
        toFile: downloadPath,
        background: true,
        discretionary: true,
        progress: res => {
          const progressPercent = Math.round(
            (res.bytesWritten / res.contentLength) * 100
          );
          setDownloadProgress(progressPercent);
          setDownloadStatus(`Downloading... ${progressPercent}%`);
        },
      };

      const result = await fs.downloadFile(downloadOptions).promise;

      if (result.statusCode === 200) {
        setDownloadStatus('Download completed!');
        
        // Show success animation
        setTimeout(() => {
          setDownloading(false);
          setShowDownloadProgress(false);
          
          if (Platform.OS === 'ios') {
            fs.readFile(downloadPath, 'base64').then(base64Data => {
              const shareOptions = {
                title: 'Save PDF',
                url: `data:application/pdf;base64,${base64Data}`,
                message: 'Save your PDF file',
              };
              Alert.alert(
                'Download Complete',
                'PDF downloaded successfully. You can find it in your documents folder.',
              );
            });
          } else {
            Alert.alert(
              'Download Complete',
              `PDF saved to Downloads folder as ${fileName}`,
            );
          }
        }, 1000);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      setDownloading(false);
      setShowDownloadProgress(false);
      setDownloadStatus('');
      Alert.alert('Download Failed', 'Could not download the PDF file');
      console.error('Download error:', error);
    }
  };

  const openJobDetails = job => {
    setSelectedJob(job);
    setModalVisible(true);
  };

  const closeJobDetails = () => {
    setModalVisible(false);
    // Reset download states when modal closes
    setDownloading(false);
    setShowDownloadProgress(false);
    setDownloadProgress(0);
    setDownloadStatus('');
  };

  const FiltersSection = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filtersContent}>
        <FilterPicker
          onExamCategoryChange={handleExamCategoryChange}
          onCategoryChange={handleCategoryChange}
        />

        <MonthYearPicker onMonthYearChange={handleMonthYearChange} />

        {(selectedCategory || selectedExamCategory || selectedMonthYear) && (
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={handleClearFilters}>
            <Text style={styles.clearFiltersText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const JobAlertCard = ({item}) => (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => openJobDetails(item)}
      activeOpacity={0.7}>
      <View style={styles.cardContent}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.adsCategory}</Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.cardBottomRow}>
          <Text style={styles.cardCategory}>{item.adsExamCategory}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Enhanced Download Progress Component
  const DownloadProgressComponent = () => {
    if (!showDownloadProgress) return null;

    return (
      <Animated.View 
        style={[
          styles.downloadProgressContainer,
          {
            opacity: progressAnimation,
            transform: [{
              translateY: progressAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }
        ]}
      >
        <View style={styles.progressHeader}>
          <Text style={styles.downloadStatusText}>{downloadStatus}</Text>
          <Text style={styles.downloadPercentText}>{downloadProgress}%</Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${downloadProgress}%` }
            ]} 
          />
        </View>
        
        <View style={styles.progressIndicatorRow}>
          <ActivityIndicator size="small" color="#5B95C4" />
          <Text style={styles.progressText}>
            {downloadProgress === 100 ? 'Finalizing...' : 'Please wait...'}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const JobDetailsModal = () => {
    if (!selectedJob) return null;

    const isApplyLinkAvailable =
      selectedJob.applyNowLink && selectedJob.applyNowLink.trim() !== '';
    const isPdfAvailable = selectedJob.pdf && selectedJob.pdf.trim() !== '';
    const isWebsiteLinkAvailable =
      selectedJob.officialWebsiteLink &&
      selectedJob.officialWebsiteLink.trim() !== '';

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeJobDetails}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeJobDetails}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>

            <View style={styles.modalHeaderRow}>
              <View style={styles.modalThumbnailContainer}>
                {selectedJob.image ? (
                  <Image
                    source={{uri: selectedJob.image}}
                    style={styles.modalThumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.modalPlaceholderThumbnail}>
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}
              </View>

              <View style={styles.modalHeaderInfo}>
                <Text style={styles.modalTitle} numberOfLines={3}>
                  {selectedJob.title}
                </Text>
              </View>
            </View>

            <View style={styles.jobDetailsRow}>
              <View style={styles.detailsItem}>
                <View style={styles.detailsBadge}>
                  <Text style={styles.detailsBadgeText}>
                    {selectedJob.adsCategory}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsItem}>
                <Text style={styles.detailsValue}>
                  {selectedJob.adsExamCategory}
                </Text>
              </View>
            </View>

            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Description</Text>
              <Text style={styles.descriptionText}>
                {selectedJob.description}
              </Text>
            </View>

            {/* Download Progress Component */}
            <DownloadProgressComponent />

            <View style={styles.actionButtonsRow}>
              {isPdfAvailable && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.downloadButton,
                    downloading && styles.disabledButton,
                  ]}
                  onPress={() => handleDownloadPdf(selectedJob.pdf)}
                  disabled={downloading}>
                  <View style={styles.downloadButtonContent}>
                    {downloading && (
                      <ActivityIndicator 
                        size="small" 
                        color="#fff" 
                        style={styles.buttonLoader}
                      />
                    )}
                    <Text style={styles.actionButtonText}>
                      {downloading ? 'Downloading...' : 'Download PDF'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const Pagination = () => (
    <View style={styles.paginationContainer}>
      <TouchableOpacity
        style={[
          styles.paginationButton,
          currentPage === 1 && styles.disabledButton,
        ]}
        onPress={handlePrevPage}
        disabled={currentPage === 1}>
        <Text style={styles.paginationButtonText}>Previous</Text>
      </TouchableOpacity>

      <Text style={styles.paginationText}>
        Page {currentPage} of {totalPages}
      </Text>

      <TouchableOpacity
        style={[
          styles.paginationButton,
          currentPage === totalPages && styles.disabledButton,
        ]}
        onPress={handleNextPage}
        disabled={currentPage === totalPages}>
        <Text style={styles.paginationButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );

  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No job alerts match your filter criteria
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleClearFilters}>
        <Text style={styles.retryButtonText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B95C4" />
        <Text style={styles.loadingText}>Loading job alerts...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchJobAlerts}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (alerts.length === 0) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>No job alerts available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchJobAlerts}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Job Alerts" subtitle="Latest job opportunities" />

      <FlatList
        ListHeaderComponent={FiltersSection}
        data={getCurrentPageItems()}
        renderItem={({item}) => <JobAlertCard item={item} />}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        numColumns={isTablet ? 2 : 1}
        key={isTablet ? 'tablet' : 'phone'}
        columnWrapperStyle={isTablet ? styles.row : null}
        ListFooterComponent={filteredAlerts.length > 0 ? Pagination : null}
        ListEmptyComponent={
          filteredAlerts.length === 0 ? EmptyListComponent : null
        }
      />
      <JobDetailsModal />
      <Footer />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    paddingHorizontal: getSpacing(20),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getSpacing(20),
    marginTop: getSpacing(40),
  },
  
  // Text styles
  loadingText: {
    marginTop: getSpacing(16),
    fontSize: getFontSize(16),
    color: '#5B95C4',
    fontWeight: '500',
  },
  errorText: {
    fontSize: getFontSize(16),
    color: '#5B95C4',
    textAlign: 'center',
    marginBottom: getSpacing(20),
    fontWeight: '500',
    lineHeight: getFontSize(24),
  },
  emptyText: {
    fontSize: getFontSize(16),
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: getSpacing(16),
    lineHeight: getFontSize(24),
  },
  
  // Button styles
  retryButton: {
    backgroundColor: '#5B95C4',
    paddingVertical: getSpacing(12),
    paddingHorizontal: getSpacing(24),
    borderRadius: getSpacing(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: getFontSize(16),
    fontWeight: '600',
  },
  
  // Filters section
  filtersContainer: {
    backgroundColor: '#5B95C4',
    marginBottom: getSpacing(16),
  },
  filtersContent: {
    paddingVertical: getSpacing(16),
    paddingHorizontal: getSpacing(16),
    borderBottomLeftRadius: getSpacing(24),
    borderBottomRightRadius: getSpacing(24),
  },
  clearFiltersButton: {
    backgroundColor: '#FF7B69',
    paddingVertical: getSpacing(10),
    paddingHorizontal: getSpacing(16),
    borderRadius: getSpacing(8),
    marginTop: getSpacing(12),
    alignSelf: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  clearFiltersText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: getFontSize(14),
  },
  
  // List styles
  listContainer: {
    paddingBottom: getSpacing(16),
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing(8),
  },
  
  // Card styles
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: getSpacing(12),
    marginHorizontal: isTablet ? getSpacing(8) : getSpacing(16),
    marginVertical: getSpacing(8),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    padding: getSpacing(16),
    flex: isTablet ? 1 : undefined,
    maxWidth: isTablet ? '48%' : undefined,
  },
  cardContent: {
    position: 'relative',
  },
  categoryBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF7B69',
    paddingHorizontal: getSpacing(8),
    paddingVertical: getSpacing(4),
    borderRadius: getSpacing(12),
    zIndex: 1,
  },
  categoryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: getFontSize(10),
  },
  cardTitle: {
    fontSize: getFontSize(14),
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: getSpacing(8),
    marginTop: getSpacing(4),
    paddingRight: getSpacing(60),
    lineHeight: getFontSize(20),
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCategory: {
    fontSize: getFontSize(12),
    color: '#5B95C4',
    fontWeight: '600',
    flex: 1,
  },
  cardDate: {
    fontSize: getFontSize(12),
    color: '#718096',
    fontWeight: '500',
  },
 
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(16),
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: getSpacing(16),
    width: isTablet ? '80%' : '100%',
    maxWidth: isTablet ? 600 : undefined,
    maxHeight: '90%',
    padding: getSpacing(20),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  closeButton: {
    position: 'absolute',
    top: getSpacing(12),
    right: getSpacing(12),
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: getSpacing(30),
    height: getSpacing(30),
    borderRadius: getSpacing(15),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: getFontSize(20),
    fontWeight: 'bold',
    lineHeight: getFontSize(20),
  },
  
  // Modal header row
  modalHeaderRow: {
    flexDirection: 'row',
    marginBottom: getSpacing(16),
    alignItems: 'flex-start',
  },
  modalThumbnailContainer: {
    width: getSpacing(80),
    height: getSpacing(80),
    borderRadius: getSpacing(8),
    overflow: 'hidden',
    marginRight: getSpacing(16),
  },
  modalThumbnail: {
    width: '100%',
    height: '100%',
  },
  modalPlaceholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: getFontSize(18),
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: getSpacing(8),
    lineHeight: getFontSize(24),
  },
  placeholderText: {
    color: '#A0AEC0',
    fontSize: getFontSize(12),
    fontWeight: '500',
  },
  
  // Job details row
  jobDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getSpacing(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: getSpacing(16),
  },
  detailsItem: {
    marginBottom: getSpacing(8),
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsValue: {
    fontSize: getFontSize(14),
    color: '#333',
    fontWeight: '700',
  },
  detailsBadge: {
    backgroundColor: '#FF7B69',
    paddingHorizontal: getSpacing(8),
    paddingVertical: getSpacing(4),
    borderRadius: getSpacing(12),
  },
  detailsBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: getFontSize(12),
  },
  
  // Description container
  descriptionContainer: {
    marginBottom: getSpacing(16),
    paddingBottom: getSpacing(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  descriptionTitle: {
    fontSize: getFontSize(16),
    fontWeight: 'bold',
    color: '#2D3748',
    marginBottom: getSpacing(8),
  },
  descriptionText: {
    fontSize: getFontSize(14),
    color: '#4A5568',
    lineHeight: getFontSize(20),
  },

  // Download Progress Styles
  downloadProgressContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: getSpacing(12),
    padding: getSpacing(16),
    marginBottom: getSpacing(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getSpacing(12),
  },
  downloadStatusText: {
    fontSize: getFontSize(14),
    color: '#2D3748',
    fontWeight: '600',
  },
  downloadPercentText: {
    fontSize: getFontSize(14),
    color: '#5B95C4',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: getSpacing(8),
    backgroundColor: '#E2E8F0',
    borderRadius: getSpacing(4),
    overflow: 'hidden',
    marginBottom: getSpacing(12),
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#5B95C4',
    borderRadius: getSpacing(4),
  },
  progressIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: getFontSize(12),
    color: '#4A5568',
    marginLeft: getSpacing(8),
  },

  // Action Buttons Row in Modal
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getSpacing(16),
  },
  actionButton: {
    paddingVertical: getSpacing(12),
    paddingHorizontal: getSpacing(20),
    borderRadius: getSpacing(8),
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#5B95C4',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: getFontSize(14),
  },
  buttonLoader: {
    marginRight: getSpacing(8),
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Pagination styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getSpacing(16),
    paddingVertical: getSpacing(12),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: getSpacing(12),
    borderRadius: getSpacing(12),
    marginHorizontal: getSpacing(16),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  paginationButton: {
    backgroundColor: '#5B95C4',
    paddingVertical: getSpacing(8),
    paddingHorizontal: getSpacing(16),
    borderRadius: getSpacing(8),
  },
  paginationButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: getFontSize(14),
  },
  paginationText: {
    fontSize: getFontSize(14),
    fontWeight: '500',
    color: '#4A5568',
  },
});

export default JobAlerts;
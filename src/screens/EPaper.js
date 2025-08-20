import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
  Animated,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {epaper} from '../util/apiCall';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MonthYearPicker from '../Components/MonthYearPicker';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  showErrorMessage,
  showSuccessMessage,
} from '../Components/SubmissionMessage';

const {width, height} = Dimensions.get('window');

const SPACING = width * 0.03;
const CARD_MARGIN = width * 0.015;
const GRID_SPACING = width * 0.02;
const PAPERS_PER_PAGE = 4;

const Thumbnail = require('../assets/vartman.png');

const EPapers = () => {
  const navigation = useNavigation();
  const [papers, setPapers] = useState([]);
  const [allPapers, setAllPapers] = useState([]);
  const [latestPaper, setLatestPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate dynamic bottom padding for ScrollView - same as Home component
  const isLargeScreen = height > 700;
  const hasHomeButton = Platform.OS === 'android' && height < 750;
  const scrollBottomPadding = hasHomeButton ? 100 : (isLargeScreen ? 90 : 80);
  const footerHeight = hasHomeButton ? 70 : 60;

  const fetchEPapers = async () => {
    try {
      setLoading(true);
      const response = await epaper();
      if (response && Array.isArray(response)) {
        const formattedPapers = response.map(paper => {
          return {
            id: paper.id.toString(),
            dateRange: `${getMonthInMarathi(paper.month)} ${paper.year}`,
            pdfUrl: paper.pdfFile,
            paperName: paper.paperName,
            month: paper.month,
            year: paper.year.toString(),
            image: paper.image,
          };
        });

        const sortedPapers = [...formattedPapers].sort(
          (a, b) => parseInt(b.id) - parseInt(a.id),
        );

        setAllPapers(sortedPapers);
        setPapers(sortedPapers);

        if (sortedPapers.length > 0) {
          setLatestPaper(sortedPapers[0]);
        }
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      setError('Failed to fetch e-papers');
      console.error('Error fetching e-papers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEPapers();
  }, []);

  const useBlinkingAnimation = (duration = 1000) => {
    const [fadeAnim] = useState(new Animated.Value(1));

    useEffect(() => {
      const startBlinking = () => {
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]).start(() => startBlinking());
      };

      startBlinking();
    }, [fadeAnim, duration]);

    return fadeAnim;
  };

  const BlinkingLatestBadge = ({paperName}) => {
    const blinkOpacity = useBlinkingAnimation(700);
    return (
      <Animated.View style={[styles.latestBadge, {opacity: blinkOpacity}]}>
        <Text style={styles.latestBadgeText}>NEW</Text>
      </Animated.View>
    );
  };

  const getMonthInMarathi = month => {
    const monthsMap = {
      January: 'जानेवारी',
      February: 'फेब्रुवारी',
      March: 'मार्च',
      April: 'एप्रिल',
      May: 'मे',
      June: 'जून',
      July: 'जुलै',
      August: 'ऑगस्ट',
      September: 'सप्टेंबर',
      October: 'ऑक्टोबर',
      November: 'नोव्हेंबर',
      December: 'डिसेंबर',
    };

    return monthsMap[month] || month;
  };

  const handleMonthYearChange = ({month, year}) => {
    setSelectedFilter({
      month: getMonthNameFromIndex(month),
      year: year.toString(),
    });

    const filteredPapers = allPapers.filter(paper => {
      return (
        paper.month === getMonthNameFromIndex(month) &&
        paper.year === year.toString()
      );
    });

    if (filteredPapers.length > 0) {
      setPapers(filteredPapers);
      setCurrentPage(1); // Reset to first page when filtering
    } else {
    showErrorMessage('No Papers Found', 'No papers available for the selected month and year.');
    }
  };

  const handleClearFilter = () => {
    setSelectedFilter(null);
    setPapers(allPapers);
    setCurrentPage(1); // Reset to first page when clearing filter
  };

  const handleViewPDF = paper => {
    if (!paper.pdfUrl) {
   showErrorMessage('Error', 'PDF not available for this paper');

      return;
    }

    navigation.navigate('PdfViewer', {
      pdfUrl: paper.pdfUrl,
      title: paper.paperName,
    });
  };

  const handleDownloadPDF = async paper => {
  if (!paper.pdfUrl) {
    showErrorMessage('Error', 'PDF not available for this paper');
    return;
  }

  try {
    setDownloadProgress(prev => ({
      ...prev,
      [paper.id]: {
        isDownloading: true,
        progress: 0,
      },
    }));

    const fileName = `${paper.paperName.replace(
      /[^a-zA-Z0-9]/g,
      '_',
    )}_${Date.now()}.pdf`;

    let downloadDest;
    if (Platform.OS === 'android') {
      downloadDest = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    } else {
      downloadDest = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    }

    const downloadOptions = {
      fromUrl: paper.pdfUrl,
      toFile: downloadDest,
      background: true,
      progressDivider: 2,
      begin: res => {},
      progress: res => {
        const progressPercent = (res.bytesWritten / res.contentLength) * 100;
        setDownloadProgress(prev => ({
          ...prev,
          [paper.id]: {
            isDownloading: true,
            progress: progressPercent,
          },
        }));
      },
    };

    const downloadTask = RNFS.downloadFile(downloadOptions);
    const result = await downloadTask.promise;

    setDownloadProgress(prev => ({
      ...prev,
      [paper.id]: {
        isDownloading: false,
        progress: 100,
      },
    }));

    if (result.statusCode === 200) {
      if (Platform.OS === 'android') {
        try {
          await RNFS.scanFile(downloadDest);
        } catch (err) {
          console.error('Error scanning file:', err);
        }
      }
      
      // ✅ Show SUCCESS message when download completes successfully
      showSuccessMessage('Download Complete', `${paper.paperName} has been downloaded successfully!`);
      
    } else {
      throw new Error(
        `Download failed with status code: ${result.statusCode}`,
      );
    }
  } catch (error) {
    setDownloadProgress(prev => ({
      ...prev,
      [paper.id]: {
        isDownloading: false,
        progress: 0,
      },
    }));

    // ✅ Show proper DOWNLOAD error message
    showErrorMessage('Download Failed', 'Failed to download the PDF. Please check your internet connection and try again.');
    console.error('Download error:', error);
  }
};

  // Function to handle WhatsApp sharing
  const handleWhatsAppShare = async paper => {
    if (!paper.pdfUrl) {
      showErrorMessage('Error', 'PDF not available for this paper');
      return;
    }

    try {
      const message = `Check out this paper: ${paper.paperName}\n${paper.pdfUrl}`;
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

      // Check if WhatsApp is installed
      const canOpen = await Linking.canOpenURL(whatsappUrl);

      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to web WhatsApp if app is not installed
        const webWhatsAppUrl = `https://wa.me/?text=${encodeURIComponent(
          message,
        )}`;
        await Linking.openURL(webWhatsAppUrl);
      }
    } catch (error) {
     showErrorMessage('Error', 'Could not open WhatsApp. Please make sure WhatsApp is installed on your device.');

    }
  };

  const handleTelegramShare = async paper => {
    if (!paper.pdfUrl) {
showErrorMessage('Error', 'PDF not available for this paper');
      return;
    }

    try {
      const message = `Check out this paper: ${paper.paperName}\n${paper.pdfUrl}`;
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
        paper.pdfUrl,
      )}&text=${encodeURIComponent(
        `Check out this paper: ${paper.paperName}`,
      )}`;

      // Check if Telegram is installed
      const canOpen = await Linking.canOpenURL('tg://');

      if (canOpen) {
        await Linking.openURL(telegramUrl);
      } else {
        // Fallback to web Telegram
        await Linking.openURL(telegramUrl);
      }
    } catch (error) {
     showErrorMessage('Error', 'Could not open Telegram. Please make sure Telegram is installed on your device.');

    }
  };

  // Updated thumbnail component to use API image with fallback
  const PaperThumbnail = ({paper}) => (
    <View style={styles.thumbnailContainer}>
      <Image
        source={paper.image ? {uri: paper.image} : Thumbnail}
        style={styles.thumbnailImage}
        resizeMode="stretch"
        onError={() => {
          // If image fails to load, it will automatically show the default source
        }}
      />
    </View>
  );

  const UnavailablePdfPlaceholder = () => (
    <View style={styles.placeholderImage}>
      <Text style={styles.placeholderText}>No PDF Available</Text>
    </View>
  );

  const FilterSection = () => (
    <View style={styles.filterSection}>
      <MonthYearPicker onMonthYearChange={handleMonthYearChange} />
      {selectedFilter && (
        <TouchableOpacity
          style={styles.clearFilterButton}
          onPress={handleClearFilter}>
          <Text style={styles.clearFilterText}>Clear Filter</Text>
        </TouchableOpacity>
      )}
      {selectedFilter && (
        <View style={styles.filterInfo}>
          <Text style={styles.filterInfoText}>
            Showing papers for: {selectedFilter.month} {selectedFilter.year}
          </Text>
        </View>
      )}
    </View>
  );

  const getMonthNameFromIndex = index => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[index];
  };

  // Pagination functions
  const getPaginatedPapers = papersList => {
    const startIndex = (currentPage - 1) * PAPERS_PER_PAGE;
    const endIndex = startIndex + PAPERS_PER_PAGE;
    return papersList.slice(startIndex, endIndex);
  };

  const getTotalPages = papersList => {
    return Math.ceil(papersList.length / PAPERS_PER_PAGE);
  };

  const handleNextPage = () => {
    const previousPapers = latestPaper
      ? papers.filter(paper => paper.id !== latestPaper.id)
      : papers;

    const totalPages = getTotalPages(previousPapers);

    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0288D1" />
        <Text style={styles.loadingText}>Loading your papers...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEPapers}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (papers.length === 0) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>No e-papers available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchEPapers}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const PaperActions = ({paper}) => (
    <View>
      <View style={styles.paperActions}>
        <TouchableOpacity
          style={[styles.iconButton, styles.viewButton]}
          onPress={() => handleViewPDF(paper)}
          disabled={!paper.pdfUrl}>
          <Icon name="visibility" size={16} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, styles.downloadButton]}
          onPress={() => handleDownloadPDF(paper)}
          disabled={!paper.pdfUrl || downloadProgress[paper.id]?.isDownloading}>
          {downloadProgress[paper.id]?.isDownloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="file-download" size={16} color="#fff" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, styles.shareButton]}
          onPress={() => handleTelegramShare(paper)}
          disabled={!paper.pdfUrl}>
          <Icon name="share" size={16} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, styles.whatsappButton]}
          onPress={() => handleWhatsAppShare(paper)}
          disabled={!paper.pdfUrl}>
          <MaterialCommunityIcons name="whatsapp" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
      {downloadProgress[paper.id]?.isDownloading && (
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {width: `${downloadProgress[paper.id]?.progress || 0}%`},
            ]}
          />
          <Text style={styles.progressText}>
            {`${Math.round(downloadProgress[paper.id]?.progress || 0)}%`}
          </Text>
        </View>
      )}
    </View>
  );

  const LatestPaper = () => {
    if (!latestPaper) return null;

    return (
      <View style={styles.featuredSection}>
        <View style={styles.latestPaperContainer}>
          <View style={styles.latestPaperImageContainer}>
            {latestPaper.pdfUrl ? (
              <PaperThumbnail paper={latestPaper} />
            ) : (
              <UnavailablePdfPlaceholder />
            )}
            <BlinkingLatestBadge paperName={latestPaper.paperName} />
          </View>
          <View style={styles.latestPaperDetailContainer}>
            <Text style={styles.latestPaperName}>{latestPaper.paperName}</Text>
            {!latestPaper.pdfUrl && (
              <Text style={styles.unavailableText}>PDF not available</Text>
            )}
            {latestPaper.pdfUrl && <PaperActions paper={latestPaper} />}
          </View>
        </View>
      </View>
    );
  };

  const PaginationControls = ({previousPapers}) => {
    const totalPages = getTotalPages(previousPapers);

    if (totalPages <= 1) return null;

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.disabledButton,
          ]}
          onPress={handlePreviousPage}
          disabled={currentPage === 1}>
          <Icon
            name="chevron-left"
            size={20}
            color={currentPage === 1 ? '#ccc' : '#5B95C4'}
          />
          <Text
            style={[
              styles.paginationButtonText,
              currentPage === 1 && styles.disabledButtonText,
            ]}>
            Previous
          </Text>
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          <Text style={styles.pageInfoText}>
            Page {currentPage} of {totalPages}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.disabledButton,
          ]}
          onPress={handleNextPage}
          disabled={currentPage === totalPages}>
          <Text
            style={[
              styles.paginationButtonText,
              currentPage === totalPages && styles.disabledButtonText,
            ]}>
            Next
          </Text>
          <Icon
            name="chevron-right"
            size={20}
            color={currentPage === totalPages ? '#ccc' : '#5B95C4'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const PreviousEditions = () => {
    const previousPapers = latestPaper
      ? papers.filter(paper => paper.id !== latestPaper.id)
      : papers;

    if (previousPapers.length === 0) return null;

    const paginatedPapers = getPaginatedPapers(previousPapers);

    return (
      <View style={styles.previousEditionsSection}>
        <Text style={styles.sectionTitle}>
          ---------- Previous Editions ----------
        </Text>
        <View style={styles.paperGrid}>
          {paginatedPapers.map(paper => (
            <View
              key={paper.id}
              style={[
                styles.paperContainer,
                !paper.pdfUrl && styles.disabledPaper,
              ]}>
              <View style={styles.paperImageContainer}>
                {paper.pdfUrl ? (
                  <PaperThumbnail paper={paper} />
                ) : (
                  <UnavailablePdfPlaceholder />
                )}
              </View>
              <View style={styles.paperDetailContainer}>
                <Text style={styles.paperName}>{paper.paperName}</Text>
                <Text style={styles.paperDate}>{paper.dateRange}</Text>
                {!paper.pdfUrl && (
                  <Text style={styles.unavailableText}>PDF not available</Text>
                )}
                {paper.pdfUrl && <PaperActions paper={paper} />}
              </View>
            </View>
          ))}
        </View>
        <PaginationControls previousPapers={previousPapers} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      
      {/* Body Scroll with proper clipping - same structure as Home component */}
      <View style={[styles.scrollContainer, {marginBottom: footerHeight}]}>
        <ScrollView
          contentContainerStyle={{paddingBottom: scrollBottomPadding}}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}>
          <FilterSection />
          <LatestPaper />
          <PreviousEditions />
        </ScrollView>
      </View>
      
      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  // Remove the old scrollViewContent padding since we're using dynamic padding now
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: width * 0.04,
    fontSize: width * 0.04,
    color: '#0288D1',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: width * 0.05,
  },
  errorText: {
    fontSize: width * 0.04,
    color: '#5B95C4',
    textAlign: 'center',
    marginBottom: width * 0.05,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#5B95C4',
    paddingVertical: width * 0.03,
    paddingHorizontal: width * 0.06,
    borderRadius: 10,
    elevation: 2,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  filterSection: {
    marginHorizontal: SPACING,
    marginBottom: SPACING * 1.2,
  },
  clearFilterButton: {
    backgroundColor: '#FF7B69',
    paddingVertical: width * 0.02,
    paddingHorizontal: width * 0.04,
    borderRadius: 8,
    marginTop: width * 0.02,
    alignSelf: 'center',
    elevation: 1,
  },
  clearFilterText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.035,
  },
  filterInfo: {
    backgroundColor: '#E0F2FF',
    padding: width * 0.02,
    borderRadius: 8,
    marginTop: width * 0.02,
    alignItems: 'center',
  },
  filterInfoText: {
    color: '#5B95C4',
    fontWeight: '500',
    fontSize: width * 0.035,
  },
  featuredSection: {
    marginHorizontal: SPACING,
    marginBottom: SPACING,
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#476685',
    marginBottom: width * 0.025,
    marginLeft: CARD_MARGIN,
    textAlign: 'center',
  },
  latestPaperContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  latestPaperImageContainer: {
    height: width * 1.15,
    width: '100%',
    position: 'relative',
  },
  latestBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'red',
    width: width * 0.5,
    height: width * 0.07,
    alignItems: 'center',
    transform: [
      {rotate: '-45deg'},
      {translateX: -width * 0.14},
      {translateY: -width * 0.11},
    ],
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 10,
  },
  latestBadgeText: {
    color: 'yellow',
    fontWeight: 'bold',
    fontSize: width * 0.05,
    letterSpacing: 0.5,
    transform: [{rotate: '0deg'}],
  },
  latestPaperDetailContainer: {
    backgroundColor: '#fff',
    padding: width * 0.035,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  latestPaperName: {
    color: '#2D3748',
    fontSize: width * 0.035,
    fontWeight: 'bold',
    marginBottom: width * 0.01,
    textAlign: 'center',
  },
  latestPaperDate: {
    color: '#718096',
    fontSize: width * 0.025,
    marginBottom: width * 0.035,
  },
  previousEditionsSection: {
    marginHorizontal: SPACING,
    marginBottom: SPACING,
  },
  paperGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  paperContainer: {
    width: (width - SPACING * 2 - GRID_SPACING) / 2,
    marginBottom: width * 0.05,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledPaper: {
    opacity: 0.7,
  },
  paperImageContainer: {
    height: width * 0.7,
    width: '100%',
  },
  paperDetailContainer: {
    backgroundColor: '#fff',
    padding: width * 0.03,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  paperName: {
    color: '#2D3748',
    fontSize: width * 0.025,
    fontWeight: '600',
    marginBottom: width * 0.01,
    textAlign: 'center',
  },
  paperDate: {
    color: '#718096',
    fontSize: width * 0.025,
    marginBottom: width * 0.02,
    textAlign: 'center',
  },
  thumbnailContainer: {
    height: '100%',
    width: '100%',
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  thumbnailImage: {
    height: '100%',
    width: '100%',
  },
  placeholderImage: {
    height: '100%',
    width: '100%',
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholderText: {
    color: '#718096',
    fontSize: width * 0.035,
    fontWeight: '500',
  },
  unavailableText: {
    color: '#E53E3E',
    fontSize: width * 0.03,
    marginTop: width * 0.01,
    fontStyle: 'italic',
  },
  paperActions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: width * 0.01,
  },
  iconButton: {
    padding: width * 0.015,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: width * 0.01,
    flex: 1,
  },
  viewButton: {
    backgroundColor: '#3498db',
  },
  downloadButton: {
    backgroundColor: '#2ecc71',
  },
  shareButton: {
    backgroundColor: '#9b59b6',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  progressContainer: {
    height: width * 0.04,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    marginTop: width * 0.02,
    marginHorizontal: width * 0.02,
    overflow: 'hidden',
    position: 'relative',
    padding: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 10,
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    color: '#333',
    fontSize: width * 0.025,
    fontWeight: '600',
    textAlignVertical: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: width * 0.05,
    paddingHorizontal: width * 0.02,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: width * 0.025,
    paddingHorizontal: width * 0.04,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  disabledButton: {
    backgroundColor: '#f8f9fa',
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: width * 0.035,
    fontWeight: '600',
    color: '#5B95C4',
    marginHorizontal: width * 0.01,
  },
  disabledButtonText: {
    color: '#ccc',
  },
  pageInfo: {
    paddingVertical: width * 0.025,
    paddingHorizontal: width * 0.04,
  },
  pageInfoText: {
    fontSize: width * 0.035,
    fontWeight: '500',
    color: '#476685',
  },
});

export default EPapers;

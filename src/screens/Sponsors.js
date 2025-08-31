import {
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
import Carousel from 'react-native-reanimated-carousel';
import {sponsor, sponsorpdf, sponsortitle} from '../util/apiCall';
import {useNavigation} from '@react-navigation/native';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  showPdfNotAvailableMessage,
  showNoPdfDataMessage,
  showPdfLoadFailedMessage,
} from '../Components/SubmissionMessage';
import RNFS from 'react-native-fs';
import {showMessage} from 'react-native-flash-message';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const Sponsors = () => {
  const navigation = useNavigation();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [title, setTitle] = useState('Champion Series Prize Distribution');
  const [titleLoading, setTitleLoading] = useState(true);
  const carouselRef = useRef(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  
  // Dynamic PDF options state
  const [pdfOptions, setPdfOptions] = useState([]);
  const [pdfOptionsLoading, setPdfOptionsLoading] = useState(true);
  
  // Loading states for each PDF option (using PDF ID as key)
  const [pdfLoadingStates, setPdfLoadingStates] = useState({});

  const isManualNavigation = useRef(false);

  // Function to get appropriate icon for each PDF type
  const getPdfIcon = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('ranking') || desc.includes('distribution')) {
      return 'leaderboard';
    } else if (desc.includes('claim') || desc.includes('process')) {
      return 'assignment';
    } else if (desc.includes('not received') || desc.includes('help')) {
      return 'help-outline';
    }
    return 'picture-as-pdf';
  };

  // Function to get appropriate color for each PDF type
  const getPdfButtonColor = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes('ranking') || desc.includes('distribution')) {
      return '#0288D1'; // Blue
    } else if (desc.includes('claim') || desc.includes('process')) {
      return '#0288D1'; // Green
    } else if (desc.includes('not received') || desc.includes('help')) {
      return '#ff6b35'; // Orange
    }
    return '#0288D1'; // Default blue
  };

  // Fetch PDF options
  const fetchPdfOptions = async () => {
    try {
      setPdfOptionsLoading(true);
      const response = await sponsorpdf();
      
      if (response && Array.isArray(response) && response.length > 0) {
        // Sort PDFs by ID to maintain consistent order
        const sortedPdfs = response.sort((a, b) => a.id - b.id);
        setPdfOptions(sortedPdfs);
        
        // Initialize loading states for each PDF
        const initialLoadingStates = {};
        sortedPdfs.forEach(pdf => {
          initialLoadingStates[pdf.id] = false;
        });
        setPdfLoadingStates(initialLoadingStates);
      } else {
        setPdfOptions([]);
      }
    } catch (error) {
      console.error('Error fetching PDF options:', error);
      setPdfOptions([]);
    } finally {
      setPdfOptionsLoading(false);
    }
  };

  // Handle viewing specific PDF
  const handleViewSpecificPDF = async (pdfOption) => {
    try {
      // Set loading state for this specific PDF
      setPdfLoadingStates(prev => ({
        ...prev,
        [pdfOption.id]: true
      }));

      if (!pdfOption.pdf) {
        showPdfNotAvailableMessage();
        return;
      }

      navigation.navigate('PdfViewer', {
        pdfUrl: pdfOption.pdf,
        title: pdfOption.description || 'PDF Document',
      });
    } catch (error) {
      console.error('Error viewing PDF:', error);
      showPdfLoadFailedMessage();
    } finally {
      // Reset loading state for this specific PDF
      setPdfLoadingStates(prev => ({
        ...prev,
        [pdfOption.id]: false
      }));
    }
  };

  // Handle downloading main sponsor PDF (first one in the list)
  const handleDownloadSponsorPDF = async () => {
    try {
      setDownloadingPdf(true);

      if (pdfOptions.length === 0) {
        showMessage({
          message: 'No PDF Data',
          description: 'No PDF data available for download.',
          type: 'warning',
          icon: 'auto',
        });
        return;
      }

      const pdfData = pdfOptions[0]; // Use first PDF for download

      if (!pdfData.pdf) {
        showMessage({
          message: 'PDF Not Available',
          description: 'PDF is not available for download.',
          type: 'warning',
          icon: 'auto',
        });
        return;
      }

      // Create filename from description or use default
      const fileName = `${(
        pdfData.description || 'Champion_Series_Prize_Distribution'
      ).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;

      let downloadDest;
      if (Platform.OS === 'android') {
        downloadDest = `${RNFS.DownloadDirectoryPath}/${fileName}`;
      } else {
        downloadDest = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      }

      const downloadOptions = {
        fromUrl: pdfData.pdf,
        toFile: downloadDest,
        background: true,
        progressDivider: 2,
        begin: res => {},
        progress: res => {
          const progressPercent = (res.bytesWritten / res.contentLength) * 100;
        },
      };

      const downloadTask = RNFS.downloadFile(downloadOptions);
      const result = await downloadTask.promise;

      if (result.statusCode === 200) {
        if (Platform.OS === 'android') {
          try {
            await RNFS.scanFile(downloadDest);
          } catch (err) {
            console.error('Error scanning file:', err);
          }
        }

        showMessage({
          message: 'Download Complete',
          description: 'Your PDF has been saved successfully.',
          type: 'success',
          icon: 'auto',
        });
      } else {
        throw new Error(
          `Download failed with status code: ${result.statusCode}`,
        );
      }
    } catch (error) {
      console.error('Download failed:', error);
      showMessage({
        message: 'Download Failed',
        description:
          error.message || 'An unexpected error occurred during download.',
        type: 'danger',
        icon: 'auto',
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    fetchSponsors();
    fetchTitle();
    fetchPdfOptions();
  }, []);

  const fetchTitle = async () => {
    try {
      setTitleLoading(true);
      const response = await sponsortitle();
      if (response && response.length > 0) {
        const titleData = response[0];
        if (titleData.title) {
          setTitle(titleData.title);
        }
      }
    } catch (err) {
      console.error('Error fetching title:', err);
    } finally {
      setTitleLoading(false);
    }
  };

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const response = await sponsor();
      setSponsors(response);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching sponsors:', err);
      setError('Failed to fetch sponsors');
      setLoading(false);
    }
  };

  const handleSnapToItem = index => {
    if (sponsors.length === 0) return;

    let normalizedIndex = index;
    if (index < 0) {
      normalizedIndex = sponsors.length - 1;
    } else if (index >= sponsors.length) {
      normalizedIndex = 0;
    } else {
      normalizedIndex = index % sponsors.length;
    }

    setCurrentIndex(normalizedIndex);

    setTimeout(() => {
      isManualNavigation.current = false;
    }, 50);
  };

  const handleDotPress = index => {
    if (carouselRef.current && sponsors.length > 0 && index !== currentIndex) {
      isManualNavigation.current = true;
      setCurrentIndex(index);
      carouselRef.current.scrollTo({index, animated: true});
    }
  };

  const renderSponsorCard = ({item, index}) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{uri: item.image}}
            style={styles.sponsorImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.sponsorName} numberOfLines={2}>
            {item.sponsorName}
          </Text>
          {item.month && item.year && (
            <Text style={styles.sponsorPeriod}>{item.ankName}</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {sponsors.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dot,
            index === currentIndex ? styles.activeDot : styles.inactiveDot,
          ]}
          onPress={() => handleDotPress(index)}
          activeOpacity={0.7}
        />
      ))}
    </View>
  );

  if (loading || titleLoading || pdfOptionsLoading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0288D1" />
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
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{title}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              fetchSponsors();
              fetchTitle();
              fetchPdfOptions();
            }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <Footer />
      </View>
    );
  }

  if (sponsors.length === 0) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{title}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No sponsors found</Text>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{title}</Text>
        </View>

        <View style={styles.carouselContainer}>
          <Carousel
            ref={carouselRef}
            width={windowWidth}
            height={windowHeight * 0.5}
            data={sponsors}
            renderItem={renderSponsorCard}
            autoPlay={autoPlay}
            autoPlayInterval={1200}
            scrollAnimationDuration={300}
            onSnapToItem={handleSnapToItem}
            loop={true}
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.85,
              parallaxScrollingOffset: 60,
              parallaxAdjacentItemScale: 0.75,
            }}
            customConfig={() => ({type: 'positive', viewCount: 1})}
            withAnimation={{
              type: 'spring',
              config: {
                damping: 18,
                stiffness: 120,
                mass: 0.8,
              },
            }}
            enabled={true}
            panGestureHandlerProps={{
              activeOffsetX: [-15, 15],
              failOffsetY: [-5, 5],
            }}
            defaultIndex={0}
            windowSize={3}
          />

          {sponsors.length > 1 && renderDots()}
        </View>

        <View style={styles.pdfSection}>
          <Text style={styles.pdfSectionTitle}>
            Prize Distribution PDF Gallery
          </Text>
          
          {/* Download button for the first PDF */}
          {pdfOptions.length > 0 && (
            <View style={styles.downloadButtonContainer}>
              <TouchableOpacity
                style={[styles.pdfButton, styles.downloadButton]}
                onPress={handleDownloadSponsorPDF}
                disabled={downloadingPdf || Object.values(pdfLoadingStates).some(loading => loading)}>
                {downloadingPdf ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="file-download" size={18} color="#fff" />
                )}
                <Text style={styles.pdfButtonText}>
                  {downloadingPdf ? 'Downloading...' : 'DOWNLOAD PDF'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Dynamic PDF View Buttons */}
          <View style={styles.pdfViewButtonsContainer}>
            {pdfOptions.map((pdfOption, index) => (
              <TouchableOpacity
                key={pdfOption.id}
                style={[
                  styles.pdfButton,
                  styles.viewButton,
                  { backgroundColor: getPdfButtonColor(pdfOption.description) }
                ]}
                onPress={() => handleViewSpecificPDF(pdfOption)}
                disabled={pdfLoadingStates[pdfOption.id] || downloadingPdf}>
                {pdfLoadingStates[pdfOption.id] ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon 
                    name={getPdfIcon(pdfOption.description)} 
                    size={18} 
                    color="#fff" 
                  />
                )}
                <Text style={styles.pdfButtonText} numberOfLines={2}>
                  {pdfLoadingStates[pdfOption.id] 
                    ? 'Loading...' 
                    : `VIEW ${pdfOption.description.toUpperCase()}`
                  }
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Show message if no PDF options available */}
          {pdfOptions.length === 0 && (
            <View style={styles.noPdfContainer}>
              <Text style={styles.noPdfText}>No PDF documents available</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
      <Footer />
    </View>
  );
};

export default Sponsors;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerContainer: {
    backgroundColor: '#0288D1',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  carouselContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: windowWidth * 0.9,
    height: windowHeight * 0.49,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: windowHeight * 0.35,
    backgroundColor: '#fff',
    padding: 8,
  },
  sponsorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  detailsContainer: {
    padding: 12,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  sponsorName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
  },
  sponsorPeriod: {
    fontSize: 11,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: -5,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dot: {
    marginHorizontal: 4,
    borderRadius: 50,
  },
  activeDot: {
    width: 8,
    height: 8,
    backgroundColor: '#0288D1',
    transform: [{scale: 1.2}],
  },
  inactiveDot: {
    width: 6,
    height: 6,
    backgroundColor: '#bdc3c7',
    opacity: 0.6,
  },
  pdfSection: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  pdfSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
    textAlign: 'center',
  },
  downloadButtonContainer: {
    marginBottom: 10,
  },
  pdfViewButtonsContainer: {
    gap: 8,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 45,
  },
  viewButton: {
    width: '100%',
  },
  downloadButton: {
    backgroundColor: '#28a745',
    width: '100%',
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
    textAlign: 'center',
    flex: 1,
  },
  noPdfContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noPdfText: {
    color: '#6c757d',
    fontSize: 14,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#0288D1',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#f8f9fa',
    minHeight: 200,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
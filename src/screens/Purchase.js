import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Modal,
  StatusBar 
} from 'react-native';
import {WebView} from 'react-native-webview';
import DropDownPicker from 'react-native-dropdown-picker';
import RNFS from 'react-native-fs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import {useAuth} from '../Auth/AuthContext';
import {getUserByEmail, getAPI} from '../util/apiCall';
import {ebookordersUrl, testseriesordersUrl} from '../util/Url';

const {width, height} = Dimensions.get('window');

const Purchase = () => {
  const {getUserEmail} = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [viewingPdf, setViewingPdf] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // DropDown state
  const [open, setOpen] = useState(false);
  const [selectedMaterialType, setSelectedMaterialType] = useState('all');
  const [dropdownItems, setDropdownItems] = useState([
    {label: 'All', value: 'all'},
    {label: 'Ebook', value: 'ebook'},
    {label: 'Test Series', value: 'testseries'},
  ]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const email = getUserEmail();
      if (!email) throw new Error('Email not found. Please login again.');

      const userResponse = await getUserByEmail(email);
      const user = userResponse?.data || userResponse;
      const userId = user.id;

      const [ebooks, testSeries] = await Promise.all([
        getAPI(ebookordersUrl, {}, userId, true),
        getAPI(testseriesordersUrl, {}, userId, true),
      ]);

      const formattedEbooks = (ebooks || []).map(item => ({
        ...item,
        type: 'ebook',
      }));

      const formattedTestSeries = (testSeries || []).map(item => ({
        ...item,
        type: 'testseries',
      }));

      setOrders([...formattedEbooks, ...formattedTestSeries]);
    } catch (err) {
      console.error('Error:', err.message);
      setError(err.message || 'Failed to load data');
      Alert.alert('Error', err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleDownloadPDF = async item => {
    const url = item?.vmMaterial?.pdfFile;
    if (!url) {
      Alert.alert('Error', 'PDF not available for this material');
      return;
    }

    const fileName = `${item?.vmMaterial?.chapterName?.replace(
      /[^a-zA-Z0-9]/g,
      '_',
    )}_${Date.now()}.pdf`;
    const downloadDest =
      Platform.OS === 'android'
        ? `${RNFS.DownloadDirectoryPath}/${fileName}`
        : `${RNFS.DocumentDirectoryPath}/${fileName}`;

    try {
      setDownloadProgress(prev => ({
        ...prev,
        [item.orderId]: {isDownloading: true, progress: 0},
      }));

      const downloadOptions = {
        fromUrl: url,
        toFile: downloadDest,
        background: true,
        progressDivider: 2,
        begin: () => {},
        progress: res => {
          const percent = (res.bytesWritten / res.contentLength) * 100;
          setDownloadProgress(prev => ({
            ...prev,
            [item.orderId]: {
              isDownloading: true,
              progress: percent,
            },
          }));
        },
      };

      const result = await RNFS.downloadFile(downloadOptions).promise;

      setDownloadProgress(prev => ({
        ...prev,
        [item.orderId]: {isDownloading: false, progress: 100},
      }));

      if (result.statusCode === 200) {
        Alert.alert('Success', 'PDF downloaded successfully');
        if (Platform.OS === 'android') {
          await RNFS.scanFile(downloadDest);
        }
      } else {
        throw new Error(`Download failed. Status code: ${result.statusCode}`);
      }
    } catch (error) {
      setDownloadProgress(prev => ({
        ...prev,
        [item.orderId]: {isDownloading: false, progress: 0},
      }));
      Alert.alert('Download Failed', error.message);
    }
  };

  // Enhanced PDF viewing with multiple fallback options
  const handleViewPDF = item => {
    const url = item?.vmMaterial?.pdfFile;
    if (!url) {
      Alert.alert('Error', 'PDF not available for this material');
      return;
    }

    // Use Google Docs viewer (most reliable for React Native)
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
      url,
    )}&embedded=true`;

    console.log('Opening PDF:', item?.vmMaterial?.chapterName);
    console.log('PDF URL:', url);
    console.log('Viewer URL:', viewerUrl);

    setViewingPdf({
      url: viewerUrl,
      title: item?.vmMaterial?.chapterName || 'PDF Document',
      originalUrl: url,
    });
  };
  const closePdfViewer = () => {
    setViewingPdf(null);
    setPdfLoading(false);
  };

  const filteredOrders =
    selectedMaterialType === 'all'
      ? orders
      : orders.filter(order => order.type === selectedMaterialType);

  const getTypeColor = type => {
    switch (type) {
      case 'ebook':
        return '#3B82F6';
      case 'testseries':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getTypeIcon = type => {
    switch (type) {
      case 'ebook':
        return 'menu-book';
      case 'testseries':
        return 'quiz';
      default:
        return 'description';
    }
  };

  const renderActionButtons = item => {
    const canDownload = item?.vmMaterial?.saveToDevice;
    const isDownloading = downloadProgress[item.orderId]?.isDownloading;

    return (
      <View style={styles.actionButtonsContainer}>
        {/* View Button - Always visible */}
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewPDF(item)}>
          <Icon name="visibility" size={16} color="#FFFFFF" />
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>

        {/* Download Button - Only visible when saveToDevice is true */}
        {canDownload && (
          <TouchableOpacity
            style={[
              styles.downloadButton,
              isDownloading && styles.downloadingButton,
            ]}
            onPress={() => handleDownloadPDF(item)}
            disabled={isDownloading}>
            {isDownloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Icon name="file-download" size={16} color="#FFFFFF" />
            )}
            <Text style={styles.downloadButtonText}>
              {isDownloading ? 'Downloading...' : 'Download'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCard = (item, index) => (
    <View key={index} style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.mainContent}>
          <View style={styles.titleRow}>
            <View style={styles.typeContainer}>
              <Icon
                name={getTypeIcon(item.type)}
                size={16}
                color={getTypeColor(item.type)}
              />
              <Text style={styles.chapterTitle} numberOfLines={2}>
                {item?.vmMaterial?.chapterName || 'Untitled'}
              </Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.dateContainer}>
              <Icon name="event" size={12} color="#6B7280" />
              <Text style={styles.dateText}>
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>

            {renderActionButtons(item)}
          </View>
        </View>
      </View>

      {downloadProgress[item.orderId]?.isDownloading && (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {width: `${downloadProgress[item.orderId]?.progress || 0}%`},
            ]}
          />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading your purchases...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchUserData}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.headerSection}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>My Material</Text>
              </View>

              <View style={styles.compactFilterContainer}>
                <DropDownPicker
                  open={open}
                  value={selectedMaterialType}
                  items={dropdownItems}
                  setOpen={setOpen}
                  setValue={setSelectedMaterialType}
                  setItems={setDropdownItems}
                  placeholder="Filter by type"
                  placeholderStyle={styles.dropdownPlaceholder}
                  style={styles.compactDropdown}
                  textStyle={styles.dropdownText}
                  dropDownContainerStyle={styles.dropdownList}
                  zIndex={3000}
                  zIndexInverse={1000}
                  searchable={false}
                  theme="LIGHT"
                  multiple={false}
                  showArrowIcon={true}
                  showTickIcon={false}
                />
              </View>
            </View>

            <ScrollView
              style={styles.cardsContainer}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}>
              {filteredOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Icon name="inbox" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No purchases found</Text>
                  <Text style={styles.emptySubText}>
                    {selectedMaterialType === 'all'
                      ? "You haven't made any purchases yet"
                      : `No ${selectedMaterialType} purchases found`}
                  </Text>
                </View>
              ) : (
                filteredOrders.map((item, index) => renderCard(item, index))
              )}
            </ScrollView>
          </>
        )}
      </View>
      <Footer />

      <Modal
        visible={!!viewingPdf}
        animationType="slide"
        onRequestClose={closePdfViewer}
        statusBarTranslucent={false}>
        <View style={styles.pdfModalContainer}>
          <View style={styles.pdfHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closePdfViewer}>
              <Icon name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.pdfHeaderTitle} numberOfLines={1}>
              {viewingPdf?.title || 'PDF Viewer'}
            </Text>
          </View>

          {pdfLoading && (
            <View style={styles.pdfLoadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
            </View>
          )}

          {viewingPdf && (
            <WebView
              source={{uri: viewingPdf.url}}
              style={styles.webView}
              onLoadStart={() => {
                console.log('PDF loading started');
                setPdfLoading(true);
              }}
              onLoadEnd={() => {
                console.log('PDF loading completed');
                setPdfLoading(false);
              }}
              onError={error => {
                console.error('WebView error:', error);
                setPdfLoading(false);
                Alert.alert(
                  'PDF Load Error',
                  'Failed to load PDF. Please check your internet connection and try again.',
                  [{text: 'OK', onPress: closePdfViewer}],
                );
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
                </View>
              )}
              onShouldStartLoadWithRequest={request => {
                console.log('Navigation request:', request.url);
                return (
                  request.url.includes('docs.google.com') ||
                  request.url.includes('googleusercontent.com')
                );
              }}
              allowsBackForwardNavigationGestures={true}
              allowsLinkPreview={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              cacheEnabled={true}
              scalesPageToFit={true}
              userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

export default Purchase;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    zIndex: 1000,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#3B82F6',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerSection: {
    marginBottom: 12,
  },
  titleRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  compactFilterContainer: {
    zIndex: 3000,
  },
  compactDropdown: {
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 40,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: '#1F2937',
  },
  dropdownList: {
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardsContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  cardContent: {
    padding: 12,
  },
  mainContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 8,
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#10B981',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  downloadButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#3B82F6',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  downloadingButton: {
    backgroundColor: '#9CA3AF',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: '#E5E7EB',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
  },
  // PDF Modal Styles
  pdfModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0) + 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    marginRight: 16,
    padding:4
  },
  pdfHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex:1
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  pdfLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  pdfLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

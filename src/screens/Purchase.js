import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Modal,
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
import {useNavigation} from '@react-navigation/native';
import {
  showErrorMessage,
  showSuccessMessage,
  showPdfLoadErrorMessage,
  showDataLoadErrorMessage,
  showDownloadFailedMessage,
  showPdfNotAvailableMessage,
  showDownloadSuccessMessage,
  hideMessage,
} from '../Components/SubmissionMessage';

const {width, height} = Dimensions.get('window');

const Purchase = () => {
  const {getUserEmail} = useAuth();
  const navigation = useNavigation();
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
    {label: 'All Materials', value: 'all'},
    {label: 'E-Books', value: 'ebook'},
    {label: 'Test Series', value: 'testseries'},
  ]);

  // Calculate statistics
  const calculateStats = () => {
    const totalItems = orders.length;
    const ebookCount = orders.filter(order => order.type === 'ebook').length;
    const testSeriesCount = orders.filter(
      order => order.type === 'testseries',
    ).length;

    // Calculate total amount spent
    const totalSpent = orders.reduce((total, order) => {
      return total + (order.amount || 0);
    }, 0);

    return {
      totalItems,
      ebookCount,
      testSeriesCount,
      totalSpent,
    };
  };

  const stats = calculateStats();

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

      const finalOrders = [...formattedEbooks, ...formattedTestSeries];

      setOrders(finalOrders);
    } catch (err) {
      console.error('❌ Error fetching user data:', err);
      setError(err.message || 'Failed to load data');
      showErrorMessage('Error', err.message || 'Failed to load data');
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
      showPdfNotAvailableMessage();
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
        showDownloadSuccessMessage();
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
      showErrorMessage('Download Failed', error.message);
    }
  };

  const handleViewPDF = item => {
    const url = item?.vmMaterial?.pdfFile;
    if (!url) {
      showPdfNotAvailableMessage();
      return;
    }

    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
      url,
    )}&embedded=true`;

    setViewingPdf({
      url: viewerUrl,
      title: item?.vmMaterial?.chapterName || 'PDF Document',
      originalUrl: url,
    });
  };

  const handleViewTestPapers = item => {
    navigation.navigate('TestPaper', {
      seriesId: item?.testSeries?.id || item.id || item.orderId,
      seriesName: item?.testSeries?.examTitle || 'Test Series',
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
        return '#2563EB';
      case 'testseries':
        return '#059669';
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
    if (item.type === 'testseries') {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.viewPapersButton}
            onPress={() => handleViewTestPapers(item)}>
            <Icon name="assignment" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>View Papers</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const canDownload = item?.vmMaterial?.saveToDevice;
    const isDownloading = downloadProgress[item.orderId]?.isDownloading;

    return (
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewPDF(item)}>
          <Icon name="visibility" size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>

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
            <Text style={styles.actionButtonText}>
              {isDownloading ? 'Downloading...' : 'Download'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderStatCard = (title, value, icon, color) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, {backgroundColor: color}]}>
        <Icon name={icon} size={14} color="#FFFFFF" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </View>
  );

  const renderStatsSection = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsHeader}>
        <Text style={styles.statsTitle}>My Purchases</Text>
      </View>
      <View style={styles.statsGrid}>
        {renderStatCard(
          'Total Items',
          stats.totalItems,
          'inventory-2',
          '#8B5CF6',
        )}
        {renderStatCard('E-Books', stats.ebookCount, 'menu-book', '#2563EB')}
        {renderStatCard(
          'Test Series',
          stats.testSeriesCount,
          'quiz',
          '#059669',
        )}
        {renderStatCard(
          'Total Spent',
          `₹${stats.totalSpent.toLocaleString()}`,
          'account-balance-wallet',
          '#DC2626',
        )}
      </View>
    </View>
  );

  const renderCard = (item, index) => (
    <View key={index} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTypeIndicator}>
          <View
            style={[
              styles.typeIcon,
              {backgroundColor: getTypeColor(item.type)},
            ]}>
            <Icon name={getTypeIcon(item.type)} size={16} color="#FFFFFF" />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {item?.vmMaterial?.chapterName ||
                item?.testSeries?.examTitle ||
                'Untitled'}
            </Text>
            <Text style={styles.cardType}>
              {item.type === 'ebook' ? 'E-Book' : 'Test Series'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardBody}>{renderActionButtons(item)}</View>

      {downloadProgress[item.orderId]?.isDownloading && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {width: `${downloadProgress[item.orderId]?.progress || 0}%`},
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(downloadProgress[item.orderId]?.progress || 0)}%
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0288D1" />
              <Text style={styles.loadingText}>Loading your purchases...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Icon name="error-outline" size={48} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchUserData}>
                <Icon name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Statistics Section */}
              {renderStatsSection()}

              <View style={styles.filterSection}>
                <View style={styles.filterDropdownContainer}>
                  <DropDownPicker
                    open={open}
                    value={selectedMaterialType}
                    items={dropdownItems}
                    setOpen={setOpen}
                    setValue={setSelectedMaterialType}
                    setItems={setDropdownItems}
                    placeholder="Filter by type"
                    placeholderStyle={styles.dropdownPlaceholder}
                    style={styles.filterDropdown}
                    textStyle={styles.dropdownText}
                    dropDownContainerStyle={styles.dropdownList}
                    zIndex={3000}
                    zIndexInverse={1000}
                    searchable={false}
                    theme="LIGHT"
                    multiple={false}
                    showArrowIcon={true}
                    showTickIcon={true}
                    tickIconStyle={{tintColor: '#2563EB'}}
                  />
                </View>
              </View>

              <View style={styles.cardsContainer}>
                {filteredOrders.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Icon name="library-books" size={60} color="#E5E7EB" />
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
              </View>
            </>
          )}
        </View>
      </ScrollView>
      <Footer />

      <Modal
        visible={!!viewingPdf}
        animationType="slide"
        onRequestClose={closePdfViewer}>
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
              <ActivityIndicator size="large" color="#0288D1" />
              <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
            </View>
          )}

          {viewingPdf && (
            <WebView
              source={{uri: viewingPdf.url}}
              style={styles.webView}
              onLoadStart={() => {
                setPdfLoading(true);
              }}
              onLoadEnd={() => {
                setPdfLoading(false);
              }}
              onError={error => {
                console.error('WebView error:', error);
                setPdfLoading(false);
                showPdfLoadErrorMessage(() => {
                  hideMessage();
                  closePdfViewer();
                });
              }}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color="#0288D1" />
                  <Text style={styles.pdfLoadingText}>Loading PDF...</Text>
                </View>
              )}
              onShouldStartLoadWithRequest={request => {
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Compact Statistics Styles
  statsContainer: {
    marginBottom: 10,
  },
  statsHeader: {
    marginBottom: 12,
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  statIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Loading and Error Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#0288D1',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Compact Filter Section
  filterSection: {
    marginBottom: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  filterSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterDropdownContainer: {
    zIndex: 3000,
  },
  filterDropdown: {
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownPlaceholder: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  dropdownList: {
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Compact Card Styles
  cardsContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  cardTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
    lineHeight: 20,
  },
  cardType: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  downloadButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  downloadingButton: {
    backgroundColor: '#9CA3AF',
  },
  viewPapersButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    flex: 1,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Compact Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },

  // PDF Modal Styles
  pdfModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  closeButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 12,
  },
  pdfHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  pdfLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 1000,
  },
  pdfLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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

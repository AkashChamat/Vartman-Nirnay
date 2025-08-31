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
  Alert,
} from 'react-native';
import {WebView} from 'react-native-webview';
import DropDownPicker from 'react-native-dropdown-picker';
import RNFS from 'react-native-fs';
import RNPrint from 'react-native-print';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import {useAuth} from '../Auth/AuthContext';
import {getUserByEmail, getAPI} from '../util/apiCall';
import {ordersUrl, testseriesordersUrl, paidbooksUrl} from '../util/Url';
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
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBillItem, setSelectedBillItem] = useState(null);

  // DropDown state
  const [open, setOpen] = useState(false);
  const [selectedMaterialType, setSelectedMaterialType] = useState('all');
  const [dropdownItems, setDropdownItems] = useState([
    {label: 'All Materials', value: 'all'},
    {label: 'E-Books', value: 'ebook'},
    {label: 'Test Series', value: 'testseries'},
    {label: 'Paid Books', value: 'paidbook'},
  ]);

  // Calculate statistics
  const calculateStats = () => {
    const totalItems = orders.length;
    const ebookCount = orders.filter(order => order.type === 'ebook').length;
    const testSeriesCount = orders.filter(
      order => order.type === 'testseries',
    ).length;
    const paidBookCount = orders.filter(
      order => order.type === 'paidbook',
    ).length;

    // Calculate total amount spent
    const totalSpent = orders.reduce((total, order) => {
      return total + (order.amount || order.totalAmount || 0);
    }, 0);

    return {
      totalItems,
      ebookCount,
      testSeriesCount,
      paidBookCount,
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

      const [ebooks, testSeries, paidBooks] = await Promise.all([
        getAPI(ordersUrl, {}, userId, true),
        getAPI(testseriesordersUrl, {}, userId, true),
        getAPI(paidbooksUrl, {}, userId, true),
      ]);

      const formattedEbooks = (ebooks || []).map(item => ({
        ...item,
        type: 'ebook',
      }));

      const formattedTestSeries = (testSeries || []).map(item => ({
        ...item,
        type: 'testseries',
      }));

      const formattedPaidBooks = (paidBooks || []).map(item => ({
        ...item,
        type: 'paidbook',
      }));

      const finalOrders = [
        ...formattedEbooks,
        ...formattedTestSeries,
        ...formattedPaidBooks,
      ];

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

  // Updated to show custom bill instead of PDF
  const handleViewBill = item => {
    setSelectedBillItem(item);
    setShowBillModal(true);
  };

  // Generate HTML content for bill printing
  const generateBillHTML = item => {
    const orderDate = formatDate(item.createdAt || item.orderDate);
    const orderId = formatOrderId(item.orderId || item.id);
    const mrp = item?.vmMaterial?.mrp || item.originalAmount || 200;
    const amountPaid = item.amount || item.totalAmount || 1;
    const savedAmount = mrp - amountPaid;
    const discountPercent = Math.round((savedAmount / mrp) * 100);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bill Receipt</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            background: white;
            color: #333;
          }
          .bill-container { 
            max-width: 600px; 
            margin: 0 auto; 
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
          }
          .bill-header { 
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white; 
            padding: 30px 20px; 
            text-align: center; 
          }
          .company-name { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 8px; 
          }
          .bill-title { 
            font-size: 18px; 
            opacity: 0.9; 
          }
          .bill-content { 
            padding: 30px; 
          }
          .section { 
            margin-bottom: 25px; 
          }
          .section-title { 
            font-size: 16px; 
            font-weight: bold; 
            color: #111827; 
            margin-bottom: 12px; 
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 6px;
          }
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 12px; 
          }
          .info-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0;
          }
          .info-label { 
            font-weight: 500; 
            color: #6b7280; 
          }
          .info-value { 
            font-weight: 600; 
            color: #111827; 
          }
          .status-paid { 
            background: #d1fae5; 
            color: #065f46; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 12px; 
            font-weight: bold; 
          }
          .item-details { 
            background: #f9fafb; 
            border-radius: 8px; 
            padding: 20px; 
            margin-bottom: 20px;
          }
          .item-name { 
            font-size: 18px; 
            font-weight: bold; 
            color: #111827; 
            margin-bottom: 8px; 
          }
          .item-type { 
            font-size: 14px; 
            color: #6b7280; 
            margin-bottom: 6px; 
          }
          .item-description { 
            font-size: 14px; 
            color: #9ca3af; 
          }
          .payment-summary { 
            background: #f8fafc; 
            border-radius: 8px; 
            padding: 20px; 
          }
          .payment-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
          }
          .payment-total { 
            border-top: 2px solid #e5e7eb; 
            margin-top: 12px; 
            padding-top: 12px; 
            font-weight: bold; 
            font-size: 18px; 
          }
          .discount-badge { 
            background: #fee2e2; 
            color: #dc2626; 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 12px; 
            font-weight: bold; 
          }
          .saved-amount { 
            color: #059669; 
            font-weight: bold; 
          }
          .total-amount { 
            color: #059669; 
            font-size: 20px; 
          }
          .bill-footer { 
            text-align: center; 
            padding: 20px; 
            background: #f8fafc; 
            color: #6b7280; 
            font-size: 14px; 
          }
          @media print {
            body { padding: 0; }
            .bill-container { border: none; }
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="bill-header">
            <div class="company-name">VartmanNirnay</div>
            <div class="bill-title">Purchase Receipt</div>
          </div>
          
          <div class="bill-content">
            <div class="section">
              <div class="section-title">Order Information</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Order ID:</span>
                  <span class="info-value">${orderId}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Date:</span>
                  <span class="info-value">${orderDate}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span class="status-paid">PAID</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Payment Method:</span>
                  <span class="info-value">Online</span>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Item Details</div>
              <div class="item-details">
                <div class="item-name">${
                  item?.vmMaterial?.chapterName || 'Untitled'
                }</div>
                <div class="item-type">${
                  item?.vmMaterial?.materialtype || 'Digital Content'
                }</div>
                <div class="item-description">${
                  item?.vmMaterial?.discription || 'Digital content purchase'
                }</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Payment Summary</div>
              <div class="payment-summary">
                <div class="payment-row">
                  <span>MRP:</span>
                  <span>₹${mrp.toLocaleString()}</span>
                </div>
                <div class="payment-row">
                  <span>Discount:</span>
                  <span class="discount-badge">${discountPercent}% OFF</span>
                </div>
                <div class="payment-row">
                  <span>You Saved:</span>
                  <span class="saved-amount">₹${savedAmount.toLocaleString()}</span>
                </div>
                <div class="payment-row payment-total">
                  <span>Total Amount Paid:</span>
                  <span class="total-amount">₹${amountPaid.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="bill-footer">
            <p>Thank you for your purchase!</p>
            <p>This is a computer generated receipt.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrintBill = async () => {

    if (!selectedBillItem) {
      showErrorMessage('Error', 'No bill data available');
      return;
    }

    try {
      const htmlContent = generateBillHTML(selectedBillItem);

      // Check if RNPrint is available
      if (!RNPrint || !RNPrint.print) {
        showErrorMessage('Print Error', 'Print service is not available');
        return;
      }

      // Simplified Android print options
      const printOptions = {
        html: htmlContent,
        jobName: `VartmanNirnay_Bill_${selectedBillItem.orderId || Date.now()}`,
      };

      const result = await RNPrint.print(printOptions);

      showSuccessMessage('Success', 'Print dialog opened successfully');
    } catch (error) {
      console.error('Print error details:', error);
      console.error('Error type:', typeof error);
      console.error('Error stack:', error.stack);
      showErrorMessage(
        'Print Error',
        error.message || 'Failed to open print dialog',
      );
    }
  };

  const closePdfViewer = () => {
    setViewingPdf(null);
    setPdfLoading(false);
  };

  const closeBillModal = () => {
    setShowBillModal(false);
    setSelectedBillItem(null);
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatOrderId = orderId => {
    if (!orderId) return 'N/A';
    return orderId.toString().toUpperCase();
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
      case 'paidbook':
        return '#F59E0B';
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
      case 'paidbook':
        return 'auto-stories';
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
          <TouchableOpacity
            style={styles.billButton}
            onPress={() => handleViewBill(item)}>
            <Icon name="receipt" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>View Bill</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (item.type === 'paidbook') {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.billButton}
            onPress={() => handleViewBill(item)}>
            <Icon name="receipt" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>View Bill</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // For ebooks - show View, Download, and Bill buttons
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

        <TouchableOpacity
          style={styles.billButton}
          onPress={() => handleViewBill(item)}>
          <Icon name="receipt" size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>View Bill</Text>
        </TouchableOpacity>
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
          'Paid Books',
          stats.paidBookCount,
          'auto-stories',
          '#F59E0B',
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

  const renderBillDetails = () => {
    if (!selectedBillItem) return null;

    const item = selectedBillItem;
    const orderDate = formatDate(item.createdAt || item.orderDate);
    const orderId = formatOrderId(item.orderId || item.id);
    const mrp = item?.vmMaterial?.mrp || item.originalAmount || 200;
    const amountPaid = item.amount || item.totalAmount || 1;
    const savedAmount = mrp - amountPaid;
    const discountPercent = Math.round((savedAmount / mrp) * 100);

    return (
      <ScrollView
        style={styles.billContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.billHeader}>
          <Text style={styles.billTitle}>Bill Details</Text>
          <TouchableOpacity
            style={styles.billCloseButton}
            onPress={closeBillModal}>
            <Icon name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Order Information */}
        <View style={styles.billSection}>
          <Text style={styles.billSectionTitle}>Order Information</Text>
          <View style={styles.billInfoGrid}>
            <View style={styles.billInfoItem}>
              <Text style={styles.billInfoLabel}>Order ID</Text>
              <Text style={styles.billInfoValue}>{orderId}</Text>
            </View>
            <View style={styles.billInfoItem}>
              <Text style={styles.billInfoLabel}>Date</Text>
              <Text style={styles.billInfoValue}>{orderDate}</Text>
            </View>
            <View style={styles.billInfoItem}>
              <Text style={styles.billInfoLabel}>Status</Text>
              <View style={styles.paidStatusBadge}>
                <Text style={styles.paidStatusText}>PAID</Text>
              </View>
            </View>
            <View style={styles.billInfoItem}>
              <Text style={styles.billInfoLabel}>Payment Method</Text>
              <Text style={styles.billInfoValue}>Online</Text>
            </View>
          </View>
        </View>

        {/* Item Details */}
        <View style={styles.billSection}>
          <Text style={styles.billSectionTitle}>Item Details</Text>
          <View style={styles.itemDetailsCard}>
            <View style={styles.itemImageContainer}>
              <Icon
                name={getTypeIcon(item.type)}
                size={40}
                color={getTypeColor(item.type)}
              />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>
                {item?.vmMaterial?.chapterName ||
                  item?.testSeries?.examTitle ||
                  item?.bookTitle ||
                  'Untitled'}
              </Text>
              <Text style={styles.itemCategory}>
                {item?.vmMaterial?.materialtype || 'Digital Content'}
              </Text>
              <Text style={styles.itemDescription}>
                {item?.vmMaterial?.discription || 'Digital content purchase'}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Summary */}
        <View style={styles.billSection}>
          <Text style={styles.billSectionTitle}>Payment Summary</Text>
          <View style={styles.paymentSummary}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>MRP:</Text>
              <Text style={styles.paymentValue}>₹{mrp.toLocaleString()}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Discount:</Text>
              <View style={styles.discountContainer}>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {discountPercent}% OFF
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>You Saved:</Text>
              <Text style={styles.savedAmount}>
                ₹{savedAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.totalAmountRow}>
              <Text style={styles.totalLabel}>Total Amount Paid:</Text>
              <Text style={styles.totalAmount}>
                ₹{amountPaid.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.printButton} onPress={handlePrintBill}>
          <Icon name="print" size={20} color="#FFFFFF" />
          <Text style={styles.printButtonText}>PRINT BILL</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

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
                item?.book?.bookName ||
                'Untitled'}
            </Text>
            <Text style={styles.cardType}>
              {item.type === 'ebook'
                ? 'E-Book'
                : item.type === 'testseries'
                ? 'Test Series'
                : 'Paid Book'}
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
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled">
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
                    listMode="SCROLLVIEW"
                    scrollViewProps={{
                      nestedScrollEnabled: true,
                      keyboardShouldPersistTaps: 'handled',
                    }}
                    flatListProps={undefined}
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

      {/* PDF Modal */}
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

      {/* Bill Details Modal */}
      <Modal
        visible={showBillModal}
        animationType="slide"
        onRequestClose={closeBillModal}>
        <View style={styles.billModalContainer}>{renderBillDetails()}</View>
      </Modal>
    </View>
  );
};

export default Purchase;

// Styles remain the same as provided in the original code
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
    width: (width - 56) / 2.5,
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

  // Card Styles
  cardsContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    lineHeight: 22,
    marginBottom: 4,
  },
  cardType: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  cardBody: {
    paddingTop: 8,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  viewButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
    minWidth: 90,
  },
  downloadButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
    minWidth: 90,
  },
  downloadingButton: {
    backgroundColor: '#9CA3AF',
  },
  viewPapersButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  billButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Progress Bar
  progressContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // PDF Modal Styles
  pdfModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  pdfHeader: {
    backgroundColor: '#1F2937',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pdfHeaderTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pdfLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#0288D1',
    fontWeight: '500',
  },

  // Bill Modal Styles
  billModalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  billContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  billTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  billCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  billSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  billSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  billInfoGrid: {
    gap: 12,
  },
  billInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  billInfoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  paidStatusBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paidStatusText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: 'bold',
  },

  // Item Details
  itemDetailsCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 16,
  },

  // Payment Summary
  paymentSummary: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  paymentValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: 'bold',
  },
  savedAmount: {
    fontSize: 14,
    color: '#059669',
    fontWeight: 'bold',
  },
  totalAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    color: '#059669',
    fontWeight: 'bold',
  },

  // Print Button
  printButton: {
    backgroundColor: '#2563EB',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  printButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

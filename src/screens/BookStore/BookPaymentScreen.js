import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  BackHandler,
  Modal,
  Platform,
} from 'react-native';
import {useRoute, useFocusEffect} from '@react-navigation/native';
import {WebView} from 'react-native-webview';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  showErrorMessage,
  showSuccessMessage,
  showPaymentInitErrorMessage,
  showPaymentFailedMessage,
  showPaymentCancelledMessage,
  showPaymentStatusUnknownMessage,
  showClosePaymentConfirmation,
  showPaymentInProgressMessage,
  hideMessage,
} from '../../Components/SubmissionMessage';

import {createBookPaymentSession} from '../../util/apiCall';

const validateBookPaymentData = (bookId, email, phone, userId, addressId) => {
  const errors = [];

  if (!bookId) {
    errors.push('Book ID is required');
  }

  // ✅ FIXED: Better email validation with null/undefined checks
  if (!email) {
    errors.push('Email is required');
  } else if (typeof email !== 'string') {
    errors.push('Email must be a valid string');
  } else if (!email.trim()) {
    errors.push('Email cannot be empty');
  } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
    errors.push('Valid email is required');
  }

  // ✅ IMPROVED: Better phone validation
  if (!phone) {
    errors.push('Phone number is required');
  } else {
    const phoneStr = phone.toString().replace(/\s+/g, '');
    if (!/^\d{10}$/.test(phoneStr)) {
      errors.push('Valid 10-digit phone number is required');
    }
  }

  if (!userId) {
    errors.push('User ID is required');
  }

  if (!addressId) {
    errors.push('Address selection is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const formatCurrency = amount => {
  if (!amount) return '₹0';
  return `₹${Number.parseFloat(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
  })}`;
};

const BookPaymentScreen = ({navigation}) => {
  const route = useRoute();
  const {book, addressId, userData} = route.params;
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [showWebView, setShowWebView] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [webViewLoading, setWebViewLoading] = useState(true);

  useEffect(() => {
    initializeBookPayment();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showWebView) {
          showPaymentInProgressMessage(
            () => {
              hideMessage();
              setShowWebView(false);
            },
            () => {
              hideMessage();
            },
          );
          return true;
        }
        return false;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [showWebView]),
  );

  const initializeBookPayment = async () => {
    try {
      setLoading(true);

      // Validate required data
      if (!book || !addressId || !userData) {
        throw new Error('Missing required payment data');
      }


      // Validate payment data
      const validation = validateBookPaymentData(
        book.id,
        userData.email,
        userData.contact,
        userData.id,
        addressId,
      );

      if (!validation.isValid) {
        console.error('❌ Validation failed:', validation.errors);
        showErrorMessage('Validation Error', validation.errors.join('\n'));
        setTimeout(() => navigation.goBack(), 2000);
        return;
      }

      const sessionResponse = await createBookPaymentSession(
        book.id, 
        userData.id, 
        userData.email, 
        userData.contact, 
        addressId, 
      );


      if (!sessionResponse.payment_session_id || !sessionResponse.order_id) {
        throw new Error('Invalid payment session response from server');
      }

      setSessionData(sessionResponse);
      setShowWebView(true);
      setLoading(false);
    } catch (error) {
      console.error('❌ Book payment initialization error:', error);
      setLoading(false);
      showPaymentInitErrorMessage(
        () => {
          hideMessage();
          initializeBookPayment();
        },
        () => {
          hideMessage();
          navigation.goBack();
        },
      );
    }
  };

  const handleWebViewMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'payment_result') {
        if (
          data.result &&
          (data.result.paymentDetails || data.result.status === 'CANCELLED')
        ) {
          handlePaymentResult(data.result);
        }
      } else if (data.type === 'payment_error') {
        handlePaymentResult({status: 'FAILED', error: data.error});
      }
    } catch (error) {
      const message = event.nativeEvent.data.toLowerCase();
      if (
        message.includes('payment_success') &&
        message.includes('paymentDetails')
      ) {
        handlePaymentResult({
          status: 'SUCCESS',
          orderId: sessionData?.order_id,
        });
      } else if (
        message.includes('payment_failed') ||
        message.includes('error')
      ) {
        handlePaymentResult({status: 'FAILED', orderId: sessionData?.order_id});
      } else if (message.includes('payment_cancelled')) {
        handlePaymentResult({
          status: 'CANCELLED',
          orderId: sessionData?.order_id,
        });
      }
    }
  };

  const handlePaymentResult = async result => {
    try {
      setShowWebView(false);
      setWebViewLoading(true);

      if (!result) {
        showPaymentStatusUnknownMessage(() => {
          hideMessage();
          navigation.navigate('Books');
        });
        return;
      }

      const txStatus =
        result.status ||
        result.txStatus ||
        result.paymentStatus ||
        result.orderStatus;
      const orderId =
        result.orderId || result.order_id || sessionData?.order_id;

      if (
        txStatus === 'SUCCESS' ||
        txStatus === 'PAID' ||
        txStatus === 'success' ||
        txStatus === 'COMPLETED'
      ) {
        showSuccessMessage(
          'Payment Successful! 🎉',
          `Your book purchase has been completed successfully.${
            orderId ? `\nOrder ID: ${orderId}` : ''
          }`,
        );
        setTimeout(() => navigation.navigate('Books'), 3000);
      } else if (
        txStatus === 'FAILED' ||
        txStatus === 'failed' ||
        txStatus === 'FAILURE' ||
        txStatus === 'ERROR'
      ) {
        showPaymentFailedMessage(
          () => {
            hideMessage();
            initializeBookPayment();
          },
          () => {
            hideMessage();
            navigation.navigate('Books');
          },
          result.message ||
            result.error ||
            'Payment could not be processed. Please try again.',
        );
      } else if (
        txStatus === 'CANCELLED' ||
        txStatus === 'cancelled' ||
        txStatus === 'CANCELED' ||
        txStatus === 'ABORTED'
      ) {
        showPaymentCancelledMessage(
          () => {
            hideMessage();
            initializeBookPayment();
          },
          () => {
            hideMessage();
            navigation.navigate('Books');
          },
        );
      } else {
        console.warn('⚠️ Unknown payment status:', txStatus);
        showErrorMessage(
          'Payment Status Unknown',
          `Unable to determine payment result. Status: ${
            txStatus || 'Unknown'
          }\nPlease check your purchase history or contact support.`,
        );
        setTimeout(() => navigation.navigate('Books'), 4000);
      }
    } catch (error) {
      console.error('❌ Error processing book payment result:', error);
      showErrorMessage(
        'Error',
        'Failed to process payment result. Please contact support.',
      );
    }
  };

  const closeWebView = () => {
    showClosePaymentConfirmation(
      () => {
        hideMessage();
      },
      () => {
        hideMessage();
        setShowWebView(false);
        setWebViewLoading(true);
        navigation.navigate('Books');
      },
    );
  };

  const goBack = () => {
    if (showWebView) {
      closeWebView();
      return;
    }
    navigation.goBack();
  };

  const createPaymentHTML = () => {
    if (!sessionData) return '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Book Payment</title>
    <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html, body {
            height: 100%;
            width: 100%;
            overflow-x: hidden;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
            padding: max(20px, env(safe-area-inset-top)) 20px max(20px, env(safe-area-inset-bottom)) 20px;
            line-height: 1.6;
        }
        
        .payment-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 40px;
            max-width: 420px;
            width: 100%;
            max-height: 90vh;
            max-height: 90dvh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
        }
        
        .payment-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2);
        }
        
        .header {
            text-align: center;
            margin-bottom: 32px;
        }
        
        .logo-container {
            background: linear-gradient(135deg, #667eea, #764ba2);
            width: 64px;
            height: 64px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
        }
        
        .logo {
            font-size: 24px;
            color: white;
        }
        
        .title {
            font-size: 24px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 8px;
        }
        
        .subtitle {
            color: #718096;
            font-size: 14px;
        }
        
        .book-info {
            background: rgba(255, 255, 255, 0.7);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 24px;
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .book-detail {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .book-detail:last-child {
            margin-bottom: 0;
            font-weight: 600;
            font-size: 16px;
            color: #667eea;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            padding-top: 12px;
            margin-top: 12px;
        }
        
        .book-label {
            color: #4a5568;
            font-weight: 500;
        }
        
        .book-value {
            color: #1a202c;
            font-weight: 600;
            text-align: right;
        }
        
        .initializing-container {
            text-align: center;
            padding: 40px 20px;
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .initializing-text {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 8px;
        }
        
        .initializing-subtext {
            font-size: 14px;
            color: #718096;
        }
        
        .error-message {
            background: #fed7d7;
            color: #c53030;
            padding: 16px;
            border-radius: 12px;
            margin: 20px 0;
            border: 1px solid #feb2b2;
            font-size: 14px;
            text-align: center;
            display: none;
        }
        
        .retry-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 16px;
            touch-action: manipulation;
        }
        
        .retry-button:active {
            transform: translateY(1px);
        }
        
        @media (max-width: 480px) {
            body {
                padding: max(10px, env(safe-area-inset-top)) 10px max(10px, env(safe-area-inset-bottom)) 10px;
            }
            
            .payment-container {
                padding: 24px;
                margin: 10px;
                max-height: 95vh;
                max-height: 95dvh;
            }
        }
        
        @supports (height: 100dvh) {
            body {
                min-height: 100dvh;
            }
            
            .payment-container {
                max-height: 90dvh;
            }
        }
    </style>
</head>
<body>
    <div class="payment-container">
        <div class="header">
            <div class="logo-container">
                <div class="logo">📚</div>
            </div>
            <h1 class="title">Book Purchase</h1>
            <p class="subtitle">Secure payment powered by Cashfree</p>
        </div>

        <div class="book-info">
            <div class="book-detail">
                <span class="book-label">Book:</span>
                <span class="book-value">${book.bookName || 'N/A'}</span>
            </div>
            <div class="book-detail">
                <span class="book-label">Email:</span>
                <span class="book-value">${userData.email || 'N/A'}</span>
            </div>
            <div class="book-detail">
                <span class="book-label">Amount:</span>
                <span class="book-value">${formatCurrency(book.price)}</span>
            </div>
        </div>

        <div class="initializing-container">
            <div class="spinner"></div>
            <div class="initializing-text">Setting up payment</div>
            <div class="initializing-subtext">Please wait while we redirect you to the payment gateway</div>
        </div>

        <div class="error-message" id="error-message">
            <div>Failed to initialize payment system</div>
            <button class="retry-button" onclick="initializePayment()">Retry</button>
        </div>
    </div>

    <script>
        let cashfreeInstance = null;
        let paymentStarted = false;
        let initializationAttempts = 0;
        const maxAttempts = 3;
        
        function safeInitialize() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializePayment);
            } else {
                initializePayment();
            }
        }
        
        safeInitialize();
        
        function initializePayment() {
            if (initializationAttempts >= maxAttempts) {
                showError("Maximum initialization attempts reached. Please try again later.");
                return;
            }
            
            initializationAttempts++;
            
            try {
                if (window.Cashfree) {
                    cashfreeInstance = new window.Cashfree({
                        mode: "production" // Change to "sandbox" for testing
                    });
                    
                    startPayment();
                } else {
                    throw new Error("Cashfree SDK not loaded");
                }
            } catch (error) {
                console.error("❌ Cashfree initialization error:", error);
                showError("Failed to initialize payment system. Please try again.");
            }
        }
        
        function startPayment() {
            if (paymentStarted) return;
            
            const errorDiv = document.getElementById('error-message');
            
            try {
                if (!cashfreeInstance) {
                    throw new Error("Payment system not initialized. Please try again.");
                }
                
                paymentStarted = true;
                errorDiv.style.display = 'none';
                                
                cashfreeInstance.checkout({
                    paymentSessionId: "${sessionData.payment_session_id}",
                    redirectTarget: "_modal",
                    appearance: {
                        primaryColor: "#667eea",
                        backgroundColor: "#ffffff"
                    }
                }).then(function(result) {
                    paymentStarted = false;
                    
                    if (result && result.paymentDetails) {
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'payment_result',
                                result: {
                                    status: 'SUCCESS',
                                    orderId: '${sessionData.order_id}',
                                    sessionId: '${
                                      sessionData.payment_session_id
                                    }',
                                    paymentDetails: result.paymentDetails,
                                    ...result
                                }
                            }));
                        }
                    } else {
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'payment_error',
                                error: 'Payment was not completed properly'
                            }));
                        }
                    }
                    
                }).catch(function(error) {
                    console.error("❌ Payment error:", error);
                    paymentStarted = false;
                    
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'payment_error',
                            error: error.message || 'Payment failed'
                        }));
                    }
                    
                    showError(error.message || 'Payment failed. Please try again.');
                });
                
            } catch (error) {
                console.error("❌ Payment start error:", error);
                paymentStarted = false;
                showError(error.message);
            }
        }
        
        function showError(message) {
            const errorDiv = document.getElementById('error-message');
            if (errorDiv) {
                const messageDiv = errorDiv.querySelector('div');
                if (messageDiv) {
                    messageDiv.textContent = message;
                }
                errorDiv.style.display = 'block';
            }
        }
        
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type) {
                const messageData = {
                    orderId: '${sessionData.order_id}',
                    sessionId: '${sessionData.payment_session_id}',
                    ...event.data
                };
                
                switch(event.data.type) {
                    case 'payment_success':
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'payment_result',
                                result: {
                                    status: 'SUCCESS',
                                    ...messageData
                                }
                            }));
                        }
                        break;
                    case 'payment_failed':
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'payment_error',
                                error: event.data.message || 'Payment failed'
                            }));
                        }
                        break;
                    case 'payment_cancelled':
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'payment_result',
                                result: {
                                    status: 'CANCELLED',
                                    ...messageData
                                }
                            }));
                        }
                        break;
                }
            }
        });
        
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible' && paymentStarted) {
                // Payment is visible again
            }
        });
        
        window.addEventListener('beforeunload', function(e) {
            if (paymentStarted) {
                e.preventDefault();
                e.returnValue = 'Payment is in progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    </script>
</body>
</html>
`;
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Initializing Payment...</Text>
          <Text style={styles.loadingSubtext}>
            Setting up secure payment gateway
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
      {/* Payment WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeWebView}>
        <SafeAreaView style={[styles.modalContainer, {paddingTop: insets.top}]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeWebView} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Book Purchase</Text>
            <View style={styles.headerSpacer} />
          </View>

          {webViewLoading && (
            <View style={styles.webViewLoadingContainer}>
              <ActivityIndicator size="large" color="#667eea" />
              <Text style={styles.webViewLoadingText}>
                Loading Payment Gateway...
              </Text>
            </View>
          )}

          <WebView
            source={{html: createPaymentHTML()}}
            onMessage={handleWebViewMessage}
            onLoadEnd={() => setWebViewLoading(false)}
            onLoadStart={() => setWebViewLoading(true)}
            onError={error => {
              console.error('❌ WebView error:', error);
              setWebViewLoading(false);
              showErrorMessage('Error', 'Failed to load payment page');
            }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            mixedContentMode="compatibility"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo={true}
            allowsProtectedMedia={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={false}
            decelerationRate="normal"
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  closeButtonText: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 80,
  },
  webViewLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(10px)',
  },
  webViewLoadingText: {
    fontSize: 16,
    color: '#495057',
    marginTop: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    ...Platform.select({
      android: {
        opacity: 0.99,
      },
    }),
  },
});

export default BookPaymentScreen;

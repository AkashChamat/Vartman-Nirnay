import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  BackHandler,
  Modal,
} from 'react-native';
import {useRoute, useFocusEffect} from '@react-navigation/native';
import {WebView} from 'react-native-webview';
import {useAuth} from '../../Auth/AuthContext';
import {
  createTestSeriesPaymentSession,
  getUserByEmail,
} from '../../util/apiCall';
import FlashMessage, {showMessage} from 'react-native-flash-message';

// Payment validation and helper functions
const validatePaymentData = (seriesId, email, phone, amount, userId) => {
  const errors = [];

  if (!seriesId) {
    errors.push('Series ID is required');
  }

  if (!email || !email.trim()) {
    errors.push('Email is required');
  } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
    errors.push('Valid email is required');
  }

  if (!phone) {
    errors.push('Phone number is required');
  } else if (!/^\d{10}$/.test(phone.toString().replace(/\s+/g, ''))) {
    errors.push('Valid 10-digit phone number is required');
  }

  if (amount && (isNaN(amount) || amount <= 0)) {
    errors.push('Valid amount is required');
  }

  if (!userId) {
    errors.push('User ID is required');
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

const TestSeriesPaymentScreen = ({navigation}) => {
  const route = useRoute();
  const {seriesId} = route.params || {};
  const {amount} = route.params || {};

  const {getUserEmail} = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    email: '',
    phone: '',
    userId: null,
  });
  const [showWebView, setShowWebView] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [webViewLoading, setWebViewLoading] = useState(true);

  useEffect(() => {
    initializePayment();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showWebView) {
          showMessage({
            message: 'Payment in Progress',
            description: 'Please complete or cancel the payment first.',
            type: 'warning',
            duration: 3000,
          });
          return true;
        }
        return false;
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [showWebView]),
  );

  const fetchSeriesData = async () => {
    try {
      // If we have seriesId, we need to fetch the series details from API
      if (routeSeriesId) {
        return {
          seriesId: routeSeriesId,
          seriesName: seriesName || 'Test Series', // You'll need to fetch this
          amount: amount || 0, // You'll need to fetch this
        };
      }

      // If no seriesId at all, throw error
      throw new Error(
        'Series ID is required but not provided in navigation params',
      );
    } catch (error) {
      console.error('❌ Error fetching series data:', error);
      throw error;
    }
  };

  const initializePayment = async () => {
    try {
      setLoading(true);

      // Get user data
      const email = await getUserEmail();

      if (!email || !email.trim()) {
        showMessage({
          message: 'Error',
          description: 'Email not found. Please login again.',
          type: 'danger',
          onPress: () => navigation.goBack(),
        });
        return;
      }

      const response = await getUserByEmail(email);
      if (!response) {
        throw new Error('User data not found.');
      }

      const userEmail = response.email || email;
      const userPhone =
        response.contact || response.phoneNumber || response.phone || '';
      const userId = response.id;

      if (!userPhone) {
        showMessage({
          message: 'Missing Phone Number',
          description:
            'Phone number is required for payment. Please update your profile.',
          type: 'warning',
          duration: 4000,
          onPress: () => navigation.navigate('Profile'),
        });
        return;
      }

      const user = {
        email: userEmail,
        phone: userPhone.toString(),
        userId: userId,
      };

      setUserData(user);

      // Validate payment data
      const validation = validatePaymentData(
        seriesId,
        userEmail,
        userPhone,
        amount,
        userId,
      );

      if (!validation.isValid) {
        showMessage({
          message: 'Validation Error',
          description: validation.errors.join('\n'),
          type: 'danger',
          duration: 4000,
        });
        return;
      }

      // Create payment session for test series
      const sessionResponse = await createTestSeriesPaymentSession(
        seriesId,
        userEmail,
        userPhone,
        userId,
      );

      if (!sessionResponse.payment_session_id || !sessionResponse.order_id) {
        throw new Error('Invalid payment session response from server');
      }

      setSessionData(sessionResponse);
      setShowWebView(true);
      setLoading(false);
    } catch (error) {
      console.error('❌ Test Series Payment initialization error:', error);
      setLoading(false);
      showMessage({
        message: 'Payment Error',
        description: error.message || 'Failed to initialize payment',
        type: 'danger',
        duration: 4000,
        onPress: () => initializePayment(),
      });
    }
  };

  const handleWebViewMessage = event => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'payment_result') {
        // Only process if we have actual payment details or confirmed status
        if (
          data.result &&
          (data.result.paymentDetails || data.result.status === 'CANCELLED')
        ) {
          handlePaymentResult(data.result);
        } else {
        }
      } else if (data.type === 'payment_error') {
        handlePaymentResult({status: 'FAILED', error: data.error});
      }
    } catch (error) {
      // Handle simple string messages with more validation
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
        showMessage({
          message: 'Payment Successful! 🎉',
          description: `Your test series payment has been processed successfully.`,
          type: 'success',
          duration: 4000,
          onPress: () => navigation.goBack(),
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
        Alert.alert(
          'Payment Successful! 🎉',
          `Your test series payment has been processed successfully.${
            orderId ? `\n\nOrder ID: ${orderId}` : ''
          }`,
          [{text: 'Continue', onPress: () => navigation.goBack()}],
        );
      } else if (
        txStatus === 'FAILED' ||
        txStatus === 'failed' ||
        txStatus === 'FAILURE' ||
        txStatus === 'ERROR'
      ) {
        showMessage({
          message: 'Payment Failed',
          description:
            result.message ||
            result.error ||
            'Payment could not be processed. Please try again.',
          type: 'danger',
          duration: 4000,
          onPress: () => initializePayment(),
        });
      } else if (
        txStatus === 'CANCELLED' ||
        txStatus === 'cancelled' ||
        txStatus === 'CANCELED' ||
        txStatus === 'ABORTED'
      ) {
        showMessage({
          message: 'Payment Cancelled',
          description: 'You cancelled the payment process.',
          type: 'info',
          duration: 3000,
          onPress: () => initializePayment(),
        });
      } else {
        console.warn('⚠️ Unknown payment status:', txStatus);
        showMessage({
          message: 'Payment Status Unknown',
          description: `Unable to determine payment result. Status: ${
            txStatus || 'Unknown'
          }\n\nPlease check your payment history or contact support.`,
          type: 'warning',
          duration: 5000,
          onPress: () => navigation.goBack(),
        });
      }
    } catch (error) {
      console.error('❌ Error processing payment result:', error);
      showMessage({
        message: 'Error',
        description:
          'Failed to process payment result. Please contact support.',
        type: 'danger',
        duration: 4000,
      });
    }
  };

  const closeWebView = () => {
    showMessage({
      message: 'Close Payment',
      description:
        'Are you sure you want to close the payment? Your payment will be cancelled.',
      type: 'warning',
      duration: 4000,
      onPress: () => {
        setShowWebView(false);
        setWebViewLoading(true);
        navigation.goBack();
      },
    });
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Test Series Payment</title>
    <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            line-height: 1.6;
        }
        
        .payment-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 40px;
            max-width: 420px;
            width: 100%;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }
        
        .payment-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
        }
        
        .header {
            text-align: center;
            margin-bottom: 32px;
        }
        
        .logo-container {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            width: 64px;
            height: 64px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
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
        
        .initializing-container {
            text-align: center;
            padding: 40px 20px;
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #4f46e5;
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
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 16px;
        }
        
        .retry-button:hover {
            transform: translateY(-1px);
        }
        
        @media (max-width: 480px) {
            .payment-container {
                padding: 24px;
                margin: 10px;
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
            <h1 class="title">Test Series Payment</h1>
            <p class="subtitle">Initializing secure payment gateway...</p>
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
        
        // Initialize Cashfree when page loads
        window.addEventListener('load', function() {
            initializePayment();
        });
        
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
                    
                    // Start payment immediately
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
            if (paymentStarted) {
                return;
            }
            
            const errorDiv = document.getElementById('error-message');
            
            try {
                if (!cashfreeInstance) {
                    throw new Error("Payment system not initialized. Please try again.");
                }
                
                paymentStarted = true;
                errorDiv.style.display = 'none';
                                
                // Start payment with Cashfree - this will open the payment modal directly
                cashfreeInstance.checkout({
                    paymentSessionId: "${sessionData.payment_session_id}",
                    redirectTarget: "_modal",
                    appearance: {
                        primaryColor: "#4f46e5",
                        backgroundColor: "#ffffff"
                    }
                }).then(function(result) {
                    paymentStarted = false;
                    
                    // Send result to React Native
                    if (result && result.paymentDetails) {
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'payment_result',
                                result: {
                                    status: 'SUCCESS',
                                    orderId: '${sessionData.order_id}',
                                    sessionId: '${sessionData.payment_session_id}',
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
                    
                    // Send error to React Native
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
            errorDiv.querySelector('div').textContent = message;
            errorDiv.style.display = 'block';
        }
        
        // Listen for payment events from Cashfree
        window.addEventListener('message', function(event) {
            
            if (event.data && event.data.type) {
                switch(event.data.type) {
                    case 'payment_success':
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'payment_result',
                                result: {
                                    status: 'SUCCESS',
                                    orderId: '${sessionData.order_id}',
                                    sessionId: '${sessionData.payment_session_id}',
                                    ...event.data
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
                                    orderId: '${sessionData.order_id}'
                                }
                            }));
                        }
                        break;
                }
            }
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible' && paymentStarted) {
            }
        });
        
        // Prevent accidental page refresh during payment
        window.addEventListener('beforeunload', function(e) {
            if (paymentStarted) {
                e.preventDefault();
                e.returnValue = '';
                return 'Payment is in progress. Are you sure you want to leave?';
            }
        });
    </script>
</body>
</html>
`;
  };

  // Show loading screen while initializing
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>
            Initializing Test Series Payment...
          </Text>
          <Text style={styles.loadingSubtext}>
            Setting up secure payment gateway
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test Series Payment</Text>
        </View>

        {/* Payment Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Amount:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(amount)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Email:</Text>
            <Text style={styles.summaryValue}>{userData.email}</Text>
          </View>
        </View>
      </ScrollView>

      {/* WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={closeWebView}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeWebView} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Test Series Payment</Text>
            <View style={styles.headerSpacer} />
          </View>

          {webViewLoading && (
            <View style={styles.webViewLoadingContainer}>
              <ActivityIndicator size="large" color="#4f46e5" />
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
              showMessage({
                message: 'Error',
                description: 'Failed to load payment page',
                type: 'danger',
                duration: 3000,
              });
            }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            mixedContentMode="compatibility"
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
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
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4f46e5',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginLeft: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#dc3545',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginLeft: 16,
  },
  headerSpacer: {
    flex: 1,
  },
  webViewLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  webViewLoadingText: {
    fontSize: 16,
    color: '#495057',
    marginTop: 12,
  },
  webview: {flex: 1},
});

export default TestSeriesPaymentScreen;

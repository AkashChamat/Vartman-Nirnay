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
import {useAuth} from '../Auth/AuthContext';
import {
  createPaymentSession,
  verifyPayment,
  getUserByEmail,
} from '../util/apiCall';

// Payment validation and helper functions
const validatePaymentData = (materialId, email, phone, amount, userId) => {
  const errors = [];

  if (!materialId) {
    errors.push('Material ID is required');
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

const CashfreePaymentScreen = ({navigation}) => {
  const route = useRoute();
  const {materialId, materialName, amount} = route.params;

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
          Alert.alert(
            'Payment in Progress',
            'Please complete or cancel the payment first.',
            [
              {text: 'Close Payment', onPress: () => setShowWebView(false)},
              {text: 'Continue', style: 'cancel'},
            ],
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

  const initializePayment = async () => {
    try {
      setLoading(true);
      
      // Get user data
      const email = await getUserEmail();

      if (!email || !email.trim()) {
        Alert.alert('Error', 'Email not found. Please login again.', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
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
        Alert.alert(
          'Missing Phone Number',
          'Phone number is required for payment. Please update your profile.',
          [
            {
              text: 'Update Profile',
              onPress: () => navigation.navigate('Profile'),
            },
            {text: 'Cancel', onPress: () => navigation.goBack()},
          ],
        );
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
        materialId,
        userEmail,
        userPhone,
        amount,
        userId,
      );
      
      if (!validation.isValid) {
        Alert.alert('Validation Error', validation.errors.join('\n'));
        return;
      }

      // Create payment session
      const sessionResponse = await createPaymentSession(
        materialId,
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
      console.error('❌ Payment initialization error:', error);
      setLoading(false);
      Alert.alert(
        'Payment Error',
        error.message || 'Failed to initialize payment',
        [
          {text: 'Try Again', onPress: () => initializePayment()},
          {text: 'Cancel', onPress: () => navigation.goBack()},
        ],
      );
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
        Alert.alert(
          'Payment Status Unknown',
          "The payment process completed but we couldn't determine the result. Please check your payment history or contact support.",
          [{text: 'OK', onPress: () => navigation.goBack()}],
        );
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
        try {
          // Verify payment on server if we have order details
          if (orderId && sessionData) {
            await verifyPayment(orderId, sessionData.payment_session_id);
          }

          Alert.alert(
            'Payment Successful! 🎉',
            `Your payment has been processed successfully.${
              orderId ? `\n\nOrder ID: ${orderId}` : ''
            }`,
            [{text: 'Continue', onPress: () => navigation.goBack()}],
          );
        } catch (verificationError) {
          console.error('❌ Payment verification failed:', verificationError);
          Alert.alert(
            'Payment Verification Failed',
            'Payment was successful but verification failed. Please contact support with your transaction details.',
            [{text: 'OK', onPress: () => navigation.goBack()}],
          );
        }
      } else if (
        txStatus === 'FAILED' ||
        txStatus === 'failed' ||
        txStatus === 'FAILURE' ||
        txStatus === 'ERROR'
      ) {
        Alert.alert(
          'Payment Failed',
          result.message ||
            result.error ||
            'Payment could not be processed. Please try again.',
          [
            {text: 'Try Again', onPress: () => initializePayment()},
            {text: 'Cancel', onPress: () => navigation.goBack()},
          ],
        );
      } else if (
        txStatus === 'CANCELLED' ||
        txStatus === 'cancelled' ||
        txStatus === 'CANCELED' ||
        txStatus === 'ABORTED'
      ) {
        Alert.alert('Payment Cancelled', 'You cancelled the payment process.', [
          {text: 'Try Again', onPress: () => initializePayment()},
          {text: 'Go Back', onPress: () => navigation.goBack()},
        ]);
      } else {
        console.warn('⚠️ Unknown payment status:', txStatus);
        Alert.alert(
          'Payment Status Unknown',
          `Unable to determine payment result. Status: ${
            txStatus || 'Unknown'
          }\n\nPlease check your payment history or contact support.`,
          [{text: 'OK', onPress: () => navigation.goBack()}],
        );
      }
    } catch (error) {
      console.error('❌ Error processing payment result:', error);
      Alert.alert(
        'Error',
        'Failed to process payment result. Please contact support.',
      );
    }
  };

  const closeWebView = () => {
    Alert.alert(
      'Close Payment',
      'Are you sure you want to close the payment? Your payment will be cancelled.',
      [
        {text: 'Continue Payment', style: 'cancel'},
        {
          text: 'Close',
          onPress: () => {
            setShowWebView(false);
            setWebViewLoading(true);
            navigation.goBack();
          },
          style: 'destructive',
        },
      ],
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Cashfree Payment</title>
    <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
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
                <div class="logo">💳</div>
            </div>
            <h1 class="title">Secure Payment</h1>
            <p class="subtitle">Initializing payment gateway...</p>
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
                        primaryColor: "#667eea",
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
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Initializing Payment...</Text>
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
          <Text style={styles.headerTitle}>Secure Payment</Text>
        </View>

        {/* Payment Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Payment Summary</Text>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Item:</Text>
            <Text style={styles.summaryValue}>{materialName}</Text>
          </View>
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
            <Text style={styles.modalTitle}>Secure Payment</Text>
            <View style={styles.headerSpacer} />
          </View>

          {webViewLoading && (
            <View style={styles.webViewLoadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.webViewLoadingText}>Loading Payment Gateway...</Text>
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
              Alert.alert('Error', 'Failed to load payment page');
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
    color: '#007bff',
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
  webview: {flex: 1}
})

export default CashfreePaymentScreen;
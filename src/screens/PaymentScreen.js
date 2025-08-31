
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  BackHandler,
  Modal,
  
  Platform,
} from 'react-native';
import {useRoute, useFocusEffect} from '@react-navigation/native';
import {WebView} from 'react-native-webview';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../Auth/AuthContext';
import {
  showErrorMessage,
  showSuccessMessage,
  showMissingPhoneMessage,
  showPaymentInitErrorMessage,
  showPaymentFailedMessage,
  showPaymentCancelledMessage,
  showPaymentStatusUnknownMessage,
  showClosePaymentConfirmation,
  showPaymentInProgressMessage,
  hideMessage,
} from '../Components/SubmissionMessage';

import {
  createPaymentSession,
  verifyPayment,
  getUserByEmail,
} from '../util/apiCall';

// Payment validation and helper functions (unchanged)
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
  const insets = useSafeAreaInsets(); // Android 15 safe area handling

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
          showPaymentInProgressMessage(
            () => {
              hideMessage();
              setShowWebView(false);
            },
            () => {
              hideMessage();
              // Continue - just hide the message
            }
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
        showErrorMessage('Error', 'Email not found. Please login again.');
        setTimeout(() => navigation.goBack(), 2000);
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
        showMissingPhoneMessage(
          () => {
            hideMessage();
            navigation.navigate('Profile');
          },
          () => {
            hideMessage();
            navigation.goBack();
          },
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
        showErrorMessage('Validation Error', validation.errors.join('\n'));
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
      showPaymentInitErrorMessage(
        () => {
          hideMessage();
          initializePayment();
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
        showPaymentStatusUnknownMessage(() => {
          hideMessage();
          navigation.goBack();
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
        try {
          // Verify payment on server if we have order details
          if (orderId && sessionData) {
            await verifyPayment(orderId, sessionData.payment_session_id);
          }

          showSuccessMessage(
            'Payment Successful! 🎉',
            `Your payment has been processed successfully.${
              orderId ? `\nOrder ID: ${orderId}` : ''
            }`,
          );
          setTimeout(() => navigation.goBack(), 3000);
        } catch (verificationError) {
          console.error('❌ Payment verification failed:', verificationError);
          showErrorMessage(
            'Payment Verification Failed',
            'Payment was successful but verification failed. Please contact support with your transaction details.',
          );
          setTimeout(() => navigation.goBack(), 4000);
        }
      } else if (
        txStatus === 'FAILED' ||
        txStatus === 'failed' ||
        txStatus === 'FAILURE' ||
        txStatus === 'ERROR'
      ) {
        showPaymentFailedMessage(
          () => {
            hideMessage();
            initializePayment();
          },
          () => {
            hideMessage();
            navigation.goBack();
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
            initializePayment();
          },
          () => {
            hideMessage();
            navigation.goBack();
          },
        );
      } else {
        console.warn('⚠️ Unknown payment status:', txStatus);
        showErrorMessage(
          'Payment Status Unknown',
          `Unable to determine payment result. Status: ${
            txStatus || 'Unknown'
          }\nPlease check your payment history or contact support.`,
        );
        setTimeout(() => navigation.goBack(), 4000);
      }
    } catch (error) {
      console.error('❌ Error processing payment result:', error);
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
        // Continue payment - just hide the message
      },
      () => {
        hideMessage();
        setShowWebView(false);
        setWebViewLoading(true);
        navigation.goBack();
      }
    );
  };

  const goBack = () => {
    if (showWebView) {
      closeWebView();
      return;
    }
    navigation.goBack();
  };

  // Android 15 compatible HTML with proper viewport and no deprecated styling
  const createPaymentHTML = () => {
    if (!sessionData) return '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Cashfree Payment</title>
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
            min-height: 100dvh; /* Android 15 dynamic viewport */
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
        
        /* Android 15 responsive adjustments */
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
        
        /* Android 15 edge-to-edge adjustments */
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
        
        // Android 15 safe initialization
        function safeInitialize() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializePayment);
            } else {
                initializePayment();
            }
        }
        
        // Initialize when page loads
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
        
        // Enhanced message handling for Android 15
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
        
        // Android 15 visibility handling
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible' && paymentStarted) {
                // Payment is visible again
            }
        });
        
        // Prevent accidental navigation during payment
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

  // Show loading screen while initializing
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
       
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
    <SafeAreaView style={[styles.container, {paddingTop: insets.top}]}>
    
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

      {/* Android 15 Compatible WebView Modal */}
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
            <Text style={styles.modalTitle}>Secure Payment</Text>
            <View style={styles.headerSpacer} />
          </View>

          {webViewLoading && (
            <View style={styles.webViewLoadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
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
            // Android 15 WebView optimizations
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

// Android 15 Compatible Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginRight: 60, // Compensate for back button
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
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
    // Android 15 elevation
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
    width: 80, // Match close button width for centering
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
    // Android 15 backdrop blur support
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
    // Android 15 WebView optimizations
    ...Platform.select({
      android: {
        // Ensure proper rendering on Android 15
        opacity: 0.99,
      },
    }),
  },
  
  // Android 15 specific responsive adjustments
  ...Platform.select({
    android: Platform.Version >= 34 ? {
      // Android 15 (API 34+) specific styles
      container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        // Edge-to-edge support
        paddingTop: 0,
      },
      
      modalContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        // Edge-to-edge modal support
        paddingTop: 0,
      },
      
      // Enhanced safe area handling for Android 15
      scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
      },
      
      // Improved touch targets for Android 15
      backButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        minHeight: 44,
        minWidth: 44,
        justifyContent: 'center',
      },
      
      closeButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
        minHeight: 44,
        minWidth: 44,
        justifyContent: 'center',
        alignItems: 'center',
      },
    } : {},
  }),
  
  // Additional Android 15 accessibility improvements
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    // Android 15 material design 3 support
    ...Platform.select({
      android: Platform.Version >= 34 ? {
        backgroundColor: '#fefefe',
        borderRadius: 16,
        elevation: 2,
      } : {},
    }),
  },
  
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: 48, // Better touch targets
  },
  
  // Android 15 enhanced loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f5f5f5',
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
    // Android 15 improved backdrop
    ...Platform.select({
      android: Platform.Version >= 34 ? {
        backgroundColor: 'rgba(245, 245, 245, 0.98)',
      } : {},
    }),
  },
  });

  export default CashfreePaymentScreen;
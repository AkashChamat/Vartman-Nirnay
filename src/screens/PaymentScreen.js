"use client"

import React, { useState, useEffect } from "react"
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
} from "react-native"
import { useRoute, useFocusEffect } from "@react-navigation/native"
import { WebView } from "react-native-webview"
import { useAuth } from "../Auth/AuthContext"
import { createPaymentSession, verifyPayment, getUserByEmail } from "../util/apiCall"

// Payment validation and helper functions
const validatePaymentData = (materialId, email, phone, amount, userId) => {
  const errors = []

  if (!materialId) {
    errors.push("Material ID is required")
  }

  if (!email || !email.trim()) {
    errors.push("Email is required")
  } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
    errors.push("Valid email is required")
  }

  if (!phone) {
    errors.push("Phone number is required")
  } else if (!/^\d{10}$/.test(phone.toString().replace(/\s+/g, ""))) {
    errors.push("Valid 10-digit phone number is required")
  }

  if (amount && (isNaN(amount) || amount <= 0)) {
    errors.push("Valid amount is required")
  }

  if (!userId) {
    errors.push("User ID is required")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

const formatCurrency = (amount) => {
  if (!amount) return "₹0"
  return `₹${Number.parseFloat(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
}

const CashfreePaymentScreen = ({ navigation }) => {
  const route = useRoute()
  const { materialId, materialName, amount } = route.params

  const { getUserEmail } = useAuth()
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState({ email: "", phone: "",userId: null  })
  const [showWebView, setShowWebView] = useState(false)
  const [sessionData, setSessionData] = useState(null)
  const [webViewLoading, setWebViewLoading] = useState(true)

  useEffect(() => {
    getUserData()
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (showWebView) {
          Alert.alert("Payment in Progress", "Please complete or cancel the payment first.", [
            { text: "Close Payment", onPress: () => setShowWebView(false) },
            { text: "Continue", style: "cancel" },
          ])
          return true
        }
        return false
      }
      BackHandler.addEventListener("hardwareBackPress", onBackPress)
      return () => BackHandler.removeEventListener("hardwareBackPress", onBackPress)
    }, [showWebView]),
  )

  const getUserData = async () => {
  try {
    const email = await getUserEmail()
    console.log("📧 Email from AuthContext:", email)

    if (!email || !email.trim()) {
      Alert.alert("Error", "Email not found. Please login again.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ])
      return
    }

    const response = await getUserByEmail(email)
    console.log("👤 getUserByEmail response:", response)

    if (!response) {
      throw new Error("User data not found.")
    }

    const userEmail = response.email || email
    const userPhone = response.contact || response.phoneNumber || response.phone || ""
    const userId = response.id // Extract userId from response

    if (!userPhone) {
      Alert.alert("Missing Phone Number", "Phone number is required for payment. Please update your profile.", [
        { text: "Update Profile", onPress: () => navigation.navigate("Profile") },
        { text: "Cancel", onPress: () => navigation.goBack() },
      ])
      return
    }

    // UPDATE setUserData to include userId
    setUserData({
      email: userEmail,
      phone: userPhone.toString(),
      userId: userId // Add this line
    })

    console.log("✅ User data loaded successfully", { userId, email: userEmail, phone: userPhone })
  } catch (error) {
    console.error("❌ Error fetching user data:", error)
    Alert.alert("Error", error.message || "Failed to fetch user data.", [
      { text: "OK", onPress: () => navigation.goBack() },
    ])
  }
}

 const handlePayment = async () => {
  if (!userData.email || !userData.phone || !userData.userId) {
    Alert.alert("Error", "User information is incomplete. Please try again.")
    return
  }

  const validation = validatePaymentData(materialId, userData.email, userData.phone, amount, userData.userId)
  if (!validation.isValid) {
    Alert.alert("Validation Error", validation.errors.join("\n"))
    return
  }

  setLoading(true)

  try {
    console.log("🚀 Creating payment session with userId:", userData.userId)

    // UPDATED: Pass userId to the payment API
    const sessionResponse = await createPaymentSession(
      materialId, 
      userData.email, 
      userData.phone,
      userData.userId // Add this parameter
    )

    console.log("📋 Full payment response:", sessionResponse)

    if (!sessionResponse.payment_session_id || !sessionResponse.order_id) {
      throw new Error("Invalid payment session response from server")
    }

    console.log("✅ Payment session created:", {
      sessionId: sessionResponse.payment_session_id,
      orderId: sessionResponse.order_id,
      userId: userData.userId
    })

    // Store session data
    setSessionData(sessionResponse)
    setShowWebView(true)
    setLoading(false)
  } catch (error) {
    console.error("❌ Payment Error:", error)
    setLoading(false)

    Alert.alert("Payment Error", error.message || "Failed to create payment session", [
      { text: "Try Again", onPress: () => setLoading(false) },
      { text: "Cancel", onPress: () => navigation.goBack() },
    ])
  }
}

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      console.log("📨 WebView message:", data)

      if (data.type === "payment_result") {
        // Only process if we have actual payment details or confirmed status
        if (data.result && (data.result.paymentDetails || data.result.status === "CANCELLED")) {
          handlePaymentResult(data.result)
        } else {
          console.log("⚠️ Ignoring incomplete payment result:", data.result)
        }
      } else if (data.type === "payment_error") {
        handlePaymentResult({ status: "FAILED", error: data.error })
      }
    } catch (error) {
      console.log("📨 WebView message (raw):", event.nativeEvent.data)

      // Handle simple string messages with more validation
      const message = event.nativeEvent.data.toLowerCase()
      if (message.includes("payment_success") && message.includes("paymentDetails")) {
        handlePaymentResult({ status: "SUCCESS", orderId: sessionData?.order_id })
      } else if (message.includes("payment_failed") || message.includes("error")) {
        handlePaymentResult({ status: "FAILED", orderId: sessionData?.order_id })
      } else if (message.includes("payment_cancelled")) {
        handlePaymentResult({ status: "CANCELLED", orderId: sessionData?.order_id })
      }
    }
  }

  const handlePaymentResult = async (result) => {
    try {
      console.log("🔍 Processing payment result:", result)
      setShowWebView(false)
      setWebViewLoading(true)

      if (!result) {
        Alert.alert(
          "Payment Status Unknown",
          "The payment process completed but we couldn't determine the result. Please check your payment history or contact support.",
          [{ text: "OK", onPress: () => navigation.goBack() }],
        )
        return
      }

      const txStatus = result.status || result.txStatus || result.paymentStatus || result.orderStatus
      const orderId = result.orderId || result.order_id || sessionData?.order_id

      console.log("🔍 Extracted values:", { txStatus, orderId })

      if (txStatus === "SUCCESS" || txStatus === "PAID" || txStatus === "success" || txStatus === "COMPLETED") {
        try {
          // Verify payment on server if we have order details
          if (orderId && sessionData) {
            console.log("🔄 Verifying payment on server...")
            await verifyPayment(orderId, sessionData.payment_session_id)
          }

          Alert.alert(
            "Payment Successful! 🎉",
            `Your payment has been processed successfully.${orderId ? `\n\nOrder ID: ${orderId}` : ""}`,
            [{ text: "Continue", onPress: () => navigation.goBack() }],
          )
        } catch (verificationError) {
          console.error("❌ Payment verification failed:", verificationError)
          Alert.alert(
            "Payment Verification Failed",
            "Payment was successful but verification failed. Please contact support with your transaction details.",
            [{ text: "OK", onPress: () => navigation.goBack() }],
          )
        }
      } else if (txStatus === "FAILED" || txStatus === "failed" || txStatus === "FAILURE" || txStatus === "ERROR") {
        Alert.alert(
          "Payment Failed",
          result.message || result.error || "Payment could not be processed. Please try again.",
          [
            { text: "Try Again", onPress: () => handlePayment() },
            { text: "Cancel", onPress: () => navigation.goBack() },
          ],
        )
      } else if (
        txStatus === "CANCELLED" ||
        txStatus === "cancelled" ||
        txStatus === "CANCELED" ||
        txStatus === "ABORTED"
      ) {
        Alert.alert("Payment Cancelled", "You cancelled the payment process.", [
          { text: "Try Again", onPress: () => handlePayment() },
          { text: "Go Back", onPress: () => navigation.goBack() },
        ])
      } else {
        console.warn("⚠️ Unknown payment status:", txStatus)
        Alert.alert(
          "Payment Status Unknown",
          `Unable to determine payment result. Status: ${txStatus || "Unknown"}\n\nPlease check your payment history or contact support.`,
          [{ text: "OK", onPress: () => navigation.goBack() }],
        )
      }
    } catch (error) {
      console.error("❌ Error processing payment result:", error)
      Alert.alert("Error", "Failed to process payment result. Please contact support.")
    }
  }

  const closeWebView = () => {
    Alert.alert("Close Payment", "Are you sure you want to close the payment? Your payment will be cancelled.", [
      { text: "Continue Payment", style: "cancel" },
      {
        text: "Close",
        onPress: () => {
          setShowWebView(false)
          setWebViewLoading(true)
        },
        style: "destructive",
      },
    ])
  }

  const goBack = () => {
    if (showWebView) {
      closeWebView()
      return
    }
    navigation.goBack()
  }

  // FIXED: Create HTML content that properly opens Cashfree payment interface
 // Replace the createPaymentHTML function in your React Native component with this improved version:

const createPaymentHTML = () => {
  if (!sessionData) return ""

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
        
        .amount-section {
            background: linear-gradient(135deg, #f7fafc, #edf2f7);
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            margin-bottom: 32px;
            border: 1px solid rgba(226, 232, 240, 0.8);
        }
        
        .amount-label {
            font-size: 14px;
            color: #718096;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .amount {
            font-size: 36px;
            font-weight: 800;
            color: #2d3748;
            margin-bottom: 4px;
        }
        
        .amount-currency {
            font-size: 24px;
            color: #667eea;
        }
        
        .details-section {
            margin-bottom: 32px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
        }
        
        .section-title::before {
            content: '';
            width: 4px;
            height: 16px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 2px;
            margin-right: 12px;
        }
        
        .detail-grid {
            display: grid;
            gap: 16px;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;
        }
        
        .detail-item:hover {
            background: #f1f5f9;
            transform: translateY(-1px);
        }
        
        .detail-label {
            font-size: 14px;
            color: #718096;
            font-weight: 500;
        }
        
        .detail-value {
            font-size: 14px;
            color: #2d3748;
            font-weight: 600;
            text-align: right;
            max-width: 200px;
            word-break: break-all;
        }
        
        .payment-methods {
            background: linear-gradient(135deg, #f0fff4, #f7fafc);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 32px;
            border: 1px solid rgba(72, 187, 120, 0.2);
        }
        
        .methods-title {
            font-size: 14px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }
        
        .methods-title::before {
            content: '💳';
            margin-right: 8px;
        }
        
        .methods-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
        }
        
        .method-item {
            font-size: 12px;
            color: #4a5568;
            padding: 6px 0;
            display: flex;
            align-items: center;
        }
        
        .method-item::before {
            content: '✓';
            color: #48bb78;
            font-weight: bold;
            margin-right: 6px;
            font-size: 10px;
        }
        
        .pay-button {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 18px 24px;
            border-radius: 16px;
            font-size: 18px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
            position: relative;
            overflow: hidden;
        }
        
        .pay-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transition: left 0.5s;
        }
        
        .pay-button:hover::before {
            left: 100%;
        }
        
        .pay-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
        }
        
        .pay-button:active {
            transform: translateY(0);
        }
        
        .pay-button:disabled {
            background: #a0aec0;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 12px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .security-section {
            text-align: center;
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e2e8f0;
        }
        
        .security-badge {
            display: inline-flex;
            align-items: center;
            background: #f0fff4;
            color: #22543d;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            border: 1px solid rgba(72, 187, 120, 0.2);
            margin-bottom: 8px;
        }
        
        .security-badge::before {
            content: '🔒';
            margin-right: 6px;
        }
        
        .security-features {
            font-size: 11px;
            color: #718096;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 16px;
        }
        
        .security-features span {
            display: flex;
            align-items: center;
        }
        
        .security-features span::before {
            content: '•';
            color: #48bb78;
            margin-right: 4px;
        }
        
        .error-message {
            background: #fed7d7;
            color: #c53030;
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 20px;
            border: 1px solid #feb2b2;
            font-size: 14px;
            display: none;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .success-message {
            background: #c6f6d5;
            color: #22543d;
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 20px;
            border: 1px solid #9ae6b4;
            font-size: 14px;
            display: none;
            animation: slideIn 0.3s ease;
        }
        
        .processing-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.95);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            backdrop-filter: blur(10px);
        }
        
        .processing-content {
            text-align: center;
            padding: 40px;
        }
        
        .processing-spinner {
            width: 60px;
            height: 60px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        .processing-text {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 8px;
        }
        
        .processing-subtext {
            font-size: 14px;
            color: #718096;
        }
        
        @media (max-width: 480px) {
            .payment-container {
                padding: 24px;
                margin: 10px;
            }
            
            .amount {
                font-size: 28px;
            }
            
            .methods-grid {
                grid-template-columns: 1fr;
            }
            
            .detail-value {
                max-width: 150px;
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="processing-overlay" id="processing-overlay">
        <div class="processing-content">
            <div class="processing-spinner"></div>
            <div class="processing-text">Processing Payment</div>
            <div class="processing-subtext">Please wait while we redirect you to the payment gateway...</div>
        </div>
    </div>

    <div class="payment-container">
        <div class="header">
            <div class="logo-container">
                <div class="logo">💳</div>
            </div>
            <h1 class="title">Secure Payment</h1>
            <p class="subtitle">Complete your purchase safely</p>
        </div>

        <div class="amount-section">
            <div class="amount-label">Total Amount</div>
            <div class="amount">
                <span class="amount-currency">₹</span>${amount || '0'}
            </div>
        </div>

        <div class="details-section">
            <h2 class="section-title">Payment Details</h2>
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Item</span>
                    <span class="detail-value">${materialName || "Material"}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${userData.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Phone</span>
                    <span class="detail-value">${userData.phone}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Order ID</span>
                    <span class="detail-value">${sessionData.order_id}</span>
                </div>
            </div>
        </div>

        <div class="payment-methods">
            <div class="methods-title">Accepted Payment Methods</div>
            <div class="methods-grid">
                <div class="method-item">Credit Cards</div>
                <div class="method-item">Debit Cards</div>
                <div class="method-item">Net Banking</div>
                <div class="method-item">UPI Payments</div>
                <div class="method-item">Digital Wallets</div>
                <div class="method-item">EMI Options</div>
            </div>
        </div>

        <div class="error-message" id="error-message"></div>
        <div class="success-message" id="success-message"></div>

        <button class="pay-button" id="pay-button" onclick="startPayment()">
            <span id="button-text">Proceed to Payment</span>
        </button>

        <div class="security-section">
            <div class="security-badge">Secured by Cashfree</div>
            <div class="security-features">
                <span>SSL Encrypted</span>
                <span>PCI DSS Compliant</span>
                <span>Bank Grade Security</span>
            </div>
        </div>
    </div>

    <script>
        let cashfreeInstance = null;
        let paymentStarted = false;
        
        // Initialize Cashfree when page loads
        window.addEventListener('load', function() {
            try {
                if (window.Cashfree) {
                    cashfreeInstance = new window.Cashfree({
                        mode: "production" // Change to "sandbox" for testing
                    });
                    console.log("✅ Cashfree initialized successfully");
                } else {
                    throw new Error("Cashfree SDK not loaded");
                }
            } catch (error) {
                console.error("❌ Cashfree initialization error:", error);
                showError("Failed to initialize payment system. Please refresh and try again.");
            }
        });
        
        function startPayment() {
            if (paymentStarted) {
                console.log("⚠️ Payment already started");
                return;
            }
            
            const payButton = document.getElementById('pay-button');
            const buttonText = document.getElementById('button-text');
            const errorDiv = document.getElementById('error-message');
            const processingOverlay = document.getElementById('processing-overlay');
            
            try {
                if (!cashfreeInstance) {
                    throw new Error("Payment system not initialized. Please refresh the page.");
                }
                
                paymentStarted = true;
                
                // Show loading state
                payButton.disabled = true;
                buttonText.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div>Initializing...</div>';
                errorDiv.style.display = 'none';
                
                setTimeout(() => {
                    processingOverlay.style.display = 'flex';
                }, 500);
                
                console.log("🚀 Starting payment with session ID: ${sessionData.payment_session_id}");
                
                // Start payment with Cashfree
                cashfreeInstance.checkout({
                    paymentSessionId: "${sessionData.payment_session_id}",
                    redirectTarget: "_modal",
                    appearance: {
                        primaryColor: "#667eea",
                        backgroundColor: "#ffffff"
                    }
                }).then(function(result) {
                    console.log("✅ Payment completed:", result);
                    paymentStarted = false;
                    processingOverlay.style.display = 'none';
                    
                    // Send result to React Native
                    if (result && result.paymentDetails) {
                        showSuccess("Payment completed successfully!");
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
                        console.log("⚠️ Payment result incomplete:", result);
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
                    processingOverlay.style.display = 'none';
                    
                    // Send error to React Native
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'payment_error',
                            error: error.message || 'Payment failed'
                        }));
                    }
                    
                    showError(error.message || 'Payment failed. Please try again.');
                    resetButton();
                });
                
            } catch (error) {
                console.error("❌ Payment start error:", error);
                paymentStarted = false;
                processingOverlay.style.display = 'none';
                showError(error.message);
                resetButton();
            }
        }
        
        function showError(message) {
            const errorDiv = document.getElementById('error-message');
            const successDiv = document.getElementById('success-message');
            
            successDiv.style.display = 'none';
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
        
        function showSuccess(message) {
            const successDiv = document.getElementById('success-message');
            const errorDiv = document.getElementById('error-message');
            
            errorDiv.style.display = 'none';
            successDiv.textContent = message;
            successDiv.style.display = 'block';
        }
        
        function resetButton() {
            const payButton = document.getElementById('pay-button');
            const buttonText = document.getElementById('button-text');
            
            payButton.disabled = false;
            buttonText.textContent = 'Proceed to Payment';
        }
        
        // Listen for payment events from Cashfree
        window.addEventListener('message', function(event) {
            console.log("📨 Received message:", event.data);
            
            if (event.data && event.data.type) {
                switch(event.data.type) {
                    case 'payment_success':
                        showSuccess("Payment successful!");
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
                        showError(event.data.message || 'Payment failed');
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'payment_error',
                                error: event.data.message || 'Payment failed'
                            }));
                        }
                        resetButton();
                        break;
                    case 'payment_cancelled':
                        showError("Payment was cancelled");
                        if (window.ReactNativeWebView) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'payment_result',
                                result: {
                                    status: 'CANCELLED',
                                    orderId: '${sessionData.order_id}'
                                }
                            }));
                        }
                        resetButton();
                        break;
                }
            }
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'visible' && paymentStarted) {
                console.log("📱 Page became visible during payment");
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
`
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

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Item:</Text>
            <Text style={styles.detailValue}>{materialName || "Material"}</Text>
          </View>

          {amount && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={[styles.detailValue, styles.amountText]}>{formatCurrency(amount)}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{userData.email}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{userData.phone}</Text>
          </View>
        </View>

        <View style={styles.paymentMethodsCard}>
          <Text style={styles.cardTitle}>Accepted Payment Methods</Text>
          <Text style={styles.paymentMethodText}>
            💳 Credit/Debit Cards{"\n"}🏦 Net Banking{"\n"}📱 UPI{"\n"}💰 Digital Wallets{"\n"}📄 EMI Options
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, loading && styles.disabledButton]}
          onPress={handlePayment}
          disabled={loading || !userData.email || !userData.phone}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.loadingText}>Creating Payment Session...</Text>
            </View>
          ) : (
            <Text style={styles.payButtonText}>{amount ? `Pay ${formatCurrency(amount)}` : "Pay with Cashfree"}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.securityInfo}>
          <Text style={styles.securityText}>🔒 Secured by Cashfree Payments</Text>
          <Text style={styles.securitySubText}>SSL encrypted • PCI DSS compliant • Bank-grade security</Text>
        </View>
      </ScrollView>

      {/* WebView Modal */}
      <Modal visible={showWebView} animationType="slide" onRequestClose={closeWebView}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeWebView} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Cashfree Payment</Text>
            <View style={styles.headerSpacer} />
          </View>

          {webViewLoading && (
            <View style={styles.webViewLoadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.webViewLoadingText}>Loading Payment...</Text>
            </View>
          )}

          <WebView
            source={{ html: createPaymentHTML() }}
            onMessage={handleWebViewMessage}
            onLoadEnd={() => setWebViewLoading(false)}
            onLoadStart={() => setWebViewLoading(true)}
            onError={(error) => {
              console.error("❌ WebView error:", error)
              setWebViewLoading(false)
              Alert.alert("Error", "Failed to load payment page")
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
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContainer: { flexGrow: 1, padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 30 },
  backButton: { padding: 10 },
  backButtonText: { fontSize: 16, color: "#007bff", fontWeight: "600" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#333", marginLeft: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 20 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: { fontSize: 16, color: "#666", fontWeight: "500" },
  detailValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  amountText: { color: "#007bff", fontSize: 18, fontWeight: "bold" },
  paymentMethodsCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  paymentMethodText: { fontSize: 14, color: "#666", lineHeight: 24 },
  payButton: {
    backgroundColor: "#007bff",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: { backgroundColor: "#ccc", shadowOpacity: 0, elevation: 0 },
  payButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  loadingContainer: { flexDirection: "row", alignItems: "center" },
  loadingText: { color: "#fff", fontSize: 16, marginLeft: 10 },
  securityInfo: { alignItems: "center", marginTop: 20 },
  securityText: { fontSize: 14, color: "#666", textAlign: "center", fontWeight: "600" },
  securitySubText: { fontSize: 12, color: "#999", textAlign: "center", marginTop: 5 },
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#f8f9fa",
  },
  closeButton: { padding: 10 },
  closeButtonText: { fontSize: 16, color: "#dc3545", fontWeight: "600" },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  headerSpacer: { width: 60 },
  webview: { flex: 1 },
  webViewLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 1,
  },
  webViewLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#007bff",
    fontWeight: "600",
  },
})

export default CashfreePaymentScreen
 
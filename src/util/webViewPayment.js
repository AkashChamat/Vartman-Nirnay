"use client"

// Alternative 1: WebView-based payment (Most Reliable)
import { useState } from "react"
import { WebView } from "react-native-webview"
import { View, StyleSheet, Alert, ActivityIndicator } from "react-native"

export const WebViewPaymentScreen = ({ sessionData, onPaymentResult, onClose }) => {
  const [loading, setLoading] = useState(true)

  // Create payment URL for web checkout
  const paymentUrl = `https://checkout.cashfree.com/payments/v3?session_id=${sessionData.payment_session_id}`

  const handleNavigationStateChange = (navState) => {

    // Check for success/failure URLs
    if (navState.url.includes("success") || navState.url.includes("payment-success")) {
      onPaymentResult({ status: "SUCCESS", orderId: sessionData.order_id })
    } else if (navState.url.includes("failure") || navState.url.includes("payment-failed")) {
      onPaymentResult({ status: "FAILED", orderId: sessionData.order_id })
    } else if (navState.url.includes("cancel") || navState.url.includes("payment-cancelled")) {
      onPaymentResult({ status: "CANCELLED", orderId: sessionData.order_id })
    }
  }

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)

      if (data.type === "payment_result") {
        onPaymentResult(data.result)
      }
    } catch (error) {
    }
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      )}
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        onLoadEnd={() => setLoading(false)}
        onError={(error) => {
          console.error("❌ WebView error:", error)
          Alert.alert("Error", "Failed to load payment page")
        }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    zIndex: 1,
  },
})

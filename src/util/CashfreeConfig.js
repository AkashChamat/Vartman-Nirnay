// Debug utility to help identify SDK issues
import { CFPaymentGatewayService, CFEnvironment } from "react-native-cashfree-pg-sdk"

export const debugCashfreeSDK = () => {


  if (CFPaymentGatewayService) {
    try {
  

      // Check for specific methods
      const expectedMethods = ["doPayment", "startPayment", "setCallback", "doWebCheckoutPayment"]
      expectedMethods.forEach((method) => {
      })
    } catch (error) {
    }
  }

  if (CFEnvironment) {
    try {

      // Check for specific environment values
      const expectedEnvs = ["PRODUCTION", "SANDBOX", "production", "sandbox", "PROD", "TEST"]
      expectedEnvs.forEach((env) => {
        if (CFEnvironment[env] !== undefined) {
        }
      })
    } catch (error) {
    }
  }
}

// FIXED: Initialize Cashfree SDK properly
export const initializeCashfreeSDK = async () => {
  try {

    // Check if SDK needs initialization
    if (CFPaymentGatewayService && typeof CFPaymentGatewayService.init === "function") {
      await CFPaymentGatewayService.init()
    } else {
    }

    return true
  } catch (error) {
    console.error("❌ Error initializing Cashfree SDK:", error)
    return false
  }
}

// Debug utility to help identify SDK issues
import { CFPaymentGatewayService, CFEnvironment } from "react-native-cashfree-pg-sdk"

export const debugCashfreeSDK = () => {
  console.log("🔍 === CASHFREE SDK DEBUG REPORT ===")

  // Check CFPaymentGatewayService
  console.log("CFPaymentGatewayService:")
  console.log("  - Available:", !!CFPaymentGatewayService)
  console.log("  - Type:", typeof CFPaymentGatewayService)

  if (CFPaymentGatewayService) {
    try {
      console.log("  - Constructor:", CFPaymentGatewayService.constructor?.name || "Unknown")
      console.log(
        "  - Methods:",
        Object.getOwnPropertyNames(CFPaymentGatewayService).filter(
          (name) => typeof CFPaymentGatewayService[name] === "function",
        ),
      )
      console.log("  - Properties:", Object.keys(CFPaymentGatewayService))

      // Check for specific methods
      const expectedMethods = ["doPayment", "startPayment", "setCallback", "doWebCheckoutPayment"]
      expectedMethods.forEach((method) => {
        console.log(`  - ${method}:`, typeof CFPaymentGatewayService[method])
      })
    } catch (error) {
      console.log("  - Error accessing CFPaymentGatewayService properties:", error.message)
    }
  }

  // Check CFEnvironment
  console.log("\nCFEnvironment:")
  console.log("  - Available:", !!CFEnvironment)
  console.log("  - Type:", typeof CFEnvironment)

  if (CFEnvironment) {
    try {
      console.log("  - Value:", CFEnvironment)
      console.log("  - Keys:", Object.keys(CFEnvironment))
      console.log("  - Values:", Object.values(CFEnvironment))

      // Check for specific environment values
      const expectedEnvs = ["PRODUCTION", "SANDBOX", "production", "sandbox", "PROD", "TEST"]
      expectedEnvs.forEach((env) => {
        if (CFEnvironment[env] !== undefined) {
          console.log(`  - ${env}:`, CFEnvironment[env])
        }
      })
    } catch (error) {
      console.log("  - Error accessing CFEnvironment properties:", error.message)
    }
  }

  console.log("🔍 === END DEBUG REPORT ===")
}

// FIXED: Initialize Cashfree SDK properly
export const initializeCashfreeSDK = async () => {
  try {
    console.log("🔧 Initializing Cashfree SDK...")

    // Check if SDK needs initialization
    if (CFPaymentGatewayService && typeof CFPaymentGatewayService.init === "function") {
      console.log("🔄 Calling CFPaymentGatewayService.init...")
      await CFPaymentGatewayService.init()
      console.log("✅ Cashfree SDK initialized successfully")
    } else {
      console.log("ℹ️ SDK initialization not required or not available")
    }

    return true
  } catch (error) {
    console.error("❌ Error initializing Cashfree SDK:", error)
    return false
  }
}

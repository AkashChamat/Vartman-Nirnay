// Alternative environment configuration
import { CFEnvironment } from "react-native-cashfree-pg-sdk"

// FIXED: Comprehensive environment detection and fallback
export const getCashfreeEnvironment = () => {

  // Method 1: Check if CFEnvironment is properly imported
  if (CFEnvironment && typeof CFEnvironment === "object") {

    // Try different possible property names
    const possibleProdNames = ["PRODUCTION", "production", "PROD", "prod"]
    const possibleSandboxNames = ["SANDBOX", "sandbox", "TEST", "test"]

    let productionEnv = null
    let sandboxEnv = null

    // Find production environment
    for (const name of possibleProdNames) {
      if (CFEnvironment[name] !== undefined) {
        productionEnv = CFEnvironment[name]
        break
      }
    }

    // Find sandbox environment
    for (const name of possibleSandboxNames) {
      if (CFEnvironment[name] !== undefined) {
        sandboxEnv = CFEnvironment[name]
        break
      }
    }

    if (productionEnv !== null && sandboxEnv !== null) {
      return {
        production: productionEnv,
        sandbox: sandboxEnv,
        isValid: true,
      }
    }
  }

  // Method 2: Try importing individual constants
  try {
    const { PRODUCTION, SANDBOX } = CFEnvironment || {}
    if (PRODUCTION !== undefined && SANDBOX !== undefined) {
      return {
        production: PRODUCTION,
        sandbox: SANDBOX,
        isValid: true,
      }
    }
  } catch (error) {
    console.warn("⚠️ Could not destructure environment constants:", error)
  }

  // Method 3: Use string fallbacks (most compatible)
  console.warn("⚠️ Using string fallback for environment configuration")
  return {
    production: "PRODUCTION",
    sandbox: "SANDBOX",
    isValid: false,
    fallback: true,
  }
}

// FIXED: Environment-specific session creation
export const createCashfreeSession = (sessionId, orderId, isProduction = true) => {
  const envConfig = getCashfreeEnvironment()

  const session = {
    payment_session_id: sessionId,
    order_id: orderId,
  }

  // FIXED: Only add environment property, not both
  if (envConfig.isValid) {
    session.environment = isProduction ? envConfig.production : envConfig.sandbox
  } else {
    // Use string fallback - this is actually correct for many SDK versions
    session.environment = isProduction ? "PRODUCTION" : "SANDBOX"
  }

  return session
}

// FIXED: Enhanced SDK method detection and execution with proper UI handling
export const executeCashfreePayment = async (CFPaymentGatewayService, session) => {

  if (!CFPaymentGatewayService) {
    throw new Error("CFPaymentGatewayService is not available")
  }

  // FIXED: Try methods in the correct order for UI-based payments
  const paymentMethods = [
    "doWebCheckoutPayment", // This usually opens the UI
    "doPayment",
    "startPayment",
    "initiatePayment",
    "processPayment",
  ]

  let lastError = null

  for (const methodName of paymentMethods) {
    if (typeof CFPaymentGatewayService[methodName] === "function") {
      try {
        // FIXED: Handle different return types
        const result = await CFPaymentGatewayService[methodName](session)

        // For UI-based payments, undefined result might be normal
        // The UI should open and callbacks will handle the result
        if (methodName === "doWebCheckoutPayment" || methodName === "doPayment") {
          return result // Return even if undefined - UI should open
        }

        return result
      } catch (error) {
        console.error(`❌ Payment method ${methodName} failed:`, error)
        lastError = error
        // Continue to next method
        continue
      }
    } else {
    }
  }

  throw new Error(`No working payment method found. Last error: ${lastError?.message || "Unknown"}`)
}

// Additional validation helpers
export const validatePaymentData = (materialId, email, phone, amount) => {
  const errors = []

  if (!materialId) {
    errors.push("Material ID is required")
  }

  if (!email || !email.trim()) {
    errors.push("Email is required")
  } else {
    const emailRegex = /\S+@\S+\.\S+/
    if (!emailRegex.test(email.trim())) {
      errors.push("Invalid email format")
    }
  }

  if (!phone) {
    errors.push("Phone number is required")
  } else {
    const phoneRegex = /^\d{10}$/
    if (!phoneRegex.test(phone.toString().replace(/\s+/g, ""))) {
      errors.push("Phone number must be exactly 10 digits")
    }
  }

  if (amount && (isNaN(amount) || amount <= 0)) {
    errors.push("Valid amount is required")
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  }
}

export const formatCurrency = (amount) => {
  if (!amount) return "₹0.00"

  // Convert to number if it's a string
  const numericAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount

  if (isNaN(numericAmount)) return "₹0.00"

  return `₹${numericAmount.toFixed(2)}`
}

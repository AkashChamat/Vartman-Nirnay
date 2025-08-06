/**
 * Pure JavaScript JWT utilities without any dependencies
 */

// Enhanced Base64 URL-safe decode function
const base64UrlDecode = (str) => {
  try {
    // Convert base64url to base64
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/")

    // Add padding if needed
    while (base64.length % 4) {
      base64 += "="
    }

    // Try using Buffer first (if available in React Native)
    if (typeof Buffer !== "undefined") {
      try {
        return Buffer.from(base64, "base64").toString("utf8")
      } catch (bufferError) {
      }
    }

    // Manual base64 decode with better character handling
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    let result = ""
    let i = 0

    // Clean the input
    base64 = base64.replace(/[^A-Za-z0-9+/=]/g, "")

    while (i < base64.length) {
      const encoded1 = chars.indexOf(base64.charAt(i++))
      const encoded2 = chars.indexOf(base64.charAt(i++))
      const encoded3 = chars.indexOf(base64.charAt(i++))
      const encoded4 = chars.indexOf(base64.charAt(i++))

      if (encoded1 === -1 || encoded2 === -1) {
        throw new Error("Invalid base64 character")
      }

      const bitmap =
        (encoded1 << 18) | (encoded2 << 12) | ((encoded3 === -1 ? 0 : encoded3) << 6) | (encoded4 === -1 ? 0 : encoded4)

      result += String.fromCharCode((bitmap >> 16) & 255)

      if (encoded3 !== -1 && encoded3 !== 64) {
        result += String.fromCharCode((bitmap >> 8) & 255)
      }

      if (encoded4 !== -1 && encoded4 !== 64) {
        result += String.fromCharCode(bitmap & 255)
      }
    }

    return result
  } catch (error) {
    console.error("[JWT-UTILS] Base64 decode error:", error.message)
    throw new Error("Failed to decode base64 string: " + error.message)
  }
}

// Pure JavaScript JWT decoder
export const decodeJWT = (token) => {
  try {
    if (!token || typeof token !== "string") {
      throw new Error("Invalid token: token must be a non-empty string")
    }
    // Split the token into parts
    const parts = token.split(".")
    if (parts.length !== 3) {
      throw new Error(`Invalid token format: expected 3 parts, got ${parts.length}`)
    }

    const [headerB64, payloadB64, signature] = parts

    // Decode header
    let header
    try {
      const headerJson = base64UrlDecode(headerB64)
      header = JSON.parse(headerJson)
    } catch (error) {
      console.error("[JWT-UTILS] Header decode error:", error.message)
      throw new Error("Invalid token: failed to decode header")
    }

    // Decode payload
    let payload
    try {
      const payloadJson = base64UrlDecode(payloadB64)

      // Clean any potential invisible characters
      const cleanPayloadJson = payloadJson.replace(/[\x00-\x1F\x7F]/g, "")

      payload = JSON.parse(cleanPayloadJson)
    } catch (error) {
      console.error("[JWT-UTILS] Payload decode error:", error.message)
      console.error("[JWT-UTILS] Raw payload base64:", payloadB64)
      throw new Error("Invalid token: failed to decode payload - " + error.message)
    }

    return {
      header,
      payload,
      signature,
    }
  } catch (error) {
    console.error("[JWT-UTILS] JWT decode failed:", error.message)
    throw error
  }
}

// Check if JWT token is expired
export const isJWTExpired = (token) => {
  try {
    if (!token) {
      return true
    }

    const decoded = decodeJWT(token)
    const { payload } = decoded

    if (!payload.exp) {
      return false // If no exp claim, consider it valid
    }

    const currentTime = Math.floor(Date.now() / 1000)
    const isExpired = payload.exp <= currentTime

    return isExpired
  } catch (error) {
    console.error("[JWT-UTILS] Token expiration check failed:", error.message)
    return true // If we can't decode it, consider it expired
  }
}

// Get payload from JWT token
export const getJWTPayload = (token) => {
  try {
    const decoded = decodeJWT(token)
    return decoded.payload
  } catch (error) {
    console.error("[JWT-UTILS] Failed to get JWT payload:", error.message)
    return null
  }
}

// Validate JWT token structure and basic claims
export const validateJWT = (token) => {
  try {
    const decoded = decodeJWT(token)
    const { header, payload } = decoded

    // Basic validation - make it less strict
    if (!header.alg) {
      throw new Error("Token header missing algorithm")
    }

    // Make type validation optional since many JWTs don't include it
    if (header.typ && header.typ.toLowerCase() !== "jwt") {
      console.warn("[JWT-UTILS] Token header has unexpected type:", header.typ)
    }

    // Check for required payload claims (customize as needed)
    const requiredClaims = ["sub", "iat"] // subject and issued at
    for (const claim of requiredClaims) {
      if (!payload[claim]) {
        console.warn(`[JWT-UTILS] Token missing recommended claim: ${claim}`)
      }
    }

    return {
      valid: true,
      header,
      payload,
    }
  } catch (error) {
    console.error("[JWT-UTILS] JWT validation failed:", error.message)
    return {
      valid: false,
      error: error.message,
    }
  }
}

// Extract user info from JWT payload
export const extractUserInfo = (token) => {
  try {
    const payload = getJWTPayload(token)
    if (!payload) {
      return null
    }

    // Extract common user fields (customize based on your token structure)
    return {
      id: payload.sub || payload.id || payload.userId,
      email: payload.email,
      name: payload.name || payload.username,
      role: payload.role,
      exp: payload.exp,
      iat: payload.iat,
      // Add any other fields your app needs
      ...payload,
    }
  } catch (error) {
    console.error("[JWT-UTILS] Failed to extract user info:", error.message)
    return null
  }
}

// Test function for debugging
export const testJwtDecode = (token) => {
  try {

    if (!token) {
      return {
        success: false,
        error: "No token provided",
      }
    }

    const result = decodeJWT(token)
    return {
      success: true,
      result: result,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    }
  }
}

export const jwtDecode = (token) => {
  try {
    const decoded = decodeJWT(token)
    return decoded.payload 
  } catch (error) {
    throw error
  }
}


// Export all functions for compatibility
export default {
  decodeJWT,
  isJWTExpired,
  getJWTPayload,
  validateJWT,
  extractUserInfo,
  testJwtDecode,
  jwtDecode,
}

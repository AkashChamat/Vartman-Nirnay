import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
// Import our pure JS JWT utilities - fix the import path
import { isJWTExpired, decodeJWT, getJWTPayload, validateJWT, extractUserInfo } from "./jwtUtils"
import {
  sliderImagesUrl,
  epaperUrl,
  jobalertUrl,
  adsExamCategoryUrl,
  categoryUrl,
  winnerUrl,
  sponsorUrl,
  loginUrl,
  marqueeUrl,
  registerUrl,
  championpaperUrl,
  TestPaperByIdUrl,
  champresultUrl,
  submitchamptestUrl,
  AllAanalysis,
  CorrectAanalysis,
  IncorrectAanalysis,
  Unsolvednalysis,
  sendotpUrl,
  verifyotpUrl,
  resetpasswordUrl,
  ProfileUrl,
  ContactusUrl,
  getpaperbyidUrl,
  attemptcountUrl,
  winnerpdfUrl,
  sponsorpdfUrl,
  todaynotificationUrl,
  allnotificationUrl,
  sponsortitleUrl,
  winnertitleUrl,
  allmaterialUrl,
  allresultUrl,
  paymentUrl,
  verifyPaymentUrl,
  materialtypeUrl,
  testseriesUrl,
  paperbyseriesUrl,
  vtcategoriesUrl,
  testseriesPaymentUrl,
  getAllBooksUrl,
  bookpaymentUrl,
} from "./Url"
import { __DEV__ } from "react-native"

let tokenExpiredCallback = null

export const setTokenExpiredCallback = (callback) => {
  tokenExpiredCallback = callback
}

const getToken = async () => {
  try {
    return await AsyncStorage.getItem("userToken")
  } catch (error) {
    console.error("Error getting token:", error)
    return null
  }
}

export const getUserId = async () => {
  try {
    // First, try to get from userData (which is what AuthContext stores)
    const userData = await AsyncStorage.getItem("userData")
    if (userData) {
      const parsedUserData = JSON.parse(userData)
      return parsedUserData.id
    }

    // Fallback to the old method if userData doesn't exist
    const userId = await AsyncStorage.getItem("userId")
    return userId
  } catch (error) {
    console.error("Error getting user ID:", error)
    return null
  }
}

// Enhanced token validation using our pure JS JWT utils
const isTokenExpired = (token) => {
  try {
    if (!token) {
   
      return true
    }
    const expired = isJWTExpired(token)

    return expired
  } catch (error) {
    console.error("[TOKEN-VALIDATION] Token validation error:", error.message)
    return true
  }
}

const handleTokenExpiration = async () => {
  try {

    await AsyncStorage.removeItem("userToken")
    await AsyncStorage.removeItem("userData")
    if (tokenExpiredCallback) {
      tokenExpiredCallback()
    }
  } catch (error) {
    console.error("[TOKEN-EXPIRATION] Error handling token expiration:", error)
  }
}

const createAxiosInstance = () => {
  const instance = axios.create({
    timeout: 40000,
  })

  instance.interceptors.request.use(
    async (config) => {
      const token = await getToken()
      if (token) {
        if (isTokenExpired(token)) {
          await handleTokenExpiration()
          return Promise.reject(new Error("Token expired"))
        }
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    },
  )

  instance.interceptors.response.use(
    (response) => {
      return response
    },
    async (error) => {
      if (error.response && error.response.status === 401) {
        await handleTokenExpiration()
      }
      return Promise.reject(error)
    },
  )

  return instance
}

const apiClient = createAxiosInstance()

const postAPI = async (url, body, headers = {}, requiresAuth = false) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "MyReactNativeApp/1.0",
        ...headers,
      },
    }

    let response
    if (requiresAuth) {
      response = await apiClient.post(url, body, config)
    } else {
      response = await axios.post(url, body, config)
    }

    return response.data
  } catch (error) {
    throw error
  }
}

const getAPI = async (url, headers = {}, urlParams = null, requiresAuth = false) => {
  let finalUrl = url
  if (urlParams !== null && urlParams !== undefined) {
    if (typeof urlParams === "string" || typeof urlParams === "number") {
      finalUrl = `${url}/${urlParams}`
    } else if (Array.isArray(urlParams)) {
      const paramString = urlParams.join("/")
      finalUrl = `${url}/${paramString}`
    } else if (typeof urlParams === "object") {
      const queryParams = new URLSearchParams(urlParams).toString()
      finalUrl = `${url}?${queryParams}`
    }
  }

  try {
    const config = {
      headers: {
        Accept: "application/json",
        ...headers,
      },
    }

    let response
    if (requiresAuth) {
      response = await apiClient.get(finalUrl, config)
    } else {
      response = await axios.get(finalUrl, config)
    }

    return response.data
  } catch (error) {
    throw error
  }
}

export const getUserByEmail = async (email) => {
  try {
    if (!email || !email.trim()) {
      throw new Error("Email is required")
    }

    const emailRegex = /\S+@\S+\.\S+/
    if (!emailRegex.test(email.trim())) {
      throw new Error("Invalid email format")
    }

    const response = await getAPI(ProfileUrl, {}, { email: email.trim() }, true)
    return response
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error("User not found with the provided email")
      } else if (error.response.status === 401) {
        throw new Error("Authentication failed. Please login again.")
      } else if (error.response.status === 403) {
        throw new Error("Access denied. You do not have permission to view this user data.")
      }
    }
    throw new Error(error.response?.data?.message || "Failed to fetch user data")
  }
}

export const login = (payload) => postAPI(loginUrl, payload)
export const slider = (payload) => getAPI(sliderImagesUrl, payload)
export const epaper = (payload) => getAPI(epaperUrl, payload, null, true)
export const jobalert = (payload) => getAPI(jobalertUrl, payload, null, true)
export const adsExamCategory = (payload) => getAPI(adsExamCategoryUrl, payload, null, true)
export const category = (payload) => getAPI(categoryUrl, payload, null, true)
export const winner = (payload) => getAPI(winnerUrl, payload, null, true)
export const sponsor = (payload) => getAPI(sponsorUrl, payload, null, true)
export const marquee = (payload) => getAPI(marqueeUrl, payload, null, true)
export const championpaper = (payload) => getAPI(championpaperUrl, payload, null, true)
export const testseries = (payload) => getAPI(testseriesUrl, payload, null, true)
export const contactus = (payload) => postAPI(ContactusUrl, payload)
export const getpaperbyid = (payload) => getAPI(getpaperbyidUrl, payload)
export const winnerpdf = (payload) => getAPI(winnerpdfUrl, payload, null, true)
export const sponsorpdf = (payload) => getAPI(sponsorpdfUrl, payload, null, true)
export const winnertitle = (payload) => getAPI(winnertitleUrl, payload, null, true)
export const sponsortitle = (payload) => getAPI(sponsortitleUrl, payload, null, true)
export const materialtype = (payload) => getAPI(materialtypeUrl, payload, null, true)
export const getAllBooks = () => getAPI(getAllBooksUrl, {}, null, true)

export const championtest = (headers = {}, testId = null) => {
  if (testId) {
    return getAPI(TestPaperByIdUrl, headers, testId, true)
  }
  return getAPI(TestPaperByIdUrl, headers, null, true)
}

export const champresult = (headers = {}, urlParams = null) => {
  return getAPI(champresultUrl, headers, urlParams, true)
}

export const submitTestPaper = async (userId, paperId, answers, startTime, endTime, timeTaken) => {
  try {
    if (!userId) {
      throw new Error("User ID is required")
    }
    if (!paperId) {
      throw new Error("Paper ID is required")
    }
    if (!answers) {
      throw new Error("Answers are required")
    }

    const fullUrl = `${submitchamptestUrl}/${userId}/${paperId}`
    const queryParams = new URLSearchParams({
      startTime: startTime,
      endTime: endTime,
      timeTaken: timeTaken,
    })

    const url = `${fullUrl}?${queryParams.toString()}`

    const response = await apiClient.post(url, answers, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "MyReactNativeApp/1.0",
      },
    })

    return response.data
  } catch (error) {
    console.error("❌ Error submitting test paper:", error)

    if (error.response) {
      if (error.response.status === 401) {
        throw new Error("Authentication failed. Please login again.")
      } else if (error.response.status === 403) {
        throw new Error("Access denied. You do not have permission to submit this test.")
      } else if (error.response.status === 404) {
        throw new Error("Test paper or user not found.")
      } else if (error.response.status === 400) {
        throw new Error("Invalid test submission data.")
      } else if (error.response.status === 500) {
        const serverMessage = error.response?.data?.message || error.response?.data?.error || error.response?.data
        throw new Error(typeof serverMessage === "string" ? serverMessage : "Internal server error occurred")
      }
    }

    throw new Error(error.response?.data?.message || error.message || "Failed to submit test paper")
  }
}

export const getTestAnalysis = async (userId, testPaperId, type = "ALL") => {
  try {
    let analysisUrl
    switch (type) {
      case "ALL":
        analysisUrl = AllAanalysis
        break
      case "CORRECT":
        analysisUrl = CorrectAanalysis
        break
      case "INCORRECT":
        analysisUrl = IncorrectAanalysis
        break
      case "UNSOLVED":
        analysisUrl = Unsolvednalysis
        break
      default:
        analysisUrl = AllAanalysis
    }

    const queryParams = {
      userId: userId,
      testPaperId: testPaperId,
      type: type,
    }

    const response = await getAPI(analysisUrl, {}, queryParams, true)
    return response
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch question analysis")
  }
}

export const checkTokenValidity = async () => {
  const token = await getToken()
  if (token && isTokenExpired(token)) {
    await handleTokenExpiration()
    return false
  }
  return !!token
}

const validateRegistrationPayload = (payload) => {
  const errors = []

  if (!payload.userName || !payload.userName.trim()) {
    errors.push("userName is required")
  }

  if (!payload.email || !payload.email.trim()) {
    errors.push("email is required")
  } else if (!/\S+@\S+\.\S+/.test(payload.email.trim())) {
    errors.push("email format is invalid")
  }

  if (!payload.password) {
    errors.push("password is required")
  } else if (payload.password.length < 6) {
    errors.push("password must be at least 6 characters")
  }

  if (!payload.confirmPassword) {
    errors.push("confirmPassword is required")
  } else if (payload.password !== payload.confirmPassword) {
    errors.push("passwords do not match")
  }

  if (!payload.contact) {
    errors.push("contact is required")
  } else if (typeof payload.contact === "string" && !/^\d{10}$/.test(payload.contact.trim())) {
    errors.push("contact must be exactly 10 digits")
  } else if (typeof payload.contact === "number" && !/^\d{10}$/.test(payload.contact.toString())) {
    errors.push("contact must be exactly 10 digits")
  }

  if (!payload.examName || !payload.examName.trim()) {
    errors.push("examName is required")
  }

  if (payload.addresses && Array.isArray(payload.addresses)) {
    payload.addresses.forEach((addr, index) => {
      if (addr.address && addr.address.trim()) {
        if (addr.pincode && !/^\d{6}$/.test(addr.pincode.trim())) {
          errors.push(`address[${index}].pincode must be exactly 6 digits`)
        }
      }
    })
  }

  return errors
}

export const register = async (payload) => {
  try {
    const validationErrors = validateRegistrationPayload(payload)
    if (validationErrors.length > 0) {
      const validationError = new Error(`Validation failed: ${validationErrors.join(", ")}`)
      validationError.code = 422
      throw validationError
    }

    const config = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "MyReactNativeApp/1.0",
      },
      timeout: 40000,
    }

    const response = await axios.post(registerUrl, payload, config)
    return response.data
  } catch (error) {
    const fallbackMessage = "Registration failed. Please try again."

    if (error.response) {
      const serverMessage = error.response.data?.message
      const customError = new Error(serverMessage || getErrorMessageByStatus(error.response.status))
      customError.response = error.response
      throw customError
    }

    throw new Error(error.message || fallbackMessage)
  }
}

function getErrorMessageByStatus(status) {
  switch (status) {
    case 400:
      return "Invalid registration data provided"
    case 401:
      return "Authentication failed during registration"
    case 403:
      return "Access denied. You do not have permission to register."
    case 500:
      return "Server error occurred during registration"
    default:
      return "Unexpected error during registration"
  }
}

export const sendOTP = async (email) => {
  try {
    const formData = new URLSearchParams()
    formData.append("email", email)

    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "MyReactNativeApp/1.0",
      },
    }

    const response = await axios.post(sendotpUrl, formData.toString(), config)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to send OTP")
  }
}

export const verifyOTP = async (email, otp) => {
  try {
    const formData = new URLSearchParams()
    formData.append("email", email)
    formData.append("otp", otp.toString())

    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "MyReactNativeApp/1.0",
      },
    }

    const response = await axios.post(verifyotpUrl, formData.toString(), config)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to verify OTP")
  }
}

export const resetPassword = async (email, password, confirmPassword) => {
  try {
    const formData = new URLSearchParams()
    formData.append("email", email)
    formData.append("password", password)
    formData.append("confirmPassword", confirmPassword)

    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "MyReactNativeApp/1.0",
      },
    }

    const response = await axios.put(resetpasswordUrl, formData.toString(), config)
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to reset password")
  }
}

// Export our pure JS JWT utilities for use in other parts of the app
export { decodeJWT, getJWTPayload, validateJWT, extractUserInfo, isJWTExpired }

// Continue with all your other existing functions...
export const getAttemptCount = async (userId, paperId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required")
    }
    if (!paperId) {
      throw new Error("Paper ID is required")
    }

    const response = await getAPI(attemptcountUrl, {}, [userId, paperId], true)
    return response
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error("Attempt count not found for the provided user and paper")
      } else if (error.response.status === 401) {
        throw new Error("Authentication failed. Please login again.")
      } else if (error.response.status === 403) {
        throw new Error("Access denied. You do not have permission to view attempt count.")
      }
    }
    throw new Error(error.response?.data?.message || "Failed to fetch attempt count")
  }
}

export const getAttemptCountWithQuery = async (userId, paperId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required")
    }
    if (!paperId) {
      throw new Error("Paper ID is required")
    }

    const response = await getAPI(attemptcountUrl, {}, { userId: userId, paperId: paperId }, true)
    return response
  } catch (error) {
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error("Attempt count not found for the provided user and paper")
      } else if (error.response.status === 401) {
        throw new Error("Authentication failed. Please login again.")
      } else if (error.response.status === 403) {
        throw new Error("Access denied. You do not have permission to view attempt count.")
      }
    }
    throw new Error(error.response?.data?.message || "Failed to fetch attempt count")
  }
}

export const getTodayNotifications = async () => {
  try {
    const response = await getAPI(todaynotificationUrl, {}, null, true)
    return response
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error("Authentication failed. Please login again.")
      } else if (error.response.status === 403) {
        throw new Error("Access denied. You do not have permission to view notifications.")
      } else if (error.response.status === 404) {
        throw new Error("No notifications found for today.")
      }
    }
    throw new Error(error.response?.data?.message || "Failed to fetch today's notifications")
  }
}

export const getAllNotifications = async () => {
  try {
    const response = await getAPI(allnotificationUrl, {}, null, true)
    return response
  } catch (error) {
    if (error.response) {
      if (error.response.status === 401) {
        throw new Error("Authentication failed. Please login again.")
      } else if (error.response.status === 403) {
        throw new Error("Access denied. You do not have permission to view notifications.")
      } else if (error.response.status === 404) {
        throw new Error("No notifications found.")
      }
    }
    throw new Error(error.response?.data?.message || "Failed to fetch all notifications")
  }
}

export const getAllResults = async (paperId) => {
  try {
    if (!paperId) {
      throw new Error("Paper ID is required")
    }

    const response = await getAPI(allresultUrl, {}, paperId, true)
    return response
  } catch (error) {
    console.error(`❌ Error fetching all results for paper ${paperId}:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })

    if (error.response) {
      if (error.response.status === 404) {
        throw new Error("Results not found for this test paper")
      } else if (error.response.status === 401) {
        throw new Error("Authentication failed. Please login again.")
      } else if (error.response.status === 403) {
        throw new Error("Access denied. You do not have permission to view results.")
      } else if (error.response.status === 500) {
        throw new Error("Server error occurred while fetching results")
      }
    }

    throw new Error(error.response?.data?.message || "Failed to fetch all results")
  }
}

export const getAllMaterials = async () => {
  try {
    const response = await getAPI(allmaterialUrl, {}, null, true)
    return response
  } catch (error) {
    console.error("❌ Error fetching all materials:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    })

    if (error.response) {
      if (error.response.status === 401) {
        throw new Error("Authentication failed. Please login again.")
      } else if (error.response.status === 403) {
        throw new Error("Access denied. You do not have permission to view materials.")
      } else if (error.response.status === 404) {
        throw new Error("No materials found.")
      } else if (error.response.status === 500) {
        throw new Error("Server error occurred while fetching materials")
      }
    }

    throw new Error(error.response?.data?.message || "Failed to fetch all materials")
  }
}

export const createPaymentSession = async (materialId, email, phone, userId) => {
  try {
    if (!materialId) {
      throw new Error("Material ID is required")
    }
    if (!email || !email.trim() || !email.includes("@")) {
      throw new Error("Valid email is required")
    }
    if (!phone || !/^\d{10}$/.test(phone.toString().replace(/\s+/g, ""))) {
      throw new Error("Valid 10-digit phone number is required")
    }
    if (!userId) {
      throw new Error("User ID is required")
    }

    const queryParams = new URLSearchParams({
      materialId: materialId.toString(),
      email: email.trim(),
      phone: phone.toString().replace(/\s+/g, ""),
      userId: userId.toString(),
    })

    const fullUrl = `${paymentUrl}?${queryParams.toString()}`

    const response = await apiClient.post(
      fullUrl,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "MyReactNativeApp/1.0",
        },
      },
    )

    return response.data
  } catch (error) {
    console.error("❌ Error creating payment order:", error)
    if (error.response) {
      switch (error.response.status) {
        case 500:
          const serverError = error.response.data?.message || error.response.data?.error || "Internal server error"
          throw new Error(`Server Error: ${serverError}`)
        case 400:
          throw new Error("Invalid payment parameters provided")
        case 401:
          throw new Error("Authentication failed. Please login again.")
        default:
          throw new Error(error.response?.data?.message || "Payment order creation failed")
      }
    }
    throw new Error(error.message || "Failed to create payment order")
  }
}

export const verifyPayment = async (orderId, paymentId) => {
  try {
    if (!orderId) {
      throw new Error("Order ID is required for payment verification")
    }

    const verificationData = {
      orderId: orderId,
      paymentId: paymentId,
    }

    const response = await postAPI(verifyPaymentUrl, verificationData, {}, true)
    return response
  } catch (error) {
    console.error("❌ Error verifying payment:", error)
    if (error.response) {
      switch (error.response.status) {
        case 404:
          throw new Error("Payment not found for verification")
        case 400:
          throw new Error("Invalid payment verification data")
        case 401:
          throw new Error("Authentication failed during verification")
        default:
          throw new Error(error.response?.data?.message || "Payment verification failed")
      }
    }
    throw new Error(error.message || "Failed to verify payment")
  }
}

export const getPaymentConfig = () => {
  const isDevelopment = __DEV__
  return {
    environment: isDevelopment ? "SANDBOX" : "PRODUCTION",
    apiBaseUrl: isDevelopment ? "https://sandbox.cashfree.com" : "https://api.cashfree.com",
  }
}

export const generateOrderId = () => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `ORDER_${timestamp}_${random}`
}

export const getPapersBySeries = async (seriesId) => {
  try {
    const response = await getAPI(paperbyseriesUrl, {}, seriesId, true)
    return response
  } catch (error) {
    console.error("❌ Error fetching papers by series:", error)
    throw error
  }
}

export const fetchVTCategories = async () => {
  try {
    const response = await getAPI(vtcategoriesUrl)
    return response
  } catch (error) {
    console.error("Error fetching VT Categories:", error)
    throw error
  }
}

export const createTestSeriesPaymentSession = async (testSeriesId, email, phone, userId) => {
  try {
    if (!testSeriesId || !email || !phone || !userId) {
      throw new Error("Missing required parameters for test series payment")
    }

    const queryParams = new URLSearchParams({
      testSeriesId: testSeriesId.toString(),
      email: email.trim(),
      phone: phone.toString().replace(/\s+/g, ""),
      userId: userId.toString(),
    })

    const fullUrl = `${testseriesPaymentUrl}?${queryParams.toString()}`

    const response = await apiClient.post(
      fullUrl,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      },
    )

    return response.data
  } catch (error) {
    console.error("❌ Error in createTestSeriesPaymentSession:", error)
    throw error
  }
}

export const verifyTestSeriesPayment = async (orderId, sessionId) => {
  try {
    const response = await fetch("https://your-api-url.com/verifyTestSeriesPayment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        sessionId,
      }),
    })

    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.message || "Verification failed")
    }

    return result
  } catch (error) {
    console.error("❌ verifyTestSeriesPayment error:", error)
    throw error
  }
}

export const createBookPaymentSession = async (bookId, userId, email, phone, addressId) => {
  try {
    if (!bookId) throw new Error("Book ID is required")
    if (!userId) throw new Error("User ID is required")
    if (!email || !email.trim() || !email.includes("@")) throw new Error("Valid email is required")
    if (!phone || !/^\d{10}$/.test(phone.toString().replace(/\s+/g, ""))) {
      throw new Error("Valid 10-digit phone number is required")
    }
    if (!addressId) throw new Error("Address ID is required")

    // Clean and prepare parameters
    const cleanEmail = email.trim()
    const cleanPhone = phone.toString().replace(/\s+/g, "")
    
    console.log('🚀 Sending payment request with params:', {
      bookId,
      userId, 
      email: cleanEmail,
      phone: cleanPhone,
      addressId
    })

    // Option 1: Try sending as URL query parameters
    const queryParams = new URLSearchParams({
      bookId: bookId.toString(),
      userId: userId.toString(),
      email: cleanEmail,
      phone: cleanPhone,
      addressId: addressId.toString()
    })
    
    const urlWithParams = `${bookpaymentUrl}?${queryParams.toString()}`
    
    // Send POST request with parameters in URL
    const response = await postAPI(urlWithParams, {}, {}, true) // Empty body, empty config, with token
    
    return response
    
  } catch (error) {
    console.error("❌ Error creating book payment order:", error)
    
    if (error.response) {
      console.error("❌ Response error details:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      })
      
      switch (error.response.status) {
        case 500:
          const serverError = error.response.data?.message || error.response.data?.error || "Internal server error"
          throw new Error(`Server Error: ${serverError}`)
        case 400:
          throw new Error("Invalid book payment parameters provided")
        case 401:
          throw new Error("Authentication failed. Please login again.")
        case 404:
          throw new Error("Book not found or unavailable for purchase")
        default:
          throw new Error(error.response?.data?.message || "Book payment order creation failed")
      }
    }
    
    throw new Error(error.message || "Failed to create book payment order")
  }
}

export const verifyBookPayment = async (orderId, paymentId, sessionId) => {
  try {
    if (!orderId) {
      throw new Error("Order ID is required for book payment verification")
    }

    const verificationData = {
      orderId,
      paymentId,
      sessionId,
    }

    // Ensure this URL is defined in your `Url.js` file:
    const verifyBookPaymentUrl = `${baseUrl}/verifyBookPayment`

    const response = await postAPI(verifyBookPaymentUrl, verificationData, {}, true) // requiresAuth: true
    return response
  } catch (error) {
    console.error("❌ Error verifying book payment:", error)
    if (error.response) {
      switch (error.response.status) {
        case 404:
          throw new Error("Book payment not found for verification")
        case 400:
          throw new Error("Invalid book payment verification data")
        case 401:
          throw new Error("Authentication failed during verification")
        default:
          throw new Error(error.response?.data?.message || "Book payment verification failed")
      }
    }
    throw new Error(error.message || "Failed to verify book payment")
  }
}


export { postAPI, getAPI, validateRegistrationPayload }

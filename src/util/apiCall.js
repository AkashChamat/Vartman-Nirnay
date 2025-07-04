import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { jwtDecode } from "jwt-decode"
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
  championtestUrl,
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
    return null
  }
}

const getUserId = async () => {
  try {
    return await AsyncStorage.getItem("userId")
  } catch (error) {
    return null
  }
}

const isTokenExpired = (token) => {
  try {
    if (!token) return true
    const decoded = jwtDecode(token)
    const currentTime = Date.now() / 1000
    return decoded.exp < currentTime
  } catch (error) {
    return true
  }
}

const handleTokenExpiration = async () => {
  try {
    await AsyncStorage.removeItem("userToken")
    if (tokenExpiredCallback) {
      tokenExpiredCallback()
    }
  } catch (error) {
    console.error("Error handling token expiration:", error)
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

    const startTime = Date.now()

    const response = await getAPI(ProfileUrl, {}, { email: email.trim() }, true)

    const endTime = Date.now()

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


export const championtest = (headers = {}, testId = null) => {
  if (testId) {
    return getAPI(championtestUrl, headers, testId, true)
  }
  return getAPI(championtestUrl, headers, null, true)
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

    const startApiTime = Date.now()

    const response = await apiClient.post(url, answers, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "MyReactNativeApp/1.0",
      },
    })

    const endApiTime = Date.now()

    return response.data
  } catch (error) {
    console.error("❌ Error submitting test paper:", error)
    console.error("❌ Error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    })

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
      throw new Error(`Validation failed: ${validationErrors.join(", ")}`)
    }

    const config = {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "MyReactNativeApp/1.0",
      },
      timeout: 40000,
    }

    const startTime = Date.now()
    const response = await axios.post(registerUrl, payload, config)
    const endTime = Date.now()

    return response.data
  } catch (error) {
    if (error.response) {
      // Handle specific error cases
      if (error.response.status === 400) {
        throw new Error("Invalid registration data provided")
      } else if (error.response.status === 401) {
        throw new Error("Authentication failed during registration")
      } else if (error.response.status === 403) {
        throw new Error("Access denied. You do not have permission to register.")
      } else if (error.response.status === 500) {
        throw new Error("Server error occurred during registration")
      }
    }

    throw new Error(error.response?.data?.message || error.message || "Failed to register")
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

export const getAttemptCount = async (userId, paperId) => {
  try {
    if (!userId) {
      throw new Error("User ID is required")
    }

    if (!paperId) {
      throw new Error("Paper ID is required")
    }

    const startTime = Date.now()

    const response = await getAPI(attemptcountUrl, {}, [userId, paperId], true)

    const endTime = Date.now()

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

    const startTime = Date.now()

    const response = await getAPI(attemptcountUrl, {}, { userId: userId, paperId: paperId }, true)

    const endTime = Date.now()

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
    const startTime = Date.now()

    const response = await getAPI(todaynotificationUrl, {}, null, true)

    const endTime = Date.now()

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
    const startTime = Date.now()

    const response = await getAPI(allnotificationUrl, {}, null, true)

    const endTime = Date.now()

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

    const startTime = Date.now()

    const response = await getAPI(allresultUrl, {}, paperId, true)

    const endTime = Date.now()

    return response
  } catch (error) {
    console.error(`❌ ==> Error fetching all results for paper ${paperId}:`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
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
    const startTime = Date.now()

    const response = await getAPI(allmaterialUrl, {}, null, true)

    const endTime = Date.now()

    return response
  } catch (error) {
    console.error("❌ ==> Error fetching all materials:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
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

export const createPaymentSession = async (materialId, email, phone, userId ) => {
  try {
    console.log("🚀 Creating Cashfree order with params:", { materialId, email, phone,userId })

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

    const startTime = Date.now()

    const queryParams = new URLSearchParams({
      materialId: materialId.toString(),
      email: email.trim(),
      phone: phone.toString().replace(/\s+/g, ""),
      userId: userId.toString(),
    })

    const fullUrl = `${paymentUrl}?${queryParams.toString()}`

    console.log("📦 Final payment URL:", fullUrl)

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

    const endTime = Date.now()
    console.log(`✅ Payment order creation took: ${endTime - startTime}ms`)
    console.log("📋 Payment response:", response.data)

    return response.data
  } catch (error) {
    console.error("❌ Error creating Cashfree order:", error)

    if (error.response) {
      console.error("📊 Error Response:", {
        status: error.response.status,
        data: error.response.data,
      })

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

    console.log("🔍 Verifying payment:", { orderId, paymentId })

    const startTime = Date.now()

    const verificationData = {
      orderId: orderId,
      paymentId: paymentId,
    }

    const response = await postAPI(verifyPaymentUrl, verificationData, {}, true)

    const endTime = Date.now()
    console.log(`⏱️ Payment verification took: ${endTime - startTime}ms`)

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
    const fullUrl = `${paperbyseriesUrl}${seriesId}`;
    console.log('=== API Debug Info ===');
    console.log('paperbyseriesUrl:', paperbyseriesUrl);
    console.log('seriesId:', seriesId);
    console.log('Full URL:', fullUrl);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      // Get more details about the error
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching papers by series:', error);
    throw error;
  }
};

export { postAPI, getAPI, getUserId, validateRegistrationPayload }

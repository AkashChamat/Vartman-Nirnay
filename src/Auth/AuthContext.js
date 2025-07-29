import { createContext, useContext, useState, useEffect, useCallback } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { isJWTExpired, extractUserInfo } from "../util/jwtUtils"

const AuthContext = createContext()

// Add the useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("userToken")
        const storedUserData = await AsyncStorage.getItem("userData")

        if (storedToken) {
          if (!isJWTExpired(storedToken)) {
            setToken(storedToken)
            setIsAuthenticated(true)
            if (storedUserData) {
              setUser(JSON.parse(storedUserData))
            }
          } else {
            await AsyncStorage.removeItem("userToken")
            await AsyncStorage.removeItem("userData")
            setToken(null)
            setIsAuthenticated(false)
            setUser(null)
          }
        }
      } catch (error) {
        console.error("[AUTH-CONTEXT] Token loading error:", error.message)
      } finally {
        setLoading(false)
      }
    }

    loadToken()
  }, [])

  const login = useCallback(async (authToken, apiResponse) => {
    try {
      await AsyncStorage.setItem("userToken", authToken)

      // Extract user info from JWT token as backup
      const tokenUserInfo = extractUserInfo(authToken)

      const userData = {
        id: apiResponse.id || tokenUserInfo?.id,
        email: apiResponse.email || tokenUserInfo?.email,
        userName: apiResponse.userName || tokenUserInfo?.name,
        contact: apiResponse.contact,
        examName: apiResponse.examName,
      }

      await AsyncStorage.setItem("userData", JSON.stringify(userData))

      setToken(authToken)
      setUser(userData)
      setIsAuthenticated(true)
    } catch (error) {
      console.error("[AUTH-CONTEXT] Login error:", error.message)
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem("userToken")
      await AsyncStorage.removeItem("userData")
      setToken(null)
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error("[AUTH-CONTEXT] Logout error:", error.message)
    }
  }, [])

  const checkTokenValidity = useCallback(async () => {
    if (token && isJWTExpired(token)) {
      await logout()
      return false
    }
    return !!token
  }, [token, logout])

  const getUserId = useCallback(() => {
    return user?.id || null
  }, [user])

  const getUserEmail = useCallback(() => {
    return user?.email || null
  }, [user])

  const value = {
    isAuthenticated,
    token,
    user,
    loading,
    login,
    logout,
    checkTokenValidity,
    getUserId,
    getUserEmail,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

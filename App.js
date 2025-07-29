import "react-native-get-random-values"
import React from "react"
import { StatusBar, SafeAreaView, StyleSheet, Platform } from "react-native"
import { AuthProvider } from "./src/Auth/AuthContext"
import AuthNavigator from "./src/Auth/AuthNavigator"
import { testJwtDecode } from "./src/util/jwtUtils"

// App initialization logging
const AppLogger = {
  log: (message, data = null) => {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [APP]`, message, data || "")
  },
}

const App = () => {
  AppLogger.log("App component initializing", {
    platform: Platform.OS,
    version: Platform.Version,
    statusBarHeight: Platform.OS === "android" ? StatusBar.currentHeight : "N/A",
  })

  // Test JWT decode functionality on app start
  React.useEffect(() => {
    AppLogger.log("Running JWT decode test...")
    const testResult = testJwtDecode()
    AppLogger.log("JWT decode test result:", { passed: testResult })
  }, [])

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        translucent={true}
        hidden={false}
        {...(Platform.OS === "android" &&
          Platform.Version < 30 && {
            backgroundColor: "#5B9EED",
          })}
      />
      <AuthProvider>
        <AuthNavigator />
      </AuthProvider>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#5B9EED",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
})

AppLogger.log("App component exported successfully")
export default App

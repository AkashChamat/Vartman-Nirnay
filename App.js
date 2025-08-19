import React from 'react';
import { StatusBar, SafeAreaView, StyleSheet, Platform } from 'react-native';
import { AuthProvider } from './src/Auth/AuthContext';
import AuthNavigator from './src/Auth/AuthNavigator';

const App = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent={true} />
      <AuthProvider>
        <AuthNavigator />
      </AuthProvider>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#5B9EED",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
});

export default App;

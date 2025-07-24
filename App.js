// import { decode, encode } from 'base-64';

// global.atob = global.atob || decode;
// global.btoa = global.btoa || encode;

// import React from 'react';
// import { StatusBar, SafeAreaView, StyleSheet, Platform } from 'react-native';
// import { AuthProvider } from './src/Auth/AuthContext';
// import AuthNavigator from './src/Auth/AuthNavigator';
// import FlashMessage from "react-native-flash-message";

// const App = () => {
//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <StatusBar 
//         barStyle="light-content" 
//         // REMOVED: backgroundColor - This causes deprecated API usage on Android 15
//         translucent={true}  // Changed to true for edge-to-edge
//         hidden={false}
//         // Only set backgroundColor on older Android versions
//         {...(Platform.OS === 'android' && Platform.Version < 30 && {
//           backgroundColor: "#5B9EED"
//         })}
//       />
//       <AuthProvider>
//         <AuthNavigator />
//       </AuthProvider>
//       <FlashMessage 
//         position="top" 
//         duration={4000}
//         floating={true}
//         style={{ 
//           paddingTop: Platform.OS === 'android' ? 50 : 25  // Adjust for translucent status bar
//         }}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#5B9EED', 
//     // Add paddingTop for Android to handle translucent status bar
//     paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
//   },
// });

// export default App;

// App.js - Fixed version with proper polyfills
import 'react-native-get-random-values'; // Add this for crypto polyfill
import { decode, encode } from 'base-64';

// Enhanced polyfills for release builds
if (!global.atob) {
  global.atob = decode;
}
if (!global.btoa) {
  global.btoa = encode;
}

// Additional polyfills that might be needed
if (typeof global.self === 'undefined') {
  global.self = global;
}

import React from 'react';
import { StatusBar, SafeAreaView, StyleSheet, Platform } from 'react-native';
import { AuthProvider } from './src/Auth/AuthContext';
import AuthNavigator from './src/Auth/AuthNavigator';
import FlashMessage from "react-native-flash-message";

const App = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="light-content"
        translucent={true}
        hidden={false}
        {...(Platform.OS === 'android' && Platform.Version < 30 && {
          backgroundColor: "#5B9EED"
        })}
      />
      <AuthProvider>
        <AuthNavigator />
      </AuthProvider>
      <FlashMessage 
        position="top"
        duration={4000}
        floating={true}
        style={{
          paddingTop: Platform.OS === 'android' ? 50 : 25
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#5B9EED',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});

export default App;
// import {NavigationContainer} from '@react-navigation/native';
// import {createStackNavigator} from '@react-navigation/stack';
// import 'react-native-reanimated';
// import { useEffect } from 'react';
// import { Platform } from 'react-native';
// import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

// import Login from './src/authenticationStack/Login';
// import Home from './src/screens/Home';
// import EPaper from './src/screens/EPaper';
// import ChampionSeries from './src/screens/ChampionSeries';
// import Packages from './src/screens/Packages';
// import TestSeries from './src/screens/testseries';
// import Courses from './src/screens/Courses';
// import WeeklyPrize from './src/screens/WeeklyPrize';
// import Ebook from './src/screens/Ebook';
// import Gallery from './src/screens/Gallery';
// import ReferEarn from './src/screens/ReferEarn';
// import FollowUs from './src/screens/FollowUs';
// import JobSearch from './src/screens/JobSearch';
// import Sponsors from './src/screens/Sponsors';
// import Purchase from './src/screens/Purchase';
// import BookStore from './src/screens/BookStore';
// import PdfViewer from './src/screens/pdfViewer';
// import ChampionTest from './src/screens/ChampionTest';
// import ChampionResult from './src/screens/ChampionResult';

// const Stack = createStackNavigator();

// const App = () => {

//   const requestStoragePermissions = async () => {
//     try {
//       // For Android 13+ (API 33+)
//       if (Platform.OS === 'android' && Platform.Version >= 33) {
//         // Request READ_MEDIA_DOCUMENTS permission for PDF files
//         await request(PERMISSIONS.ANDROID.READ_MEDIA_DOCUMENTS);
        
//         // Request READ_MEDIA_IMAGES permission as fallback
//         await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
//       } 
//       // For Android 11-12 (API 30-32)
//       else if (Platform.OS === 'android' && Platform.Version >= 30 && Platform.Version < 33) {
//         await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
//       }
//       // For Android 10 and below (API 29 and below)
//       else if (Platform.OS === 'android') {
//         await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
//         await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
//       }
//     } catch (error) {
//       console.error('Error requesting permissions:', error);
//     }
//   };

//   useEffect(() => {
//     requestStoragePermissions();
//   }, []);

//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName="Login">
//         <Stack.Screen
//           name="Login"
//           component={Login}
//           options={{headerShown: false}}
//         />
//         <Stack.Screen
//           name="Home"
//           component={Home}
//           options={{headerShown: false}}
//         />
//          <Stack.Screen
//           name="PdfViewer"
//           component={PdfViewer}
//           options={{headerShown: false}}
//         />
//         <Stack.Screen
//           name="EPaper"
//           component={EPaper}
//           options={{headerShown: false}}
//         />
//          <Stack.Screen
//           name="ChampionSeries"
//           component={ChampionSeries}
//           options={{headerShown: false}}
//         />
//           <Stack.Screen
//           name="Packages"
//           component={Packages}
//           options={{headerShown: false}}
//         />
//         <Stack.Screen
//           name="Courses"
//           component={Courses}
//           options={{headerShown: false}}
//         />
    
//          <Stack.Screen
//           name="WeeklyPrize"
//           component={WeeklyPrize}
//           options={{headerShown: false}}
//         />
//          <Stack.Screen
//           name="Ebook"
//           component={Ebook}
//           options={{headerShown: false}}
//         />
//          <Stack.Screen
//           name="Gallery"
//           component={Gallery}
//           options={{headerShown: false}}
//         />
//          <Stack.Screen
//           name="ReferEarn"
//           component={ReferEarn}
//           options={{headerShown: false}}
//         />
//          <Stack.Screen
//           name="FollowUs"
//           component={FollowUs}
//           options={{headerShown: false}}
//         />
//          <Stack.Screen
//           name="JobSearch"
//           component={JobSearch}
//           options={{headerShown: false}}
//         />
//          <Stack.Screen
//           name="TestSeries"
//           component={TestSeries}
//           options={{headerShown: false}}
//         />
//         <Stack.Screen
//           name="Sponsors"
//           component={Sponsors}
//           options={{headerShown: false}}
//         />
//          <Stack.Screen
//           name="Purchase"
//           component={Purchase}
//           options={{headerShown: false}}
//         />
//        <Stack.Screen
//           name="BookStore"
//           component={BookStore}
//           options={{headerShown: false}}
//         />
//         <Stack.Screen
//           name="ChampionTest"
//           component={ChampionTest}
//           options={{headerShown: false}}
//         />
//         <Stack.Screen
//           name="ChampionResult"
//           component={ChampionResult}
//           options={{headerShown: false}}
//         />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default App;



import { decode, encode } from 'base-64';

global.atob = global.atob || decode;
global.btoa = global.btoa || encode;

import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/Auth/AuthContext';
import AuthNavigator from './src/Auth/AuthNavigator';

const App = () => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#5B9EED" />
      <AuthProvider>
        <AuthNavigator />
      </AuthProvider>
    </>
  );
};

export default App;
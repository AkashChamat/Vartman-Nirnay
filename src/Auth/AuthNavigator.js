import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {useAuth} from '../Auth/AuthContext';
import FlashMessage from "react-native-flash-message";
import { navigationRef } from '../Components/NavigationService';

// Import your screens
import LoginScreen from '../authenticationStack/Login';
import Home from '../screens/Home';
import EPaper from '../screens/EPaper';
import ChampionSeries from '../screens/ChampionSeries';
import Packages from '../screens/Packages';
import TestSeries from '../screens/TestSeries/testseries';
import Courses from '../screens/Courses';
import WeeklyPrize from '../screens/WeeklyPrize';
import Ebook from '../screens/Ebook';
import Gallery from '../screens/Gallery';
import ReferEarn from '../screens/ReferEarn';
import FollowUs from '../screens/FollowUs';
import JobSearch from '../screens/JobSearch';
import Sponsors from '../screens/Sponsors';
import Purchase from '../screens/Purchase';
import BookStore from '../screens/BookStore';
import PdfViewer from '../screens/pdfViewer';
import ChampionTest from '../screens/ChampionTest';
import ChampionResult from '../screens/ChampionResult';
import SendOtp from '../authenticationStack/SendOtp';
import VerifyOtp from '../authenticationStack/VerifyOtp';
import ResetPassword from '../authenticationStack/ResetPassword';
import Profile from '../screens/Profile';
import ContactUs from '../screens/ContactUs';
import Privacy from '../screens/Privacy';
import TermsAndConditions from '../screens/TermsAndConditions';
import Shipping from '../screens/Shipping';
import Refund from '../screens/Refund';
import Notification from '../screens/Notification';
import AllResult from '../screens/AllResult';
import PaymentScreen from '../screens/PaymentScreen';
import PaymentSuccess from '../screens/PaymentSuccess';
import TestPaper from '../screens/TestSeries/TestPaper';
import SeriesPayment from '../screens/TestSeries/SeriesPayment';
import Test from '../screens/TestSeries/Test';
import Books from '../screens/BookStore/Books'
import BookPaymentScreen from '../screens/BookStore/BookPaymentScreen';

const Stack = createStackNavigator();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#5B9EED" />
    <Text style={styles.loadingText}>Verifying session...</Text>
  </View>
);

const AuthNavigator = () => {
  const {isAuthenticated, isLoading, token} = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <NavigationContainer 
        ref={navigationRef} // ✅ Connect navigation ref
        onReady={() => console.log('🚀 Navigation ready for notifications')}
      >
        {isAuthenticated ? (
          // ✅ COMPLETE Authenticated stack
          <Stack.Navigator 
            initialRouteName="Home"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Notification" component={Notification} />
            <Stack.Screen name="EPaper" component={EPaper} />
            <Stack.Screen name="ChampionSeries" component={ChampionSeries} />
            <Stack.Screen name="Packages" component={Packages} />
            <Stack.Screen name="TestSeries" component={TestSeries} />
            <Stack.Screen name="Courses" component={Courses} />
            <Stack.Screen name="WeeklyPrize" component={WeeklyPrize} />
            <Stack.Screen name="Ebook" component={Ebook} />
            <Stack.Screen name="Gallery" component={Gallery} />
            <Stack.Screen name="ReferEarn" component={ReferEarn} />
            <Stack.Screen name="FollowUs" component={FollowUs} />
            <Stack.Screen name="JobSearch" component={JobSearch} />
            <Stack.Screen name="Sponsors" component={Sponsors} />
            <Stack.Screen name="Purchase" component={Purchase} />
            <Stack.Screen name="BookStore" component={BookStore} />
            <Stack.Screen name="PdfViewer" component={PdfViewer} />
            <Stack.Screen name="ChampionTest" component={ChampionTest} />
            <Stack.Screen name="ChampionResult" component={ChampionResult} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="ContactUs" component={ContactUs} />
            <Stack.Screen name="Privacy" component={Privacy} />
            <Stack.Screen name="TermsAndConditions" component={TermsAndConditions} />
            <Stack.Screen name="Shipping" component={Shipping} />
            <Stack.Screen name="Refund" component={Refund} />
            <Stack.Screen name="AllResult" component={AllResult} />
            <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
            <Stack.Screen name="PaymentSuccess" component={PaymentSuccess} />
            <Stack.Screen name="TestPaper" component={TestPaper} />
            <Stack.Screen name="SeriesPayment" component={SeriesPayment} />
            <Stack.Screen name="Test" component={Test} />
            <Stack.Screen name="Books" component={Books} />
            <Stack.Screen name="BookPaymentScreen" component={BookPaymentScreen} />
          </Stack.Navigator>
        ) : (
          // ✅ COMPLETE Unauthenticated stack
          <Stack.Navigator 
            initialRouteName="LoginScreen"
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="SendOtp" component={SendOtp} />
            <Stack.Screen name="VerifyOtp" component={VerifyOtp} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
      <FlashMessage position="top" />
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F9FE',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#5B9EED',
    fontWeight: '500',
  },
});

export default AuthNavigator;

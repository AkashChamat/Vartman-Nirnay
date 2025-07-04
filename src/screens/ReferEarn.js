import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '../Components/Header';
import Footer from '../Components/Footer';

const ReferEarn = () => {
  return (
    <View style={styles.container}>
      <Header/>
      <View style={{flex:1,justifyContent:'center',alignItems:'center'}}> 
      <MaterialIcons name="hourglass-empty" size={100} color="#42A5F5" />
      <Text style={styles.title}>Coming Soon</Text>
      <Text style={styles.subtitle}>
        This page is currently in progress. Please check back later!
      </Text>
      </View>
      <Footer/>
    </View>
  );
};

export default ReferEarn;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

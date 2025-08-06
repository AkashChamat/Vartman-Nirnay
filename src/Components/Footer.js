// import React from 'react';
// import {
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   Dimensions,
// } from 'react-native';
// import {useNavigation} from '@react-navigation/native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import LinearGradient from 'react-native-linear-gradient';

// const {width} = Dimensions.get('window');

// const Footer = () => {
//   const navigation = useNavigation();

//   // Navigation handlers for each button
//   const navigateToEPaper = () => {
//     navigation.navigate('EPaper');
//   };

//   const navigateToMyPurchase = () => {
//     navigation.navigate('Purchase');
//   };

//   const navigateToTrophy = () => {
//     navigation.navigate('ChampionSeries');
//   };

//   const navigateToHome = () => {
//     navigation.navigate('Home');
//   };

//   return (
//     <View style={styles.container}>
//       <LinearGradient
//         colors={['#0288D1', '#03A9F4']}
//         style={styles.background}
//         start={{x: 0, y: 0}}
//         end={{x: 1, y: 0}}>

//             <TouchableOpacity
//           style={styles.tabButton}
//           onPress={navigateToHome}
//           activeOpacity={0.7}>
//           <View style={styles.buttonContent}>
//             <Ionicons name="home" size={24} color="#FFFFFF" />
//             <Text style={styles.buttonText}>Home</Text>
//           </View>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.tabButton}
//           onPress={navigateToTrophy}
//           activeOpacity={0.7}>
//           <View style={styles.buttonContent}>
//             <Ionicons name="trophy-outline" size={24} color="#FFFFFF" />
//             <Text style={styles.buttonText}>Champion Series</Text>
//           </View>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.tabButton}
//           onPress={navigateToEPaper}
//           activeOpacity={0.7}>
//           <View style={styles.buttonContent}>
//             <Ionicons name="newspaper-outline" size={24} color="#FFFFFF" />
//             <Text style={styles.buttonText}>EPaper</Text>
//           </View>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.tabButton}
//           onPress={navigateToMyPurchase}
//           activeOpacity={0.7}>
//           <View style={styles.buttonContent}>
//             <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
//             <Text style={styles.buttonText}>My Purchase</Text>
//           </View>
//         </TouchableOpacity>

      
//       </LinearGradient>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     position: 'absolute',
//     bottom: 0,
//     width: width,
//   },
//   background: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     height: 60,
//     borderTopLeftRadius: 15,
//     borderTopRightRadius: 15,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: -2},
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//     elevation: 10,
//   },
//   tabButton: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   buttonContent: {
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontSize: 11,
//     fontWeight: '600',
//     marginTop: 4,
//     textAlign:'center'
//   },
// });

// export default Footer;


// Update ONLY your Footer component - no other file changes needed!
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

const Footer = () => {
  const navigation = useNavigation();

  const navigateToEPaper = () => {
    navigation.navigate('EPaper');
  };

  const navigateToMyPurchase = () => {
    navigation.navigate('Purchase');
  };

  const navigateToTrophy = () => {
    navigation.navigate('ChampionSeries');
  };

  const navigateToHome = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#0288D1', '#03A9F4']}
          style={styles.background}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}>
          
          <TouchableOpacity
            style={styles.tabButton}
            onPress={navigateToHome}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Ionicons name="home" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Home</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabButton}
            onPress={navigateToTrophy}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Ionicons name="trophy-outline" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>Champion Series</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabButton}
            onPress={navigateToEPaper}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Ionicons name="newspaper-outline" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>EPaper</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabButton}
            onPress={navigateToMyPurchase}
            activeOpacity={0.7}>
            <View style={styles.buttonContent}>
              <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
              <Text style={styles.buttonText}>My Purchase</Text>
            </View>
          </TouchableOpacity>
          
        </LinearGradient>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  container: {
    height: 2, // Increased height to account for system nav
    width: width,
    backgroundColor: 'transparent',
    paddingBottom: 20, // Push footer content up from system nav
  },
  background: {
    position: 'absolute',
    bottom: 40, // Moved up from system navigation
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 60,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 10,
    zIndex: 1000,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default Footer;
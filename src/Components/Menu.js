import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  Image,
  Linking,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useAuth} from '../Auth/AuthContext';

const screenWidth = Dimensions.get('window').width;

const Menu = () => {
  const [visible, setVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;
  const settingsHeightAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();
  const {logout} = useAuth();

  const menuOptions = [
    {label: 'Home', value: 'Home', icon: 'home'},
    {label: 'E-Paper', value: 'EPaper', icon: 'file-text'},
    {label: 'Winners Gallery', value: 'Gallery', icon: 'image'},
    {label: 'Prize Distribution', value: 'Sponsors', icon: 'gift'},
    {label: 'Champion Series', value: 'ChampionSeries', icon: 'award'},
    {label: 'Job Alerts', value: 'JobSearch', icon: 'briefcase'},
    // {label: 'Packages', value: 'Packages', icon: 'box'},
    // {label: 'Test Series', value: 'TestSeries', icon: 'edit'},
    // {label: 'E-Book', value: 'Ebook', icon: 'book-open'},
    // {label: 'Courses', value: 'Courses', icon: 'layers'},
    {label: 'Contact Us', value: 'ContactUs', icon: 'message-square'},
    {
      label: 'About US',
      value: 'Settings',
      icon: 'info',
      isExpandable: true,
      subOptions: [
        {label: 'Privacy Policy', value: 'Privacy', icon: 'lock'},
        {label: 'Terms & Conditions', value: 'TermsAndConditions', icon: 'file-text'},
        {label: 'Shipping Policy', value: 'Shipping', icon: 'truck'},
        {label: 'Refund Policy', value: 'Refund', icon: 'refresh-ccw'},
      ],
    },
    
    {label: 'Logout', value: 'Logout', icon: 'log-out'},
  ];

  const openWhatsApp = () => {
    const whatsappNumber = '9028596157';
    const message = encodeURIComponent(
      'स्पर्धा परीक्षा माहितीसाठी मला साप्ताहिक वर्तमान निर्णय व्हाट्सअप ग्रुप ला ॲड करा',
    );
    const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${message}`;

    Linking.canOpenURL(whatsappUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          const browserUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
          return Linking.openURL(browserUrl);
        }
      })
      .catch(err => console.error('An error occurred', err));
  };

  const openSocialMedia = (url) => {
    Linking.openURL(url).catch(err => console.error('An error occurred', err));
  };

  const closeMenu = () => {
    setVisible(false);
    setSettingsExpanded(false);
  };

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 0 : -screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  useEffect(() => {
    Animated.timing(settingsHeightAnim, {
      toValue: settingsExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [settingsExpanded]);

  const handleOptionPress = (screenName, isExpandable = false, isWebLink = false, url = null) => {
    if (isExpandable && screenName === 'Settings') {
      setSettingsExpanded(!settingsExpanded);
      return;
    }

    closeMenu();
    
    if (isWebLink && url) {
      openSocialMedia(url);
      return;
    }

    if (screenName === 'Logout') {
      setLogoutConfirmVisible(true);
    } else {
      navigation.navigate(screenName);
    }
  };

  const handleSubOptionPress = screenName => {
    closeMenu();
    navigation.navigate(screenName);
  };

  const confirmLogout = async () => {
    setLogoutConfirmVisible(false);
    await logout();
    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
  };

  const renderMenuItem = (option, index) => {
    if (option.isExpandable) {
      return (
        <View key={index}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => handleOptionPress(option.value, true)}>
            <Feather
              name={option.icon}
              size={20}
              color="#0288D1"
              style={styles.optionIcon}
            />
            <Text style={styles.optionText}>{option.label}</Text>
            <Feather
              name={settingsExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#0288D1"
              style={styles.chevronIcon}
            />
          </TouchableOpacity>
          
          <Animated.View
            style={[
              styles.subMenuContainer,
              {
                height: settingsHeightAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, option.subOptions.length * 40],
                }),
                opacity: settingsHeightAnim,
              },
            ]}>
            {option.subOptions.map((subOption, subIndex) => (
              <TouchableOpacity
                key={subIndex}
                style={styles.subOption}
                onPress={() => handleSubOptionPress(subOption.value)}>
                <Feather
                  name={subOption.icon}
                  size={18}
                  color="#666"
                  style={styles.subOptionIcon}
                />
                <Text style={styles.subOptionText}>{subOption.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        style={styles.option}
        onPress={() => handleOptionPress(option.value, false, option.isWebLink, option.url)}>
        <Feather
          name={option.icon}
          size={20}
          color="#0288D1"
          style={styles.optionIcon}
        />
        <Text style={styles.optionText}>{option.label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <Feather name="menu" size={30} color="#0288D1" />
      </TouchableOpacity>

      {visible && (
        <Modal transparent animationType="none" visible={visible}>
          <View style={styles.container}>
            <Pressable
              style={styles.overlay}
              onPress={closeMenu}
            />
            <Animated.View
              style={[
                styles.menuContainer,
                {transform: [{translateX: slideAnim}]},
              ]}>
              <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                  <Image
                    style={styles.logo}
                    source={require('../assets/logo.png')}
                  />
                  <TouchableOpacity onPress={closeMenu}>
                    <Feather name="x" size={28} color="#0288D1" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.menuOptions}
                  showsVerticalScrollIndicator={false}>
                  {menuOptions.map((option, index) => renderMenuItem(option, index))}
                </ScrollView>

                {/* Developed By Section */}
                <View style={styles.developedByContainer}>
                  <TouchableOpacity
                    style={styles.developedByButton}
                    onPress={() => openSocialMedia('https://pjsofttech.com')}>
                    <Image
                      source={require('../assets/pjsofttech.jpg')}
                      style={styles.developerIcon}
                      
                    />
                    <Text style={styles.developedByText}>Developed by PJ SoftTech</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.socialContainer}>
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() =>
                      openSocialMedia(
                        'https://www.instagram.com/vartman.nirnay/profilecard/?igsh=MWEyZDN1MmVzMGhx',
                      )
                    }>
                    <Image
                      source={require('../assets/instagram.png')}
                      style={styles.socialIcon}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() =>
                      openSocialMedia(
                        'https://www.facebook.com/people/%E0%A4%B5%E0%A4%B0%E0%A5%8D%E0%A4%A4%E0%A4%AE%E0%A4%BE%E0%A4%A8-%E0%A4%A8%E0%A4%BF%E0%A4%B0%E0%A5%8D%E0%A4%A3%E0%A4%AF-%E0%A4%B8%E0%A4%BE%E0%A4%AA%E0%A5%8D%E0%A4%A4%E0%A4%BE%E0%A4%B9%E0%A4%BF%E0%A4%95/61576318642335/?rdid=wetIJZPjgvPDTAaC&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F15HoQeGbSj%2F',
                      )
                    }>
                    <FontAwesome name="facebook" size={24} color="#0288D1" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.socialButton}>
                    <FontAwesome name="youtube" size={24} color="red" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={openWhatsApp}>
                    <FontAwesome name="whatsapp" size={24} color="green" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={() => openSocialMedia('https://vartmannirnay.com/')}>
                    <Feather name="globe" size={24} color="#0288D1" />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* Logout Confirmation Modal */}
      <Modal transparent visible={logoutConfirmVisible} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>Do you really want to logout?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setLogoutConfirmVisible(false)}
                style={styles.modalButton}>
                <Text style={styles.modalButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmLogout}
                style={[styles.modalButton, styles.yesButton]}>
                <Text style={[styles.modalButtonText, {color: 'white'}]}>
                  Yes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, flexDirection: 'row'},
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)'},
  menuContainer: {
    width: screenWidth * 0.6,
    maxWidth: 300,
    backgroundColor: '#fff',
    height: '100%',
    position: 'absolute',
    left: 0,
    elevation: 10,
  },
  safeArea: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logo: {width: 110, height: 40, resizeMode: 'contain'},
  menuOptions: {flex: 1},
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 20,
  },
  optionIcon: {marginRight: 13},
  optionText: {fontSize: 13, color: '#0288D1', flex: 1},
  chevronIcon: {marginLeft: 'auto'},
  
  // Sub-menu styles
  subMenuContainer: {
    overflow: 'hidden',
    backgroundColor: '#f5f9ff',
  },
  subOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 40,
    height: 40,
  },
  subOptionIcon: {marginRight: 12},
  subOptionText: {fontSize: 12, color: '#666'},
  
  // Developed By Section
  developedByContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  developedByButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  developerIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  developedByText: {
    fontSize: 12,
    color: '#0288D1',
    fontWeight: '600',
    textShadowColor: 'rgba(2, 136, 209, 0.3)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  socialButton: {padding: 8},
  socialIcon: {width: 24, height: 24, resizeMode: 'contain'},

  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#0288D1',
  },
  yesButton: {
    backgroundColor: '#0288D1',
    borderColor: '#0288D1',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#0288D1',
  },
});

export default Menu;
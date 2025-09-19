import React, {useState, useEffect} from 'react';

import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  ActivityIndicator,
  Modal,
  Animated,
  Platform,
  Alert,
  Clipboard,
} from 'react-native';

import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MarqueeText from 'react-native-marquee';
import {slider, marquee} from '../util/apiCall';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import ImageSlider from '../Components/ImageSlider';
import TestTimer from '../Components/TestTimer';
import {getPersonalChatMobile, getGroupLinks} from '../util/apiCall';

const {width, height} = Dimensions.get('window');

const Home = () => {
  const navigation = useNavigation();
  const [sliderImages, setSliderImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [marqueeText, setMarqueeText] = useState(
    'VN Champion Series • New Courses Available • Special Offers • Join Now',
  );
  const [isMarqueeLoading, setIsMarqueeLoading] = useState(true);
  const [showFollowPopup, setShowFollowPopup] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(0));

  // Calculate dynamic bottom padding for ScrollView
  const isLargeScreen = height > 700;
  const hasHomeButton = Platform.OS === 'android' && height < 750;
  const scrollBottomPadding = hasHomeButton ? 100 : isLargeScreen ? 90 : 80;
  const footerHeight = hasHomeButton ? 70 : 60;

  const [isWhatsAppPopupVisible, setIsWhatsAppPopupVisible] = useState(false);
  const [whatsappScaleAnim] = useState(new Animated.Value(0));
  const [personalChatNumber, setPersonalChatNumber] = useState('');
  const [groupLinks, setGroupLinks] = useState([]);
  const [isLoadingWhatsAppData, setIsLoadingWhatsAppData] = useState(false);

  useEffect(() => {
    const getSliderImages = async () => {
      try {
        setIsLoading(true);
        const response = await slider();
        if (Array.isArray(response) && response.length > 0) {
          setSliderImages(response);
        } else {
          setSliderImages([]);
        }
      } catch (error) {
        console.error('Error fetching slider images:', error);
        setSliderImages([]);
      } finally {
        setIsLoading(false);
      }
    };

    const getMarqueeText = async () => {
      try {
        setIsMarqueeLoading(true);
        const response = await marquee();
        if (response && response.message) {
          setMarqueeText(response.message);
        } else if (
          Array.isArray(response) &&
          response.length > 0 &&
          response[0].message
        ) {
          setMarqueeText(response[0].message);
        }
      } catch (error) {
        console.error('Error fetching marquee text:', error);
      } finally {
        setIsMarqueeLoading(false);
      }
    };

    getSliderImages();
    getMarqueeText();
  }, []);

  const socialLinks = {
    instagram:
      'https://www.instagram.com/vartman.nirnay/profilecard/?igsh=MWEyZDN1MmVzMGhq',
    facebook:
      'https://www.facebook.com/people/%E0%A4%B5%E0%A4%B0%E0%A5%8D%E0%A4%A4%E0%A4%AE%E0%A4%BE%E0%A4%A8-%E0%A4%A8%E0%A4%BF%E0%A4%B0%E0%A5%8D%E0%A4%A3%E0%A4%AF-%E0%A4%B8%E0%A4%BE%E0%A4%AA%E0%A5%8D%E0%A4%A4%E0%A4%BE%E0%A4%B9%E0%A4%BF%E0%A4%95/61576318642335/?rdid=mrro65egz2XSc4qz&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F15HoQeGbSj%2F',
  };

  const menuItems = [
    {
      id: '1',
      title: 'E-Paper',
      image: require('../assets/epaper.png'),
      screen: 'EPaper',
      color: '#FBE9E7',
    },
    {
      id: '2',
      title: 'Ebook',
      image: require('../assets/ebook.png'),
      screen: 'Ebook',
      color: '#E0F7FA',
    },
    {
      id: '3',
      title: 'Test Series',
      image: require('../assets/testseries.png'),
      screen: 'TestSeries',
      color: '#FFF8E1',
    },
    {
      id: '4',
      title: 'Champion Series',
      image: require('../assets/champion.png'),
      screen: 'ChampionSeries',
      color: '#F3E5F5',
    },
    {
      id: '5',
      title: 'Prize Distribution',
      image: require('../assets/sponsors.png'),
      screen: 'Sponsors',
      color: '#F1F8E9',
    },
    {
      id: '6',
      title: 'Winners Gallery',
      image: require('../assets/gallery.png'),
      screen: 'Gallery',
      color: '#FBE9E7',
    },
    {
      id: '9',
      title: 'WhatsApp',
      image: require('../assets/whatsapp.png'),
      action: 'whatsapp',
      color: '#E8F5E9',
    },
    {
      id: '10',
      title: 'Follow Us',
      image: require('../assets/follow.png'),
      action: 'followUs',
      color: '#E3F2FD',
    },
    {
      id: '11',
      title: 'Job Search',
      image: require('../assets/jobsearch.png'),
      screen: 'JobSearch',
      color: '#FBE9E7',
    },
    {
      id: '12',
      title: 'Book Store',
      image: require('../assets/books.png'),
      screen: 'Books',
      color: '#E8F5E9',
    },
    {
      id: '13',
      title: 'Packages',
      image: require('../assets/packages.png'),
      screen: 'Packages',
      color: '#F0E6FF'
    },
  ];

  // IMPROVED fetchWhatsAppData with proper logging
  const fetchWhatsAppData = async () => {
    try {
      setIsLoadingWhatsAppData(true);
      console.log('🔄 Starting WhatsApp data fetch...');
      
      const [personalChatResponse, groupLinksResponse] = await Promise.all([
        getPersonalChatMobile(),
        getGroupLinks(),
      ]);

      // Log personal chat data
      console.log('📱 Personal Chat API Response:', personalChatResponse);
      
      // FIXED: Handle array response for personal chat
      if (Array.isArray(personalChatResponse) && personalChatResponse.length > 0) {
        const personalChatData = personalChatResponse[0];
        console.log('📱 Personal Chat Data (first item):', personalChatData);
        
        if (personalChatData && personalChatData.mobileNo) {
          console.log('✅ Personal Chat Mobile Number Found:', personalChatData.mobileNo);
          setPersonalChatNumber(personalChatData.mobileNo);
        } else {
          console.log('❌ No mobileNo found in personal chat data');
          setPersonalChatNumber('');
        }
      } else if (personalChatResponse && personalChatResponse.mobileNo) {
        // Fallback for direct object response
        console.log('✅ Personal Chat Mobile Number Found (direct):', personalChatResponse.mobileNo);
        setPersonalChatNumber(personalChatResponse.mobileNo);
      } else {
        console.log('❌ Invalid personal chat response format');
        setPersonalChatNumber('');
      }

      // Log group links data
      console.log('👥 Group Links API Response:', groupLinksResponse);
      if (Array.isArray(groupLinksResponse)) {
        setGroupLinks(groupLinksResponse);
        console.log('✅ Group Links set:', groupLinksResponse.length, 'groups');
      } else if (
        groupLinksResponse &&
        groupLinksResponse.data &&
        Array.isArray(groupLinksResponse.data)
      ) {
        setGroupLinks(groupLinksResponse.data);
        console.log('✅ Group Links set from data property:', groupLinksResponse.data.length, 'groups');
      } else {
        setGroupLinks([]);
        console.log('⚠️ No valid group links found');
      }
    } catch (error) {
      console.error('❌ Error fetching WhatsApp data:', error);
    } finally {
      setIsLoadingWhatsAppData(false);
    }
  };

  const showWhatsAppPopup = () => {
    setIsWhatsAppPopupVisible(true);
    fetchWhatsAppData();
    Animated.spring(whatsappScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const hideWhatsAppPopup = () => {
    Animated.spring(whatsappScaleAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start(() => {
      setIsWhatsAppPopupVisible(false);
    });
  };

  const openPersonalChat = () => {
    console.log('📱 Opening Personal Chat...');
    console.log('📱 Personal Chat Number:', personalChatNumber);
    
    if (!personalChatNumber) {
      console.log('❌ No personal chat number available');
      return;
    }

    const message = encodeURIComponent(
      'स्पर्धा परीक्षा माहितीसाठी मला साप्ताहिक वर्तमान निर्णय व्हाट्सअप ग्रुप ला ॲड करा',
    );
    const whatsappUrl = `whatsapp://send?phone=${personalChatNumber}&text=${message}`;
    
    console.log('📱 WhatsApp URL:', whatsappUrl);

    Linking.canOpenURL(whatsappUrl)
      .then(supported => {
        console.log('📱 WhatsApp URL supported:', supported);
        if (supported) {
          console.log('📱 Opening WhatsApp app...');
          return Linking.openURL(whatsappUrl);
        } else {
          const browserUrl = `https://wa.me/${personalChatNumber}?text=${message}`;
          console.log('📱 Fallback to browser URL:', browserUrl);
          return Linking.openURL(browserUrl);
        }
      })
      .catch(err => {
        console.error('❌ Error opening personal chat:', err);
      });

    hideWhatsAppPopup();
  };

  // IMPROVED openGroupLink with multiple format attempts
  const openGroupLink = (link) => {
    console.log('👥 Opening Group Link...');
    console.log('👥 Original Link:', link);
    
    if (!link) {
      console.log('❌ No group link provided');
      return;
    }

    const attemptOpenLink = async () => {
      // Extract group ID from different link formats
      let groupId = '';
      
      if (link.includes('chat.whatsapp.com/')) {
        groupId = link.split('chat.whatsapp.com/')[1];
      } else if (link.includes('whatsapp.com/')) {
        groupId = link.split('whatsapp.com/')[1];
      } else {
        groupId = link; // Assume it's just the ID
      }
      
      console.log('👥 Extracted Group ID:', groupId);

      // DIFFERENT URL FORMATS TO TRY (in order of compatibility)
      const urlFormats = [
        `whatsapp://chat.whatsapp.com/${groupId}`, // Native app format
        `https://chat.whatsapp.com/${groupId}`,    // Standard web format
        `https://api.whatsapp.com/send/?text=Join%20group&app_absent=0&chat=${groupId}`, // Alternative format
        `https://wa.me/join/${groupId}` // Newer format
      ];

      // Try each format until one works
      for (let i = 0; i < urlFormats.length; i++) {
        const currentUrl = urlFormats[i];
        console.log(`👥 Trying URL format ${i + 1}:`, currentUrl);

        try {
          const supported = await Linking.canOpenURL(currentUrl);
          console.log(`👥 Format ${i + 1} supported:`, supported);
          
          if (supported) {
            await Linking.openURL(currentUrl);
            console.log(`✅ Successfully opened group with format ${i + 1}`);
            hideWhatsAppPopup();
            return true; // Success
          }
        } catch (error) {
          console.log(`❌ Format ${i + 1} failed:`, error.message);
          continue; // Try next format
        }
      }

      // If all formats fail, show user feedback
      console.log('❌ All group link formats failed');
      Alert.alert(
        'Group Link Issue', 
        'Unable to open WhatsApp group. Please try copying the link and opening it manually in WhatsApp.',
        [
          {
            text: 'Copy Link',
            onPress: () => {
              Clipboard.setString(link);
              console.log('📋 Group link copied to clipboard');
            }
          },
          { text: 'OK' }
        ]
      );
      return false;
    };

    attemptOpenLink();
    hideWhatsAppPopup();
  };

  const showFollowUsPopup = () => {
    setShowFollowPopup(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const hideFollowUsPopup = () => {
    Animated.spring(scaleAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start(() => {
      setShowFollowPopup(false);
    });
  };

  const openSocialLink = platform => {
    const url = socialLinks[platform];
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          console.error('Cannot open URL:', url);
        }
      })
      .catch(err => console.error('An error occurred', err));
    hideFollowUsPopup();
  };

  const handleMenuItemPress = item => {
    if (item.action === 'whatsapp') {
      showWhatsAppPopup();
    } else if (item.action === 'followUs') {
      showFollowUsPopup();
    } else if (item.screen) {
      navigation.navigate(item.screen);
    }
  };

  return (
    <View style={styles.container}>
      <Header />

      {/* Body Scroll with proper clipping */}
      <View style={styles.scrollContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{paddingBottom: scrollBottomPadding}}
          showsVerticalScrollIndicator={false}>
          
          {/* Image Slider */}
          <ImageSlider images={sliderImages} isLoading={isLoading} />

          {/* Marquee Section */}
          <View style={styles.timer}>
            <View style={styles.timerBadge}>
              <Ionicons name="megaphone" size={16} color="#00695C" />
              <Text style={styles.timerLabel}>UPDATES!</Text>
            </View>
            <View style={styles.timerTextContainer}>
              {isMarqueeLoading ? (
                <ActivityIndicator size="small" color="#FF6B6B" />
              ) : (
                <MarqueeText
                  style={styles.timertext}
                  speed={100}
                  marqueeOnStart={true}
                  loop={true}
                  delay={1000}>
                  {marqueeText}
                </MarqueeText>
              )}
            </View>
          </View>

          {/* Reusable Timer Component */}
          <TestTimer />

          {/* Menu Grid */}
          <View style={styles.gridContainer}>
            {Array(Math.ceil(menuItems.length / 3))
              .fill()
              .map((_, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                  {menuItems.slice(rowIndex * 3, rowIndex * 3 + 3).map(item => (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.menuItem, {backgroundColor: item.color}]}
                      onPress={() => handleMenuItemPress(item)}>
                      <Image source={item.image} style={styles.menuImage} />
                      <Text style={styles.menuTitle}>{item.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
          </View>
        </ScrollView>
      </View>

      {/* Follow Us Modal */}
      <Modal
        visible={showFollowPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={hideFollowUsPopup}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.popupContainer,
              {transform: [{scale: scaleAnim}]},
            ]}>
            {/* Header */}
            <View style={styles.popupHeader}>
              <View style={styles.headerIconContainer}>
                <Ionicons name="share-social" size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.popupTitle}>Follow Us</Text>
              <Text style={styles.popupSubtitle}>
                Stay connected with us on social media
              </Text>
            </View>

            {/* Social Media Buttons */}
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity
                style={[styles.socialButton, styles.instagramButton]}
                onPress={() => openSocialLink('instagram')}>
                <View style={styles.socialIconContainer}>
                  <Ionicons name="logo-instagram" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.socialTextContainer}>
                  <Text style={styles.socialButtonText}>Instagram</Text>
                  <Text style={styles.socialButtonSubtext}>
                    @vartman.nirnay
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, styles.facebookButton]}
                onPress={() => openSocialLink('facebook')}>
                <View style={styles.socialIconContainer}>
                  <Ionicons name="logo-facebook" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.socialTextContainer}>
                  <Text style={styles.socialButtonText}>Facebook</Text>
                  <Text style={styles.socialButtonSubtext}>
                    वर्तमान निर्णय साप्ताहिक
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={hideFollowUsPopup}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* WhatsApp Options Modal - REPOSITIONED ORDER */}
      <Modal
        visible={isWhatsAppPopupVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideWhatsAppPopup}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.popupContainer,
              {transform: [{scale: whatsappScaleAnim}]},
            ]}>
            {/* Header */}
            <View style={styles.popupHeader}>
              <View style={[styles.headerIconContainer, {backgroundColor: '#E8F5E9'}]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <Text style={styles.popupTitle}>WhatsApp Options</Text>
              <Text style={styles.popupSubtitle}>
                Choose how you'd like to connect with us
              </Text>
            </View>

            {/* WhatsApp Options - GROUP LINKS FIRST, PERSONAL CHAT SECOND */}
            <View style={styles.socialButtonsContainer}>
              {isLoadingWhatsAppData ? (
                <ActivityIndicator size="large" color="#25D366" />
              ) : (
                <>
                  {/* Group Links FIRST (moved above) */}
                  {groupLinks.map((group, index) => {
                    console.log('👥 Rendering Group Link:', group);
                    return (
                      <TouchableOpacity
                        key={group.id || index}
                        style={[styles.socialButton, styles.whatsappGroupButton]}
                        onPress={() => openGroupLink(group.link)}>
                        <View style={styles.socialIconContainer}>
                          <Ionicons name="people-outline" size={28} color="#FFFFFF" />
                        </View>
                        <View style={styles.socialTextContainer}>
                          <Text style={styles.socialButtonText}>Join Group</Text>
                          <Text style={styles.socialButtonSubtext}>
                            {group.groupName}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    );
                  })}

                  {/* Personal Chat Option SECOND (moved below) */}
                  <TouchableOpacity
                    style={[styles.socialButton, styles.whatsappPersonalButton]}
                    onPress={openPersonalChat}
                    disabled={!personalChatNumber}>
                    <View style={styles.socialIconContainer}>
                      <Ionicons name="chatbubble-outline" size={28} color="#FFFFFF" />
                    </View>
                    <View style={styles.socialTextContainer}>
                      <Text style={styles.socialButtonText}>Personal Chat</Text>
                      <Text style={styles.socialButtonSubtext}>
                        Direct message for queries
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={hideWhatsAppPopup}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Footer height={footerHeight} />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  timer: {
    marginTop: 10,
    marginHorizontal: '3%',
    marginBottom: '3%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  timerBadge: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
  },
  timerLabel: {
    color: '#00695C',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  timerTextContainer: {
    flex: 1,
    height: 34,
    justifyContent: 'center',
  },
  timertext: {
    fontSize: 14,
    color: 'red',
    fontWeight: '500',
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  gridContainer: {
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  menuItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuImage: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  // Modal and Popup Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  popupContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  popupHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  popupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  popupSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  socialButtonsContainer: {
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instagramButton: {
    backgroundColor: '#E4405F',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
  },
  whatsappPersonalButton: {
    backgroundColor: '#128C7E',
  },
  whatsappGroupButton: {
    backgroundColor: '#25D366',
  },
  socialIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  socialTextContainer: {
    flex: 1,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  socialButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C757D',
  },
});

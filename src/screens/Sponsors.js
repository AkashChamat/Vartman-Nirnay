import { StyleSheet, Text, View, Image, ActivityIndicator, Dimensions, TouchableOpacity, Alert, ScrollView } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import Carousel from 'react-native-reanimated-carousel';
import { sponsor, sponsorpdf, sponsortitle } from '../util/apiCall';
import { useNavigation } from '@react-navigation/native';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import Icon from 'react-native-vector-icons/MaterialIcons';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const Sponsors = () => {
  const navigation = useNavigation();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [title, setTitle] = useState('Champion Series Prize Distribution'); // Default title
  const [titleLoading, setTitleLoading] = useState(true);
  const carouselRef = useRef(null);
  
  // Add this ref to track if we're manually navigating
  const isManualNavigation = useRef(false);

  useEffect(() => {
    fetchSponsors();
    fetchTitle();
  }, []);

  const fetchTitle = async () => {
    try {
      setTitleLoading(true);
      const response = await sponsortitle();
      if (response && response.length > 0) {
        // Assuming the API returns an array with title object
        const titleData = response[0];
        if (titleData.title) {
          setTitle(titleData.title);
        }
      }
    } catch (err) {
      console.error('Error fetching title:', err);
      // Keep default title if API fails
    } finally {
      setTitleLoading(false);
    }
  };

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const response = await sponsor();
      setSponsors(response);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching sponsors:', err);
      setError('Failed to fetch sponsors');
      setLoading(false);
    }
  };

  // PDF viewing logic similar to Gallery component
  const handleViewSponsorPDF = async () => {
    try {
      setPdfLoading(true);
      const response = await sponsorpdf();
      
      if (response && Array.isArray(response) && response.length > 0) {
        const pdfData = response[0];
        
        if (!pdfData.pdf) {
          Alert.alert('Error', 'PDF not available');
          return;
        }

        navigation.navigate('PdfViewer', {
          pdfUrl: pdfData.pdf,
          title: pdfData.description || 'Champion Series Prize Distribution',
        });
      } else {
        Alert.alert('Error', 'No PDF data available');
      }
    } catch (error) {
      console.error('Error fetching PDF:', error);
      Alert.alert('Error', 'Failed to load PDF. Please try again later.');
    } finally {
      setPdfLoading(false);
    }
  };

  // Improved onSnapToItem handler for better synchronization
  const handleSnapToItem = (index) => {
    if (sponsors.length === 0) return;
    
    // Handle looping properly
    let normalizedIndex = index;
    if (index < 0) {
      normalizedIndex = sponsors.length - 1;
    } else if (index >= sponsors.length) {
      normalizedIndex = 0;
    } else {
      normalizedIndex = index % sponsors.length;
    }
    
    setCurrentIndex(normalizedIndex);
    
    setTimeout(() => {
      isManualNavigation.current = false;
    }, 50);
  };

  const handleDotPress = (index) => {
    if (carouselRef.current && sponsors.length > 0 && index !== currentIndex) {
      isManualNavigation.current = true;
      setCurrentIndex(index);
      carouselRef.current.scrollTo({ index, animated: true });
    }
  };

  const renderSponsorCard = ({ item, index }) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.sponsorImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.sponsorName} numberOfLines={2}>
            {item.sponsorName}
          </Text>
          {item.month && item.year && (
            <Text style={styles.sponsorPeriod}>
              {item.month} {item.year}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {sponsors.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dot,
            index === currentIndex ? styles.activeDot : styles.inactiveDot
          ]}
          onPress={() => handleDotPress(index)}
          activeOpacity={0.7}
        />
      ))}
    </View>
  );

  if (loading || titleLoading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0288D1" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <Footer />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{title}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => {
            fetchSponsors();
            fetchTitle();
          }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <Footer />
      </View>
    );
  }

  if (sponsors.length === 0) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{title}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No sponsors found</Text>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{title}</Text>
        </View>
        
        <View style={styles.carouselContainer}>
          <Carousel
            ref={carouselRef}
            width={windowWidth}
            height={windowHeight * 0.5} // Reduced from 0.7 to 0.5
            data={sponsors}
            renderItem={renderSponsorCard}
            autoPlay={autoPlay}
            autoPlayInterval={1200}
            scrollAnimationDuration={300}
            onSnapToItem={handleSnapToItem}
            loop={true}
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.85,
              parallaxScrollingOffset: 60,
              parallaxAdjacentItemScale: 0.75,
            }}
            customConfig={() => ({ type: 'positive', viewCount: 1 })}
            withAnimation={{
              type: 'spring',
              config: {
                damping: 18,
                stiffness: 120,
                mass: 0.8,
              },
            }}
            enabled={true}
            panGestureHandlerProps={{
              activeOffsetX: [-15, 15],
              failOffsetY: [-5, 5],
            }}
            defaultIndex={0}
            windowSize={3}
          />
          
          {/* Dots container */}
          {sponsors.length > 1 && renderDots()}
        </View>

        <View style={styles.pdfSection}>
          <Text style={styles.pdfSectionTitle}>Prize Distribution PDF Gallery</Text>
          <TouchableOpacity
            style={styles.pdfButton}
            onPress={handleViewSponsorPDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="picture-as-pdf" size={18} color="#fff" />
            )}
            <Text style={styles.pdfButtonText}>
              {pdfLoading ? 'Loading...' : 'VIEW'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add some extra padding at the bottom for better scrolling */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      <Footer />
    </View>
  );
};

export default Sponsors;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerContainer: {
    backgroundColor: '#0288D1',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  carouselContainer: {
    position: 'relative',
    marginBottom: 20, // Add margin to separate from PDF section
  },
  cardContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    width: windowWidth * 0.90, 
    height: windowHeight * 0.49, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: windowHeight * 0.35, 
    backgroundColor: '#fff',
    padding: 8, 
  },
  sponsorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  detailsContainer: {
    padding: 12, 
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  sponsorName: {
    fontSize: 13, 
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4, // Reduced from 5 to 4
  },
  sponsorPeriod: {
    fontSize: 11, // Reduced from 12 to 11
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '500',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom:-5, // Adjusted position
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dot: {
    marginHorizontal: 4, 
    borderRadius: 50,
  },
  activeDot: {
    width: 8, 
    height: 8,
    backgroundColor: '#0288D1',
    transform: [{ scale: 1.2 }], 
  },
  inactiveDot: {
    width: 6, 
    height: 6,
    backgroundColor: '#bdc3c7',
    opacity: 0.6,
  },
  // PDF Section Styles - Row Layout
  pdfSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  pdfSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    flex: 1,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0288D1',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    minWidth: 80,
    justifyContent: 'center',
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  bottomPadding: {
    height: 50, // Extra padding for better scrolling experience
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#0288D1',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#f8f9fa',
    minHeight: 200,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
 
  retryButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
});
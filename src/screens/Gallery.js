import {
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  
} from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
import Carousel from 'react-native-reanimated-carousel';
import {winner, winnerpdf, winnertitle} from '../util/apiCall';
import {useNavigation} from '@react-navigation/native';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { showErrorMessage } from '../Components/SubmissionMessage';


const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const Gallery = () => {
  const navigation = useNavigation();
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [title, setTitle] = useState("Champion Series Winner's Gallery"); // Default title
  const [titleLoading, setTitleLoading] = useState(true);
  const carouselRef = useRef(null);

  // Add ref to track manual navigation
  const isManualNavigation = useRef(false);

  useEffect(() => {
    fetchWinners();
    fetchTitle();
  }, []);

  const fetchTitle = async () => {
    try {
      setTitleLoading(true);
      const response = await winnertitle();
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

  const fetchWinners = async () => {
    try {
      setLoading(true);
      const response = await winner();
      setWinners(response);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch winners');
      setLoading(false);
      console.error('Error fetching winners:', err);
    }
  };

  // PDF viewing logic similar to EPapers component
  const handleViewWinnerPDF = async () => {
    try {
      setPdfLoading(true);
      const response = await winnerpdf();

      if (response && Array.isArray(response) && response.length > 0) {
        const pdfData = response[0];

        if (!pdfData.pdf) {
          showErrorMessage('Error', 'PDF not available');

          return;
        }

        navigation.navigate('PdfViewer', {
          pdfUrl: pdfData.pdf,
          title: pdfData.description || 'Winner PDF Gallery',
        });
      } else {
        showErrorMessage('Error', 'PDF not available');
      }
    } catch (error) {
      console.error('Error fetching PDF:', error);
      showErrorMessage('Error', 'Failed to load PDF. Please try again later.');
    } finally {
      setPdfLoading(false);
    }
  };

  const cleanText = text => {
    if (!text) return '';
    return text.replace(/^"(.*)"$/, '$1');
  };

  // Improved dot press handler for better synchronization
  const handleDotPress = index => {
    if (carouselRef.current && winners.length > 0 && index !== currentIndex) {
      isManualNavigation.current = true;
      setCurrentIndex(index);
      carouselRef.current.scrollTo({index, animated: true});
    }
  };

  // Improved onSnapToItem handler for better synchronization
  const handleSnapToItem = index => {
    if (winners.length === 0) return;

    // Handle looping properly
    let normalizedIndex = index;
    if (index < 0) {
      normalizedIndex = winners.length - 1;
    } else if (index >= winners.length) {
      normalizedIndex = 0;
    } else {
      normalizedIndex = index % winners.length;
    }

    setCurrentIndex(normalizedIndex);

    // Reset manual navigation flag after a short delay
    setTimeout(() => {
      isManualNavigation.current = false;
    }, 50);
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {winners.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.activeDot : styles.inactiveDot,
            ]}
            onPress={() => handleDotPress(index)}
            activeOpacity={0.7}
          />
        ))}
      </View>
    );
  };

  const renderWinnerCard = ({item: currentWinner}) => (
    <View style={styles.cardContainer}>
      <View style={styles.winnerCard}>
        <View style={styles.imageContainer}>
          <Image
            source={{uri: currentWinner.image}}
            style={styles.winnerImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.winnerName}>{currentWinner.winnerName}</Text>

          <View style={styles.testimonialContainer}>
            <ScrollView
              style={styles.testimonialScrollView}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              bounces={true}>
              <Text style={styles.testimonialText}>
                {cleanText(currentWinner.ankName) ||
                  `${currentWinner.winnerName} was recognized as the winner for ${currentWinner.month} ${currentWinner.year}.`}
              </Text>
            </ScrollView>
          </View>
        </View>
      </View>
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
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              fetchWinners();
              fetchTitle();
            }}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <Footer />
      </View>
    );
  }

  if (winners.length === 0) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{title}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No winners found</Text>
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
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        bounces={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>{title}</Text>
        </View>

        <View style={styles.carouselContainer}>
          <Carousel
            ref={carouselRef}
            data={winners}
            renderItem={renderWinnerCard}
            width={windowWidth}
            height={windowHeight * 0.45} // Reduced from 0.6 to 0.45
            autoPlay={autoPlay}
            autoPlayInterval={1200}
            scrollAnimationDuration={300}
            loop={true}
            pagingEnabled={true}
            snapEnabled={true}
            onSnapToItem={handleSnapToItem}
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.9,
              parallaxScrollingOffset: 50,
            }}
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

          {/* Dots positioned below carousel */}
          {winners.length > 1 && renderDots()}
        </View>

        <View style={styles.pdfSection}>
          <Text style={styles.pdfSectionTitle}>Winner PDF Gallery</Text>
          <TouchableOpacity
            style={styles.pdfButton}
            onPress={handleViewWinnerPDF}
            disabled={pdfLoading}>
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
      </ScrollView>
      <Footer />
    </View>
  );
};

export default Gallery;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 30, // Increased padding for better scrolling
  },
  carouselContainer: {
    marginBottom: 15,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  headerContainer: {
    backgroundColor: '#0288D1',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 15,
    marginVertical: 10,
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  winnerCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: windowHeight * 0.25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  winnerImage: {
    width: '65%',
    height: '96%',
  },
  detailsContainer: {
    flex: 1,
    padding: 12,
    backgroundColor: 'white',
  },
  winnerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0288D1',
    textAlign: 'center',
    marginBottom: 8,
  },
  testimonialContainer: {
    flex: 1,
    marginTop: 6,
  },
  testimonialScrollView: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    padding: 8,
    maxHeight: 100,
  },
  testimonialText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    textAlign: 'justify',
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dot: {
    borderRadius: 50,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    backgroundColor: '#0288D1',
    transform: [{scale: 1.2}],
  },
  inactiveDot: {
    width: 6,
    height: 6,
    backgroundColor: '#bdc3c7',
    opacity: 0.6,
  },
  pdfSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 15,
    marginVertical: 3,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
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

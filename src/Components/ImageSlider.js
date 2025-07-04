import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const ImageSlider = ({ images = [], isLoading = false, onImagePress }) => {
  const { width: windowWidth } = useWindowDimensions(); 
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  
  // Responsive sizing logic
  const isTablet = windowWidth >= 768;
  const sliderWidth = windowWidth - (isTablet ? 40 : 10); // More margin on tablets
  
  // Dynamic height calculation
  const getSliderHeight = () => {
    if (isTablet) {
      // For tablets, use a larger height with aspect ratio
      return Math.min(250, windowWidth * 0.35);
    } else {
      // For mobile, use smaller height
      return Math.min(180, windowWidth * 0.45);
    }
  };
  
  const sliderHeight = getSliderHeight();
  
  const fallbackImage = require('../assets/packages.png'); 

  useEffect(() => {
    setHasError(false);
  }, [images]);

  if (hasError) {
    return (
      <View style={[styles.errorContainer, { height: sliderHeight, width: sliderWidth, marginHorizontal: isTablet ? 20 : 5 }]}>
        <Image source={fallbackImage} style={styles.placeholderImage} resizeMode="contain" />
        <Text style={styles.errorText}>Image slider unavailable at the moment</Text>
      </View>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { height: sliderHeight, width: sliderWidth, marginHorizontal: isTablet ? 20 : 5 }]}>
        <ActivityIndicator size="large" color="#0288D1" />
      </View>
    );
  }

  // Show placeholder if no images
  if (!images || images.length === 0) {
    return (
      <View style={[styles.noImagesContainer, { height: sliderHeight, width: sliderWidth, marginHorizontal: isTablet ? 20 : 5 }]}>
        <Image source={fallbackImage} style={styles.placeholderImage} resizeMode="contain" />
      </View>
    );
  }

  const renderItem = ({ item, index }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onImagePress && onImagePress(item, index)}
        style={[styles.slide, { width: sliderWidth, height: sliderHeight }]}>
        <Image
          source={{ uri: item.thumbnailFile }}
          style={[styles.image, { borderRadius: isTablet ? 15 : 10 }]}
          resizeMode="contain" // Changed from 'contain' to 'cover' for better visual
          onError={() => {
          }}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { marginHorizontal: isTablet ? 20 : 5 }]}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.carouselContainer, { height: sliderHeight }]}>
          <Carousel
            loop
            width={sliderWidth}
            height={sliderHeight}
            autoPlay={images.length > 1}
            data={images}
            scrollAnimationDuration={500}
            autoPlayInterval={isTablet ? 2000 : 1500} // Slightly slower on tablets
            renderItem={renderItem}
            onSnapToItem={(index) => setActiveIndex(index)}
            onError={() => setHasError(true)}
          />
        </View>
      </GestureHandlerRootView>
      
      {/* Optional: Add dots indicator for better UX */}
      {images.length > 1 && (
        <View style={styles.dotsContainer}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index === activeIndex ? '#0288D1' : '#E0E0E0',
                  width: isTablet ? 10 : 8,
                  height: isTablet ? 10 : 8,
                }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    alignItems: 'center',
  },
  carouselContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
  },
  noImagesContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    opacity: 0.7,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
  },
  errorText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    borderRadius: 5,
    marginHorizontal: 3,
  },
});

export default ImageSlider;
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Alert,
  Dimensions,
  
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { Packages as getPackages } from '../util/apiCall';
import LinearGradient from 'react-native-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Get unique package types from the data for categories
  const getCategories = () => {
    if (!packages || packages.length === 0) {
      return ['All'];
    }
    const uniqueTypes = [...new Set(packages.map(pkg => pkg.packageType))];
    return ['All', ...uniqueTypes];
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getPackages();
      if (response && response.data) {
        setPackages(response.data);
      } else if (response && Array.isArray(response)) {
        // In case the API returns array directly
        setPackages(response);
      } else {
        setPackages([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError('Failed to load packages. Please try again.');
      setLoading(false);
      // Set empty packages array on error to show empty state
      setPackages([]);
    }
  };

  const getPackageGradient = (packageType) => {
    switch (packageType) {
      case 'Basic':
        return ['#4CAF50', '#45A049'];
      case 'Premium':
        return ['#FF9800', '#F57C00'];
      case 'Advanced':
        return ['#9C27B0', '#7B1FA2'];
      case 'EPaper':
        return ['#FF5722', '#D84315'];
      default:
        return ['#2196F3', '#1976D2'];
    }
  };

  const getPackageIcon = (packageType) => {
    switch (packageType) {
      case 'Basic':
        return 'school';
      case 'Premium':
        return 'star';
      case 'Advanced':
        return 'military-tech';
      case 'EPaper':
        return 'newspaper';
      default:
        return 'book';
    }
  };

  const filteredPackages = selectedCategory === 'All' 
    ? packages 
    : packages.filter(pkg => pkg.packageType === selectedCategory);

  const handlePurchasePackage = (packageData) => {
    const finalPrice = packageData.discount > 0 ? packageData.discountPrice : packageData.price;
    const savings = packageData.discount > 0 ? (packageData.price - packageData.discountPrice).toFixed(0) : 0;
    
    Alert.alert(
      '🛒 Purchase Package',
      `Ready to unlock your potential?\n\n"${packageData.packageName}"\n\nPrice: ₹${finalPrice}${savings > 0 ? `\nSave ₹${savings}!` : ''}`,
      [
        { text: 'Maybe Later', style: 'cancel' },
        { 
          text: 'Purchase Now', 
          style: 'default',
          onPress: () => {
            // Add your purchase logic here
          }
        }
      ]
    );
  };

  const renderCategoryFilter = () => {
    const categories = getCategories();
    
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.categoryTabActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderPackageItem = ({ item, index }) => (
    <View style={[styles.packageCard, { marginTop: index === 0 ? 0 : 20 }]}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={getPackageGradient(item.packageType)}
        style={styles.packageHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.packageHeaderContent}>
          <View style={styles.packageIconContainer}>
            {item.image ? (
              <Image 
                source={{ uri: item.image }} 
                style={styles.packageImage}
                resizeMode="cover"
              />
            ) : (
              <MaterialIcons 
                name={getPackageIcon(item.packageType)} 
                size={24} 
                color="#fff" 
              />
            )}
          </View>
          <View style={styles.packageTypeContainer}>
            <Text style={styles.packageType}>{item.packageType}</Text>
            <Text style={styles.packageName}>{item.packageName}</Text>
          </View>
          <View style={styles.validityBadge}>
            <MaterialIcons name="schedule" size={14} color="#fff" />
            <Text style={styles.validityText}>{item.validity}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <View style={styles.packageContent}>
        <Text style={styles.packageDescription}>{item.packageDescription}</Text>
        
        {/* Papers Preview */}
        <View style={styles.papersPreview}>
          <View style={styles.papersHeader}>
            <MaterialIcons name="library-books" size={18} color="#666" />
            <Text style={styles.papersTitle}>
              {item.papers.length} Paper{item.papers.length !== 1 ? 's' : ''} Included
            </Text>
          </View>
          
          <View style={styles.papersGrid}>
            {item.papers.slice(0, 3).map((paper, idx) => (
              <View key={paper.id} style={styles.paperChip}>
                <MaterialIcons name="description" size={12} color="#42A5F5" />
                <Text style={styles.paperChipText} numberOfLines={1}>
                  {paper.paperName}
                </Text>
              </View>
            ))}
            {item.papers.length > 3 && (
              <View style={[styles.paperChip, styles.morePapersChip]}>
                <Text style={styles.morePapersText}>+{item.papers.length - 3}</Text>
              </View>
            )}
          </View>
        </View>



        {/* Pricing */}
        <View style={styles.pricingContainer}>
          <View style={styles.priceInfo}>
            {item.discount > 0 ? (
              <>
                <View style={styles.priceRow}>
                  <Text style={styles.originalPrice}>₹{item.price}</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{item.discount}% OFF</Text>
                  </View>
                </View>
                <Text style={styles.finalPrice}>₹{item.discountPrice}</Text>
                <Text style={styles.savings}>
                  You save ₹{(item.price - item.discountPrice).toFixed(0)}
                </Text>
              </>
            ) : (
              <Text style={styles.finalPrice}>₹{item.price}</Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.purchaseButton}
            onPress={() => handlePurchasePackage(item)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#42A5F5', '#1976D2']}
              style={styles.purchaseButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="shopping-cart" size={20} color="#fff" />
              <Text style={styles.purchaseButtonText}>Buy Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <MaterialIcons name="shopping-bag" size={80} color="#E0E0E0" />
      </View>
      <Text style={styles.emptyTitle}>No Packages Found</Text>
      <Text style={styles.emptySubtitle}>
        {selectedCategory === 'All' 
          ? "We're preparing amazing packages for you. Check back soon!"
          : `No ${selectedCategory} packages available right now.`
        }
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={fetchPackages}>
        <MaterialIcons name="refresh" size={20} color="#42A5F5" />
        <Text style={styles.emptyButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <MaterialIcons name="error-outline" size={80} color="#f44336" />
      </View>
      <Text style={styles.emptyTitle}>Oops! Something went wrong</Text>
      <Text style={styles.emptySubtitle}>{error}</Text>
      <TouchableOpacity style={styles.emptyButton} onPress={fetchPackages}>
        <MaterialIcons name="refresh" size={20} color="#42A5F5" />
        <Text style={styles.emptyButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#42A5F5" />
          <Text style={styles.loadingText}>Loading packages...</Text>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      
      {/* Hero Section */}
      <LinearGradient
        colors={['#42A5F5', '#1976D2']}
        style={styles.heroSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.heroTitle}>Study Packages</Text>
        <Text style={styles.heroSubtitle}>Choose your perfect learning companion</Text>
      </LinearGradient>

      <View style={styles.content}>
        {renderCategoryFilter()}
        
        {error ? (
          renderErrorState()
        ) : filteredPackages.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlatList
            data={filteredPackages}
            renderItem={renderPackageItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.packagesList}
            ItemSeparatorComponent={null}
          />
        )}
      </View>
      <Footer />
    </View>
  );
};

export default Packages;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFF',
  },
  heroSection: {
    paddingHorizontal: 13,
    paddingVertical: 20,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  categoryContainer: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    maxHeight: 70,
  },
  categoryContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    height: 35,
  },
  categoryTabActive: {
    backgroundColor: '#42A5F5',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  packagesList: {
    padding: 20,
    paddingTop: 20,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  packageHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  packageHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  packageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  packageImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  packageTypeContainer: {
    flex: 1,
  },
  packageType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  packageName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 2,
  },
  validityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  validityText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
  packageContent: {
    padding: 20,
  },
  packageDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 20,
  },
  papersPreview: {
    marginBottom: 20,
  },
  papersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  papersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  papersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paperChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: (screenWidth - 80) / 2,
  },
  paperChipText: {
    fontSize: 11,
    color: '#42A5F5',
    marginLeft: 4,
    fontWeight: '500',
  },
  morePapersChip: {
    backgroundColor: '#E8E8E8',
  },
  morePapersText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },

  pricingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  finalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  savings: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  purchaseButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 15,
  },
  purchaseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#42A5F5',
  },
  emptyButtonText: {
    color: '#42A5F5',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
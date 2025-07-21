import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {useNavigation} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import DropDownPicker from 'react-native-dropdown-picker';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import {getAllMaterials, materialtype} from '../util/apiCall';
import { showErrorMessage } from '../Components/SubmissionMessage';


const {width, height} = Dimensions.get('window');

// Color Palette - Beautiful and Modern
const COLORS = {
  primary: '#667EEA', // Beautiful gradient blue
  secondary: '#764BA2', // Rich purple
  success: '#48BB78', // Fresh green
  warning: '#ED8936', // Warm orange
  background: '#F7FAFC', // Light blue-gray background
  surface: '#FFFFFF',
  accent: '#9F7AEA', // Soft purple
  cardBorder: '#E2E8F0', // Subtle card border
  text: {
    primary: '#2D3748',
    secondary: '#4A5568',
    light: '#718096',
  },
  shadow: 'rgba(0, 0, 0, 0.12)',
};

const Ebook = () => {
  const navigation = useNavigation();
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [selectedMaterialType, setSelectedMaterialType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [error, setError] = useState(null);

  // Dropdown state
  const [open, setOpen] = useState(false);
  const [dropdownItems, setDropdownItems] = useState([
    {label: 'All Materials', value: 'all'},
  ]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [materials, selectedMaterialType]);

  const fetchInitialData = async () => {
    try {
      setError(null);
      // Fetch both materials and material types concurrently
      const [materialsResponse, typesResponse] = await Promise.all([
        getAllMaterials(),
        materialtype(),
      ]);

      setMaterials(materialsResponse || []);
      setMaterialTypes(typesResponse || []);
      updateDropdownItems(typesResponse || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message || 'Failed to fetch data');
showErrorMessage('Error', error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Update dropdown items when material types change
  const updateDropdownItems = materialTypesData => {
    const items = [
      {label: 'All Materials', value: 'all'},
      ...materialTypesData.map(type => ({
        label: type.materialtype,
        value: type.materialtype,
      })),
    ];
    setDropdownItems(items);
  };

  const filterMaterials = () => {
    if (selectedMaterialType === 'all') {
      setFilteredMaterials(materials);
    } else {
      const filtered = materials.filter(
        material =>
          material.materialType?.toLowerCase() ===
          selectedMaterialType.toLowerCase(),
      );
      setFilteredMaterials(filtered);
    }
  };

  // Handle material type selection
  const handleMaterialTypeChange = materialTypeValue => {
    setSelectedMaterialType(materialTypeValue);
    filterMaterials();
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInitialData();
  };

  const handleViewPdf = (pdfUrl, title) => {
    if (!pdfUrl) {
showErrorMessage('Error', 'PDF file not available');
      return;
    }

    try {
      new URL(pdfUrl);
      setSelectedPdf({url: pdfUrl, title});
      setShowPdfModal(true);
    } catch (error) {
      showErrorMessage('Error', 'Invalid PDF URL format');

    }
  };

 const handleBuy = (item) => {
  navigation.navigate('PaymentScreen', {
    materialId: item.id,
    materialName: item.chapterName,
    amount: item.price,
  });
};

  const hasDemo = demoPdf => {
    return (
      demoPdf && demoPdf.trim() !== '' && demoPdf !== 'null' && demoPdf !== null
    );
  };

  const renderActionButtons = item => {
    const {status, pdfFile, demoPdf, price} = item;

    if (status === 'free') {
      return (
        <TouchableOpacity
          style={[styles.actionButton, styles.freeButton]}
          onPress={() => handleViewPdf(pdfFile, item.chapterName)}>
          <MaterialIcons name="visibility" size={16} color="#fff" />
          <Text style={styles.buttonText}>View Free</Text>
        </TouchableOpacity>
      );
    }

    if (status === 'paid') {
      const showDemo = hasDemo(demoPdf);

      return (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.buyButton,
              showDemo && styles.halfButton,
            ]}
            onPress={() => handleBuy(item)}>
            <Text style={styles.buttonText}>Get Access</Text>
          </TouchableOpacity>

          {showDemo && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.demoButton,
                styles.halfButton,
              ]}
              onPress={() =>
                handleViewPdf(demoPdf, `${item.chapterName} - Demo`)
              }>
              <MaterialIcons name="preview" size={16} color="#fff" />
              <Text style={styles.buttonText}>Demo</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return null;
  };

  const renderFilterDropdown = () => (
    <View style={styles.filterContainer}>
      <View style={styles.dropdownContainer}>
        <View style={{position: 'relative', zIndex: 3000}}>
          {(open || selectedMaterialType !== 'all') && (
            <Text style={styles.floatingLabelText}>Material Type</Text>
          )}
          <DropDownPicker
            open={open}
            value={selectedMaterialType}
            items={dropdownItems}
            setOpen={setOpen}
            setValue={setSelectedMaterialType}
            setItems={setDropdownItems}
            onChangeValue={handleMaterialTypeChange}
            placeholder="Select Material Type"
            placeholderStyle={styles.dropdownPlaceholder}
            style={styles.dropdown}
            textStyle={styles.dropdownText}
            dropDownContainerStyle={styles.dropdownList}
            zIndex={3000}
            zIndexInverse={1000}
            listItemContainerStyle={styles.listItemContainer}
            listItemLabelStyle={styles.listItemLabel}
            selectedItemContainerStyle={styles.selectedItemContainer}
            selectedItemLabelStyle={styles.selectedItemLabel}
            arrowIconStyle={styles.arrowIcon}
            tickIconStyle={styles.tickIcon}
            closeIconStyle={styles.closeIcon}
            searchable={false}
            theme="LIGHT"
            multiple={false}
          />
        </View>
      </View>
    </View>
  );

  const renderMaterialItem = ({item}) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {item.thumbnailFile ? (
          <Image source={{uri: item.thumbnailFile}} style={styles.cardImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons
              name="description"
              size={48}
              color={COLORS.text.light}
            />
          </View>
        )}

        {/* Material Type Badge */}
        {item.materialType && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.materialType}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.title} numberOfLines={2}>
          {item.chapterName}
        </Text>

        <Text style={styles.category}>
          {item.categoryName}
          {item.subcategoryName && ` • ${item.subcategoryName}`}
        </Text>

        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <MaterialIcons
              name="calendar-today"
              size={14}
              color={COLORS.text.light}
            />
            <Text style={styles.metaText}>
              {new Date(item.createdDate).toLocaleDateString()}
            </Text>
          </View>

          {item.validity > 0 && (
            <View style={styles.metaItem}>
              <MaterialIcons
                name="access-time"
                size={14}
                color={COLORS.warning}
              />
              <Text style={[styles.metaText, {color: COLORS.warning}]}>
                {item.validity} days
              </Text>
            </View>
          )}
        </View>

        {renderActionButtons(item)}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MaterialIcons
          name={selectedMaterialType === 'all' ? 'library-books' : 'search-off'}
          size={64}
          color={COLORS.text.light}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {selectedMaterialType === 'all'
          ? 'No Materials Available'
          : 'No Results Found'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedMaterialType === 'all'
          ? 'Check back later for new materials!'
          : `No ${selectedMaterialType} materials available. Try selecting a different type.`}
      </Text>
      {selectedMaterialType !== 'all' && (
        <TouchableOpacity
          style={styles.clearFilterButton}
          onPress={() => setSelectedMaterialType('all')}>
          <Text style={styles.clearFilterText}>Show All Materials</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MaterialIcons
          name="error-outline"
          size={64}
          color={COLORS.secondary}
        />
      </View>
      <Text style={styles.emptyTitle}>Something went wrong</Text>
      <Text style={styles.emptySubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchInitialData}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading Materials...</Text>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      <View style={styles.content}>
        {error ? (
          renderError()
        ) : (
          <>
            {renderFilterDropdown()}
            <FlatList
              data={filteredMaterials}
              renderItem={renderMaterialItem}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primary]}
                  tintColor={COLORS.primary}
                />
              }
              ListEmptyComponent={renderEmptyState}
            />
          </>
        )}
      </View>

      <Modal
        visible={showPdfModal}
        animationType="slide"
        onRequestClose={() => setShowPdfModal(false)}>
        <View style={styles.pdfModal}>
          <View style={styles.pdfHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPdfModal(false)}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.pdfTitle} numberOfLines={1}>
              {selectedPdf?.title || 'PDF Viewer'}
            </Text>
          </View>

          {selectedPdf && (
            <WebView
              source={{uri: selectedPdf.url}}
              style={styles.webView}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.webViewLoading}>
                  <ActivityIndicator size="large" color={'#0288D1'} />
                  <Text style={styles.loadingText}>Loading PDF...</Text>
                </View>
              )}
onError={() => showErrorMessage('Error', 'Failed to load PDF')}
            />
          )}
        </View>
      </Modal>

      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    zIndex: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#0288D1',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 120,
  },

  filterContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 3000,
  },
  dropdownContainer: {
    zIndex: 4000,
  },

  dropdown: {
    borderWidth: 1.5,
    borderColor: '#f5f5f5',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    minHeight: 50,
  },
  dropdownPlaceholder: {
    color: '#999',
    fontSize: 14,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    marginTop: 5,
    maxHeight: 200,
  },
  listItemContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listItemLabel: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  selectedItemContainer: {
    backgroundColor: '#EBF4FF',
  },
  selectedItemLabel: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  arrowIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.primary,
  },
  tickIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.primary,
  },
  closeIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.primary,
  },
  floatingLabelText: {
    position: 'absolute',
    top: -10,
    left: 12,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 6,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    zIndex: 9999,
  },

  // Card Styles
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#F8FAFC',
    overflow: 'hidden',
    
  },
  cardImage: {
    height: '97%',
    resizeMode: 'contain',
    margin:5
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },

 
  typeBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },

  // Content Styles
  cardContent: {
    padding: 20,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    lineHeight: 24,
  },
  category: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: -4,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.text.light,
    fontWeight: '500',
  },

  // Button Styles
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    flex: 1,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  halfButton: {
    flex: 1,
  },
  freeButton: {
    backgroundColor: COLORS.success,
  },
  buyButton: {
    backgroundColor: '#E53E3E', // Vibrant red for buy button
  },
  demoButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: height * 0.1,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    backgroundColor: '#EDF2F7',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearFilterButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  clearFilterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // PDF Modal
  pdfModal: {
    flex: 1,
    backgroundColor: '#000',
  },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.text.primary,
    paddingTop: height * 0.05,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  pdfTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    gap: 16,
  },
});

export default Ebook;

import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import {adsExamCategory, category} from '../util/apiCall';

const {width} = Dimensions.get('window');

const CategoryPicker = ({onCategoryChange, onExamCategoryChange}) => {
  // Commented out exam category related states
  // const [examCategories, setExamCategories] = useState([]);
  // const [loadingExamCategories, setLoadingExamCategories] = useState(false);
  // const [selectedExamCategory, setSelectedExamCategory] = useState(null);
  // const [examCategoryModalVisible, setExamCategoryModalVisible] = useState(false);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Static data for Weekly/Monthly ads
  const adsPeriods = [
    {id: 1, name: 'Weekly', value: 'weekly'},
    {id: 2, name: 'Monthly', value: 'monthly'},
  ];

  useEffect(() => {
    // fetchExamCategories(); // Commented out
    fetchCategories();
  }, []);

  // Commented out fetchExamCategories function
  // const fetchExamCategories = async () => {
  //   try {
  //     setLoadingExamCategories(true);
  //     const response = await adsExamCategory();
  //     if (response && Array.isArray(response)) {
  //       setExamCategories(response);
  //     } else {
  //       setError('Invalid exam categories response format');
  //     }
  //   } catch (err) {
  //     setError('Failed to fetch exam categories');
  //     console.error('Error fetching exam categories:', err);
  //   } finally {
  //     setLoadingExamCategories(false);
  //   }
  // };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await category();
      if (response && Array.isArray(response)) {
        setCategories(response);
      } else {
        setError('Invalid categories response format');
      }
    } catch (err) {
      setError('Failed to fetch categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Commented out exam category select handler
  // const handleExamCategorySelect = (item) => {
  //   setSelectedExamCategory(item);
  //   setExamCategoryModalVisible(false);
  //   if (onExamCategoryChange) {
  //     onExamCategoryChange(item);
  //   }
  // };

  const handleCategorySelect = item => {
    setSelectedCategory(item === selectedCategory ? null : item);
    if (onCategoryChange) {
      onCategoryChange(item === selectedCategory ? null : item);
    }
  };

  const resetFilters = () => {
    // setSelectedExamCategory(null); // Commented out
    setSelectedCategory(null);
    // if (onExamCategoryChange) {
    //   onExamCategoryChange(null);
    // }
    if (onCategoryChange) {
      onCategoryChange(null);
    }
  };

  // Commented out exam category modal
  // const renderExamCategoryModal = () => (
  //   <Modal
  //     animationType="slide"
  //     transparent={true}
  //     visible={examCategoryModalVisible}
  //     onRequestClose={() => setExamCategoryModalVisible(false)}
  //   >
  //     <View style={styles.modalOverlay}>
  //       <View style={styles.modalContent}>
  //         <Text style={styles.modalTitle}>Select Exam Category</Text>

  //         {loadingExamCategories ? (
  //           <ActivityIndicator size="small" color="#5B95C4" />
  //         ) : (
  //           <FlatList
  //             data={examCategories}
  //             keyExtractor={item => item.id.toString()}
  //             renderItem={({ item }) => (
  //               <TouchableOpacity
  //                 style={[
  //                   styles.modalItem,
  //                   selectedExamCategory?.id === item.id && styles.selectedModalItem
  //                 ]}
  //                 onPress={() => handleExamCategorySelect(item)}
  //               >
  //                 <Text
  //                   style={[
  //                     styles.modalItemText,
  //                     selectedExamCategory?.id === item.id && styles.selectedModalItemText
  //                   ]}
  //                 >
  //                   {item.adsExamCategory}
  //                 </Text>
  //               </TouchableOpacity>
  //             )}
  //           />
  //         )}

  //         <TouchableOpacity
  //           style={styles.modalCloseButton}
  //           onPress={() => setExamCategoryModalVisible(false)}
  //         >
  //           <Text style={styles.modalCloseButtonText}>Close</Text>
  //         </TouchableOpacity>
  //       </View>
  //     </View>
  //   </Modal>
  // );

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Weekly and Monthly Ads Buttons */}
      <View style={styles.filterRowContainer}>
        {loadingCategories ? (
          <ActivityIndicator
            size="small"
            color="#5B95C4"
            style={styles.loader}
          />
        ) : (
          <>
            {/* Weekly and Monthly Buttons */}
            {adsPeriods.map(item => (
              <TouchableOpacity
                key={item.id.toString()}
                style={[
                  styles.categoryButton,
                  selectedCategory?.id === item.id &&
                    styles.selectedCategoryButton,
                ]}
                onPress={() => handleCategorySelect(item)}>
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory?.id === item.id &&
                      styles.selectedCategoryButtonText,
                  ]}>
                  {item.name} Ads
                </Text>
              </TouchableOpacity>
            ))}

            {/* Commented out Exam Category Picker */}
            {/* <TouchableOpacity 
              style={styles.examPickerButton}
              onPress={() => setExamCategoryModalVisible(true)}
            >
              <Text style={styles.examPickerButtonText} numberOfLines={1} ellipsizeMode="tail">
                {selectedExamCategory ? selectedExamCategory.adsExamCategory : 'Exam Category'}
              </Text>
            </TouchableOpacity> */}

            {/* Reset Button */}
            {selectedCategory && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetFilters}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Commented out exam category modal */}
      {/* {renderExamCategoryModal()} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginVertical: 6,
  },
  errorText: {
    color: '#E53E3E',
    textAlign: 'center',
    marginBottom: 8,
  },
  loader: {
    marginVertical: 8,
  },
  filterRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  },
  categoryButton: {
    backgroundColor: '#F7FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    paddingVertical: 9,
    marginRight: 8,
    alignItems: 'center',
    flex: 1,
  },
  selectedCategoryButton: {
    backgroundColor: '#5B95C4',
    borderColor: '#5B95C4',
  },
  categoryButtonText: {
    fontSize: 11,
    color: '#4A5568',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Commented out exam picker button styles
  // examPickerButton: {
  //   backgroundColor: '#fff',
  //   borderRadius: 6,
  //   borderWidth: 1,
  //   borderColor: '#CBD5E0',
  //   paddingVertical: 7,
  //   paddingHorizontal: 10,
  //   flex: 1.5,
  //   marginRight: 4,
  //   elevation: 1,
  // },
  // examPickerButtonText: {
  //   color: '#4A5568',
  //   fontSize: 10,
  //   textAlign: 'center',
  // },
  resetButton: {
    backgroundColor: '#FF7B69',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    justifyContent: 'center',
    marginLeft: 4,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Commented out modal styles
  // modalOverlay: {
  //   flex: 1,
  //   backgroundColor: 'rgba(0, 0, 0, 0.5)',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  // },
  // modalContent: {
  //   backgroundColor: '#fff',
  //   width: width * 0.85,
  //   maxHeight: '70%',
  //   borderRadius: 16,
  //   padding: 20,
  //   elevation: 5,
  // },
  // modalTitle: {
  //   fontSize: 16,
  //   fontWeight: 'bold',
  //   color: '#2D3748',
  //   marginBottom: 12,
  //   textAlign: 'center',
  // },
  // modalItem: {
  //   paddingVertical: 8,
  //   paddingHorizontal: 12,
  //   borderBottomWidth: 1,
  //   borderBottomColor: '#E2E8F0',
  // },
  // selectedModalItem: {
  //   backgroundColor: '#EBF8FF',
  // },
  // modalItemText: {
  //   fontSize: 14,
  //   color: '#4A5568',
  // },
  // selectedModalItemText: {
  //   color: '#5B95C4',
  //   fontWeight: 'bold',
  // },
  // modalCloseButton: {
  //   backgroundColor: '#5B95C4',
  //   borderRadius: 8,
  //   paddingVertical: 8,
  //   marginTop: 12,
  //   alignItems: 'center',
  // },
  // modalCloseButtonText: {
  //   color: '#fff',
  //   fontSize: 14,
  //   fontWeight: '600',
  // },
});

export default CategoryPicker;

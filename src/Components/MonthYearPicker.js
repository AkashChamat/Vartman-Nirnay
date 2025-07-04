import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions
} from 'react-native';

const { width } = Dimensions.get('window');

const MonthYearPicker = ({ onMonthYearChange }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (selectedMonth !== null && selectedYear !== null) {
      onMonthYearChange({ month: selectedMonth, year: selectedYear });
    }
  }, [selectedMonth, selectedYear]);

  const handleMonthSelect = (month, index) => {
    setSelectedMonth(index);
    setIsMonthPickerVisible(false);
    setModalVisible(false);
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setModalVisible(false);
  };

  const openMonthPicker = () => {
    setIsMonthPickerVisible(true);
    setModalVisible(true);
  };

  const openYearPicker = () => {
    setIsMonthPickerVisible(false);
    setModalVisible(true);
  };

  const renderMonthItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.pickerItem,
        selectedMonth === index && styles.selectedPickerItem
      ]}
      onPress={() => handleMonthSelect(item, index)}
    >
      <Text style={[
        styles.pickerItemText,
        selectedMonth === index && styles.selectedPickerItemText
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderYearItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.pickerItem,
        selectedYear === item && styles.selectedPickerItem
      ]}
      onPress={() => handleYearSelect(item)}
    >
      <Text style={[
        styles.pickerItemText,
        selectedYear === item && styles.selectedPickerItemText
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.pickerRow}>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={openMonthPicker}
        >
          <Text style={styles.pickerButtonText}>
            {selectedMonth !== null ? months[selectedMonth] : 'Select Month'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pickerButton}
          onPress={openYearPicker}
        >
          <Text style={styles.pickerButtonText}>
            {selectedYear !== null ? selectedYear : 'Select Year'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isMonthPickerVisible ? 'Select Month' : 'Select Year'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={isMonthPickerVisible ? months : years}
              renderItem={isMonthPickerVisible ? renderMonthItem : renderYearItem}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.pickerList}
              showsVerticalScrollIndicator={false}
              numColumns={3}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: '2%',
    marginBottom: '2%',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: '3%',
  },
  pickerButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerButtonText: {
    color: '#5B95C4',
    fontWeight: '500',
    fontSize: 10,
    padding:2
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 16,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D3748',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#4A5568',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  pickerList: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  pickerItem: {
    width: (width * 0.9 - 32) / 3,
    paddingVertical: 12,
    paddingHorizontal: 8,
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPickerItem: {
    backgroundColor: '#5B95C4',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '700',
  },
  selectedPickerItemText: {
    color: '#fff',
    fontWeight: '600',
  }
});

export default MonthYearPicker;
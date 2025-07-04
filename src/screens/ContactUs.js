import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, SafeAreaView } from 'react-native';
import React, { useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { contactus, logAPI } from '../util/apiCall'; 
import Header from '../Components/Header';
import Footer from '../Components/Footer';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    category: 'UPSC',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prevState => ({
      ...prevState,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) {
      errors.push('Name is required');
    }
    
    if (!formData.phone.trim()) {
      errors.push('Phone number is required');
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      errors.push('Phone number must be exactly 10 digits');
    }
    
    if (!formData.message.trim()) {
      errors.push('Message is required');
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      Alert.alert('Validation Error', validationErrors.join('\n'));
      return;
    }

    const payload = {
      name: formData.name.trim(),
      phoneNumber: formData.phone.trim(),
      adsExamCategory: formData.category,
      message: formData.message.trim()
    };

    setIsSubmitting(true);

    try {
      const startTime = Date.now();
      const response = await contactus(payload);
      const endTime = Date.now();

      Alert.alert(
        'Success', 
        'Your message has been sent successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setFormData({
                name: '',
                phone: '',
                category: 'UPSC',
                message: ''
              });
            }
          }
        ]
      );

    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          Alert.alert('Invalid Data', 'Please check your input and try again.');
        } else if (error.response.status === 500) {
          Alert.alert('Server Error', 'Something went wrong on our end. Please try again later.');
        } else {
          Alert.alert('Error', error.response.data?.message || 'Failed to send message. Please try again.');
        }
      } else if (error.request) {
        Alert.alert('Network Error', 'Unable to connect to server. Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <Header />
      
      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Contact Us</Text>
          <Text style={styles.subtitle}>
            Get in touch for queries & assistance
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          
          {/* Email and Phone in a row */}
          <View style={styles.contactRow}>
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>vartmannirnay@gmail.com</Text>
            </View>
            
            <View style={styles.contactItem}>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>+91 9028596157</Text>
            </View>
          </View>

          {/* Address and Hours in two columns */}
          <View style={styles.infoRow}>
            <View style={styles.infoColumn}>
              <Text style={styles.contactLabel}>Address</Text>
              <Text style={styles.contactValue}>
                Mudrak Bhaskar Printing Press{'\n'}
                Plot D-181, Shendra MIDC{'\n'}
                Aurangabad, Maharashtra
              </Text>
            </View>
            
            <View style={styles.infoColumn}>
              <Text style={styles.contactLabel}>Hours</Text>
              <Text style={styles.contactValue}>Mon-Fri: 9 AM - 6 PM</Text>
              <Text style={styles.contactValue}>Sat: 10 AM - 2 PM</Text>
              <Text style={styles.contactValueSmall}>Response within 2 days</Text>
            </View>
          </View>
        </View>

        {/* Contact Form */}
        <View style={styles.formSection}>
          <Text style={styles.formTitle}>Send Message</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={formData.name}
              onChangeText={(text) => handleInputChange('name', text)}
              editable={!isSubmitting}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit phone number"
              value={formData.phone}
              onChangeText={(text) => handleInputChange('phone', text)}
              keyboardType="phone-pad"
              maxLength={10}
              editable={!isSubmitting}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.category}
                style={styles.picker}
                onValueChange={(itemValue) => handleInputChange('category', itemValue)}
                enabled={!isSubmitting}
              >
                <Picker.Item label="UPSC" value="UPSC" />
                <Picker.Item label="MPSC" value="MPSC" />
                <Picker.Item label="Saralseva" value="Saralseva" />
                <Picker.Item label="Railway" value="Railway" />
                <Picker.Item label="Army Bharti" value="Army Bharti" />
                <Picker.Item label="SSC Exam" value="SSC Exam" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              placeholder="Type your message here..."
              value={formData.message}
              onChangeText={(text) => handleInputChange('message', text)}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSubmitting}
              placeholderTextColor="#999"
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Footer */}
      <Footer />
    </SafeAreaView>
  );
};

export default ContactUs;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
    textAlign: 'center',
  },
  contactSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  contactItem: {
    flex: 1,
    marginRight: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f4',
  },
  infoColumn: {
    flex: 1,
    marginRight: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 11.5, 
    color: '#1a1a1a',
    lineHeight: 16, 
  },
  contactValueSmall: {
    fontSize: 12,
    color: '#6c757d',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  formSection: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom:50
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1a1a1a',
  },
  messageInput: {
    height: 100,
    paddingTop: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 48,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#adb5bd',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {register as registerAPI} from '../util/apiCall';

const {width} = Dimensions.get('window');

const RegistrationForm = ({onSwitchToLogin, loading, setLoading}) => {
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    contact: '',
    examName: 'UPSC',
    password: '',
    confirmPassword: '',
    addresses: [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showAddressSection, setShowAddressSection] = useState(false);
  const [examDropdownVisible, setExamDropdownVisible] = useState(false);

  const isMountedRef = useRef(true);

  const examOptions = ['UPSC', 'SSC', 'Banking', 'Railway', 'Other'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleAddressChange = (index, field, value) => {
    const updatedAddresses = [...formData.addresses];
    updatedAddresses[index] = {...updatedAddresses[index], [field]: value};
    setFormData(prev => ({...prev, addresses: updatedAddresses}));
  };

  const addAddress = () => {
    const newAddress = {
      address: '',
      state: '',
      district: '',
      city: '',
      area: '',
      pincode: '',
      landmark: '',
    };
    setFormData(prev => ({
      ...prev,
      addresses: [...prev.addresses, newAddress],
    }));
  };

  const removeAddress = index => {
    const updatedAddresses = formData.addresses.filter((_, i) => i !== index);
    setFormData(prev => ({...prev, addresses: updatedAddresses}));
  };

  const toggleAddressSection = () => {
    setShowAddressSection(!showAddressSection);
    if (!showAddressSection && formData.addresses.length === 0) {
      addAddress();
    }
  };

  const validateForm = () => {
    const {userName, email, contact, password, confirmPassword} = formData;

    if (!userName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!contact.trim()) {
      Alert.alert('Error', 'Please enter your contact number');
      return false;
    }

    if (contact.length !== 10) {
      Alert.alert('Error', 'Contact number must be 10 digits');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (showAddressSection && formData.addresses.length > 0) {
      for (let i = 0; i < formData.addresses.length; i++) {
        const addr = formData.addresses[i];
        if (!addr.address.trim() || !addr.state.trim() || !addr.district.trim() || 
            !addr.city.trim() || !addr.pincode.trim()) {
          Alert.alert('Error', `Please fill all required fields in Address ${i + 1}`);
          return false;
        }
        if (addr.pincode.length !== 6) {
          Alert.alert('Error', `Pincode must be 6 digits in Address ${i + 1}`);
          return false;
        }
      }
    }

    return true;
  };

  const handleRegister = async () => {
    if (loading) return;

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        userName: formData.userName.trim(),
        email: formData.email.trim().toLowerCase(),
        contact: parseInt(formData.contact.trim()),
        examName: formData.examName,
        password: formData.password.trim(),
        confirmPassword: formData.confirmPassword.trim(),
        ...(showAddressSection && formData.addresses.length > 0
          ? {addresses: formData.addresses}
          : {addresses: []}),
      };

      const response = await registerAPI(payload);

      if (response?.status === 200 || response?.status === 201 || response?.success) {
        Alert.alert(
          'Success',
          'Registration successful! Please login with your credentials.',
          [
            {
              text: 'OK',
              onPress: () => {
                setFormData({
                  userName: '',
                  email: '',
                  contact: '',
                  examName: 'UPSC',
                  password: '',
                  confirmPassword: '',
                  addresses: [],
                });
                setShowAddressSection(false);
                onSwitchToLogin();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Registration failed. Please try again.';
      Alert.alert('Registration Failed', errorMessage);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const ExamDropdown = () => (
    <View style={styles.dropdownContainer}>
      {examOptions.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={styles.dropdownItem}
          onPress={() => {
            handleInputChange('examName', option);
            setExamDropdownVisible(false);
          }}>
          <Text style={styles.dropdownItemText}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.subheading}>Sign up to get started</Text>

        <Text style={styles.sectionTitle}>Basic Information</Text>

        <View style={styles.inputContainer}>
          <Icon name="person" size={22} color="#5B9EED" />
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            placeholderTextColor="#777"
            value={formData.userName}
            onChangeText={value => handleInputChange('userName', value)}
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="email" size={22} color="#5B9EED" />
          <TextInput
            style={styles.input}
            placeholder="Email *"
            placeholderTextColor="#777"
            value={formData.email}
            onChangeText={value => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="phone" size={22} color="#5B9EED" />
          <TextInput
            style={styles.input}
            placeholder="Contact *"
            placeholderTextColor="#777"
            value={formData.contact}
            onChangeText={value => handleInputChange('contact', value)}
            keyboardType="numeric"
            maxLength={10}
            editable={!loading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="school" size={22} color="#5B9EED" />
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setExamDropdownVisible(!examDropdownVisible)}
            disabled={loading}>
            <Text style={styles.dropdownButtonText}>{formData.examName}</Text>
            <Icon 
              name={examDropdownVisible ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
              size={22} 
              color="#5B9EED" 
            />
          </TouchableOpacity>
        </View>

        {examDropdownVisible && <ExamDropdown />}

        <View style={styles.inputContainer}>
          <Icon name="lock" size={22} color="#5B9EED" />
          <TextInput
            style={styles.input}
            placeholder="Password *"
            placeholderTextColor="#777"
            value={formData.password}
            onChangeText={value => handleInputChange('password', value)}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            disabled={loading}>
            <Icon
              name={showPassword ? 'visibility' : 'visibility-off'}
              size={22}
              color="#5B9EED"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock" size={22} color="#5B9EED" />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password *"
            placeholderTextColor="#777"
            value={formData.confirmPassword}
            onChangeText={value => handleInputChange('confirmPassword', value)}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleAddressSection}
          disabled={loading}>
          <Icon 
            name={showAddressSection ? "remove" : "add"} 
            size={20} 
            color="#5B9EED" 
          />
          <Text style={styles.toggleButtonText}>
            {showAddressSection ? 'Hide Address' : 'Add Address (Optional)'}
          </Text>
        </TouchableOpacity>

        {showAddressSection && (
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Address Information</Text>
            
            {formData.addresses.map((address, index) => (
              <View key={index} style={styles.addressCard}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressTitle}>Address {index + 1}</Text>
                  {formData.addresses.length > 1 && (
                    <TouchableOpacity
                      onPress={() => removeAddress(index)}
                      disabled={loading}>
                      <Icon name="close" size={24} color="#FF5252" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Icon name="home" size={22} color="#5B9EED" />
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    placeholder="Address Line *"
                    placeholderTextColor="#777"
                    value={address.address}
                    onChangeText={value => handleAddressChange(index, 'address', value)}
                    multiline
                    numberOfLines={2}
                    editable={!loading}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.halfInput]}>
                    <Icon name="map" size={22} color="#5B9EED" />
                    <TextInput
                      style={styles.input}
                      placeholder="State *"
                      placeholderTextColor="#777"
                      value={address.state}
                      onChangeText={value => handleAddressChange(index, 'state', value)}
                      editable={!loading}
                    />
                  </View>

                  <View style={[styles.inputContainer, styles.halfInput]}>
                    <Icon name="location-city" size={22} color="#5B9EED" />
                    <TextInput
                      style={styles.input}
                      placeholder="District *"
                      placeholderTextColor="#777"
                      value={address.district}
                      onChangeText={value => handleAddressChange(index, 'district', value)}
                      editable={!loading}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.halfInput]}>
                    <Icon name="location-city" size={22} color="#5B9EED" />
                    <TextInput
                      style={styles.input}
                      placeholder="City *"
                      placeholderTextColor="#777"
                      value={address.city}
                      onChangeText={value => handleAddressChange(index, 'city', value)}
                      editable={!loading}
                    />
                  </View>

                  <View style={[styles.inputContainer, styles.halfInput]}>
                    <Icon name="place" size={22} color="#5B9EED" />
                    <TextInput
                      style={styles.input}
                      placeholder="Area/Locality"
                      placeholderTextColor="#777"
                      value={address.area}
                      onChangeText={value => handleAddressChange(index, 'area', value)}
                      editable={!loading}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputContainer, styles.halfInput]}>
                    <Icon name="local-post-office" size={22} color="#5B9EED" />
                    <TextInput
                      style={styles.input}
                      placeholder="Pincode *"
                      placeholderTextColor="#777"
                      value={address.pincode}
                      onChangeText={value => handleAddressChange(index, 'pincode', value)}
                      keyboardType="numeric"
                      maxLength={6}
                      editable={!loading}
                    />
                  </View>

                  <View style={[styles.inputContainer, styles.halfInput]}>
                    <Icon name="location-on" size={22} color="#5B9EED" />
                    <TextInput
                      style={styles.input}
                      placeholder="Landmark"
                      placeholderTextColor="#777"
                      value={address.landmark}
                      onChangeText={value => handleAddressChange(index, 'landmark', value)}
                      editable={!loading}
                    />
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addAddressButton}
              onPress={addAddress}
              disabled={loading}>
              <Icon name="add" size={20} color="#5B9EED" />
              <Text style={styles.addAddressButtonText}>Add Another Address</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}>
          {loading ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.buttonText}>Registering...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>REGISTER</Text>
          )}
        </TouchableOpacity>

        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>Already have an account? </Text>
          <TouchableOpacity onPress={onSwitchToLogin} disabled={loading}>
            <Text style={styles.switchActionText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5B9EED',
    textAlign: 'center',
    marginBottom: 5,
  },
  subheading: {
    fontSize: 14,
    color: '#5B9EED',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5B9EED',
    marginBottom: 10,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#5B9EED',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 12,
    height: 55,
    backgroundColor: '#EEF5FD',
  },
  input: {
    flex: 1,
    height: 50,
    paddingLeft: 10,
    color: '#333',
    fontSize: 15,
  },
  multilineInput: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    height: 50,
  },
  dropdownButtonText: {
    color: '#333',
    fontSize: 15,
  },
  dropdownContainer: {
    backgroundColor: '#fff',
    borderColor: '#5B9EED',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 12,
    maxHeight: 150,
  },
  dropdownItem: {
    padding: 12,
    borderBottomColor: '#E0E0E0',
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    color: '#333',
    fontSize: 15,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#5B9EED',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  toggleButtonText: {
    color: '#5B9EED',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  addressSection: {
    marginBottom: 10,
  },
  addressCard: {
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FAFAFA',
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5B9EED',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#5B9EED',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  addAddressButtonText: {
    color: '#5B9EED',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#5B9EED',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 15,
    shadowColor: '#5B9EED',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#A5CCF4',
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  switchText: {
    color: '#757575',
    fontSize: 14,
  },
  switchActionText: {
    color: '#5B9EED',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default RegistrationForm;
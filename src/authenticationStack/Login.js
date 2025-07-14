import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Picker} from '@react-native-picker/picker';
import {login as loginAPI, register as registerAPI} from '../util/apiCall';
import {useAuth} from '../Auth/AuthContext';
import {logError} from '../util/ErrorHandler';
import {jwtDecode} from 'jwt-decode';

const {width} = Dimensions.get('window');

const LoginScreen = ({navigation}) => {
  const {login: authLogin, loading: authLoading} = useAuth();

  // Form state for login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Enhanced registration form state
  const [regFormData, setRegFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    contact: '',
    examName: 'UPSC',
    addresses: [
      {
        address: '',
        state: '',
        district: '',
        city: '',
        area: '',
        pincode: '',
        landmark: '',
      },
    ],
  });

  const [showRegPassword, setShowRegPassword] = useState(false);
  // const [showAddressSection, setShowAddressSection] = useState(false);
  const [regLoading, setRegLoading] = useState(false);

  // Animation state
  const [isLogin, setIsLogin] = useState(true);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  // References for measuring content size
  const loginFormRef = useRef(null);
  const registerFormRef = useRef(null);
  const [loginHeight, setLoginHeight] = useState(0);
  const [registerHeight, setRegisterHeight] = useState(0);

  const isMountedRef = useRef(true);

  const maharashtraDistricts = [
    'Ahmednagar',
    'Akola',
    'Amravati',
    'Aurangabad',
    'Beed',
    'Bhandara',
    'Buldhana',
    'Chandrapur',
    'Dhule',
    'Gadchiroli',
    'Gondia',
    'Hingoli',
    'Jalgaon',
    'Jalna',
    'Kolhapur',
    'Latur',
    'Mumbai City',
    'Mumbai Suburban',
    'Nagpur',
    'Nanded',
    'Nandurbar',
    'Nashik',
    'Osmanabad',
    'Palghar',
    'Parbhani',
    'Pune',
    'Raigad',
    'Ratnagiri',
    'Sangli',
    'Satara',
    'Sindhudurg',
    'Solapur',
    'Thane',
    'Wardha',
    'Washim',
    'Yavatmal',
  ];

  // Exam options
  const examOptions = [
    'UPSC',
    'MPSC',
    'Banking',
    'Saralseva',
    'Railway',
    'Army Bharati',
    'SSC Exam',
    'Other',
  ];

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleRegChange = (name, value) => {
    setRegFormData(prev => ({...prev, [name]: value}));
  };

  const handleAddressChange = (index, name, value) => {
    const updatedAddresses = [...regFormData.addresses];
    updatedAddresses[index] = {...updatedAddresses[index], [name]: value};
    setRegFormData(prev => ({...prev, addresses: updatedAddresses}));
  };

  const handleForgotPassword = () => {
    if (navigation) {
      navigation.navigate('SendOtp');
    } else {
      Alert.alert('Error', 'Navigation not available');
    }
  };

  const flipCard = () => {
    if (loading || regLoading) return;

    setEmail('');
    setPassword('');
    setRegFormData({
      userName: '',
      email: '',
      password: '',
      confirmPassword: '',
      contact: '',
      examName: 'UPSC',
      addresses: [
        {
          address: '',
          state: '',
          district: '',
          city: '',
          area: '',
          pincode: '',
          landmark: '',
        },
      ],
    });

    Animated.spring(flipAnimation, {
      toValue: isLogin ? 180 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      setIsLogin(!isLogin);
    }, 100);
  };

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 180],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 180],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  const handleLogin = async () => {
    if (loading || authLoading) return;

    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    setLoading(true);

    try {
      const payload = {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      };

      const response = await loginAPI(payload);

      if (response && response.token) {
        try {
          const decoded = jwtDecode(response.token);
          const currentTime = Date.now() / 1000;

          if (decoded.exp && decoded.exp <= currentTime) {
            Alert.alert('Error', 'Received expired token. Please try again.');
            return;
          }

          await authLogin(response.token, response);
          setEmail('');
          setPassword('');
        } catch (decodeError) {
          Alert.alert('Error', 'Invalid token received. Please try again.');
        }
      } else {
        Alert.alert('Login Failed', 'Unexpected response from server');
      }
    } catch (error) {
      if (error.response) {
        const msg = error.response.data?.message || 'Invalid credentials';
        Alert.alert('Login Failed', msg);
      } else if (error.request) {
        Alert.alert('Network Error', 'No response from server');
      } else {
        Alert.alert('Error', error.message);
      }

      logError('Login:handleLogin', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

// Replace your handleRegister function payload creation with this:

const handleRegister = async () => {
  if (regLoading) {
    return;
  }

  const errors = [];
  if (!regFormData.userName.trim()) {
    errors.push('Full name is required');
  }

  if (!regFormData.email.trim()) {
    errors.push('Email is required');
  } else if (!/\S+@\S+\.\S+/.test(regFormData.email.trim())) {
    errors.push('Please enter a valid email address');
  }

  if (!regFormData.contact.trim()) {
    errors.push('Contact number is required');
  } else if (!/^\d{10}$/.test(regFormData.contact.trim())) {
    errors.push('Contact number must be exactly 10 digits');
  }

  // District validation
  const currentDistrict = regFormData.addresses[0].district;
  if (!currentDistrict || currentDistrict.trim() === '') {
    errors.push('Please select a district');
  }

  if (!regFormData.password) {
    errors.push('Password is required');
  } else if (regFormData.password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (!regFormData.confirmPassword) {
    errors.push('Please confirm your password');
  } else if (regFormData.password !== regFormData.confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (errors.length > 0) {
    Alert.alert('Validation Error', errors.join('\n'));
    return;
  }

  setRegLoading(true);

  try {
    // FIXED: Create payload in the exact format your backend expects
    const payload = {
      userName: regFormData.userName.trim(),
      email: regFormData.email.trim().toLowerCase(),
      contact: regFormData.contact.trim(), // Keep as string as per your example
      examName: regFormData.examName,
      district: regFormData.addresses[0].district.trim(), // District at root level
      password: regFormData.password,
      confirmPassword: regFormData.confirmPassword,
    };

    const response = await registerAPI(payload);

    if (response) {
      console.log('[registerAPI] Success Response:', response.data);
      let successMessage = 'Account created successfully!';

      if (response.message) {
        successMessage = response.message;
      }

      Alert.alert('Registration Successful', successMessage, [
        {
          text: 'OK',
          onPress: () => {
            // Reset form data
            setRegFormData({
              userName: '',
              email: '',
              password: '',
              confirmPassword: '',
              contact: '',
              examName: 'UPSC',
              addresses: [
                {
                  address: '',
                  state: '',
                  district: '',
                  city: '',
                  area: '',
                  pincode: '',
                  landmark: '',
                },
              ],
            });

            setTimeout(() => {
              flipCard();
            }, 500);
          },
        },
      ]);

      if (response.token) {
        try {
          const decoded = jwtDecode(response.token);
          const currentTime = Date.now() / 1000;

          if (decoded.exp && decoded.exp > currentTime) {
            await authLogin(response.token, response);
            return;
          }
        } catch (decodeError) {
        }
      }
    }
  } catch (error) {
    console.error('❌ [REGISTER] Registration failed:', error);
    console.error('❌ Error details:', error.response?.data);

    let errorMessage = 'Registration failed. Please try again.';

    if (error.response) {
      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.status === 400) {
        errorMessage = 'Invalid registration data. Please check your inputs.';
      } else if (error.response.status === 409) {
        errorMessage = 'Email already exists. Please use a different email.';
      } else if (error.response.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    Alert.alert('Registration Failed', errorMessage);
    logError('Registration:handleRegister', error);
  } finally {
    if (isMountedRef.current) {
      setRegLoading(false);
    }
  }
};

  const onLoginFormLayout = event => {
    const {height} = event.nativeEvent.layout;
    setLoginHeight(height + 40);
  };

  const onRegisterFormLayout = event => {
    const {height} = event.nativeEvent.layout;
    setRegisterHeight(height + 40);
  };

  const cardHeight = isLogin ? loginHeight : registerHeight;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <Image
            style={styles.logo}
            source={require('../assets/logo.png')}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          <View
            style={[styles.cardContainer, {height: Math.max(cardHeight, 400)}]}>
            {/* Login Form - Front of Card */}
            <Animated.View
              style={[
                styles.card,
                frontAnimatedStyle,
                {zIndex: isLogin ? 1 : 0, opacity: isLogin ? 1 : 0},
              ]}>
              <View ref={loginFormRef} onLayout={onLoginFormLayout}>
                <Text style={styles.heading}>Welcome Back</Text>
                <Text style={styles.subheading}>Sign in to continue</Text>

                <View style={styles.inputContainer}>
                  <Icon name="email" size={22} color="#5B9EED" />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#777"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading && !authLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Icon name="lock" size={22} color="#5B9EED" />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#777"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!loading && !authLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading || authLoading}>
                    <Icon
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={22}
                      color="#5B9EED"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={handleForgotPassword}
                  disabled={loading || authLoading}>
                  <Text style={styles.forgotPasswordText}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    (loading || authLoading) && styles.buttonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={loading || authLoading}>
                  {loading || authLoading ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.buttonText}>Signing In...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>SIGN IN</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={flipCard} disabled={loading}>
                    <Text style={styles.switchActionText}>Register</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>

            {/* Register Form - Back of Card */}
            <Animated.View
              style={[
                styles.card,
                backAnimatedStyle,
                {zIndex: !isLogin ? 1 : 0, opacity: !isLogin ? 1 : 0},
              ]}>
              <View ref={registerFormRef} onLayout={onRegisterFormLayout}>
                <Text style={styles.heading}>Create Account</Text>
                <Text style={styles.subheading}>Sign up to get started</Text>

                {/* User Name */}
                <View>
                  <Text style={{padding: 10, color: '#000'}}>
                    Full Name <Text style={{color: 'red'}}>*</Text>
                  </Text>
                </View>
                <View style={styles.inputContainer}>
                  <Icon name="person" size={22} color="#5B9EED" />
                  <TextInput
                    placeholder="Full Name"
                    value={regFormData.userName}
                    onChangeText={value => handleRegChange('userName', value)}
                    style={styles.input}
                    editable={!regLoading}
                  />
                </View>

                {/* Email */}
                <View>
                  <Text style={{padding: 10, color: '#000'}}>
                    Email <Text style={{color: 'red'}}>*</Text>
                  </Text>
                </View>
                <View style={styles.inputContainer}>
                  <Icon name="email" size={22} color="#5B9EED" />
                  <TextInput
                    placeholder="Email Address"
                    value={regFormData.email}
                    onChangeText={value => handleRegChange('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    editable={!regLoading}
                  />
                </View>

                {/* Contact */}
                <View>
                  <Text style={{padding: 10, color: '#000'}}>
                    Contact <Text style={{color: 'red'}}>*</Text>
                  </Text>
                </View>
                <View style={styles.inputContainer}>
                  <Icon name="phone" size={22} color="#5B9EED" />
                  <TextInput
                    placeholder="Contact Number (10 digits)"
                    value={regFormData.contact}
                    onChangeText={value => handleRegChange('contact', value)}
                    keyboardType="numeric"
                    maxLength={10}
                    style={styles.input}
                    editable={!regLoading}
                  />
                </View>

                {/* District */}
                <View>
                  <Text style={{padding: 10, color: '#000'}}>
                    District <Text style={{color: 'red'}}>*</Text>
                  </Text>
                </View>
                <View style={styles.pickerContainer}>
                  <Icon
                    name="location-city"
                    size={22}
                    color="#5B9EED"
                    style={styles.pickerIcon}
                  />
                  <View style={styles.pickerWrapper}>
                    <Picker
                      selectedValue={regFormData.addresses[0].district}
                      onValueChange={value =>
                        handleAddressChange(0, 'district', value)
                      }
                      style={styles.picker}
                      enabled={!regLoading}>
                      <Picker.Item
                        label="Select District"
                        value=""
                        color="#777"
                      />
                      {maharashtraDistricts.map((district, index) => (
                        <Picker.Item
                          key={index}
                          label={district}
                          value={district}
                          color="#333"
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Exam Name Picker */}
                <View>
                  <Text style={{padding: 10, color: '#000'}}>
                    Select Exam <Text style={{color: 'red'}}>*</Text>
                  </Text>
                </View>
                <View style={styles.pickerContainer}>
                  <Icon
                    name="school"
                    size={22}
                    color="#5B9EED"
                    style={styles.pickerIcon}
                  />
                  <View style={styles.pickerWrapper}>
                    {/* <Text style={styles.pickerLabel}>Select Exam</Text> */}
                    <Picker
                      selectedValue={regFormData.examName}
                      onValueChange={value =>
                        handleRegChange('examName', value)
                      }
                      style={styles.picker}
                      enabled={!regLoading}>
                      {examOptions.map((exam, index) => (
                        <Picker.Item
                          key={index}
                          label={exam}
                          value={exam}
                          color="#333"
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {/* Password */}
                <View>
                  <Text style={{padding: 10, color: '#000'}}>
                    Password <Text style={{color: 'red'}}>*</Text>
                  </Text>
                </View>
                <View style={styles.inputContainer}>
                  <Icon name="lock" size={22} color="#5B9EED" />
                  <TextInput
                    placeholder="Password (min 6 chars)"
                    value={regFormData.password}
                    onChangeText={value => handleRegChange('password', value)}
                    secureTextEntry={!showRegPassword}
                    style={styles.input}
                    editable={!regLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowRegPassword(!showRegPassword)}
                    disabled={regLoading}>
                    <Icon
                      name={showRegPassword ? 'visibility' : 'visibility-off'}
                      size={22}
                      color="#5B9EED"
                    />
                  </TouchableOpacity>
                </View>

                {/* Confirm Password */}
                <View>
                  <Text style={{padding: 10, color: '#000'}}>
                    Confirm Password <Text style={{color: 'red'}}>*</Text>
                  </Text>
                </View>
                <View style={styles.inputContainer}>
                  <Icon name="lock" size={22} color="#5B9EED" />
                  <TextInput
                    placeholder="Confirm Password"
                    value={regFormData.confirmPassword}
                    onChangeText={value =>
                      handleRegChange('confirmPassword', value)
                    }
                    secureTextEntry={!showRegPassword}
                    style={styles.input}
                    editable={!regLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowRegPassword(!showRegPassword)}
                    disabled={regLoading}>
                    <Icon
                      name={showRegPassword ? 'visibility' : 'visibility-off'}
                      size={22}
                      color="#5B9EED"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.button, regLoading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={regLoading}>
                  {regLoading ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.buttonText}>Creating Account...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>
                    Already have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={flipCard} disabled={regLoading}>
                    <Text style={styles.switchActionText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9FE',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    width: 200,
    height: 150,
  },
  formContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    marginBottom: 20,
  },
  card: {
    position: 'absolute',
    top: -30,
    width: '100%',
    height: '100%',
    padding: 20,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    backfaceVisibility: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
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
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#5B9EED',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
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
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#5B9EED',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    minHeight: 55,
    backgroundColor: '#EEF5FD',
  },
  pickerIcon: {
    marginRight: 10,
  },
  pickerWrapper: {
    flex: 1,
  },
  pickerLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: -5,
  },
  picker: {
    flex: 1,
    color: '#333',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#5B9EED',
    fontSize: 13,
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
    marginTop: 20,
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

export default LoginScreen;

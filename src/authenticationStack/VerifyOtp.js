import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { verifyOTP, sendOTP } from '../util/apiCall'; 

const VerifyOtp = ({ navigation, route }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  // Get email from navigation params
  const { email } = route.params || {};

  // Timer for resend OTP
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer => timer - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Redirect back if no email provided
  useEffect(() => {
    if (!email) {
      showMessage({
        message: 'Email not provided',
        type: 'danger',
        duration: 3000,
      });
      
      // Navigate back after showing the message
      setTimeout(() => {
        navigation.navigate('SendOtp');
      }, 1000);
    }
  }, [email, navigation]);

  const handleVerifyOTP = async () => {
    // Validate OTP
    if (!otp.trim()) {
      showMessage({
        message: 'Please enter the OTP',
        type: 'danger',
        duration: 3000,
      });
      return;
    }

    if (otp.trim().length !== 6 && otp.trim().length !== 4) {
      showMessage({
        message: 'Please enter a valid OTP',
        type: 'danger',
        duration: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await verifyOTP(email, parseInt(otp.trim()));
      
      // Check if OTP was verified successfully
      if (response && response.includes('verified successfully')) {
        showMessage({
          message: 'OTP verified successfully',
          type: 'success',
          duration: 3000,
        });
        
        // Navigate to ResetPassword page with email parameter after a short delay
        setTimeout(() => {
          navigation.navigate('ResetPassword', { email: email });
        }, 1000);
      } else {
        showMessage({
          message: response || 'Invalid OTP or OTP expired',
          type: 'danger',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      showMessage({
        message: error.message || 'Failed to verify OTP. Please try again.',
        type: 'danger',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setResendLoading(true);

    try {
      const response = await sendOTP(email);
      
      if (response && (response.includes('OTP sent') || response === `OTP sent to ${email}`)) {
        showMessage({
          message: 'OTP has been resent to your email',
          type: 'success',
          duration: 3000,
        });
        
        setTimer(60);
        setCanResend(false);
        setOtp(''); // Clear previous OTP
      } else {
        showMessage({
          message: response || 'Failed to resend OTP',
          type: 'danger',
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Resend OTP Error:', error);
      showMessage({
        message: error.message || 'Failed to resend OTP. Please try again.',
        type: 'danger',
        duration: 4000,
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          We've sent a verification code to{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Enter OTP</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter 6-digit OTP"
            placeholderTextColor="#999"
            value={otp}
            onChangeText={setOtp}
            keyboardType="numeric"
            maxLength={6}
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerifyOTP}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          {!canResend ? (
            <Text style={styles.timerText}>
              Resend OTP in {timer} seconds
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={resendLoading}
              style={styles.resendButton}
            >
              {resendLoading ? (
                <ActivityIndicator size="small" color="#007bff" />
              ) : (
                <Text style={styles.resendText}>Resend OTP</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Change Email</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  innerContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  emailText: {
    fontWeight: '600',
    color: '#007bff',
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    backgroundColor: '#fff',
    color: '#333',
    textAlign: 'center',
    letterSpacing: 2,
  },
  button: {
    backgroundColor: '#007bff',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 20,
    height: 40,
    justifyContent: 'center',
  },
  timerText: {
    color: '#666',
    fontSize: 14,
  },
  resendButton: {
    padding: 10,
  },
  resendText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    alignItems: 'center',
    padding: 10,
  },
  backButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default VerifyOtp;
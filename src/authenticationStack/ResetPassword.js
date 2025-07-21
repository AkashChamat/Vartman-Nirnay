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
import { resetPassword } from '../util/apiCall'; // Adjust path according to your file structure

const ResetPassword = ({ navigation, route }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Get email from navigation params
  const { email } = route.params || {};

  // Redirect back if no email provided
  useEffect(() => {
    if (!email) {
      showMessage({
        message: "Session Expired",
        description: "Please start the password reset process again.",
        type: "danger",
        duration: 4000,
        onPress: () => navigation.navigate('SendOtp')
      });
      
      // Navigate back after showing message
      setTimeout(() => {
        navigation.navigate('SendOtp');
      }, 2000);
    }
  }, [email, navigation]);

  const validatePassword = (password) => {
    // Password should be at least 6 characters
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return null;
  };

  const handleResetPassword = async () => {
    // Validate passwords
    if (!password.trim()) {
      showMessage({
        message: "Password Required",
        description: "Please enter a new password",
        type: "warning",
        duration: 3000,
      });
      return;
    }

    if (!confirmPassword.trim()) {
      showMessage({
        message: "Confirm Password Required",
        description: "Please confirm your password",
        type: "warning",
        duration: 3000,
      });
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      showMessage({
        message: "Password Invalid",
        description: passwordError,
        type: "warning",
        duration: 3000,
      });
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      showMessage({
        message: "Passwords Don't Match",
        description: "Please make sure both passwords are identical",
        type: "warning",
        duration: 3000,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(email, password, confirmPassword);
      
      // Check if password was reset successfully
      if (response && response.includes('reset successfully')) {
        showMessage({
          message: "Password Reset Successful! 🎉",
          description: "Your password has been reset successfully. You can now login with your new password.",
          type: "success",
          duration: 4000,
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }
        });

        // Navigate to login after a short delay
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }, 2000);
      } else {
        showMessage({
          message: "Reset Failed",
          description: response || "Failed to reset password. Please try again.",
          type: "danger",
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Reset Password Error:', error);
      showMessage({
        message: "Network Error",
        description: error.message || "Failed to reset password. Please check your connection and try again.",
        type: "danger",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          Create a new password for{'\n'}
          <Text style={styles.emailText}>{email}</Text>
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter new password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Confirm new password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Text style={styles.eyeText}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.passwordRequirements}>
          <Text style={styles.requirementText}>
            • Password must be at least 6 characters long
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Back to Verify OTP</Text>
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
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 15,
  },
  eyeText: {
    fontSize: 18,
  },
  passwordRequirements: {
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
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

export default ResetPassword;
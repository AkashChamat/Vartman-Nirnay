import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import FlashMessage, { showMessage } from 'react-native-flash-message';

// Custom hideMessage function
export const hideMessage = () => {
  // Try multiple methods to hide the message
  try {
    // Method 1: Try the FlashMessage ref method
    if (FlashMessage && FlashMessage.current) {
      FlashMessage.current.hideMessage();
      return;
    }
    
    // Method 2: Use showMessage with empty content to effectively hide
    showMessage({
      message: '',
      description: '',
      type: 'none',
      autoHide: true,
      duration: 1,
    });
  } catch (error) {

  }
};

export const showSubmissionMessage = (onViewResult, onGoHome) => {
  showMessage({
    message: '',
    type: 'success',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>Test Submitted Successfully!</Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]} 
            onPress={() => {
              hideMessage();
              onGoHome();
            }}
          >
            <Text style={styles.buttonTextSecondary}>Back to Home</Text>
          </TouchableOpacity>
         
        </View>
      </View>
    ),
  });
};

export const showTimeUpMessage = (onSubmit) => {
  showMessage({
    message: '',
    type: 'warning',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={[styles.container, styles.warningContainer]}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, styles.warningTitle]}>Time's Up!</Text>
          <Text style={[styles.subtitle, styles.warningSubtitle]}>
            Your test time has ended. The test will be automatically submitted.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonWarning]} 
            onPress={() => {
              hideMessage();
              onSubmit();
            }}
          >
            <Text style={styles.buttonTextPrimary}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

export const showIncompleteTestMessage = (answeredCount, totalQuestions, onSubmit, onCancel) => {
  showMessage({
    message: '',
    type: 'warning',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={[styles.container, styles.warningContainer]}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, styles.warningTitle]}>Incomplete Test</Text>
          <Text style={[styles.subtitle, styles.warningSubtitle]}>
            You have answered {answeredCount} out of {totalQuestions} questions. Are you sure you want to submit?
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]} 
            onPress={() => {
              hideMessage();
              onCancel();
            }}
          >
            <Text style={styles.buttonTextSecondary}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.buttonDanger]} 
            onPress={() => {
              hideMessage();
              onSubmit();
            }}
          >
            <Text style={styles.buttonTextPrimary}>Submit Anyway</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

export const showConfirmSubmissionMessage = (onSubmit, onCancel) => {
  showMessage({
    message: '',
    type: 'info',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={[styles.container, styles.infoContainer]}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, styles.infoTitle]}>Submit Test</Text>
          <Text style={[styles.subtitle, styles.infoSubtitle]}>
            Are you sure you want to submit your test? This action cannot be undone.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]} 
            onPress={() => {
              hideMessage();
              onCancel();
            }}
          >
            <Text style={styles.buttonTextSecondary}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary]} 
            onPress={() => {
              hideMessage();
              onSubmit();
            }}
          >
            <Text style={styles.buttonTextPrimary}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

// Missing Phone Number Message
export const showMissingPhoneMessage = (onUpdateProfile, onCancel) => {
  showMessage({
    message: '',
    type: 'warning',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={[styles.container, styles.warningContainer]}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, styles.warningTitle]}>Missing Phone Number</Text>
          <Text style={[styles.subtitle, styles.warningSubtitle]}>
            Phone number is required for payment. Please update your profile.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]} 
            onPress={() => {
              hideMessage();
              onCancel();
            }}
          >
            <Text style={styles.buttonTextSecondary}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary]} 
            onPress={() => {
              hideMessage();
              onUpdateProfile();
            }}
          >
            <Text style={styles.buttonTextPrimary}>Update Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

// Payment Initialization Error Message
export const showPaymentInitErrorMessage = (onTryAgain, onCancel) => {
  showMessage({
    message: '',
    type: 'danger',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={[styles.container, styles.errorContainer]}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, styles.errorTitle]}>Payment Error</Text>
          <Text style={[styles.subtitle, styles.errorSubtitle]}>
            Failed to initialize payment. Please try again.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]} 
            onPress={() => {
              hideMessage();
              onCancel();
            }}
          >
            <Text style={styles.buttonTextSecondary}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.buttonDanger]} 
            onPress={() => {
              hideMessage();
              onTryAgain();
            }}
          >
            <Text style={styles.buttonTextPrimary}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

// Payment Failed Message
export const showPaymentFailedMessage = (onTryAgain, onCancel, message = 'Payment could not be processed. Please try again.') => {
  showMessage({
    message: '',
    type: 'danger',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={[styles.container, styles.errorContainer]}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, styles.errorTitle]}>Payment Failed</Text>
          <Text style={[styles.subtitle, styles.errorSubtitle]}>
            {message}
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]} 
            onPress={() => {
              hideMessage();
              onCancel();
            }}
          >
            <Text style={styles.buttonTextSecondary}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.buttonDanger]} 
            onPress={() => {
              hideMessage();
              onTryAgain();
            }}
          >
            <Text style={styles.buttonTextPrimary}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

// Payment Cancelled Message
export const showPaymentCancelledMessage = (onTryAgain, onGoBack) => {
  showMessage({
    message: '',
    type: 'info',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={[styles.container, styles.infoContainer]}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, styles.infoTitle]}>Payment Cancelled</Text>
          <Text style={[styles.subtitle, styles.infoSubtitle]}>
            You cancelled the payment process.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]} 
            onPress={() => {
              hideMessage();
              onGoBack();
            }}
          >
            <Text style={styles.buttonTextSecondary}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary]} 
            onPress={() => {
              hideMessage();
              onTryAgain();
            }}
          >
            <Text style={styles.buttonTextPrimary}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

// Payment Status Unknown with back navigation
export const showPaymentStatusUnknownMessage = (onOK) => {
  showMessage({
    message: '',
    type: 'warning',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={[styles.container, styles.warningContainer]}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, styles.warningTitle]}>Payment Status Unknown</Text>
          <Text style={[styles.subtitle, styles.warningSubtitle]}>
            The payment process completed but we couldn't determine the result. Please check your payment history or contact support.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonWarning]} 
            onPress={() => {
              hideMessage();
              onOK();
            }}
          >
            <Text style={styles.buttonTextPrimary}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

// Close Payment Confirmation
export const showClosePaymentConfirmation = (onContinue, onClose) => {
  showMessage({
    message: '',
    type: 'warning',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={[styles.container, styles.warningContainer]}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, styles.warningTitle]}>Close Payment</Text>
          <Text style={[styles.subtitle, styles.warningSubtitle]}>
            Are you sure you want to close the payment? Your payment will be cancelled.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]} 
            onPress={() => {
              hideMessage();
              onContinue();
            }}
          >
            <Text style={styles.buttonTextSecondary}>Continue Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.buttonDanger]} 
            onPress={() => {
              hideMessage();
              onClose();
            }}
          >
            <Text style={styles.buttonTextPrimary}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

// Payment in Progress
export const showPaymentInProgressMessage = (onClosePayment, onContinue) => {
  showMessage({
    message: '',
    type: 'info',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={[styles.container, styles.infoContainer]}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, styles.infoTitle]}>Payment in Progress</Text>
          <Text style={[styles.subtitle, styles.infoSubtitle]}>
            Please complete or cancel the payment first.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]} 
            onPress={() => {
              hideMessage();
              onContinue();
            }}
          >
            <Text style={styles.buttonTextSecondary}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary]} 
            onPress={() => {
              hideMessage();
              onClosePayment();
            }}
          >
            <Text style={styles.buttonTextPrimary}>Close Payment</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

// Registration success message with buttons for functionality
export const showRegistrationSuccessMessage = (onLoginRedirect) => {
  showMessage({
    message: '',
    type: 'success',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>Registration Successful!</Text>
          <Text style={styles.subtitle}>
            Your account has been created successfully. Please login with your credentials.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary]} 
            onPress={() => {
              hideMessage();
              onLoginRedirect();
            }}
          >
            <Text style={styles.buttonTextPrimary}>Login Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

// PDF Generated Successfully with Open/OK options
export const showPdfGeneratedSuccessMessage = (filePath, onOpenPdf, onOk) => {
  showMessage({
    message: '',
    type: 'success',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>PDF Generated Successfully</Text>
          <Text style={styles.subtitle}>
            PDF saved to Downloads folder:{'\n'}{filePath}
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]} 
            onPress={() => {
              hideMessage();
              onOk();
            }}
          >
            <Text style={styles.buttonTextSecondary}>OK</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary]} 
            onPress={() => {
              hideMessage();
              onOpenPdf();
            }}
          >
            <Text style={styles.buttonTextPrimary}>Open PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

// PDF Generation Success (fallback when file can't be opened directly)
export const showPdfSavedToDownloadsMessage = (filePath, onOk) => {
  showMessage({
    message: '',
    type: 'success',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>PDF Generated Successfully</Text>
          <Text style={styles.subtitle}>
            PDF saved to Downloads folder:{'\n'}{filePath}{'\n\n'}
            Please open your file manager to view the PDF.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary]} 
            onPress={() => {
              hideMessage();
              onOk();
            }}
          >
            <Text style={styles.buttonTextPrimary}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

// Download Complete with Open/OK options
export const showDownloadCompleteMessage = (filePath, onOpenPdf, onOk) => {
  showMessage({
    message: '',
    type: 'success',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <Text style={styles.title}>Download Complete</Text>
          <Text style={styles.subtitle}>
            PDF saved to Downloads folder:{'\n'}{filePath}
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]} 
            onPress={() => {
              hideMessage();
              onOk();
            }}
          >
            <Text style={styles.buttonTextSecondary}>OK</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary]} 
            onPress={() => {
              hideMessage();
              onOpenPdf();
            }}
          >
            <Text style={styles.buttonTextPrimary}>Open PDF</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

// File Open Success (fallback when direct file opening fails)
export const showFileOpenFallbackMessage = (filePath, onOk) => {
  showMessage({
    message: '',
    type: 'info',
    floating: true,
    autoHide: false,
    renderCustomContent: () => (
      <View style={[styles.container, styles.infoContainer]}>
        <View style={styles.contentWrapper}>
          <Text style={[styles.title, styles.infoTitle]}>PDF Generated Successfully</Text>
          <Text style={[styles.subtitle, styles.infoSubtitle]}>
            File saved to Downloads folder:{'\n'}{filePath}{'\n\n'}
            Please open your file manager to view the PDF.
          </Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonPrimary]} 
            onPress={() => {
              hideMessage();
              onOk();
            }}
          >
            <Text style={styles.buttonTextPrimary}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
  });
};

// Simple auto-hide messages (these don't need custom hideMessage calls)
export const showPdfNotAvailableMessage = () => {
  showMessage({
    message: 'PDF Not Available',
    description: 'The requested PDF file is not available at this time.',
    type: 'danger',
    floating: true,
    autoHide: true,
    duration: 4000,
  });
};

export const showNoPdfDataMessage = () => {
  showMessage({
    message: 'No PDF Data',
    description: 'No PDF data is available to display.',
    type: 'warning',
    floating: true,
    autoHide: true,
    duration: 4000,
  });
};

export const showPdfLoadFailedMessage = () => {
  showMessage({
    message: 'PDF Load Failed',
    description: 'Failed to load PDF. Please check your connection and try again.',
    type: 'danger',
    floating: true,
    autoHide: true,
    duration: 4000,
  });
};

export const showSimpleErrorMessage = (title, description) => {
  showMessage({
    message: title,
    description: description,
    type: 'danger',
    floating: true,
    autoHide: true,
    duration: 4000,
  });
};

export const showSimpleWarningMessage = (title, description) => {
  showMessage({
    message: title,
    description: description,
    type: 'warning',
    floating: true,
    autoHide: true,
    duration: 4000,
  });
};

export const showValidationErrorMessage = (message) => {
  showMessage({
    message: 'Validation Error',
    description: message,
    type: 'danger',
    floating: true,
    autoHide: true,
    duration: 4000,
  });
};

export const showRegistrationFailedMessage = (message = 'Registration failed. Please try again.') => {
  showMessage({
    message: 'Registration Failed',
    description: message,
    type: 'danger',
    floating: true,
    autoHide: true,
    duration: 5000,
  });
};

export const showPermissionDeniedMessage = () => {
  showMessage({
    message: 'Permission Denied',
    description: 'Storage permission is required to download PDF',
    type: 'danger',
    floating: true,
    autoHide: true,
    duration: 4000,
  });
};

export const showPermissionErrorMessage = () => {
  showMessage({
    message: 'Permission Error',
    description: 'Failed to request storage permission',
    type: 'danger',
    floating: true,
    autoHide: true,
    duration: 4000,
  });
};

export const showPdfGeneratingMessage = () => {
  showMessage({
    message: 'Generating PDF...',
    description: 'Please wait while we prepare your test paper.',
    type: 'info',
    floating: true,
    autoHide: true,
    duration: 3000,
  });
};

export const showFileNotFoundMessage = () => {
  showMessage({
    message: 'Error',
    description: 'File not found',
    type: 'danger',
    floating: true,
    autoHide: true,
    duration: 4000,
  });
};

export const showTestFailedMessage = (errorMessage) => {
  showMessage({
    message: 'Test Failed',
    description: errorMessage || 'An error occurred during testing',
    type: 'danger',
    floating: true,
    autoHide: true,
    duration: 4000,
  });
};

export const showDownloadingMessage = () => {
  showMessage({
    message: 'Downloading...',
    description: 'Please wait while we download your PDF.',
    type: 'info',
    floating: true,
    autoHide: true,
    duration: 3000,
  });
};

export const showDownloadFailedMessage = () => {
  showMessage({
    message: 'Download Failed',
    description: 'Unable to download the PDF. Please try again.',
    type: 'danger',
    floating: true,
    autoHide: true,
    duration: 4000,
  });
};

export const showPdfGenerationFailedMessage = (errorMessage) => {
  let message = 'Unable to generate the test paper. Please try again.';
  
  if (errorMessage?.includes('Permission')) {
    message = 'Storage permission is required. Please grant permission and try again.';
  } else if (errorMessage?.includes('network') || errorMessage?.includes('Network')) {
    message = 'Network error occurred. Please check your connection and try again.';
  } else if (errorMessage?.includes('space') || errorMessage?.includes('storage')) {
    message = 'Insufficient storage space. Please free up some space and try again.';
  }

  showMessage({
    message: 'Generation Failed',
    description: `${message}\n\nTechnical details: ${errorMessage || 'Unknown error'}`,
    type: 'danger',
    floating: true,
    autoHide: true,
    duration: 6000,
  });
};

export const showSimpleInfoMessage = (title, description) => {
  showMessage({
    message: title,
    description: description,
    type: 'info',
    floating: true,
    autoHide: true,
    duration: 3000,
  });
};

export const showErrorMessage = (title, message) => {
  showMessage({
    message: title,
    description: message,
    type: 'danger',
    floating: true,
    autoHide: true,
    duration: 4000,
  });
};

export const showSuccessMessage = (title, message) => {
  showMessage({
    message: title,
    description: message,
    type: 'success',
    floating: true,
    autoHide: true,
    duration: 3000,
  });
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  warningContainer: {
    borderColor: '#fff3cd',
    backgroundColor: '#fff',
  },
  infoContainer: {
    borderColor: '#d1ecf1',
    backgroundColor: '#fff',
  },
  errorContainer: {
    borderColor: '#f8d7da',
    backgroundColor: '#fff',
  },
  contentWrapper: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0288D1',
    marginBottom: 8,
    textAlign: 'center',
  },
  warningTitle: {
    color: '#ff9800',
  },
  infoTitle: {
    color: '#0288D1',
  },
  errorTitle: {
    color: '#f44336',
  },
  subtitle: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    textAlign: 'center',
  },
  warningSubtitle: {
    color: '#424242',
  },
  infoSubtitle: {
    color: '#424242',
  },
  errorSubtitle: {
    color: '#424242',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#0288D1',
    shadowColor: '#0288D1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#0288D1',
  },
  buttonWarning: {
    backgroundColor: '#ff9800',
    shadowColor: '#ff9800',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDanger: {
    backgroundColor: '#f44336',
    shadowColor: '#f44336',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonTextPrimary: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonTextSecondary: {
    color: '#0288D1',
    fontWeight: '600',
    fontSize: 14,
  },
});
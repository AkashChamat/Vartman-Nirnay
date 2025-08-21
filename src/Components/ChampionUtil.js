import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {championtest, submitTestPaper} from '../util/apiCall';
import {
  showSuccessMessage,
  showErrorMessage,
  showInstructionsRequiredMessage,
} from '../Components/SubmissionMessage';

// API Functions
export const fetchTestQuestions = async (
  testId,
  setTestData,
  setError,
  setLoading,
) => {
  try {
    setLoading(true);

    const response = await championtest({}, testId);
    if (response && response.data) {
      setTestData(response.data);
    } else if (response) {
      setTestData(response);
    } else {
      throw new Error('No data received from API');
    }

    setError(null);
  } catch (err) {
    console.error('Full error object:', err);
    console.error('Error response:', err.response);
    console.error('Error status:', err.response?.status);
    console.error('Error data:', err.response?.data);

    let errorMessage = 'Failed to load test questions';

    if (err.response?.status === 403) {
      errorMessage =
        'Access denied. You may not have permission to access this test or your session may have expired.';
    } else if (err.response?.status === 401) {
      errorMessage = 'Authentication required. Please log in again.';
    } else if (err.response?.status === 404) {
      errorMessage =
        'Test not found. The test may have been removed or the ID is incorrect.';
    } else if (err.response?.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (err.message) {
      errorMessage = `Failed to load test: ${err.message}`;
    }

    setError(errorMessage);
    console.error('Test ID being passed:', testId);
  } finally {
    setLoading(false);
  }
};

// Time tracking utilities
export const initializeTestTimer = () => {
  const startTime = new Date().toISOString();
  return startTime;
};

export const calculateTestDuration = startTime => {
  const endTime = new Date().toISOString();
  const start = new Date(startTime);
  const end = new Date(endTime);

  // Calculate duration in seconds
  const durationInSeconds = Math.floor((end - start) / 1000);

  // Format as ISO 8601 duration (PT15S format)
  const timeTaken = `PT${durationInSeconds}S`;

  return {
    endTime,
    timeTaken,
    durationInSeconds,
  };
};

// Updated submit test function with time parameters
export const submitTest = async (
  paperId,
  selectedAnswers,
  userId,
  startTime,
  endTime,
  timeTaken,
) => {
  try {
    console.log('🚀 [SUBMIT TEST] Starting submitTest function');
    console.log('📋 [SUBMIT TEST] Input parameters:');
    console.log('📋 [SUBMIT TEST] - paperId:', paperId);
    console.log('📋 [SUBMIT TEST] - userId:', userId);
    console.log('📋 [SUBMIT TEST] - startTime:', startTime);
    console.log('📋 [SUBMIT TEST] - endTime:', endTime);
    console.log('📋 [SUBMIT TEST] - timeTaken:', timeTaken);
    console.log(
      '📋 [SUBMIT TEST] - selectedAnswers count:',
      Object.keys(selectedAnswers).length,
    );
    console.log(
      '📋 [SUBMIT TEST] - selectedAnswers:',
      JSON.stringify(selectedAnswers, null, 2),
    );
    if (!userId) {
      throw new Error('User not logged in.');
    }

    console.log('✅ [SUBMIT TEST] User ID validation passed');

    // Format answers similar to your web implementation
    console.log('🔄 [SUBMIT TEST] Formatting answers...');
    const formattedAnswers = {};
    Object.entries(selectedAnswers).forEach(([qid, val]) => {
      console.log(
        `🔄 [SUBMIT TEST] Processing answer - Question ID: ${qid}, Value: ${val}`,
      );
      if (typeof val === 'string' && val.startsWith('option')) {
        formattedAnswers[qid] = val.replace('option', '');
      } else {
        formattedAnswers[qid] = val;
      }
    });

    console.log(
      '✅ [SUBMIT TEST] Formatted answers:',
      JSON.stringify(formattedAnswers, null, 2),
    );

    // Submit the test using the API function with time parameters
    console.log('🌐 [SUBMIT TEST] Calling submitTestPaper API...');
    console.log('🌐 [SUBMIT TEST] API call parameters:');
    console.log('🌐 [SUBMIT TEST] - userId:', userId);
    console.log('🌐 [SUBMIT TEST] - paperId:', paperId);
    console.log(
      '🌐 [SUBMIT TEST] - formattedAnswers:',
      JSON.stringify(formattedAnswers, null, 2),
    );
    console.log('🌐 [SUBMIT TEST] - startTime:', startTime);
    console.log('🌐 [SUBMIT TEST] - endTime:', endTime);
    console.log('🌐 [SUBMIT TEST] - timeTaken:', timeTaken);

    const response = await submitTestPaper(
      userId,
      paperId,
      formattedAnswers,
      startTime,
      endTime,
      timeTaken,
    );

    console.log('🎉 [SUBMIT TEST] API call completed successfully!');
    console.log('📊 [SUBMIT TEST] Response received:');
    console.log('📊 [SUBMIT TEST] - Response type:', typeof response);
    console.log('📊 [SUBMIT TEST] - Response is null?', response === null);
    console.log(
      '📊 [SUBMIT TEST] - Response is undefined?',
      response === undefined,
    );
    console.log(
      '📊 [SUBMIT TEST] - Response keys:',
      response ? Object.keys(response) : 'No keys (null/undefined)',
    );
    console.log(
      '📊 [SUBMIT TEST] - Full response:',
      JSON.stringify(response, null, 2),
    );

    if (response) {
      console.log('🔍 [SUBMIT TEST] Response analysis:');
      console.log(
        '🔍 [SUBMIT TEST] - Has success property?',
        'success' in response,
      );
      console.log('🔍 [SUBMIT TEST] - Has data property?', 'data' in response);
      console.log(
        '🔍 [SUBMIT TEST] - Has message property?',
        'message' in response,
      );
      console.log(
        '🔍 [SUBMIT TEST] - Has status property?',
        'status' in response,
      );
      console.log(
        '🔍 [SUBMIT TEST] - Has error property?',
        'error' in response,
      );

      if (response.success !== undefined) {
        console.log('🔍 [SUBMIT TEST] - Success value:', response.success);
      }
      if (response.data !== undefined) {
        console.log(
          '🔍 [SUBMIT TEST] - Data value:',
          JSON.stringify(response.data, null, 2),
        );
      }
      if (response.message !== undefined) {
        console.log('🔍 [SUBMIT TEST] - Message value:', response.message);
      }
      if (response.status !== undefined) {
        console.log('🔍 [SUBMIT TEST] - Status value:', response.status);
      }
      if (response.error !== undefined) {
        console.log('🔍 [SUBMIT TEST] - Error value:', response.error);
      }
    }

    console.log('✅ [SUBMIT TEST] Returning response to caller');
    return response;
  } catch (error) {
    console.error('❌ Submit test error:', error);
    console.error('❌ [SUBMIT TEST] Error occurred in submitTest');
    console.error('❌ [SUBMIT TEST] Error type:', typeof error);
    console.error('❌ [SUBMIT TEST] Error name:', error.name);
    console.error('❌ [SUBMIT TEST] Error message:', error.message);
    console.error('❌ [SUBMIT TEST] Error stack:', error.stack);
    console.error('❌ [SUBMIT TEST] Full error object:', error);

    if (error.response) {
      console.error('❌ [SUBMIT TEST] Error has response property');
      console.error(
        '❌ [SUBMIT TEST] Error response status:',
        error.response.status,
      );
      console.error(
        '❌ [SUBMIT TEST] Error response data:',
        JSON.stringify(error.response.data, null, 2),
      );
    }
    console.error('❌ [SUBMIT TEST] Re-throwing error');
    throw error;
  }
};

// Updated handle test submission with timing logic
export const handleTestSubmission = async (
  paperId,
  selectedAnswers,
  setIsSubmitting,
  userId,
  testStartTime, // Add test start time parameter
  onSuccess = null,
  onError = null,
) => {
  try {
    console.log('🎯 [HANDLE SUBMISSION] Starting handleTestSubmission');
    console.log('🎯 [HANDLE SUBMISSION] Input parameters:');
    console.log('🎯 [HANDLE SUBMISSION] - paperId:', paperId);
    console.log('🎯 [HANDLE SUBMISSION] - userId:', userId);
    console.log('🎯 [HANDLE SUBMISSION] - testStartTime:', testStartTime);
    console.log(
      '🎯 [HANDLE SUBMISSION] - selectedAnswers count:',
      Object.keys(selectedAnswers).length,
    );
    console.log(
      '🎯 [HANDLE SUBMISSION] - has onSuccess callback:',
      !!onSuccess,
    );
    console.log('🎯 [HANDLE SUBMISSION] - has onError callback:', !!onError);

    console.log('🔄 [HANDLE SUBMISSION] Setting isSubmitting to true');
    setIsSubmitting(true);

    // Calculate timing data
    console.log('⏰ [HANDLE SUBMISSION] Calculating timing data...');
    const {endTime, timeTaken} = calculateTestDuration(testStartTime);
    console.log('⏰ [HANDLE SUBMISSION] Calculated endTime:', endTime);
    console.log('⏰ [HANDLE SUBMISSION] Calculated timeTaken:', timeTaken);

    console.log('🚀 [HANDLE SUBMISSION] Calling submitTest...');
    const response = await submitTest(
      paperId,
      selectedAnswers,
      userId,
      testStartTime,
      endTime,
      timeTaken,
    );

    console.log('🎉 [HANDLE SUBMISSION] submitTest completed successfully!');
    console.log('📊 [HANDLE SUBMISSION] Response from submitTest:');
    console.log('📊 [HANDLE SUBMISSION] - Response type:', typeof response);
    console.log(
      '📊 [HANDLE SUBMISSION] - Response content:',
      JSON.stringify(response, null, 2),
    );

    if (response) {
      console.log('🔍 [HANDLE SUBMISSION] Response analysis:');
      console.log(
        '🔍 [HANDLE SUBMISSION] - Response object keys:',
        Object.keys(response),
      );
      console.log(
        '🔍 [HANDLE SUBMISSION] - Response length (if array):',
        Array.isArray(response) ? response.length : 'Not an array',
      );

      // Log each property of the response
      Object.entries(response).forEach(([key, value]) => {
        console.log(
          `🔍 [HANDLE SUBMISSION] - ${key}:`,
          typeof value === 'object' ? JSON.stringify(value, null, 2) : value,
        );
      });
    } else {
      console.log('🔍 [HANDLE SUBMISSION] Response is null or undefined');
    }

    console.log('🔄 [HANDLE SUBMISSION] Checking for onSuccess callback...');

    if (onSuccess) {
      console.log(
        '✅ [HANDLE SUBMISSION] onSuccess callback exists, calling it...',
      );
      console.log(
        '✅ [HANDLE SUBMISSION] Passing response to onSuccess:',
        JSON.stringify(response, null, 2),
      );

      try {
        const callbackResult = onSuccess(response);
        console.log('✅ [HANDLE SUBMISSION] onSuccess callback completed');
        console.log('✅ [HANDLE SUBMISSION] Callback result:', callbackResult);
      } catch (callbackError) {
        console.error(
          '❌ [HANDLE SUBMISSION] Error in onSuccess callback:',
          callbackError,
        );
        throw callbackError;
      }
    } else {
      console.log(
        '✅ [HANDLE SUBMISSION] No onSuccess callback, showing default success message',
      );
      showSuccessMessage('Success!', 'Test submitted successfully!');
    }

    console.log(
      '✅ [HANDLE SUBMISSION] handleTestSubmission completed successfully',
    );
    console.log(
      '✅ [HANDLE SUBMISSION] Returning response:',
      JSON.stringify(response, null, 2),
    );

    return response;
  } catch (error) {
    console.error(
      '❌ [HANDLE SUBMISSION] Error occurred in handleTestSubmission',
    );
    console.error('❌ [HANDLE SUBMISSION] Error type:', typeof error);
    console.error('❌ [HANDLE SUBMISSION] Error name:', error.name);
    console.error('❌ [HANDLE SUBMISSION] Error message:', error.message);
    console.error('❌ [HANDLE SUBMISSION] Error stack:', error.stack);
    console.error('❌ [HANDLE SUBMISSION] Full error object:', error);

    const errorMessage = error.message || 'Failed to submit test';
    console.error(
      '❌ [HANDLE SUBMISSION] Processed error message:',
      errorMessage,
    );
    console.error('❌ Test submission error:', errorMessage);
    console.log('🔄 [HANDLE SUBMISSION] Checking for onError callback...');

    if (onError) {
      console.log(
        '❌ [HANDLE SUBMISSION] onError callback exists, calling it...',
      );
      console.log(
        '❌ [HANDLE SUBMISSION] Passing error message to onError:',
        errorMessage,
      );

      try {
        const errorCallbackResult = onError(errorMessage);
        console.log('❌ [HANDLE SUBMISSION] onError callback completed');
        console.log(
          '❌ [HANDLE SUBMISSION] Error callback result:',
          errorCallbackResult,
        );
      } catch (callbackError) {
        console.error(
          '❌ [HANDLE SUBMISSION] Error in onError callback:',
          callbackError,
        );
      }
    } else {
      console.log(
        '❌ [HANDLE SUBMISSION] No onError callback, showing default error message',
      );
      showErrorMessage('Submission Failed', errorMessage);
    }

    throw error;
  } finally {
    console.log(
      '🔄 [HANDLE SUBMISSION] Finally block - setting isSubmitting to false',
    );
    setIsSubmitting(false);
  }
};

// Add this new function to render the loading overlay
export const renderSubmissionLoading = (isSubmitting, styles) => {
  if (!isSubmitting) return null;

  return (
    <View style={styles.submissionOverlay}>
      <View style={styles.submissionContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.submissionText}>Submitting your test...</Text>
        <Text style={styles.submissionSubtext}>Please don't close the app</Text>
      </View>
    </View>
  );
};

// Navigation Functions
export const handleNextQuestion = (
  currentQuestionIndex,
  testData,
  setCurrentQuestionIndex,
) => {
  if (
    testData?.questions &&
    currentQuestionIndex < testData.questions.length - 1
  ) {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
  }
};

export const handlePreviousQuestion = (
  currentQuestionIndex,
  setCurrentQuestionIndex,
) => {
  if (currentQuestionIndex > 0) {
    setCurrentQuestionIndex(currentQuestionIndex - 1);
  }
};

export const handleAnswerSelect = (
  questionId,
  selectedOption,
  setSelectedAnswers,
) => {
  setSelectedAnswers(prev => ({
    ...prev,
    [questionId]: selectedOption,
  }));
};

export const handleInstructionsAccept = (
  setShowInstructions,
  setInstructionsAccepted,
) => {
  setShowInstructions(false);
  setInstructionsAccepted(true);
};

export const handleInstructionsClose = navigation => {
  // Use the new flash message with buttons
  showInstructionsRequiredMessage(
    () => {}, // Stay - do nothing
    () => navigation.goBack(), // Go Back
  );
};

// Render Functions
export const renderProgressBar = (
  currentQuestionIndex,
  testData,
  selectedAnswers,
  styles,
) => {
  const progress =
    ((currentQuestionIndex + 1) / testData.questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          Progress: {currentQuestionIndex + 1}/{testData.questions.length}
        </Text>
        <Text style={styles.answeredText}>
          Answered: {answeredCount}/{testData.questions.length}
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, {width: `${progress}%`}]} />
      </View>
    </View>
  );
};

export const renderQuestionOptions = (
  question,
  selectedAnswers,
  handleAnswerSelect,
  styles,
) => {
  const options = [
    {key: 'A', value: question.optionA},
    {key: 'B', value: question.optionB},
    {key: 'C', value: question.optionC},
    {key: 'D', value: question.optionD},
  ];

  if (question.optionE && question.optionE.trim() !== '') {
    options.push({key: 'E', value: question.optionE});
  }

  return options.map(option => (
    <TouchableOpacity
      key={option.key}
      style={[
        styles.optionButton,
        selectedAnswers[question.id] === option.key && styles.selectedOption,
      ]}
      onPress={() => handleAnswerSelect(question.id, option.key)}
      activeOpacity={0.7}>
      <View style={styles.optionContent}>
        <View
          style={[
            styles.optionKeyContainer,
            selectedAnswers[question.id] === option.key &&
              styles.selectedOptionKeyContainer,
          ]}>
          <Text
            style={[
              styles.optionKey,
              selectedAnswers[question.id] === option.key &&
                styles.selectedOptionKey,
            ]}>
            {option.key}
          </Text>
        </View>
        <Text
          style={[
            styles.optionValue,
            selectedAnswers[question.id] === option.key &&
              styles.selectedOptionText,
          ]}>
          {option.value}
        </Text>
      </View>
    </TouchableOpacity>
  ));
};

export const renderLoadingScreen = styles => (
  <View style={styles.loadingContainer}>
    <View style={styles.loadingContent}>
      <ActivityIndicator size="large" color="#6366F1" />
      <Text style={styles.loadingText}>Loading test questions...</Text>
      <Text style={styles.loadingSubtext}>
        Please wait while we prepare your test
      </Text>
    </View>
  </View>
);

export const renderErrorScreen = (error, onRetry, navigation, styles) => (
  <View style={styles.errorContainer}>
    <View style={styles.errorIconContainer}>
      <MaterialIcons name="error-outline" size={80} color="#EF4444" />
    </View>
    <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
    <Text style={styles.errorSubtitle}>{error}</Text>
    <View style={styles.errorActions}>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={onRetry}
        activeOpacity={0.8}>
        <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}>
        <Text style={styles.secondaryButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export const renderNoQuestionsScreen = (navigation, styles) => (
  <View style={styles.errorContainer}>
    <View style={styles.errorIconContainer}>
      <MaterialIcons name="quiz" size={80} color="#F59E0B" />
    </View>
    <Text style={styles.errorTitle}>No Questions Available</Text>
    <Text style={styles.errorSubtitle}>
      This test doesn't have any questions yet.
    </Text>
    <TouchableOpacity
      style={styles.primaryButton}
      onPress={() => navigation.goBack()}
      activeOpacity={0.8}>
      <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
      <Text style={styles.primaryButtonText}>Go Back</Text>
    </TouchableOpacity>
  </View>
);

// Navigation buttons with submission handling
export const renderNavigationButtons = (
  currentQuestionIndex,
  testData,
  onPrevious,
  onNext,
  onSubmit,
  styles,
  isSubmitting = false,
) => (
  <View style={styles.navigationContainer}>
    <TouchableOpacity
      style={[
        styles.navButton,
        styles.secondaryNavButton,
        (currentQuestionIndex === 0 || isSubmitting) && styles.disabledButton,
      ]}
      onPress={onPrevious}
      disabled={currentQuestionIndex === 0 || isSubmitting}
      activeOpacity={0.7}>
      <Text
        style={[
          styles.secondaryNavButtonText,
          (currentQuestionIndex === 0 || isSubmitting) &&
            styles.disabledButtonText,
        ]}>
        Previous
      </Text>
    </TouchableOpacity>

    {currentQuestionIndex === testData.questions.length - 1 ? (
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.disabledButton]}
        onPress={onSubmit}
        disabled={isSubmitting}
        activeOpacity={0.8}>
        {isSubmitting ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit</Text>
        )}
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        style={[
          styles.navButton,
          styles.primaryNavButton,
          isSubmitting && styles.disabledButton,
        ]}
        onPress={onNext}
        disabled={isSubmitting}
        activeOpacity={0.7}>
        <Text
          style={[
            styles.primaryNavButtonText,
            isSubmitting && styles.disabledButtonText,
          ]}>
          Next
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

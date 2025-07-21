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
    if (!userId) {
      throw new Error('User not logged in.');
    }

    // Format answers similar to your web implementation
    const formattedAnswers = {};
    Object.entries(selectedAnswers).forEach(([qid, val]) => {
      if (typeof val === 'string' && val.startsWith('option')) {
        formattedAnswers[qid] = val.replace('option', '');
      } else {
        formattedAnswers[qid] = val;
      }
    });

    // Submit the test using the API function with time parameters
    const response = await submitTestPaper(
      userId,
      paperId,
      formattedAnswers,
      startTime,
      endTime,
      timeTaken,
    );

    return response;
  } catch (error) {
    console.error('❌ Submit test error:', error);
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
    setIsSubmitting(true);

    // Calculate timing data
    const {endTime, timeTaken} = calculateTestDuration(testStartTime);

    const response = await submitTest(
      paperId,
      selectedAnswers,
      userId,
      testStartTime,
      endTime,
      timeTaken,
    );

    if (onSuccess) {
      onSuccess(response);
    } else {
      showSuccessMessage('Success!', 'Test submitted successfully!');
    }

    return response;
  } catch (error) {
    const errorMessage = error.message || 'Failed to submit test';
    console.error('❌ Test submission error:', errorMessage);

    if (onError) {
      onError(errorMessage);
    } else {
      showErrorMessage('Submission Failed', errorMessage);
    }

    throw error;
  } finally {
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

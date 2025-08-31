import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  BackHandler,
  Alert,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '../Components/Header';
import TestInstructions from '../Components/TestInstructions';
import PaperTimer from '../Components/PaperTimer';
import TestMenu from '../Components/TestMenu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../Auth/AuthContext';

import {getAPI} from '../util/apiCall';
import {TestPaperByIdUrl} from '../util/Url';
import {
  showSubmissionMessage,
  showTimeUpMessage,
  showIncompleteTestMessage,
  showConfirmSubmissionMessage,
  showErrorMessage,
  showSuccessMessage,
  hideMessage,
} from '../Components/SubmissionMessage';

import {
  handleTestSubmission,
  handleNextQuestion,
  handlePreviousQuestion,
  handleAnswerSelect,
  handleInstructionsAccept,
  handleInstructionsClose,
  renderProgressBar,
  renderQuestionOptions,
  renderLoadingScreen,
  renderErrorScreen,
  renderNoQuestionsScreen,
  renderExplanation,
  renderNavigationButtons,
  renderSubmissionLoading,
  initializeTestTimer,
  fetchTestQuestions,
} from '../Components/ChampionUtil';

const {width} = Dimensions.get('window');

const ChampionTest = ({route, navigation}) => {
  const {testId, testTitle, source,effectiveTimeRemaining } = route.params || {};
  const [isNavigationWarningActive, setIsNavigationWarningActive] =
    useState(false);
  // Determine which API to use based on source or route name
  const isFromTestPaper =
    source === 'TestPaper' || route.name === 'TestFromPaper';

  // Get user ID from AuthContext instead of AsyncStorage
  const {getUserId, isAuthenticated, loading: authLoading} = useAuth();

  const userId = getUserId();
  const [testStartTime, setTestStartTime] = useState(null);

  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showInstructions, setShowInstructions] = useState(true);
  const [instructionsAccepted, setInstructionsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [isTestCompleted, setIsTestCompleted] = useState(false);

  const [actualElapsedTime, setActualElapsedTime] = useState(0);

  const [submissionInProgress, setSubmissionInProgress] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(null);

  const [effectiveTestDuration, setEffectiveTestDuration] = useState(null);
  const [timingWarning, setTimingWarning] = useState(null);

  // ADD these new functions
  const calculateEffectiveTestDuration = testData => {
    console.log('🕐 Calculating effective test duration...');

    if (
      !testData.testStartDate ||
      !testData.testEndDate ||
      !testData.startTime ||
      !testData.endTime
    ) {
      console.log('⚠️ Missing timing data, using original duration');
      return testData.duration * 60; // Return original duration in seconds
    }

    const now = new Date();
    const testEndDateTime = new Date(
      `${testData.testEndDate}T${testData.endTime}`,
    );

    console.log('🕐 Current time:', now.toISOString());
    console.log('🕐 Test end time:', testEndDateTime.toISOString());

    // Calculate remaining time in the test active window (in seconds)
    const remainingActiveTime = Math.floor((testEndDateTime - now) / 1000);

    // Original test duration in seconds
    const originalDuration = testData.duration * 60;

    console.log('🕐 Remaining active time:', remainingActiveTime, 'seconds');
    console.log('🕐 Original duration:', originalDuration, 'seconds');

    // Return the minimum of remaining active time and original duration
    const effectiveDuration = Math.min(remainingActiveTime, originalDuration);
    console.log('🕐 Effective duration:', effectiveDuration, 'seconds');

    return effectiveDuration;
  };

  const validateTestTiming = testData => {
    console.log('✅ Validating test timing...');

    if (
      !testData.testStartDate ||
      !testData.testEndDate ||
      !testData.startTime ||
      !testData.endTime
    ) {
      console.log('⚠️ Missing timing data, allowing test to start');
      return {
        canStart: true,
        remainingTime: testData.duration * 60,
        warning: null,
      };
    }

    const now = new Date();
    const testStartDateTime = new Date(
      `${testData.testStartDate}T${testData.startTime}`,
    );
    const testEndDateTime = new Date(
      `${testData.testEndDate}T${testData.endTime}`,
    );

    console.log('✅ Test start time:', testStartDateTime.toISOString());
    console.log('✅ Test end time:', testEndDateTime.toISOString());
    console.log('✅ Current time:', now.toISOString());

    // Check if test hasn't started yet
    if (now < testStartDateTime) {
      return {
        canStart: false,
        reason: 'Test has not started yet',
        remainingTime: 0,
        warning: null,
      };
    }

    // Check if test has ended
    if (now >= testEndDateTime) {
      return {
        canStart: false,
        reason: 'Test active time has ended',
        remainingTime: 0,
        warning: null,
      };
    }

    // Calculate remaining time
    const remainingTime = Math.floor((testEndDateTime - now) / 1000);
    const originalDuration = testData.duration * 60;
    const effectiveDuration = Math.min(remainingTime, originalDuration);

    // Check if there's at least 1 minute remaining
    if (remainingTime < 60) {
      return {
        canStart: false,
        reason: 'Insufficient time remaining (less than 1 minute)',
        remainingTime: remainingTime,
        warning: null,
      };
    }

    // Generate warning message if time is limited
    let warning = null;
    if (effectiveDuration < originalDuration) {
      const effectiveMinutes = Math.floor(effectiveDuration / 60);
      const originalMinutes = Math.floor(originalDuration / 60);
      warning = `Due to the test active time window, you have ${effectiveMinutes} minutes available instead of the full ${originalMinutes} minutes.`;
    }

    return {
      canStart: true,
      remainingTime: effectiveDuration,
      warning: warning,
    };
  };

  const fetchTestData = async testId => {
    try {
      setLoading(true);
      setError(null);

      if (!testId) throw new Error('Test ID is required');

      let response;

      if (isFromTestPaper) {
        // Use TestPaper API
        response = await getAPI(TestPaperByIdUrl, {}, testId, true);

        // Transform the data to ensure consistent format
        const transformedData = {
          ...response,
          questions:
            response.questions?.map(q => ({
              ...q,
              createQuestion: q.createQuestion || q.question,
              marks: q.marks || 1,
              section: q.section || 'General',
            })) || [],
          duration: response.duration || 60,
          totalMarks: response.totalMarks || response.questions?.length || 0,
          noOfQuestions: response.questions?.length || 0,
          testTitle: response.testTitle || testTitle || 'Test',
          terms:
            response.terms ||
            response.instructions ||
            'Please read all questions carefully and answer to the best of your ability.',
        };

        setTestData(transformedData);
      } else {
        // Use ChampionTest API - call the imported function
        await fetchTestQuestions(testId, setTestData, setError, setLoading);
        return; // fetchTestQuestions handles setLoading, so we return early
      }
    } catch (err) {
      console.error('❌ Error fetching test data:', err.message);
      setError(err.message || 'Failed to load test data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (testId) {
      fetchTestData(testId);
    } else {
      setError('No test ID provided');
      setLoading(false);
    }
  }, [testId, isFromTestPaper]);

  // Handle hardware back button and navigation gestures
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Only show warning if test has started and not completed
        if (testStarted && !isTestCompleted && !showInstructions) {
          showNavigationWarning();
          return true; // Prevent default back action
        }
        return false; // Allow default back action
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => subscription.remove();
    }, [testStarted, isTestCompleted, showInstructions]),
  );

  // Handle navigation gestures and other navigation events
  useEffect(() => {
    const unsubscribeBeforeRemove = navigation.addListener(
      'beforeRemove',
      e => {
        // Only prevent navigation if test is active
        if (!testStarted || isTestCompleted || showInstructions) {
          return; // Allow navigation
        }

        // Prevent default behavior of leaving the screen
        e.preventDefault();

        // Show navigation warning
        showNavigationWarning();
      },
    );

    return unsubscribeBeforeRemove;
  }, [navigation, testStarted, isTestCompleted, showInstructions]);

  const onInstructionsAccept = () => {
    console.log('📋 Instructions accepted, validating timing...');

    if (effectiveTimeRemaining) {
    console.log('🚀 Using effective time from route params:', effectiveTimeRemaining);
    startTestWithEffectiveDuration(effectiveTimeRemaining);
    return;
  }

    const timingValidation = validateTestTiming(testData);

    if (!timingValidation.canStart) {
      Alert.alert('Cannot Start Test', timingValidation.reason, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
      return;
    }

    // Show warning if time is limited
    if (timingValidation.warning) {
      Alert.alert('Limited Time Available', timingValidation.warning, [
        {
          text: 'Continue',
          onPress: () => {
            startTestWithEffectiveDuration(timingValidation.remainingTime);
          },
        },
        {
          text: 'Go Back',
          style: 'cancel',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      startTestWithEffectiveDuration(timingValidation.remainingTime);
    }
  };

  // ADD this new helper function
  const startTestWithEffectiveDuration = effectiveDuration => {
    console.log('🚀 Starting test with effective duration:', effectiveDuration);

    handleInstructionsAccept(setShowInstructions, setInstructionsAccepted);
    setTestStarted(true);
    setEffectiveTestDuration(effectiveDuration);

    // Initialize test timer when instructions are accepted
    const startTime = initializeTestTimer();
    setTestStartTime(startTime);
  };

  const onInstructionsClose = () => {
    handleInstructionsClose(navigation);
  };

  const onAnswerSelect = (questionId, selectedOption) => {
    handleAnswerSelect(questionId, selectedOption, setSelectedAnswers);
  };

  const onNext = () =>
    handleNextQuestion(currentQuestionIndex, testData, setCurrentQuestionIndex);
  const onPrevious = () =>
    handlePreviousQuestion(currentQuestionIndex, setCurrentQuestionIndex);

  // Handle question selection from menu
  const handleQuestionSelect = questionIndex => {
    setCurrentQuestionIndex(questionIndex);
  };

  // Handle skip functionality
  const handleSkip = () => {
    if (currentQuestionIndex < testData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleTimeUp = elapsedTimeInSeconds => {
    if (isTestCompleted || isSubmitting) {
      return;
    }

    // IMMEDIATELY set test as completed to prevent multiple calls
    setIsTestCompleted(true);
    setActualElapsedTime(elapsedTimeInSeconds);

    showTimeUpMessage(() => {
      hideMessage();
      submitTestWithElapsedTime(elapsedTimeInSeconds);
    });
  };

  const handleTimeUpdate = elapsedTimeInSeconds => {
    setActualElapsedTime(elapsedTimeInSeconds);
  };

  const submitTestWithElapsedTime = async (
    elapsedTimeInSeconds = actualElapsedTime,
  ) => {
    const userId = getUserId();
    if (!userId) {
      showErrorMessage('Error', 'User not authenticated. Please login again.');
      return;
    }

    if (!testStartTime) {
      showErrorMessage(
        'Error',
        'Test timing data is missing. Please try again.',
      );
      return;
    }

    try {
      const formatTime = seconds => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs
          .toString()
          .padStart(2, '0')}`;
      };

      const formattedTimeTaken = formatTime(elapsedTimeInSeconds);

      // Create adjusted start time to match client elapsed time
      const now = new Date();
      const adjustedStartTime = new Date(
        now.getTime() - elapsedTimeInSeconds * 1000,
      );

      await handleTestSubmission(
        testId,
        selectedAnswers,
        setIsSubmitting,
        userId,
        adjustedStartTime.toISOString(), // Send adjusted start time
        response => {
          setIsTestCompleted(true);

          Alert.alert(
            'Success!',
            `Test submitted successfully!\nTime taken: ${formattedTimeTaken}`,
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{name: 'ChampionSeries'}],
                  });
                },
              },
            ],
            {cancelable: false},
          );
        },
        errorMessage => {
          const errorText =
            typeof errorMessage === 'string'
              ? errorMessage
              : 'Submission failed';
          setIsTestCompleted(false);
          showErrorMessage('Submission Failed', errorText);
        },
      );
    } catch (error) {
      console.error('❌ Test submission with elapsed time failed:', error);
      setIsTestCompleted(false);
    }
  };

  // Handle test submission when user wants to navigate away
  const submitTestAndNavigateBack = async () => {
    const userId = getUserId();
    if (!userId) {
      showErrorMessage('Error', 'User not authenticated. Please login again.');
      return;
    }

    if (!testStartTime) {
      showErrorMessage(
        'Error',
        'Test timing data is missing. Please try again.',
      );
      return;
    }

    setIsTestCompleted(true);

    try {
      const endTime = new Date().toISOString();

      await handleTestSubmission(
        testId,
        selectedAnswers,
        setIsSubmitting,
        userId,
        testStartTime,
        endTime,
        actualElapsedTime, // Pass actual elapsed time
        response => {
          hideMessage();
          navigation.goBack();
        },
        errorMessage => {
          setIsTestCompleted(false);
          showErrorMessage('Submission Failed', errorMessage);
        },
      );
    } catch (error) {
      console.error('❌ Test submission failed with error:', error);
      setIsTestCompleted(false);
    }
  };

  const showNavigationWarning = () => {
    if (isNavigationWarningActive) return; // Prevent multiple alerts

    setIsNavigationWarningActive(true);
    Alert.alert(
      'Submit Test?',
      'If you navigate away, your test will be automatically submitted with current answers. Do you want to continue?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setIsNavigationWarningActive(false);
          },
        },
        {
          text: 'OK',
          style: 'destructive',
          onPress: () => {
            setIsNavigationWarningActive(false);
            // Set a flag to indicate this is a forced navigation
            submitTestAndNavigateBack();
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleSubmitTest = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    const totalQuestions = testData?.questions?.length || 0;

    if (answeredCount < totalQuestions) {
      showIncompleteTestMessage(
        answeredCount,
        totalQuestions,
        () => {
          hideMessage();
          submitTest();
        },
        () => {
          hideMessage();
        },
      );
    } else {
      showConfirmSubmissionMessage(
        () => {
          hideMessage();
          submitTest();
        },
        () => {
          hideMessage();
        },
      );
    }
  };

  const submitTest = async () => {
    await submitTestWithElapsedTime(actualElapsedTime);
  };

  const onRetryFetch = () => {
    fetchTestData(testId);
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <View
        style={[
          styles.container,
          {justifyContent: 'center', alignItems: 'center'},
        ]}>
        <Header />
        <Text style={{fontSize: 18, color: '#6B7280'}}>
          Please login to take the test
        </Text>
      </View>
    );
  }

  if (showInstructions) {
    return (
      <>
        <View style={styles.container}></View>
        <TestInstructions
          visible={showInstructions}
          onAccept={onInstructionsAccept}
          onClose={onInstructionsClose}
          testTitle={testData?.testTitle || testTitle}
          testData={testData}
        />
      </>
    );
  }

  // Render Loading Screen
  if (loading || authLoading) {
    return <View style={styles.container}>{renderLoadingScreen(styles)}</View>;
  }

  // Render Error Screen
  if (error || !testData) {
    return (
      <View style={styles.container}>
        {renderErrorScreen(error, onRetryFetch, navigation, styles)}
      </View>
    );
  }

  // Render No Questions Screen
  if (!testData.questions || testData.questions.length === 0) {
    return (
      <View style={styles.container}>
        {renderNoQuestionsScreen(navigation, styles)}
      </View>
    );
  }

  const currentQuestion = testData.questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = testData?.questions?.length || 0;

  // Check if current question is answered
  const isCurrentQuestionAnswered =
    selectedAnswers[currentQuestion.id] !== undefined;

  // Main Test Screen
  return (
    <View style={styles.container}>
      {/* Test Header with Timer, Submit Button, and Menu */}
      <View style={styles.testHeaderContainer}>
        <View style={styles.headerTopSection}>
          <TestMenu
            testData={testData}
            selectedAnswers={selectedAnswers}
            currentQuestionIndex={currentQuestionIndex}
            navigation={navigation}
            onQuestionSelect={handleQuestionSelect}
          />
          {/* REPLACE the existing PaperTimer component */}
          <PaperTimer
            duration={effectiveTestDuration || testData?.duration * 60}
            onTimeUp={handleTimeUp}
            onTimeUpdate={handleTimeUpdate}
            isActive={testStarted && !isTestCompleted}
            testData={testData}
            showRemainingTime={true}
          />

          {/* Submit Button in Header */}
          <TouchableOpacity
            style={styles.headerSubmitButton}
            onPress={() => {
              if (!isSubmitting && !submissionInProgress) {
                handleSubmitTest();
              }
            }}
            disabled={isSubmitting || submissionInProgress}>
            <Text style={styles.headerSubmitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.QestionHeader}>
        <View style={styles.testTitleSection}>
          <View style={styles.questionInfoContainer}>
            <View style={styles.questionNumberBadge}>
              <Text style={styles.questionNumberText}>
                Q{currentQuestionIndex + 1}
              </Text>
            </View>
            <View style={styles.questionMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.sectionText}>
                  Section: {currentQuestion.section}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.progressText}>
                  Progress: {answeredCount}/{totalQuestions}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.marksContainer}>
            <Text style={styles.marksText}>Marks: {currentQuestion.marks}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>
            {currentQuestion.createQuestion}
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.optionsTitle}>Choose your answer:</Text>
          {renderQuestionOptions(
            currentQuestion,
            selectedAnswers,
            onAnswerSelect,
            styles,
          )}
        </View>
      </ScrollView>

      {/* Navigation with Skip Button - Fixed positioning */}
      <View style={styles.navigationContainer}>
        <View style={styles.navigationBackground} />
        <View style={styles.navigationContent}>
          <TouchableOpacity
            style={[styles.navButton, styles.secondaryNavButton]}
            onPress={onPrevious}
            disabled={currentQuestionIndex === 0}>
            <Text
              style={[
                styles.secondaryNavButtonText,
                currentQuestionIndex === 0 && styles.disabledButtonText,
              ]}>
              Previous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.saveNextButton,
              !isCurrentQuestionAnswered && styles.disabledSaveNextButton,
            ]}
            onPress={onNext}
            disabled={
              currentQuestionIndex >= testData.questions.length - 1 ||
              !isCurrentQuestionAnswered
            }>
            <Text
              style={[
                styles.saveNextButtonText,
                (currentQuestionIndex >= testData.questions.length - 1 ||
                  !isCurrentQuestionAnswered) &&
                  styles.disabledButtonText,
              ]}>
              {currentQuestionIndex < testData.questions.length - 1
                ? 'Save & Next'
                : 'Last Question'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.skipButton]}
            onPress={handleSkip}
            disabled={currentQuestionIndex >= testData.questions.length - 1}>
            <Text
              style={[
                styles.skipButtonText,
                currentQuestionIndex >= testData.questions.length - 1 &&
                  styles.disabledButtonText,
              ]}>
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderSubmissionLoading(isSubmitting, styles)}
    </View>
  );
};

// Updated styles with proper spacing and button logic
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  testHeaderContainer: {
    backgroundColor: '#3F4856',
    padding: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  QestionHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // New Header Submit Button Styles
  headerSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#EF4444',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  testTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  questionNumberBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  questionNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  questionMeta: {
    flex: 1,
  },
  metaItem: {
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  marksContainer: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  marksText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 120, // Add padding to ensure content doesn't hide behind navigation
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  questionText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    fontWeight: '500',
  },
  optionsContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 5,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  selectedOption: {
    borderColor: '#6366F1',
    backgroundColor: '#EEF2FF',
    elevation: 2,
    shadowOpacity: 0.1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionKeyContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedOptionKeyContainer: {
    backgroundColor: '#6366F1',
  },
  optionKey: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedOptionKey: {
    color: '#FFFFFF',
  },
  optionValue: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#1F2937',
    fontWeight: '500',
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  navigationBackground: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 100, // Fixed height to prevent content overlap
  },
  navigationContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 26, // Extra padding from device navigation
  },
  navButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryNavButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  skipButton: {
    backgroundColor: '#F59E0B',
    elevation: 2,
    shadowColor: '#F59E0B',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveNextButton: {
    backgroundColor: '#6366F1',
    elevation: 2,
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  disabledSaveNextButton: {
    backgroundColor: '#D1D5DB',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButton: {
    backgroundColor: '#059669',
    elevation: 3,
    shadowColor: '#059669',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  secondaryNavButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveNextButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#0288D1',
    marginTop: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#6366F1',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  progressBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  submissionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  submissionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    minWidth: 200,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submissionText: {
    fontSize: 16,
    color: '#1F2937',
    marginTop: 16,
    fontWeight: '500',
  },
  noQuestionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
  },
  noQuestionsIcon: {
    marginBottom: 16,
  },
  noQuestionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  noQuestionsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textCenter: {
    textAlign: 'center',
  },
  marginTop: {
    marginTop: 16,
  },
  marginBottom: {
    marginBottom: 16,
  },
  paddingHorizontal: {
    paddingHorizontal: 20,
  },
  fullWidth: {
    width: '100%',
  },
  hidden: {
    display: 'none',
  },
  visible: {
    display: 'flex',
  },
});

export default ChampionTest;

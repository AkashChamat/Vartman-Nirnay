import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '../Components/Header';
import TestInstructions from '../Components/TestInstructions';
import PaperTimer from '../Components/PaperTimer';
import TestMenu from '../Components/TestMenu';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../Auth/AuthContext';

import {
  handleTestSubmission,
  fetchTestQuestions,
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
} from '../Components/ChampionUtil';

const {width} = Dimensions.get('window');

const ChampionTest = ({route, navigation}) => {
  const {testId, testTitle} = route.params || {};

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
  const [isTestCompleted, setIsTestCompleted] = useState(false); // Add this state

  useEffect(() => {
    if (testId) {
      fetchTestQuestions(testId, setTestData, setError, setLoading);
    } else {
      setError('No test ID provided');
      setLoading(false);
    }
  }, [testId]);

  // Event handlers using utility functions
  const onInstructionsAccept = () => {
    handleInstructionsAccept(setShowInstructions, setInstructionsAccepted);
    setTestStarted(true);

    // Initialize test timer when instructions are accepted
    const startTime = initializeTestTimer();
    setTestStartTime(startTime);

    // console.log('🎯 Test initialized with start time:', startTime);
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

  // Handle time up - only if test is not completed
  const handleTimeUp = () => {
    if (isTestCompleted) {
      return; // Don't show alert if test is already completed
    }

    Alert.alert(
      "Time's Up!",
      'Your test time has ended. The test will be automatically submitted.',
      [
        {
          text: 'OK',
          onPress: () => submitTest(),
          style: 'default',
        },
      ],
      {cancelable: false},
    );
  };

  const handleSubmitTest = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    const totalQuestions = testData?.questions?.length || 0;

    if (answeredCount < totalQuestions) {
      Alert.alert(
        'Incomplete Test',
        `You have answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Submit Anyway',
            onPress: () => submitTest(),
            style: 'destructive',
          },
        ],
      );
    } else {
      Alert.alert(
        'Submit Test',
        'Are you sure you want to submit your test? This action cannot be undone.',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Submit',
            onPress: () => submitTest(),
            style: 'default',
          },
        ],
      );
    }
  };

  const submitTest = async () => {
    const userId = getUserId();

    if (!userId) {
      Alert.alert('Error', 'User not authenticated. Please login again.');
      return;
    }

    if (!testStartTime) {
      Alert.alert('Error', 'Test timing data is missing. Please try again.');
      return;
    }

    // Mark test as completed to prevent timer alerts
    setIsTestCompleted(true);

    try {
      await handleTestSubmission(
        testId,
        selectedAnswers,
        setIsSubmitting,
        userId,
        testStartTime, // Pass the test start time
        response => {
          Alert.alert(
            'Test Submitted Successfully!',
            'Your test has been submitted. You can now view your results.',
            [
              {
                text: 'View Result',
                onPress: () => {
                  // Navigate to result screen
                  navigation.navigate('ChampionResult', {
                    userId: userId,
                    testPaperId: testId,
                    testTitle: testTitle,
                  });
                },
                style: 'default',
              },
              {
                text: 'Back to Home',
                onPress: () => {
                  // Navigate back to main screen or home
                  navigation.navigate('ChampionSeries'); // or your home screen name
                },
                style: 'cancel',
              },
            ],
          );
        },
        errorMessage => {
          // Error callback - reset completion state on error
          setIsTestCompleted(false);
          Alert.alert('Submission Failed', errorMessage, [
            {text: 'OK', style: 'default'},
          ]);
        },
      );
    } catch (error) {
      console.error('❌ Test submission failed with error:', error);
      // Reset completion state on error
      setIsTestCompleted(false);
    }
  };

  const onRetryFetch = () => {
    fetchTestQuestions(testId, setTestData, setError, setLoading);
  };

  // Check if user is authenticated before rendering
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
          testTitle={testTitle}
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

  // Main Test Screen
  return (
    <View style={styles.container}>
      {/* Test Header with Timer and Menu */}
      <View style={styles.testHeaderContainer}>
        <View style={styles.headerTopSection}>
          <PaperTimer
            duration={testData.duration}
            onTimeUp={handleTimeUp}
            testStarted={testStarted}
            isTestCompleted={isTestCompleted} // Pass completion state to timer
          />
          <TestMenu
            testData={testData}
            selectedAnswers={selectedAnswers}
            currentQuestionIndex={currentQuestionIndex}
            navigation={navigation}
            onQuestionSelect={handleQuestionSelect}
          />
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
            </View>
          </View>
          <View style={styles.marksContainer}>
            <Text style={styles.marksText}>Marks: {currentQuestion.marks}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        {/* Explanation */}
        {/* {renderExplanation(currentQuestion, selectedAnswers, styles)} */}
      </ScrollView>

      {/* Navigation with Skip Button */}
      <View style={styles.navigationContainer}>
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
          style={[styles.navButton, styles.skipButton]}
          onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>

        {currentQuestionIndex < testData.questions.length - 1 ? (
          <TouchableOpacity
            style={[styles.navButton, styles.saveNextButton]}
            onPress={onNext}>
            <Text style={styles.saveNextButtonText}>Save & Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButton, styles.submitButton]}
            onPress={handleSubmitTest}
            disabled={isSubmitting}>
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {renderSubmissionLoading(isSubmitting, styles)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  testHeaderContainer: {
    backgroundColor: '#3F4856',
    padding:8,
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
    // marginBottom: 16,
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

  // ========== OPTION BUTTONS STYLES ==========
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

  // ========== NAVIGATION BUTTONS STYLES ==========
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
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

  // ========== LOADING & ERROR STATES ==========
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

  // ========== PROGRESS BAR STYLES ==========
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
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },

  // ========== SUBMISSION LOADING OVERLAY ==========
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

  // ========== NO QUESTIONS SCREEN ==========
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

  // ========== UTILITY STYLES ==========
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

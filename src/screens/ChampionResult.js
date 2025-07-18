import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import {champresult, getTestAnalysis} from '../util/apiCall';
import {useAuth} from '../Auth/AuthContext';

const {width, height} = Dimensions.get('window');

const ChampionResult = ({route, navigation}) => {
  const {userId, testPaperId, testTitle} = route.params || {};
  const {isAuthenticated} = useAuth();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState(0);
  const [analysisData, setAnalysisData] = useState({});
  const [analysisLoading, setAnalysisLoading] = useState(false);

  const tabs = [
    {id: 0, title: 'Results', icon: 'assessment'},
    {id: 1, title: 'All', icon: 'list', type: 'ALL'},
    {id: 2, title: 'Correct', icon: 'check-circle', type: 'CORRECT'},
    {id: 3, title: 'Incorrect', icon: 'cancel', type: 'INCORRECT'},
    {id: 4, title: 'Unsolved', icon: 'help-outline', type: 'UNSOLVED'},
  ];

  useEffect(() => {

    if (!userId || !testPaperId) {
      setError('Missing required parameters');
      setLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    fetchResult();
  }, [userId, testPaperId, isAuthenticated]);

  useEffect(() => {
    // Fetch analysis data when tab changes (except for Results tab)
    if (activeTab > 0) {
      const currentTab = tabs[activeTab];

      fetchAnalysisData(currentTab.type);
    }
  }, [activeTab, userId, testPaperId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await champresult({}, [userId, testPaperId]);

      setResult(response);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching result:', err);

      if (err.message && err.message.includes('no attempts')) {
        setError('No test attempts found. Please complete the test first.');
      } else {
        setError('Failed to fetch result. Please try again.');
      }
      setLoading(false);
    }
  };

  const fetchAnalysisData = async type => {
    try {
     
      setAnalysisLoading(true);
      const response = await getTestAnalysis(userId, testPaperId, type);

      // Handle response - it should be an array based on your API responses
      const questionsArray = Array.isArray(response)
        ? response
        : response.data || [];

      setAnalysisData(prev => ({
        ...prev,
        [type]: questionsArray,
      }));
    } catch (err) {
      console.error('Error fetching analysis:', err);
      Alert.alert('Error', 'Failed to fetch analysis data');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleRetry = () => {
    fetchResult();
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.activeTab]}
            onPress={() => setActiveTab(tab.id)}>
            <MaterialIcons
              name={tab.icon}
              size={18}
              color={activeTab === tab.id ? '#6366F1' : '#6B7280'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText,
              ]}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderLoadingScreen = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#0288D1" />
      <Text style={styles.loadingText}>Loading your results...</Text>
    </View>
  );

  const renderErrorScreen = () => (
    <View style={styles.centerContainer}>
      <MaterialIcons name="error-outline" size={80} color="#EF4444" />
      <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
        <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCompactResultCard = (title, value, icon, color = '#6366F1') => (
    <View style={styles.compactResultCard}>
      <View style={[styles.compactResultIcon, {backgroundColor: `${color}20`}]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.compactResultTitle}>{title}</Text>
      <Text style={[styles.compactResultValue, {color}]}>{value}</Text>
    </View>
  );

  const getScoreColor = percentage => {
    if (percentage >= 80) return '#10B981'; // Green
    if (percentage >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const renderQuestionItem = ({item, index}) => {
    const getStatusColor = status => {
      if (status === 'CORRECT') return '#10B981'; // Green
      if (status === 'INCORRECT') return '#EF4444'; // Red
      return '#6B7280'; // Gray for UNSOLVED
    };

    const getStatusIcon = status => {
      if (status === 'CORRECT') return 'check-circle';
      if (status === 'INCORRECT') return 'cancel';
      return 'help-outline';
    };

    const getStatusText = status => {
      switch (status) {
        case 'CORRECT':
          return 'Correct';
        case 'INCORRECT':
          return 'Incorrect';
        case 'UNSOLVED':
          return 'Unsolved';
        default:
          return 'Unknown';
      }
    };

    return (
      <View style={styles.questionCard}>
        <View style={styles.questionHeader}>
          <View style={styles.questionNumber}>
            <Text style={styles.questionNumberText}>Q{index + 1}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: `${getStatusColor(item.status)}20`},
            ]}>
            <MaterialIcons
              name={getStatusIcon(item.status)}
              size={16}
              color={getStatusColor(item.status)}
            />
            <Text
              style={[styles.statusText, {color: getStatusColor(item.status)}]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.questionText}>{item.question}</Text>

        {/* Display all options */}
        <View style={styles.optionsContainer}>
          {['A', 'B', 'C', 'D', 'E'].map(option => {
            const optionKey = `option${option}`;
            const optionText = item[optionKey];

            if (!optionText || optionText.trim() === '') return null;

            const isUserAnswer = item.userAnswer === option;
            const isCorrectAnswer = item.correctAnswer === option;

            return (
              <View
                key={option}
                style={[
                  styles.optionItem,
                  isUserAnswer && isCorrectAnswer && styles.correctAnswerOption,
                  isUserAnswer && !isCorrectAnswer && styles.wrongAnswerOption,
                  !isUserAnswer &&
                    isCorrectAnswer &&
                    styles.correctAnswerOption,
                ]}>
                <Text
                  style={[
                    styles.optionLabel,
                    (isUserAnswer || isCorrectAnswer) &&
                      styles.highlightedOptionLabel,
                  ]}>
                  {option})
                </Text>
                <Text
                  style={[
                    styles.optionText,
                    (isUserAnswer || isCorrectAnswer) &&
                      styles.highlightedOptionText,
                  ]}>
                  {optionText}
                </Text>
                {isUserAnswer && (
                  <MaterialIcons
                    name="person"
                    size={16}
                    color={isCorrectAnswer ? '#10B981' : '#EF4444'}
                    style={styles.userIcon}
                  />
                )}
                {isCorrectAnswer && (
                  <MaterialIcons
                    name="check-circle"
                    size={16}
                    color="#10B981"
                    style={styles.correctIcon}
                  />
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.answersContainer}>
          <View style={styles.answerRow}>
            <Text style={styles.answerLabel}>Your Answer: </Text>
            <Text
              style={[
                styles.answerValue,
                {
                  color: item.userAnswer
                    ? item.status === 'CORRECT'
                      ? '#10B981'
                      : '#EF4444'
                    : '#6B7280',
                },
              ]}>
              {item.userAnswer
                ? `${item.userAnswer}) ${
                    item[`option${item.userAnswer}`] || item.userAnswer
                  }`
                : 'Not Answered'}
            </Text>
          </View>

          <View style={styles.answerRow}>
            <Text style={styles.answerLabel}>Correct Answer: </Text>
            <Text style={[styles.answerValue, {color: '#10B981'}]}>
              {item.correctAnswer && item.correctAnswer !== 'undefined'
                ? `${item.correctAnswer}) ${
                    item[`option${item.correctAnswer}`] || item.correctAnswer
                  }`
                : 'Not Available'}
            </Text>
          </View>
        </View>

        {item.answerExplanation && item.answerExplanation.trim() !== '' && (
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>Explanation:</Text>
            <Text style={styles.explanationText}>{item.answerExplanation}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderAnalysisContent = () => {
    const currentTab = tabs[activeTab];

    // Get data from analysisData for the current tab
    let questionsData = analysisData[currentTab.type] || [];

    if (analysisLoading) {

      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0288D1" />
          <Text style={styles.loadingText}>Loading analysis...</Text>
        </View>
      );
    }

    if (!questionsData || questionsData.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <MaterialIcons name="inbox" size={80} color="#6B7280" />
          <Text style={styles.emptyTitle}>No questions found</Text>
          <Text style={styles.emptyText}>
            No {currentTab.title.toLowerCase()} questions available for this
            test.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.analysisContainer}>
        <View style={styles.analysisHeader}>
          <Text style={styles.analysisTitle}>
            {currentTab.title} Questions ({questionsData.length})
          </Text>
        </View>

        <FlatList
          data={questionsData}
          renderItem={renderQuestionItem}
          keyExtractor={(item, index) => `question-${item.questionId || index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.questionsList}
        />
      </View>
    );
  };

  const renderResultContent = () => {
    if (!result) return null;

    const {
      attemptNumber = 0,
      correctQuestions = 0,
      incorrectQuestions = 0,
      solvedQuestions = 0,
      unsolvedQuestions = 0,
      totalScore = 0,
      timeTaken = '',
      testTitle: testName = testTitle || 'Test',
      userRank = '',
      questionResponses = [],
    } = result;

    const totalQuestions = solvedQuestions + unsolvedQuestions;
    const obtainedMarks = correctQuestions;
    const percentage =
      totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0;
    const scoreColor = getScoreColor(percentage);

    return (
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.testIconContainer}>
            <MaterialIcons name="emoji-events" size={40} color="#F59E0B" />
          </View>
          <Text style={styles.testName}>{testName}</Text>
          <Text style={styles.resultStatus}>Test Completed Successfully!</Text>
        </View>

        {/* Compact Stats Container */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Test Results</Text>

          {/* First Row: Total Questions and Correct Answers */}
          <View style={styles.statsRow}>
            {renderCompactResultCard(
              'Total Questions',
              totalQuestions.toString(),
              'quiz',
              '#6366F1',
            )}
            {renderCompactResultCard(
              'Correct',
              correctQuestions.toString(),
              'check-circle',
              '#10B981',
            )}
          </View>

          {/* Second Row: Wrong and Unanswered */}
          <View style={styles.statsRow}>
            {renderCompactResultCard(
              'Wrong',
              incorrectQuestions.toString(),
              'cancel',
              '#EF4444',
            )}
            {renderCompactResultCard(
              'Unanswered',
              unsolvedQuestions.toString(),
              'help-outline',
              '#6B7280',
            )}
          </View>

          {/* Third Row: Rank and Time (if available) */}
          {(userRank || timeTaken) && (
            <View style={styles.statsRow}>
              {userRank &&
                renderCompactResultCard(
                  'Rank',
                  userRank,
                  'leaderboard',
                  '#F59E0B',
                )}
              {timeTaken &&
                renderCompactResultCard(
                  'Time Taken',
                  timeTaken,
                  'access-time',
                  '#8B5CF6',
                )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoBack}>
            <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Back to Tests</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header />

      {loading && renderLoadingScreen()}
      {error && !loading && renderErrorScreen()}
      {!loading && !error && result && (
        <View style={styles.mainContent}>
          {renderTabBar()}
          {activeTab === 0 ? renderResultContent() : renderAnalysisContent()}
        </View>
      )}

      <Footer />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainContent: {
    flex: 1,
    width: width,
    height: height * 0.8, // Adjust based on header/footer height
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.05,
  },
  scrollContent: {
    paddingBottom: height * 0.15,
  },
  sectionTitle: {
    alignSelf: 'center',
    padding: 10,
    fontWeight: '600',
    fontSize: 16,
    color: '#1F2937',
  },

  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0288D1',
    marginTop: 12,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  backButton: {
    marginTop: 12,
    paddingVertical: 12,
  },
  backButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '500',
  },

  // Tab Styles
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabScrollContent: {
    paddingHorizontal: width * 0.05,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#6366F1',
    fontWeight: '600',
  },

  // Header Card Styles
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginVertical: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  testIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  testName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultStatus: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },

  // Compact Stats Container Styles
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  compactResultCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  compactResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactResultTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  compactResultValue: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Action Buttons Styles
  actionButtons: {
    marginBottom: height * 0.03, // Add margin based on screen height
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Question Analysis Styles
  analysisContainer: {
    flex: 1,
    paddingHorizontal: width * 0.05,
  },
  analysisHeader: {
    paddingVertical: 16,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  questionsList: {
    paddingBottom: height * 0.15, // Add bottom padding for footer clearance
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionNumber: {
    backgroundColor: '#6366F1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  questionNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  questionText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 12,
  },

  // Options Container Styles
  optionsContainer: {
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  correctAnswerOption: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  wrongAnswerOption: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
    minWidth: 20,
  },
  highlightedOptionLabel: {
    color: '#1F2937',
  },
  optionText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
  highlightedOptionText: {
    color: '#1F2937',
    fontWeight: '500',
  },
  userIcon: {
    marginLeft: 8,
  },
  correctIcon: {
    marginLeft: 8,
  },

  // Answer Container Styles
  answersContainer: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    minWidth: 100,
  },
  answerValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Explanation Styles
  explanationContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  explanationText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },

  // Empty State Styles
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ChampionResult;

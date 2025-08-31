import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from '../Components/Header';
import TestTimer from '../Components/TestTimer';
import Footer from '../Components/Footer';
import {championpaper, getAttemptCount, getUserId} from '../util/apiCall';
import {showMessage} from 'react-native-flash-message';
import {generateAndDownloadTestPaper} from '../Components/PDFGenerator';

const {width} = Dimensions.get('window');

const ChampionSeries = ({navigation}) => {
  const [testPapers, setTestPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attemptCounts, setAttemptCounts] = useState({});
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [downloadingPapers, setDownloadingPapers] = useState({});

  const fetchAttemptCounts = async papers => {
    try {
      setLoadingAttempts(true);
      const userId = await getUserId();
      if (!userId) return;

      const attemptCountsData = {};
      const promises = papers.map(async paper => {
        try {
          const attemptData = await getAttemptCount(userId, paper.id);
          let count = 0;
          if (attemptData && typeof attemptData === 'object') {
            if (attemptData.attemptCount !== undefined)
              count = attemptData.attemptCount;
            else if (attemptData.count !== undefined) count = attemptData.count;
            else if (
              attemptData.data &&
              attemptData.data.attemptCount !== undefined
            )
              count = attemptData.data.attemptCount;
            else if (attemptData.data && attemptData.data.count !== undefined)
              count = attemptData.data.count;
          } else if (typeof attemptData === 'number') {
            count = attemptData;
          }
          attemptCountsData[paper.id] = count;
        } catch (error) {
          console.error(
            `Error fetching attempt count for paper ${paper.id}`,
            error,
          );
          attemptCountsData[paper.id] = 0; // Default to 0 if error
        }
      });

      await Promise.all(promises);
      setAttemptCounts(attemptCountsData);
    } catch (error) {
      console.error('Critical error in fetchAttemptCounts:', error);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const getAttemptCountForPaper = paperId => {
    return attemptCounts[paperId] || 0;
  };

  const BlinkingNewBadge = ({testTitle}) => {
    const [fadeAnim] = useState(new Animated.Value(1));
    const [shouldBlink, setShouldBlink] = useState(true);
    const animationRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
      if (!shouldBlink) return;

      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
        {iterations: -1},
      );
      animationRef.current.start();

      timeoutRef.current = setTimeout(() => {
        setShouldBlink(false);
      }, 10000);

      return () => {
        if (animationRef.current) {
          animationRef.current.stop();
          animationRef.current = null;
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }, [fadeAnim, shouldBlink]);

    if (!shouldBlink) {
      return (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>NEW</Text>
        </View>
      );
    }

    return (
      <Animated.View style={[styles.newBadge, {opacity: fadeAnim}]}>
        <Text style={styles.newBadgeText}>NEW</Text>
      </Animated.View>
    );
  };

  const isLatestPaper = testPaper => {
    return testPapers.length > 0 && testPapers[0].id === testPaper.id;
  };

  const fetchTestPapers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await championpaper();
      //  console.log('response', response);
      const activePapers = (response.data || response)
        .filter(paper => paper.status === true)
        .sort((a, b) => b.id - a.id);
      setTestPapers(activePapers);
      await fetchAttemptCounts(activePapers);
    } catch (err) {
      setError('Failed to load test papers');
      console.error('Error in fetchTestPapers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestPapers();
  }, []);

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = timeString => {
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':').map(num => parseInt(num));
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const checkTestTiming = testPaper => {
    const now = new Date();
    const startDateTime = new Date(
      `${testPaper.testStartDate}T${testPaper.startTime}`,
    );
    const endDateTime = new Date(
      `${testPaper.testEndDate}T${testPaper.endTime}`,
    );

    if (now < startDateTime) {
      return {
        canStart: false,
        reason: 'not_started',
        message: `Test will start on ${formatDate(
          testPaper.testStartDate,
        )} at ${formatTime(testPaper.startTime)}`,
      };
    }

    if (now > endDateTime) {
      return {
        canStart: false,
        reason: 'ended',
        message: 'Test has been completed',
      };
    }

    // Calculate remaining time and show warning if less than original duration
    const remainingTime = Math.floor((endDateTime - now) / 1000);
    const originalDuration = testPaper.duration * 60; // Convert minutes to seconds

    if (remainingTime < 60) {
      return {
        canStart: false,
        reason: 'insufficient_time',
        message: 'Less than 1 minute remaining in test active time',
      };
    }

    let warningMessage = null;
    if (remainingTime < originalDuration) {
      const remainingMinutes = Math.floor(remainingTime / 60);
      const originalMinutes = testPaper.duration;
      warningMessage = `Only ${remainingMinutes} minutes available instead of ${originalMinutes} minutes due to active time window.`;
    }

    return {
      canStart: true,
      reason: 'active',
      message: 'Test is active',
      warningMessage: warningMessage,
      remainingTime: remainingTime,
    };
  };

  // REPLACE the existing handleStartTest function
  const handleStartTest = testPaper => {
    const timingCheck = checkTestTiming(testPaper);

    if (!timingCheck.canStart) {
      let title = 'Test Not Available';
      if (timingCheck.reason === 'not_started') {
        title = 'Test Not Started';
      } else if (timingCheck.reason === 'ended') {
        title = 'Test Completed';
      } else if (timingCheck.reason === 'insufficient_time') {
        title = 'Insufficient Time';
      }

      showMessage({
        message: title,
        description: timingCheck.message,
        type: 'warning',
        icon: 'auto',
      });
      return;
    }

    const attemptCount = getAttemptCountForPaper(testPaper.id);
    const maxAttemptsAllowed = testPaper.maxAttemptsAllowed;

    // Only block entry and show warning if user exceeded attempts
    if (
      typeof maxAttemptsAllowed === 'number' &&
      attemptCount >= maxAttemptsAllowed
    ) {
      showMessage({
        message: 'Maximum Attempts Reached',
        description: `You have already used all your allowed attempts for this test.`,
        type: 'danger',
        icon: 'auto',
      });
      return;
    }

    // Show timing warning if applicable
    if (timingCheck.warningMessage) {
      Alert.alert(
        'Limited Time Available',
        timingCheck.warningMessage + '\n\nDo you want to continue?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Continue',
            onPress: () => {
              navigation.navigate('ChampionTest', {
                testId: testPaper.id,
                testTitle: testPaper.testTitle || 'Champion Test',
                source: 'ChampionSeries',
                effectiveTimeRemaining: timingCheck.remainingTime,
              });
            },
          },
        ],
      );
    } else {
      // Go to test normally
      navigation.navigate('ChampionTest', {
        testId: testPaper.id,
        testTitle: testPaper.testTitle || 'Champion Test',
        source: 'ChampionSeries',
      });
    }
  };

  const handleViewResult = testPaper => {
    if (!testPaper.showTestResult) {
      showMessage({
        message: 'Results Not Available',
        description: 'Results for this test are not available yet.',
        type: 'info',
        icon: 'auto',
      });
      return;
    }
    navigation.navigate('TestResult', {
      testId: testPaper.id,
      testTitle: testPaper.testTitle,
    });
  };

  const handleViewAllResult = testPaper => {
    navigation.navigate('AllResult', {
      testId: testPaper.id,
      testTitle: testPaper.testTitle,
      testStartDate: testPaper.testStartDate,
      pdfUrl: testPaper.allResultPdf || null,
    });
  };

  const handleViewMyResult = async testPaper => {
    try {
      const userId = await getUserId();
      if (!userId) {
        showMessage({
          message: 'User not authenticated',
          type: 'danger',
          icon: 'auto',
        });
        return;
      }

      const attemptCount = getAttemptCountForPaper(testPaper.id);
      if (attemptCount === 0) {
        showMessage({
          message: 'No Attempts Found',
          description: 'Please complete the test first to view your result.',
          type: 'warning',
          icon: 'auto',
        });
        return;
      }

      navigation.navigate('ChampionResult', {
        userId,
        testPaperId: testPaper.id,
        testTitle: testPaper.testTitle,
        source: 'ChampionSeries',
      });
    } catch (error) {
      console.error('Error in handleViewMyResult:', error);
      showMessage({
        message: 'Failed to load result',
        type: 'danger',
        icon: 'auto',
      });
    }
  };

  const handleDownloadTestPaper = async testPaper => {
    if (!testPaper) {
      showMessage({
        message: 'Error',
        description: 'Test paper data not available.',
        type: 'danger',
      });
      return;
    }

    try {
      setDownloadingPapers(prev => ({...prev, [testPaper.id]: true}));

      await generateAndDownloadTestPaper(testPaper);

      showMessage({
        message: 'Download complete',
        description: 'Your test paper PDF has been saved.',
        type: 'success',
      });
    } catch (error) {
      console.error('Download failed:', error);
      showMessage({
        message: 'Download Failed',
        description: error.message || 'An unexpected error occurred.',
        type: 'danger',
      });
    } finally {
      setDownloadingPapers(prev => ({...prev, [testPaper.id]: false}));
    }
  };

  const renderTestCard = ({item}) => {
    const attemptCount = getAttemptCountForPaper(item.id);
    const isNew = isLatestPaper(item);
    const hasValidImage = item.image && item.image.trim() !== '';

    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {hasValidImage ? (
            <Image
              source={{uri: item.image}}
              style={styles.testImage}
              resizeMode="contain"
              onError={error => {
                console.warn('Image failed to load:', item.image, error);
              }}
            />
          ) : (
            <View style={styles.noImageContainer}>
              <MaterialIcons name="image" size={40} color="#DFE3E8" />
              <Text style={styles.noImageText}>No Image</Text>
            </View>
          )}
          {isNew && <BlinkingNewBadge testTitle={item.testTitle} />}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.testTitle}
          </Text>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Questions:</Text>
              <Text style={styles.detailValue}>{item.noOfQuestions}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Marks:</Text>
              <Text style={styles.detailValue}>{item.totalMarks}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time:</Text>
              <Text style={styles.detailValue}>{item.duration} min</Text>
            </View>
          </View>

          <View style={styles.buttonContainerCompact}>
            <TouchableOpacity
              style={styles.startButtonCompact}
              onPress={() => handleStartTest(item)}>
              <Text style={styles.startButtonText}>Start Test</Text>
            </TouchableOpacity>

            <View style={styles.resultActionsGroup}>
              <TouchableOpacity
                style={[
                  styles.resultButtonCompact,
                  !item.showAllResult && styles.disabledButton,
                ]}
                onPress={() => handleViewAllResult(item)}
                disabled={!item.showAllResult}>
                <Text
                  style={[
                    styles.resultButtonTextCompact,
                    !item.showAllResult && styles.disabledButtonText,
                  ]}>
                  All Result
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.resultButtonCompact,
                  !item.showTestResult && styles.disabledButton,
                ]}
                onPress={() => handleViewMyResult(item)}
                disabled={!item.showTestResult}>
                <Text
                  style={[
                    styles.resultButtonTextCompact,
                    !item.showTestResult && styles.disabledButtonText,
                  ]}>
                  My Result
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.downloadIconButton,
                  !item.downloadTestPaper && styles.disabledButton,
                ]}
                onPress={() => handleDownloadTestPaper(item)}
                disabled={
                  downloadingPapers[item.id] || !item.downloadTestPaper
                }>
                {downloadingPapers[item.id] ? (
                  <ActivityIndicator size="small" color="#3182CE" />
                ) : (
                  <Icon
                    name="file-download"
                    size={18}
                    color={item.downloadTestPaper ? '#3182CE' : '#A0AEC0'}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="assignment" size={60} color="#DFE3E8" />
      <Text style={styles.emptyTitle}>No Test Papers Available</Text>
      <Text style={styles.emptySubtitle}>
        Check back later for new test papers!
      </Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="error-outline" size={60} color="#F28B8B" />
      <Text style={styles.emptyTitle}>Error Loading Tests</Text>
      <Text style={styles.emptySubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchTestPapers}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0288D1" />
          <Text style={styles.loadingText}>Loading test papers...</Text>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <View style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.pageTitle}>Champion Series</Text>
          <Text style={styles.pageSubtitle}>
            Choose a test to begin your challenge
          </Text>
        </View>

        <TestTimer
          navigation={navigation}
          onTestPress={paper => {
            if (isLatestPaper(paper)) {
              handleStartTest(paper);
            }
          }}
        />

        {error ? (
          renderErrorState()
        ) : (
          <FlatList
            data={testPapers}
            renderItem={renderTestCard}
            keyExtractor={item => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
            refreshing={loading}
            onRefresh={fetchTestPapers}
          />
        )}
      </View>
      <Footer />
    </View>
  );
};

export default ChampionSeries;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FAFBFD'},
  content: {flex: 1, paddingHorizontal: 16},
  headerSection: {paddingVertical: 12, marginBottom: 8},
  pageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0288D1',
    textAlign: 'center',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 12,
    color: '#0D47A1',
    textAlign: 'center',
  },
  listContainer: {paddingBottom: 100},
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#8B9DC3',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 0.5,
    borderColor: '#F0F4F8',
    overflow: 'hidden',
  },
  imageContainer: {position: 'relative', height: 180},
  testImage: {width: '100%', height: '100%'},
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F7FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  noImageText: {
    fontSize: 12,
    color: '#A0AEC0',
    fontWeight: '500',
    marginTop: 8,
  },
  cardContent: {padding: 16},
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
    lineHeight: 22,
    alignSelf: 'center',
    textAlign: 'center',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  detailRow: {alignItems: 'center'},
  detailLabel: {
    fontSize: 12,
    color: '#8B9DC3',
    fontWeight: '500',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '700',
  },
  buttonContainerCompact: {flexDirection: 'column', gap: 8},
  startButtonCompact: {
    backgroundColor: '#3182CE',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultActionsGroup: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  resultButtonCompact: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3182CE',
  },
  resultButtonTextCompact: {
    color: '#3182CE',
    fontSize: 12,
    fontWeight: '600',
  },
  downloadIconButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3182CE',
  },
  disabledButton: {
    backgroundColor: '#F7FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#A0AEC0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#0288D1',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8B9DC3',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#7C9CBF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  newBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'red',
    width: width * 0.3,
    height: width * 0.06,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [
      {rotate: '-45deg'},
      {translateX: -width * 0.09},
      {translateY: -width * 0.05},
    ],
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 10,
  },
  newBadgeText: {
    color: 'yellow',
    fontWeight: 'bold',
    fontSize: width * 0.035,
    letterSpacing: 0.5,
    transform: [{rotate: '0deg'}],
  },
});

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from '../Components/Header';
import TestTimer from '../Components/TestTimer'; // Import the reusable TestTimer component
import {
  championpaper,
  getpaperbyid,
  getAttemptCount,
  getUserId,
} from '../util/apiCall';
import Footer from '../Components/Footer';

const {width} = Dimensions.get('window');

const ChampionSeries = ({navigation}) => {
  const [testPapers, setTestPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attemptCounts, setAttemptCounts] = useState({});
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const fetchAttemptCounts = async papers => {
    try {
      setLoadingAttempts(true);
      const userId = await getUserId();

      if (!userId) {
        return;
      }

      const attemptCountsData = {};

      const promises = papers.map(async (paper, index) => {
        try {
          const startTime = Date.now();
          const attemptData = await getAttemptCount(userId, paper.id);
          const endTime = Date.now();

          let count = 0;

          if (attemptData && typeof attemptData === 'object') {
            if (attemptData.attemptCount !== undefined) {
              count = attemptData.attemptCount;
            } else if (attemptData.count !== undefined) {
              count = attemptData.count;
            } else if (
              attemptData.data &&
              attemptData.data.attemptCount !== undefined
            ) {
              count = attemptData.data.attemptCount;
            } else if (
              attemptData.data &&
              attemptData.data.count !== undefined
            ) {
              count = attemptData.data.count;
            }
          } else if (typeof attemptData === 'number') {
            count = attemptData;
          }

          attemptCountsData[paper.id] = count;
        } catch (error) {
          console.error(
            `❌ ==> Error fetching attempt count for paper ${paper.id}`,
          );
          console.error(`📝 ==> Paper title: "${paper.testTitle}"`);
          console.error(`🔍 ==> Error details:`, {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
          });

          attemptCountsData[paper.id] = 0; // Default to 0 if error
        }
      });

      await Promise.all(promises);

      setAttemptCounts(attemptCountsData);

      const totalAttempts = Object.values(attemptCountsData).reduce(
        (sum, count) => sum + count,
        0,
      );

      Object.entries(attemptCountsData).forEach(([paperId, count]) => {
        const paper = papers.find(p => p.id.toString() === paperId.toString());
      });
    } catch (error) {
      console.error('❌ ==> Critical error in fetchAttemptCounts:');
      console.error('🔍 ==> Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
    } finally {
      setLoadingAttempts(false);
    }
  };

  const getAttemptCountForPaper = paperId => {
    const count = attemptCounts[paperId] || 0;
    return count;
  };

  // Optimized BlinkingNewBadge that stops after a certain time
  const BlinkingNewBadge = ({testTitle}) => {
    const [fadeAnim] = useState(new Animated.Value(1));
    const [shouldBlink, setShouldBlink] = useState(true);
    const animationRef = useRef(null);
    const timeoutRef = useRef(null);

    useEffect(() => {
      if (!shouldBlink) return;

      const startBlinking = () => {
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
          {iterations: -1}
        );
        
        animationRef.current.start();
      };

      startBlinking();

      // Stop blinking after 10 seconds to reduce resource usage
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
      // Show static badge after blinking stops
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

  // Check if paper is the latest (first in sorted array)
  const isLatestPaper = testPaper => {
    return testPapers.length > 0 && testPapers[0].id === testPaper.id;
  };

  // Function to check test timing
  const checkTestTiming = testPaper => {
    const now = new Date();

    // Create start datetime
    const startDateTime = new Date(
      `${testPaper.testStartDate}T${testPaper.startTime}`,
    );

    // Create end datetime
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

    return {
      canStart: true,
      reason: 'active',
      message: 'Test is active',
    };
  };

  const fetchTestPapers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await championpaper();

      // Filter out inactive tests (status: false) and sort in descending order by ID
      const activePapers = (response.data || response)
        .filter(paper => paper.status === true) // Only show active tests
        .sort((a, b) => b.id - a.id);

      setTestPapers(activePapers);

      await fetchAttemptCounts(activePapers);
      setError(null);
    } catch (err) {
      const errorMessage = 'Failed to load test papers';
      setError(errorMessage);
      console.error('❌ ==> Error in fetchTestPapers:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
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
    // Handle time format properly
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

  // Simplified handleStartTest - only check timing, no attempt limits
  const handleStartTest = testPaper => {
    // Check test timing
    const timingCheck = checkTestTiming(testPaper);
    if (!timingCheck.canStart) {
      Alert.alert(
        timingCheck.reason === 'not_started'
          ? 'Test Not Started'
          : 'Test Completed',
        timingCheck.message,
        [{text: 'OK'}],
      );
      return;
    }

    // All checks passed, navigate to test
    const attemptCount = getAttemptCountForPaper(testPaper.id);
    navigation.navigate('ChampionTest', {
      testId: testPaper.id,
      testTitle: testPaper.testTitle,
      currentAttempts: attemptCount,
      maxAttemptsAllowed: testPaper.maxAttemptsAllowed,
      multipleAttemptsAllowed: testPaper.multipleAttemptsAllowed,
    });
  };

  const handleViewResult = testPaper => {
    // Check if results are available
    if (!testPaper.showTestResult) {
      Alert.alert(
        'Results Not Available',
        'Results for this test are not available yet.',
        [{text: 'OK'}],
      );
      return;
    }

    navigation.navigate('TestResult', {
      testId: testPaper.id,
      testTitle: testPaper.testTitle,
    });
  };

  // Handle test press from timer component
  const handleTestPress = (latestPaper) => {
    if (latestPaper) {
      handleStartTest(latestPaper);
    }
  };

 const handleViewAllResult = (testPaper) => {
  console.log(`📊 ==> Viewing all results for test: ${testPaper.testTitle}`);
  console.log(`📋 ==> Test ID: ${testPaper.id}`);
  
  // Navigate to AllResults screen with test details
  navigation.navigate('AllResult', {
    testId: testPaper.id,
    testTitle: testPaper.testTitle,
    pdfUrl: testPaper.allResultPdf || null, // Optional PDF URL if available
  });
};
  const handleViewMyResult = (testPaper) => {
  navigation.navigate('ChampionResult', {
    testId: testPaper.id,
    testTitle: testPaper.testTitle,
  });
};

const renderTestCard = ({item}) => {
  const attemptCount = getAttemptCountForPaper(item.id);
  const isNew = isLatestPaper(item); // Show badge for the latest paper
  
  // Check if image exists and is valid
  const hasValidImage = item.image && item.image.trim() !== '';

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {hasValidImage ? (
          <Image
            source={{uri: item.image}}
            style={styles.testImage}
            resizeMode="contain"
            onError={(error) => {
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

        {/* Result availability message */}
        {/* {!item.showTestResult && !item.showAllResult && (
          <View style={styles.attemptInfoContainer}>
            <Text style={styles.resultMessage}>
              Results will not be shown
            </Text>
          </View>
        )} */}

        <View style={styles.buttonContainerCompact}>
          <TouchableOpacity style={styles.startButtonCompact} onPress={() => handleStartTest(item)}>
            <Text style={styles.startButtonText}>Start Test</Text>
          </TouchableOpacity>
          
          <View style={styles.resultActionsGroup}>
            {/* All Result Button - Only show if showAllResult is true */}
            {item.showAllResult && (
              <TouchableOpacity 
                style={styles.resultButtonCompact} 
                onPress={() => handleViewAllResult(item)}>
                <Text style={styles.resultButtonTextCompact}>
                  All Result
                </Text>
              </TouchableOpacity>
            )}
            
            {/* My Result Button - Only show if showTestResult is true */}
            {item.showTestResult && (
              <TouchableOpacity 
                style={styles.resultButtonCompact} 
                onPress={() => handleViewMyResult(item)}>
                <Text style={styles.resultButtonTextCompact}>
                  My Result
                </Text>
              </TouchableOpacity>
            )}
            
            {/* Download Button - Always visible */}
            <TouchableOpacity 
              style={styles.downloadIconButton}
              onPress={() => handleDownloadTestPaper(item)}>
              <Icon 
                name="file-download" 
                size={18} 
                color="#3182CE" 
              />
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
        
        {/* Use the reusable TestTimer component */}
        <TestTimer 
          navigation={navigation} 
          onTestPress={handleTestPress}
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
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
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
  headerSection: {
    paddingVertical: 12,
    marginBottom: 8,
  },
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
  listContainer: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#8B9DC3',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 0.5,
    borderColor: '#F0F4F8',
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  testImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
    lineHeight: 22,
    alignSelf: 'center',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  detailRow: {
    alignItems: 'center',
  },
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
  attemptInfoContainer: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  resultMessage: {
    fontSize: 11,
    color: '#E53E3E',
    textAlign: 'center',
    fontWeight: '500',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  resultButtonText: {
    color: '#3182CE',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledResultText: {
    color: '#A0AEC0',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
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
  loadingSubText: {
    fontSize: 14,
    color: '#718096',
    marginTop: 4,
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
  buttonContainerCompact: {
    flexDirection: 'column',
    gap: 8,
  },
  startButtonCompact: {
    backgroundColor: '#3182CE',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: '#3182CE'
  },
  downloadIconButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3182CE'
  },
  resultButtonTextCompact: {
    color: '#3182CE',
    fontSize: 12,
    fontWeight: '600',
  },
});
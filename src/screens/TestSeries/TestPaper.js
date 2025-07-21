import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../../Auth/AuthContext';
import {useRoute, useNavigation} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
import {
  getPapersBySeries,
  getUserId,
  getAttemptCount,
} from '../../util/apiCall';
import { showMessage } from 'react-native-flash-message';

// CHANGE THIS PATH TO MATCH YOUR ACTUAL FILE LOCATION
import {generateAndDownloadTestPaper} from '../../Components/PDFGenerator';

const {width} = Dimensions.get('window');

const TestPaper = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {seriesId} = route.params;
  const {getUserId: getAuthUserId} = useAuth();
  const [testPapers, setTestPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attemptCounts, setAttemptCounts] = useState({});
  const [error, setError] = useState(null);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  useEffect(() => {
    fetchTestPapers();
  }, []);

  const fetchTestPapers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPapersBySeries(seriesId);
      const papers =
        (response.data || response)?.filter(p => p.status === true) || [];
      // Sort papers by ID in descending order (latest first)
      const sortedPapers = papers.sort((a, b) => b.id - a.id);
      setTestPapers(sortedPapers);
      await fetchAttemptCounts(sortedPapers);
    } catch (err) {
      setError('Failed to load test papers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttemptCounts = async papers => {
    try {
      setLoadingAttempts(true);
      const userId = await getUserId();
      if (!userId) return;

      const attemptData = {};
      await Promise.all(
        papers.map(async paper => {
          try {
            const result = await getAttemptCount(userId, paper.id);
            let count = 0;

            if (typeof result === 'number') {
              count = result;
            } else if (result?.attemptCount !== undefined) {
              count = result.attemptCount;
            } else if (result?.count !== undefined) {
              count = result.count;
            } else if (result?.data?.attemptCount !== undefined) {
              count = result.data.attemptCount;
            } else if (result?.data?.count !== undefined) {
              count = result.data.count;
            }

            attemptData[paper.id] = count;
          } catch (e) {
            console.error(
              `Failed to fetch attempt count for paper ${paper.id}`,
              e,
            );
            attemptData[paper.id] = 0;
          }
        }),
      );

      setAttemptCounts(attemptData);
    } catch (err) {
      console.error('Error in fetchAttemptCounts:', err);
    } finally {
      setLoadingAttempts(false);
    }
  };

  const getAttemptCountForPaper = paperId => {
    return attemptCounts?.[paperId] || 0;
  };

  // Optimized BlinkingNewBadge component
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
          {iterations: -1},
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

  const handleStartTest = paper => {
    const attemptCount = getAttemptCountForPaper(paper.id);
    if (!paper.multipleAttemptsAllowed && attemptCount >= 1) {
      showMessage({
        message: 'Attempts Over',
        description: 'You have already attempted this test.',
        type: 'warning',
      });
      return;
    }
    if (paper.maxAttemptsAllowed && attemptCount >= paper.maxAttemptsAllowed) {
      showMessage({
        message: 'Limit Exceeded',
        description: 'Maximum attempts reached for this test.',
        type: 'danger',
      });
      return;
    }

    navigation.navigate('ChampionTest', {
      testId: paper.id,
      testTitle: paper.testTitle || 'Test Paper',
      currentAttempts: attemptCount,
      source: 'TestPaper',
      maxAttemptsAllowed: paper.maxAttemptsAllowed,
      multipleAttemptsAllowed: paper.multipleAttemptsAllowed,
    });
  };

  const handleViewAllResult = testPaper => {
    navigation.navigate('AllResult', {
      testId: testPaper.id,
      testTitle: testPaper.testTitle,
      pdfUrl: testPaper.allResultPdf || null,
    });
  };

  const handleViewMyResult = async testPaper => {
    try {
      let userId = null;
      try {
        userId = getAuthUserId();
        if (userId) {
        }
      } catch (authError) {
        console.error('❌ AuthContext getUserId failed:', authError);
      }

      // Method 2: Try apiCall method
      if (!userId) {
        userId = await getUserId();
      }

      // Method 3: Try AsyncStorage userData
      if (!userId) {
        try {
          const storedUserData = await AsyncStorage.getItem('userData');
          if (storedUserData) {
            const parsedUserData = JSON.parse(storedUserData);
            userId = parsedUserData.id;
          }
        } catch (storageError) {
          console.error('❌ AsyncStorage userData error:', storageError);
        }
      }

      // Method 4: Try AsyncStorage userId key
      if (!userId) {
        try {
          const storedUserId = await AsyncStorage.getItem('userId');
          if (storedUserId) {
            userId = storedUserId;
          }
        } catch (storageError) {
          console.error('❌ AsyncStorage userId error:', storageError);
        }
      }

      if (!userId) {
        console.error('❌ Could not get user ID from any method');
        showMessage({
          message: 'Authentication Error',
          description: 'Please login again.',
          type: 'danger',
        });
        return;
      }

      // Check if user has attempted the test
      const attemptCount = getAttemptCountForPaper(testPaper.id);

      if (attemptCount === 0) {
        showMessage({
          message: 'No Attempts Found',
          description: 'Please complete the test first to view your result.',
          type: 'warning',
        });

        return;
      }

      navigation.navigate('ChampionResult', {
        userId: userId,
        testPaperId: testPaper.id,
        testTitle: testPaper.testTitle,
        source: 'TestPaper',
      });
    } catch (error) {
      console.error('Error in handleViewMyResult:', error);
      Alert.alert('Error', 'Failed to load result');
    }
  };

  const handleDownloadTestPaper = async testPaper => {
    try {
      if (!testPaper) {
        Alert.alert('Error', 'Test paper data is not available');
        return;
      }

      if (!testPaper.testTitle) {
        Alert.alert('Error', 'Test paper title is missing');
        return;
      }

      showMessage({
        message: 'Please Wait',
        description: 'Generating PDF... This may take a moment.',
        type: 'info',
      });

      // Call the PDF generator utility with proper error handling
      await generateAndDownloadTestPaper(testPaper);
    } catch (error) {
      console.error('❌ Download Error:', error);

      // Enhanced error messages
      let errorMessage = 'Unable to download the test paper. Please try again.';

      if (error.message?.includes('Permission')) {
        errorMessage =
          'Storage permission is required to download the PDF. Please grant permission and try again.';
      } else if (
        error.message?.includes('network') ||
        error.message?.includes('Network')
      ) {
        errorMessage =
          'Network error occurred. Please check your connection and try again.';
      } else if (
        error.message?.includes('space') ||
        error.message?.includes('storage')
      ) {
        errorMessage =
          'Insufficient storage space. Please free up some space and try again.';
      }

      showMessage({
        message: 'Download Failed',
        description: errorMessage + '\n\n' + (error.message || 'Unknown error'),
        type: 'danger',
        duration: 5000,
      });
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
              {/* All Result Button */}
              {item.showAllResult && (
                <TouchableOpacity
                  style={styles.resultButtonCompact}
                  onPress={() => handleViewAllResult(item)}>
                  <Text style={styles.resultButtonTextCompact}>All Result</Text>
                </TouchableOpacity>
              )}

              {/* My Result Button */}
              {item.showTestResult && (
                <TouchableOpacity
                  style={styles.resultButtonCompact}
                  onPress={() => handleViewMyResult(item)}>
                  <Text style={styles.resultButtonTextCompact}>My Result</Text>
                </TouchableOpacity>
              )}

              {/* Download Button */}
              {item.downloadTestPaper && (
                <TouchableOpacity
                  style={styles.downloadIconButton}
                  onPress={() => handleDownloadTestPaper(item)}>
                  <Icon name="file-download" size={18} color="#3182CE" />
                </TouchableOpacity>
              )}
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
          <Text style={styles.pageTitle}>Test Papers</Text>
          <Text style={styles.pageSubtitle}>
            Choose a test to begin your challenge
          </Text>
        </View>

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

export default TestPaper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
    textAlign: 'center',
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
  attemptText: {
    fontSize: 12,
    color: '#4A5568',
    fontWeight: '500',
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

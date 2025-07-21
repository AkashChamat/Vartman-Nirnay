// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Dimensions,
//   Alert,
//   TouchableOpacity,
//   ActivityIndicator,
// } from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import {useRoute} from '@react-navigation/native';
// import {TestPaperByIdUrl} from '../../util/Url';
// import {getAPI} from '../../util/apiCall';
// import {useAuth} from '../../Auth/AuthContext';

// // Import components from ChampionTest
// import Header from '../../Components/Header';
// import TestInstructions from '../../Components/TestInstructions';
// import PaperTimer from '../../Components/PaperTimer';
// import TestMenu from '../../Components/TestMenu';

// // Import utility functions from ChampionUtil
// import {
//   handleTestSubmission,
//   handleNextQuestion,
//   handlePreviousQuestion,
//   handleAnswerSelect,
//   handleInstructionsAccept,
//   handleInstructionsClose,
//   renderQuestionOptions,
//   renderLoadingScreen,
//   renderErrorScreen,
//   renderNoQuestionsScreen,
//   renderSubmissionLoading,
//   initializeTestTimer,
// } from '../../Components/ChampionUtil';

// const {width} = Dimensions.get('window');

// const Test = ({navigation}) => {
//   const route = useRoute();
//   const {paperId} = route.params;
  
//   // Get user ID from AuthContext
//   const {getUserId, isAuthenticated, loading: authLoading} = useAuth();
//   const userId = getUserId();
  
//   // State management
//   const [paperData, setPaperData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [selectedAnswers, setSelectedAnswers] = useState({});
//   const [showInstructions, setShowInstructions] = useState(true);
//   const [instructionsAccepted, setInstructionsAccepted] = useState(false);
//   const [testStartTime, setTestStartTime] = useState(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [testStarted, setTestStarted] = useState(false);
//   const [isTestCompleted, setIsTestCompleted] = useState(false);

//   // Fetch test paper data
//   const getTestPaperById = async (paperId) => {
//     try {
//       setLoading(true);
//       setError(null);
      
//       if (!paperId) throw new Error('Paper ID is required');
      
//       const response = await getAPI(TestPaperByIdUrl, {}, paperId, true);
      
//       // Transform the data to match ChampionTest format if needed
//       const transformedData = {
//         ...response,
//         // Map questions to expected format
//         questions: response.questions?.map(q => ({
//           ...q,
//           createQuestion: q.createQuestion || q.question,
//           marks: q.marks || 1,
//           section: q.section || 'General',
//         })) || [],
//         // Ensure we have the required fields
//         duration: response.duration || 60,
//         totalMarks: response.totalMarks || response.questions?.length || 0,
//         noOfQuestions: response.questions?.length || 0,
//         testTitle: response.testTitle || 'Test',
//         terms: response.terms || response.instructions || 'Please read all questions carefully and answer to the best of your ability.',
//       };
      
//       setPaperData(transformedData);
//     } catch (err) {
//       console.error('❌ Error in getTestPaperById:', err.message);
//       setError(err.message || 'Failed to load test paper');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Initialize test data
//   useEffect(() => {
//     if (paperId) {
//       getTestPaperById(paperId);
//     } else {
//       setError('No paper ID provided');
//       setLoading(false);
//     }
//   }, [paperId]);

//   // Event handlers using utility functions
//   const onInstructionsAccept = () => {
//     handleInstructionsAccept(setShowInstructions, setInstructionsAccepted);
//     setTestStarted(true);
    
//     // Initialize test timer when instructions are accepted
//     const startTime = initializeTestTimer();
//     setTestStartTime(startTime);
    
//   };

//   const onInstructionsClose = () => {
//     handleInstructionsClose(navigation);
//   };

//   const onAnswerSelect = (questionId, selectedOption) => {
//     handleAnswerSelect(questionId, selectedOption, setSelectedAnswers);
//   };

//   const onNext = () =>
//     handleNextQuestion(currentQuestionIndex, paperData, setCurrentQuestionIndex);
    
//   const onPrevious = () =>
//     handlePreviousQuestion(currentQuestionIndex, setCurrentQuestionIndex);

//   // Handle question selection from menu
//   const handleQuestionSelect = (questionIndex) => {
//     setCurrentQuestionIndex(questionIndex);
//   };

//   // Handle skip functionality
//   const handleSkip = () => {
//     if (currentQuestionIndex < paperData.questions.length - 1) {
//       setCurrentQuestionIndex(currentQuestionIndex + 1);
//     }
//   };

//   // Handle time up
//   const handleTimeUp = () => {
//   if (isTestCompleted) {
//     return;
//   }

//   showMessage({
//     message: "Time's Up!",
//     description: 'Your test time has ended. The test will be automatically submitted.',
//     type: 'warning',
//     floating: true,
//     autoHide: false,
//     renderCustomContent: () => (
//       <View style={styles.flashContainer}>
//         <Text style={styles.flashTitle}>Time's Up!</Text>
//         <Text style={styles.flashDescription}>Your test time has ended. The test will be automatically submitted.</Text>
//         <TouchableOpacity 
//           style={styles.flashButton} 
//           onPress={() => {
//             showMessage({ message: '', type: 'none' }); // Hide message
//             submitTest();
//           }}
//         >
//           <Text style={styles.flashButtonText}>OK</Text>
//         </TouchableOpacity>
//       </View>
//     ),
//   });
// };

//   // Handle test submission
//  const handleSubmitTest = () => {
//   const answeredCount = Object.keys(selectedAnswers).length;
//   const totalQuestions = paperData?.questions?.length || 0;

//   if (answeredCount < totalQuestions) {
//     showMessage({
//       message: 'Incomplete Test',
//       description: `You have answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit?`,
//       type: 'warning',
//       floating: true,
//       autoHide: false,
//       renderCustomContent: () => (
//         <View style={styles.flashContainer}>
//           <Text style={styles.flashTitle}>Incomplete Test</Text>
//           <Text style={styles.flashDescription}>
//             You have answered {answeredCount} out of {totalQuestions} questions. Are you sure you want to submit?
//           </Text>
//           <View style={styles.flashButtonsRow}>
//             <TouchableOpacity 
//               style={[styles.flashButton, styles.flashButtonSecondary]} 
//               onPress={() => showMessage({ message: '', type: 'none' })}
//             >
//               <Text style={styles.flashButtonTextSecondary}>Cancel</Text>
//             </TouchableOpacity>
//             <TouchableOpacity 
//               style={[styles.flashButton, styles.flashButtonDanger]} 
//               onPress={() => {
//                 showMessage({ message: '', type: 'none' });
//                 submitTest();
//               }}
//             >
//               <Text style={styles.flashButtonText}>Submit Anyway</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       ),
//     });
//   } else {
//     showMessage({
//       message: 'Submit Test',
//       description: 'Are you sure you want to submit your test? This action cannot be undone.',
//       type: 'info',
//       floating: true,
//       autoHide: false,
//       renderCustomContent: () => (
//         <View style={styles.flashContainer}>
//           <Text style={styles.flashTitle}>Submit Test</Text>
//           <Text style={styles.flashDescription}>Are you sure you want to submit your test? This action cannot be undone.</Text>
//           <View style={styles.flashButtonsRow}>
//             <TouchableOpacity 
//               style={[styles.flashButton, styles.flashButtonSecondary]} 
//               onPress={() => showMessage({ message: '', type: 'none' })}
//             >
//               <Text style={styles.flashButtonTextSecondary}>Cancel</Text>
//             </TouchableOpacity>
//             <TouchableOpacity 
//               style={styles.flashButton} 
//               onPress={() => {
//                 showMessage({ message: '', type: 'none' });
//                 submitTest();
//               }}
//             >
//               <Text style={styles.flashButtonText}>Submit</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       ),
//     });
//   }
// };

//   // Submit test function
//  const submitTest = async () => {
//   const userId = getUserId();

//   if (!userId) {
//     showMessage({
//       message: 'Error',
//       description: 'User not authenticated. Please login again.',
//       type: 'danger',
//       duration: 4000,
//     });
//     return;
//   }

//   if (!testStartTime) {
//     showMessage({
//       message: 'Error',
//       description: 'Test timing data is missing. Please try again.',
//       type: 'danger',
//       duration: 4000,
//     });
//     return;
//   }

//   // Mark test as completed to prevent timer alerts
//   setIsTestCompleted(true);

//   try {
//     await handleTestSubmission(
//       paperId,
//       selectedAnswers,
//       setIsSubmitting,
//       userId,
//       testStartTime,
//       (response) => {
//         // Replace Alert with custom flash message
//         showSubmissionMessage(
//           () => {
//             showMessage({ message: '', type: 'none' }); // Hide message
//             navigation.navigate('ChampionResult', {
//               userId: userId,
//               testPaperId: paperId,
//               testTitle: paperData.testTitle,
//             });
//           },
//           () => {
//             showMessage({ message: '', type: 'none' }); // Hide message
//             navigation.navigate('Home');
//           }
//         );
//       },
//       (errorMessage) => {
//         // Error callback - reset completion state on error
//         setIsTestCompleted(false);
//         showMessage({
//           message: 'Submission Failed',
//           description: errorMessage,
//           type: 'danger',
//           duration: 4000,
//         });
//       },
//     );
//   } catch (error) {
//     console.error('❌ Test submission failed with error:', error);
//     setIsTestCompleted(false);
//     showMessage({
//       message: 'Submission Failed',
//       description: 'An unexpected error occurred. Please try again.',
//       type: 'danger',
//       duration: 4000,
//     });
//   }
// };


//   // Retry function
//   const onRetryFetch = () => {
//     getTestPaperById(paperId);
//   };

//   // Check if user is authenticated
//   if (!isAuthenticated && !authLoading) {
//     return (
//       <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
//         <Header />
//         <Text style={{fontSize: 18, color: '#6B7280'}}>
//           Please login to take the test
//         </Text>
//       </View>
//     );
//   }

//   // Show instructions screen
//   if (showInstructions) {
//     return (
//       <>
//         <View style={styles.container}></View>
//         <TestInstructions
//           visible={showInstructions}
//           onAccept={onInstructionsAccept}
//           onClose={onInstructionsClose}
//           testTitle={paperData?.testTitle}
//           testData={paperData}
//         />
//       </>
//     );
//   }

//   // Render Loading Screen
//   if (loading || authLoading) {
//     return <View style={styles.container}>{renderLoadingScreen(styles)}</View>;
//   }

//   // Render Error Screen
//   if (error || !paperData) {
//     return (
//       <View style={styles.container}>
//         {renderErrorScreen(error, onRetryFetch, navigation, styles)}
//       </View>
//     );
//   }

//   // Render No Questions Screen
//   if (!paperData.questions || paperData.questions.length === 0) {
//     return (
//       <View style={styles.container}>
//         {renderNoQuestionsScreen(navigation, styles)}
//       </View>
//     );
//   }

//   const currentQuestion = paperData.questions[currentQuestionIndex];

//   // Main Test Screen
//   return (
//     <View style={styles.container}>
//       {/* Test Header with Timer and Menu */}
//       <View style={styles.testHeaderContainer}>
//         <View style={styles.headerTopSection}>
//           <PaperTimer
//             duration={paperData.duration}
//             onTimeUp={handleTimeUp}
//             testStarted={testStarted}
//             isTestCompleted={isTestCompleted}
//           />
//           <TestMenu
//             testData={paperData}
//             selectedAnswers={selectedAnswers}
//             currentQuestionIndex={currentQuestionIndex}
//             navigation={navigation}
//             onQuestionSelect={handleQuestionSelect}
//           />
//         </View>
//       </View>

//       {/* Question Header */}
//       <View style={styles.questionHeader}>
//         <View style={styles.testTitleSection}>
//           <View style={styles.questionInfoContainer}>
//             <View style={styles.questionNumberBadge}>
//               <Text style={styles.questionNumberText}>
//                 Q{currentQuestionIndex + 1}
//               </Text>
//             </View>
//             <View style={styles.questionMeta}>
//               <View style={styles.metaItem}>
//                 <Text style={styles.sectionText}>
//                   Section: {currentQuestion.section}
//                 </Text>
//               </View>
//             </View>
//           </View>
//           <View style={styles.marksContainer}>
//             <Text style={styles.marksText}>Marks: {currentQuestion.marks}</Text>
//           </View>
//         </View>
//       </View>

//       {/* Question Content */}
//       <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
//         {/* Question Card */}
//         <View style={styles.questionCard}>
//           <Text style={styles.questionText}>
//             {currentQuestion.createQuestion}
//           </Text>
//         </View>

//         {/* Options */}
//         <View style={styles.optionsContainer}>
//           <Text style={styles.optionsTitle}>Choose your answer:</Text>
//           {renderQuestionOptions(
//             currentQuestion,
//             selectedAnswers,
//             onAnswerSelect,
//             styles,
//           )}
//         </View>
//       </ScrollView>

//       {/* Navigation with Skip Button */}
//       <View style={styles.navigationContainer}>
//         <TouchableOpacity
//           style={[styles.navButton, styles.secondaryNavButton]}
//           onPress={onPrevious}
//           disabled={currentQuestionIndex === 0}>
//           <Text
//             style={[
//               styles.secondaryNavButtonText,
//               currentQuestionIndex === 0 && styles.disabledButtonText,
//             ]}>
//             Previous
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.navButton, styles.skipButton]}
//           onPress={handleSkip}>
//           <Text style={styles.skipButtonText}>Skip</Text>
//         </TouchableOpacity>

//         {currentQuestionIndex < paperData.questions.length - 1 ? (
//           <TouchableOpacity
//             style={[styles.navButton, styles.saveNextButton]}
//             onPress={onNext}>
//             <Text style={styles.saveNextButtonText}>Save & Next</Text>
//           </TouchableOpacity>
//         ) : (
//           <TouchableOpacity
//             style={[styles.navButton, styles.submitButton]}
//             onPress={handleSubmitTest}
//             disabled={isSubmitting}>
//             <Text style={styles.submitButtonText}>
//               {isSubmitting ? 'Submitting...' : 'Submit'}
//             </Text>
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* Submission Loading Overlay */}
//       {renderSubmissionLoading(isSubmitting, styles)}
//       <FlashMessage position="top" />
//     </View>
//   );
// };

// // Styles (same as ChampionTest)
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   testHeaderContainer: {
//     backgroundColor: '#3F4856',
//     padding: 8,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   questionHeader: {
//     backgroundColor: '#fff',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   headerTopSection: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   testTitleSection: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   questionInfoContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   questionNumberBadge: {
//     backgroundColor: '#8B5CF6',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     marginRight: 12,
//   },
//   questionNumberText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   questionMeta: {
//     flex: 1,
//   },
//   metaItem: {
//     marginBottom: 4,
//   },
//   sectionText: {
//     fontSize: 14,
//     color: '#8B5CF6',
//     fontWeight: '500',
//   },
//   marksContainer: {
//     backgroundColor: '#8B5CF6',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//   },
//   marksText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 20,
//   },
//   questionCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 20,
//     marginTop: 20,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 1},
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   questionText: {
//     fontSize: 16,
//     color: '#1F2937',
//     lineHeight: 24,
//     fontWeight: '500',
//   },
//   optionsContainer: {
//     marginTop: 16,
//     marginBottom: 20,
//   },
//   optionsTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginBottom: 16,
//     paddingHorizontal: 20,
//   },
  
//   // Option button styles
//   optionButton: {
//     backgroundColor: '#FFFFFF',
//     borderWidth: 2,
//     borderColor: '#E5E7EB',
//     borderRadius: 12,
//     marginBottom: 12,
//     marginHorizontal: 5,
//     elevation: 1,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 1},
//     shadowOpacity: 0.05,
//     shadowRadius: 1,
//   },
//   selectedOption: {
//     borderColor: '#6366F1',
//     backgroundColor: '#EEF2FF',
//     elevation: 2,
//     shadowOpacity: 0.1,
//   },
//   optionContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//   },
//   optionKeyContainer: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: '#F3F4F6',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//   },
//   selectedOptionKeyContainer: {
//     backgroundColor: '#6366F1',
//   },
//   optionKey: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#6B7280',
//   },
//   selectedOptionKey: {
//     color: '#FFFFFF',
//   },
//   optionValue: {
//     flex: 1,
//     fontSize: 15,
//     color: '#1F2937',
//     lineHeight: 22,
//   },
//   selectedOptionText: {
//     color: '#1F2937',
//     fontWeight: '500',
//   },
  
//   // Navigation styles
//   navigationContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#FFFFFF',
//     borderTopWidth: 1,
//     borderTopColor: '#E5E7EB',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: -2},
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   navButton: {
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 8,
//     minWidth: 80,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   secondaryNavButton: {
//     backgroundColor: '#FFFFFF',
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//   },
//   skipButton: {
//     backgroundColor: '#F59E0B',
//     elevation: 2,
//     shadowColor: '#F59E0B',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   saveNextButton: {
//     backgroundColor: '#6366F1',
//     elevation: 2,
//     shadowColor: '#6366F1',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//   },
//   submitButton: {
//     backgroundColor: '#059669',
//     elevation: 3,
//     shadowColor: '#059669',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//   },
//   secondaryNavButtonText: {
//     color: '#6B7280',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   skipButtonText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   saveNextButtonText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   submitButtonText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   disabledButtonText: {
//     color: '#9CA3AF',
//   },
  
//   // Loading and error styles
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F8FAFC',
//   },
//   loadingContent: {
//     alignItems: 'center',
//   },
//   loadingText: {
//     fontSize: 16,
//     color: '#6366F1',
//     marginTop: 16,
//     fontWeight: '500',
//   },
//   loadingSubtext: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginTop: 8,
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F8FAFC',
//     paddingHorizontal: 20,
//   },
//   errorIconContainer: {
//     marginBottom: 20,
//   },
//   errorTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   errorSubtitle: {
//     fontSize: 16,
//     color: '#6B7280',
//     textAlign: 'center',
//     marginBottom: 24,
//     lineHeight: 24,
//   },
//   errorActions: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   primaryButton: {
//     backgroundColor: '#6366F1',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   primaryButtonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   secondaryButton: {
//     backgroundColor: '#FFFFFF',
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     borderRadius: 8,
//   },
//   secondaryButtonText: {
//     color: '#6B7280',
//     fontSize: 16,
//     fontWeight: '600',
//   },
  
//   // Submission overlay styles
//   submissionOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 1000,
//   },
//   submissionContainer: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 24,
//     alignItems: 'center',
//     minWidth: 200,
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 4},
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   submissionText: {
//     fontSize: 16,
//     color: '#1F2937',
//     marginTop: 16,
//     fontWeight: '500',
//   },
//   submissionSubtext: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginTop: 8,
//   },
//    flashContainer: {
//     backgroundColor: '#FFFFFF',
//     padding: 20,
//     borderRadius: 12,
//     margin: 10,
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 4},
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   flashTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1F2937',
//     marginBottom: 8,
//   },
//   flashDescription: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginBottom: 16,
//     lineHeight: 20,
//   },
//   flashButton: {
//     backgroundColor: '#6366F1',
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     alignItems: 'center',
//     marginTop: 8,
//   },
//   flashButtonSecondary: {
//     backgroundColor: '#FFFFFF',
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//   },
//   flashButtonDanger: {
//     backgroundColor: '#DC2626',
//   },
//   flashButtonText: {
//     color: '#FFFFFF',
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   flashButtonTextSecondary: {
//     color: '#6B7280',
//     fontWeight: '600',
//     fontSize: 14,
//   },
//   flashButtonsRow: {
//     flexDirection: 'row',
//     justifyContent: 'flex-end',
//     gap: 10,
//   },
// });

// export default Test;
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Test = () => {
  return (
    <View>
      <Text>Test</Text>
    </View>
  )
}

export default Test

const styles = StyleSheet.create({})
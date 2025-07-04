import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const {width, height} = Dimensions.get('window');

const TestMenuButton = ({
  testData,
  selectedAnswers,
  currentQuestionIndex,
  navigation,
  onQuestionSelect,
}) => {
  const [showProgressModal, setShowProgressModal] = useState(false);

  const getQuestionStatus = (questionIndex) => {
    const questionId = testData?.questions?.[questionIndex]?.id;
    if (selectedAnswers[questionId]) {
      return 'answered';
    }
    return 'unanswered';
  };

  const handleQuestionSelect = (questionIndex) => {
    setShowProgressModal(false);
    if (onQuestionSelect) {
      onQuestionSelect(questionIndex);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(selectedAnswers).length;
  };

  const getTotalQuestions = () => {
    return testData?.questions?.length || 0;
  };

  const getSkippedCount = () => {
    return getTotalQuestions() - getAnsweredCount();
  };

  const renderProgressModal = () => (
    <Modal
      visible={showProgressModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowProgressModal(false)}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowProgressModal(false)}>
        <View style={styles.progressModal}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={styles.modalContent}>
            <Text style={styles.modalTitle}>Progress</Text>
            
            {/* Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>Answered</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.unansweredDot]} />
                <Text style={styles.legendText}>Unanswered</Text>
              </View>
            </View>

            {/* Statistics */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{getAnsweredCount()}</Text>
                <Text style={styles.statLabel}>Answered</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{getTotalQuestions()}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{getSkippedCount()}</Text>
                <Text style={styles.statLabel}>Skipped</Text>
              </View>
            </View>

            {/* Question Numbers Grid */}
            <View style={styles.questionsGrid}>
              {testData?.questions?.map((_, index) => {
                const status = getQuestionStatus(index);
                const isCurrentQuestion = index === currentQuestionIndex;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.questionNumberButton,
                      status === 'answered' ? styles.answeredQuestion : styles.unansweredQuestion,
                      isCurrentQuestion && styles.currentQuestion,
                    ]}
                    onPress={() => handleQuestionSelect(index)}>
                    <Text
                      style={[
                        styles.questionNumberText,
                        status === 'answered' ? styles.answeredQuestionText : styles.unansweredQuestionText,
                        isCurrentQuestion && styles.currentQuestionText,
                      ]}>
                      {index + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setShowProgressModal(true)}>
        <MaterialIcons name="menu" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      {renderProgressModal()}
    </>
  );
};

const styles = StyleSheet.create({
  menuButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressModal: {
    width: width * 0.85,
    maxHeight: height * 0.8,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  unansweredDot: {
    backgroundColor: '#F97316',
  },
  legendText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    minWidth: 70,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  questionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  questionNumberButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  answeredQuestion: {
    backgroundColor: '#10B981',
  },
  unansweredQuestion: {
    backgroundColor: '#F97316',
  },
  currentQuestion: {
    backgroundColor: '#6366F1',
    transform: [{scale: 1.1}],
    elevation: 4,
    shadowOpacity: 0.2,
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  answeredQuestionText: {
    color: '#FFFFFF',
  },
  unansweredQuestionText: {
    color: '#FFFFFF',
  },
  currentQuestionText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default TestMenuButton;
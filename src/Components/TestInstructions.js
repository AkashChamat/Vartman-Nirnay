import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const TestInstructions = ({ 
  visible, 
  onAccept, 
  onClose, 
  testTitle, 
  testData 
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Compact Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test Instructions</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Compact Test Info */}
          <View style={styles.testInfoCard}>
            <View style={styles.testHeader}>
              <View style={styles.testBadge}>
                <MaterialIcons name="quiz" size={14} color="#6366F1" />
                <Text style={styles.testBadgeText}>Test</Text>
              </View>
              <Text style={styles.testTitle}>{testTitle}</Text>
            </View>
            
            {testData && (
              <View style={styles.testStats}>
                <View style={styles.statItem}>
                  <MaterialIcons name="quiz" size={12} color="#6B7280" />
                  <Text style={styles.statText}>{testData.noOfQuestions}Q</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="star" size={12} color="#F59E0B" />
                  <Text style={styles.statText}>{testData.totalMarks}M</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="schedule" size={12} color="#10B981" />
                  <Text style={styles.statText}>{testData.duration}min</Text>
                </View>
              </View>
            )}
          </View>

          {/* Compact Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="info" size={14} color="#6366F1" /> Instructions
            </Text>
            
            <View style={styles.instructionsList}>
              <Text style={styles.instructionText}>
                • Read questions carefully before answering{'\n'}
                • Navigate using Previous/Next buttons{'\n'}
                • Progress saves automatically{'\n'}
                • Maintain stable internet connection{'\n'}
                • Cannot modify after submission
              </Text>
            </View>
          </View>

          {/* Compact Terms */}
          {testData?.terms && (
            <View style={styles.termsCard}>
              <Text style={styles.sectionTitle}>
                <MaterialIcons name="gavel" size={14} color="#DC2626" /> Terms
              </Text>
              <Text style={styles.termsText}>{testData.terms}</Text>
            </View>
          )}

          {/* Compact Important Notes */}
          <View style={styles.notesCard}>
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="warning" size={14} color="#F59E0B" /> Important
            </Text>
            <Text style={styles.noteText}>
              • Auto-submit when time expires{'\n'}
              • Don't switch apps during test{'\n'}
              • Ensure stable internet connection
            </Text>
          </View>
        </ScrollView>

        {/* Compact Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.declineButton} onPress={onClose}>
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
            <MaterialIcons name="check" size={16} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>Accept & Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  // Compact Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 28,
  },
  
  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  
  // Compact Test Info Card
  testInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  testHeader: {
    marginBottom: 8,
  },
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  testBadgeText: {
    fontSize: 10,
    color: '#6366F1',
    fontWeight: '600',
    marginLeft: 4,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 20,
  },
  testStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  
  // Compact Cards
  instructionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  termsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  notesCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  
  // Typography
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructionsList: {
    marginTop: 4,
  },
  instructionText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  termsText: {
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 16,
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
  },
  noteText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 16,
  },
  
  // Compact Action Buttons
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
});

export default TestInstructions;
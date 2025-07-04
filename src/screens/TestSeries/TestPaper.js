import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Header from '../../Components/Header';
import Footer from '../../Components/Footer';
const { width } = Dimensions.get('window');

const TestPaper = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const [papers, setPapers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const { seriesId, seriesData } = route.params;
  
  useEffect(() => {
    if (seriesData && seriesData.testPapers) {
      const activePapers = seriesData.testPapers.filter(paper => paper.status === true);
      setPapers(activePapers);
      setTotalPages(Math.ceil(activePapers.length / itemsPerPage));
    }
  }, [seriesData]);

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return papers.slice(startIndex, endIndex);
  };

  const handleStartTest = (paper) => {
    if (!paper.status) {
      alert('This test is currently not active.');
      return;
    }
    alert(`Starting test: ${paper.testTitle}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderPaper = ({ item, index }) => (
    <View style={[styles.paperCard, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc' }]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.paperTitle} numberOfLines={1}>
            {item.testTitle}
          </Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: item.status ? '#10b981' : '#ef4444' }]} />
            <Text style={[styles.statusText, { color: item.status ? '#10b981' : '#ef4444' }]}>
              {item.status ? 'Live' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.noOfQuestions}</Text>
            <Text style={styles.statLabel}>Questions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.totalMarks}</Text>
            <Text style={styles.statLabel}>Marks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{item.duration}</Text>
            <Text style={styles.statLabel}>Minutes</Text>
          </View>
        </View>

        <View style={styles.timeContainer}>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>📅 {formatDate(item.testStartDate)}</Text>
          </View>
          <View style={styles.timeItem}>
            <Text style={styles.timeLabel}>🕐 {formatTime(item.startTime)} - {formatTime(item.endTime)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, { 
            backgroundColor: item.status ? '#3b82f6' : '#e5e7eb',
            opacity: item.status ? 1 : 0.6
          }]}
          onPress={() => handleStartTest(item)}
          disabled={!item.status}
        >
          <Text style={[styles.actionText, { color: item.status ? '#ffffff' : '#9ca3af' }]}>
            {item.status ? 'Start Test' : 'Unavailable'}
          </Text>
        </TouchableOpacity>

        {item.showTestResult && (
          <TouchableOpacity style={styles.resultButton}>
            <Text style={styles.resultText}>Results</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.paginationButton, { opacity: currentPage === 1 ? 0.3 : 1 }]}
          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <Text style={styles.paginationText}>‹</Text>
        </TouchableOpacity>

        {pageNumbers.map(page => (
          <TouchableOpacity
            key={page}
            style={[
              styles.paginationButton,
              currentPage === page && styles.paginationButtonActive
            ]}
            onPress={() => setCurrentPage(page)}
          >
            <Text style={[
              styles.paginationText,
              currentPage === page && styles.paginationTextActive
            ]}>
              {page}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.paginationButton, { opacity: currentPage === totalPages ? 0.3 : 1 }]}
          onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.paginationText}>›</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>No Active Tests</Text>
      <Text style={styles.emptyMessage}>
        Check back later for new test papers
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
        <Header/>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {seriesData?.examTitle || 'Test Papers'}
        </Text>
      </View>
      
      <FlatList
        data={getCurrentPageData()}
        renderItem={renderPaper}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
      />

      {renderPagination()}
      <Footer/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 2,
  },
  headerCount: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  paperCard: {
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paperTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardContent: {
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    minWidth: 36,
    alignItems: 'center',
  },
  paginationButtonActive: {
    backgroundColor: '#3b82f6',
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  paginationTextActive: {
    color: '#ffffff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
export default TestPaper
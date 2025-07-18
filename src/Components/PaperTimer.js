import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PaperTimer = ({ duration, onTimeUp, testStarted, isTestCompleted }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert minutes to seconds
  const intervalRef = useRef(null);

  useEffect(() => {
    if (testStarted && !isTestCompleted) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current);
            onTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [testStarted, isTestCompleted, onTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (isTestCompleted) return '#9CA3AF'; // Gray when completed
    if (timeLeft <= 300) return '#EF4444'; // Red for last 5 minutes
    if (timeLeft <= 600) return '#FBBF24'; // Amber for last 10 minutes
    return '#3B82F6'; // Sky blue for normal time
  };

  return (
    <View style={styles.timerContainer}>
      <View style={[styles.timerBadge, { backgroundColor: getTimerColor() }]}>
        <Text style={styles.timerText}>
          {formatTime(timeLeft)}
        </Text>
      </View>
      {isTestCompleted && (
        <Text style={styles.completedText}>Test Completed</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  timerContainer: {
    alignItems: 'center',
  },
  timerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  completedText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default PaperTimer;

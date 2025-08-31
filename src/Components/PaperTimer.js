import React, {useState, useEffect, useRef, useCallback} from 'react';
import {View, Text, StyleSheet} from 'react-native';

const PaperTimer = ({
  duration, // This will now be the effective duration in seconds
  onTimeUp,
  onTimeUpdate,
  isActive, // Changed from testStarted to isActive for better control
  isTestCompleted,
  testData,
  showRemainingTime = true,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration || 0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const isTimerActiveRef = useRef(false);

  // Add refs to prevent calling callbacks during render
  const onTimeUpRef = useRef(onTimeUp);
  const onTimeUpdateRef = useRef(onTimeUpdate);

  // Update refs when callbacks change
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  // Initialize timer when duration changes
  useEffect(() => {
    console.log('⏱️ PaperTimer: Duration changed to', duration);
    if (duration && duration > 0) {
      setTimeLeft(duration);
      setElapsedTime(0);
      // Reset start time reference
      startTimeRef.current = null;
    }
  }, [duration]);

  // Main timer effect with improved performance
  useEffect(() => {
    console.log('⏱️ PaperTimer: Timer effect triggered', {
      isActive,
      isTestCompleted,
      duration,
      currentTimeLeft: timeLeft,
    });

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't start timer if conditions aren't met
    if (!isActive || isTestCompleted || !duration || duration <= 0) {
      isTimerActiveRef.current = false;
      console.log('⏱️ PaperTimer: Timer not started - conditions not met');
      return;
    }

    // Set start time only once when timer actually starts
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
      console.log(
        '⏱️ PaperTimer: Timer started at',
        new Date(startTimeRef.current).toISOString(),
      );
    }

    isTimerActiveRef.current = true;

    // ENHANCE the timer interval in PaperTimer.js
    intervalRef.current = setInterval(() => {
      try {
        if (!isTimerActiveRef.current || !startTimeRef.current) {
          return;
        }

        const now = Date.now();
        const actualElapsed = Math.floor((now - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(0, duration - actualElapsed);

        // Validate timing data
        if (actualElapsed < 0 || newTimeLeft < 0) {
          console.warn('⚠️ PaperTimer: Invalid timing detected', {
            actualElapsed,
            newTimeLeft,
          });
          return;
        }

        // Update state in batch
        setElapsedTime(actualElapsed);
        setTimeLeft(newTimeLeft);

        // Use setTimeout to call callbacks AFTER render is complete
        setTimeout(() => {
          if (
            onTimeUpdateRef.current &&
            typeof onTimeUpdateRef.current === 'function'
          ) {
            try {
              onTimeUpdateRef.current(actualElapsed);
            } catch (error) {
              console.error(
                '⚠️ PaperTimer: Error in onTimeUpdate callback:',
                error,
              );
            }
          }
        }, 0);

        // Check for time up condition
        if (newTimeLeft <= 0 && isTimerActiveRef.current) {
          console.log('⏱️ PaperTimer: Time up! Elapsed:', actualElapsed);
          isTimerActiveRef.current = false;

          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Use setTimeout to prevent calling during render
          setTimeout(() => {
            if (
              onTimeUpRef.current &&
              typeof onTimeUpRef.current === 'function'
            ) {
              try {
                onTimeUpRef.current(actualElapsed);
              } catch (error) {
                console.error(
                  '⚠️ PaperTimer: Error in onTimeUp callback:',
                  error,
                );
              }
            }
          }, 0);
        }
      } catch (error) {
        console.error(
          '⚠️ PaperTimer: Critical error in timer interval:',
          error,
        );
      }
    }, 1000);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isTimerActiveRef.current = false;
    };
  }, [isActive, isTestCompleted, duration]);

  // Format time display
  const formatTime = useCallback(seconds => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  }, []);

  // Get timer color based on remaining time
  const getTimerColor = useCallback(() => {
    if (isTestCompleted) return '#9CA3AF';
    if (timeLeft <= 300) return '#EF4444'; // Red for last 5 minutes
    if (timeLeft <= 600) return '#FBBF24'; // Yellow for last 10 minutes
    return '#3B82F6'; // Blue for normal time
  }, [timeLeft, isTestCompleted]);

  // Show warning for limited time
  const isLimitedTime = useCallback(() => {
    if (!testData?.duration || !duration) return false;
    const originalDuration = testData.duration * 60;
    return duration < originalDuration;
  }, [testData?.duration, duration]);

  // Calculate original vs effective time
  const getTimeInfo = useCallback(() => {
    if (!testData?.duration) return null;

    const originalMinutes = testData.duration;
    const effectiveMinutes = Math.floor(duration / 60);

    return {
      originalMinutes,
      effectiveMinutes,
      isLimited: effectiveMinutes < originalMinutes,
    };
  }, [testData?.duration, duration]);

  const timeInfo = getTimeInfo();

  return (
    <View style={styles.timerContainer}>
      <View style={[styles.timerBadge, {backgroundColor: getTimerColor()}]}>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
      </View>

      {/* Show limited time warning */}
      {timeInfo?.isLimited && !isTestCompleted && (
        <Text style={styles.warningText}>
          Limited: {timeInfo.effectiveMinutes}min (Original:{' '}
          {timeInfo.originalMinutes}min)
        </Text>
      )}

      {/* Show completion info */}
      {isTestCompleted && (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>
            Time taken: {formatTime(elapsedTime)}
          </Text>
          {timeInfo?.isLimited && (
            <Text style={styles.limitedCompletedText}>
              Available: {timeInfo.effectiveMinutes}min
            </Text>
          )}
        </View>
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
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  warningText: {
    color: '#F59E0B',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
    textAlign: 'center',
  },
  completedContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  completedText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  limitedCompletedText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default PaperTimer;

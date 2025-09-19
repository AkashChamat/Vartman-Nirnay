import React, {useState, useEffect, useRef, useCallback} from 'react';
import {View, Text, StyleSheet, AppState} from 'react-native';

const PaperTimer = ({
  testData,
  onTimeUp,
  onTimeUpdate,
  isActive,
  isTestCompleted,
  showRemainingTime = true,
}) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [effectiveDuration, setEffectiveDuration] = useState(0);
  const [timingInfo, setTimingInfo] = useState(null);

  // Use refs to prevent stale closures and maintain timer independence
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const isTimerActiveRef = useRef(false);
  const onTimeUpRef = useRef(onTimeUp);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const appStateRef = useRef(AppState.currentState);

  // Update refs when callbacks change
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  // In PaperTimer.js, update the calculateEffectiveDuration function:
  const calculateEffectiveDuration = useCallback(testData => {
    if (
      !testData?.testStartDate ||
      !testData?.testEndDate ||
      !testData?.startTime ||
      !testData?.endTime
    ) {
      const originalDuration = (testData?.duration || 60) * 60;
      setTimingInfo({
        originalMinutes: testData?.duration || 60,
        effectiveMinutes: Math.floor(originalDuration / 60),
        isLimited: false,
        reason: 'No active time window defined',
      });
      return originalDuration;
    }

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0];

    // Check date availability
    if (
      currentDate < testData.testStartDate ||
      currentDate > testData.testEndDate
    ) {
      setTimingInfo({
        originalMinutes: testData.duration,
        effectiveMinutes: 0,
        isLimited: true,
        reason:
          currentDate < testData.testStartDate
            ? 'Test not started'
            : 'Test ended',
      });
      return 0;
    }

    // Check daily time window
    if (currentTime < testData.startTime || currentTime > testData.endTime) {
      setTimingInfo({
        originalMinutes: testData.duration,
        effectiveMinutes: 0,
        isLimited: true,
        reason:
          currentTime < testData.startTime
            ? 'Daily window not started'
            : 'Daily window ended',
      });
      return 0;
    }

    // Calculate remaining time in today's window
    const todayEndDateTime = new Date(`${currentDate}T${testData.endTime}`);
    const remainingTimeInWindow = Math.floor((todayEndDateTime - now) / 1000);
    const originalDuration = testData.duration * 60;

    // User gets minimum of remaining time in today's window or original test duration
    const effectiveDuration = Math.min(remainingTimeInWindow, originalDuration);
    const effectiveMinutes = Math.floor(effectiveDuration / 60);
    const originalMinutes = Math.floor(originalDuration / 60);

    setTimingInfo({
      originalMinutes,
      effectiveMinutes,
      isLimited: effectiveDuration < originalDuration,
      reason:
        effectiveDuration < originalDuration
          ? "Limited by today's time window"
          : 'Full duration available',
    });

    return Math.max(effectiveDuration, 0);
  }, []);

  // Initialize timer when testData changes
  useEffect(() => {
    if (testData) {
      const duration = calculateEffectiveDuration(testData);
      setEffectiveDuration(duration);
      setTimeLeft(duration);
      setElapsedTime(0);
      startTimeRef.current = null; // Reset start time
    }
  }, [testData, calculateEffectiveDuration]);

  // Handle app state changes to maintain timer accuracy
  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      appStateRef.current = nextAppState;

      // Recalculate time when app comes to foreground to maintain accuracy
      if (
        nextAppState === 'active' &&
        isTimerActiveRef.current &&
        startTimeRef.current
      ) {
        const now = Date.now();
        const actualElapsed = Math.floor((now - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(0, effectiveDuration - actualElapsed);

        setElapsedTime(actualElapsed);
        setTimeLeft(newTimeLeft);

        // Call update callback
        if (
          onTimeUpdateRef.current &&
          typeof onTimeUpdateRef.current === 'function'
        ) {
          setTimeout(() => onTimeUpdateRef.current(actualElapsed), 0);
        }

        // Check for time up
        if (newTimeLeft <= 0 && isTimerActiveRef.current) {
          isTimerActiveRef.current = false;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (
            onTimeUpRef.current &&
            typeof onTimeUpRef.current === 'function'
          ) {
            setTimeout(() => onTimeUpRef.current(actualElapsed), 0);
          }
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => subscription?.remove();
  }, [effectiveDuration]);

  // Main timer effect - USES DATE.NOW() FOR ACCURACY
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't start timer if conditions aren't met
    if (
      !isActive ||
      isTestCompleted ||
      !effectiveDuration ||
      effectiveDuration <= 0
    ) {
      isTimerActiveRef.current = false;
      return;
    }

    // Set start time only once when timer actually starts
    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    isTimerActiveRef.current = true;

    // Use high-frequency interval but calculate time based on actual elapsed time
    intervalRef.current = setInterval(() => {
      try {
        if (!isTimerActiveRef.current || !startTimeRef.current) {
          return;
        }

        const now = Date.now();
        const actualElapsed = Math.floor((now - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(0, effectiveDuration - actualElapsed);

        // Validate timing data
        if (actualElapsed < 0) {
          return;
        }

        // Update state (this won't block timer due to Date.now() calculations)
        setElapsedTime(actualElapsed);
        setTimeLeft(newTimeLeft);

        // Call update callback (use setTimeout to prevent blocking)
        if (
          onTimeUpdateRef.current &&
          typeof onTimeUpdateRef.current === 'function'
        ) {
          setTimeout(() => onTimeUpdateRef.current(actualElapsed), 0);
        }

        // Check for time up condition
        if (newTimeLeft <= 0 && isTimerActiveRef.current) {
          isTimerActiveRef.current = false;

          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Call time up callback (use setTimeout to prevent blocking)
          if (
            onTimeUpRef.current &&
            typeof onTimeUpRef.current === 'function'
          ) {
            setTimeout(() => onTimeUpRef.current(actualElapsed), 0);
          }
        }
      } catch (error) {
        // Handle error silently
      }
    }, 100); // Update every 100ms for smooth UI, but calculations are based on actual time

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isTimerActiveRef.current = false;
    };
  }, [isActive, isTestCompleted, effectiveDuration]);

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

  // Don't render if no effective duration
  if (effectiveDuration <= 0 && !isTestCompleted) {
    return (
      <View style={styles.timerContainer}>
        <View style={[styles.timerBadge, {backgroundColor: '#EF4444'}]}>
          <Text style={styles.timerText}>No Time Available</Text>
        </View>
        {timingInfo && (
          <Text style={styles.warningText}>{timingInfo.reason}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.timerContainer}>
      <View style={[styles.timerBadge, {backgroundColor: getTimerColor()}]}>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
      </View>

      {/* Show limited time warning */}
      {timingInfo?.isLimited && !isTestCompleted && (
        <Text style={styles.warningText}>
          Limited: {timingInfo.effectiveMinutes}min (Original:{' '}
          {timingInfo.originalMinutes}min)
        </Text>
      )}

      {/* Show completion info */}
      {isTestCompleted && (
        <View style={styles.completedContainer}>
          <Text style={styles.completedText}>
            Time taken: {formatTime(elapsedTime)}
          </Text>
          {timingInfo?.isLimited && (
            <Text style={styles.limitedCompletedText}>
              Available: {timingInfo.effectiveMinutes}min
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
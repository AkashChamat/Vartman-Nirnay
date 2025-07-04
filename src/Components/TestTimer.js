import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Dimensions} from 'react-native';
import {championpaper} from '../util/apiCall';

const {width} = Dimensions.get('window');

const TestTimer = ({navigation, onTestPress}) => {
  const [latestPaper, setLatestPaper] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [showCountdown, setShowCountdown] = useState(false);
  const [timerLoading, setTimerLoading] = useState(false);
  const intervalRef = useRef(null);

  // Fetch latest test paper for timer
  const fetchLatestTestPaper = async () => {
    try {
      setTimerLoading(true);
      const response = await championpaper();
      
      const activePapers = (response.data || response)
        .filter(paper => paper.status === true)
        .sort((a, b) => b.id - a.id);

      if (activePapers.length > 0) {
        setLatestPaper(activePapers[0]);
      } else {
        setLatestPaper(null);
      }
    } catch (error) {
      console.error('Error fetching latest test paper:', error);
      setLatestPaper(null);
    } finally {
      setTimerLoading(false);
    }
  };

  // Timer logic
  useEffect(() => {
    if (!latestPaper) {
      setShowCountdown(false);
      return;
    }

    const now = new Date();
    let startDateTime;
    
    if (latestPaper.testStartDate && latestPaper.startTime) {
      startDateTime = new Date(
        `${latestPaper.testStartDate}T${latestPaper.startTime}`,
      );
    } else if (latestPaper.startTime && latestPaper.startTime.includes('T')) {
      startDateTime = new Date(latestPaper.startTime);
    } else if (latestPaper.testStartDate) {
      startDateTime = new Date(`${latestPaper.testStartDate}T00:00:00`);
    } else {
      setShowCountdown(false);
      return;
    }

    let endDateTime;
    if (latestPaper.testEndDate && latestPaper.endTime) {
      endDateTime = new Date(
        `${latestPaper.testEndDate}T${latestPaper.endTime}`,
      );
    } else if (latestPaper.endTime && latestPaper.endTime.includes('T')) {
      endDateTime = new Date(latestPaper.endTime);
    } else if (latestPaper.testEndDate) {
      endDateTime = new Date(`${latestPaper.testEndDate}T23:59:59`);
    }

    if (isNaN(startDateTime.getTime())) {
      setShowCountdown(false);
      return;
    }

    if (now < startDateTime) {
      setShowCountdown(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      updateCountdownToStart(startDateTime);
      intervalRef.current = setInterval(() => {
        updateCountdownToStart(startDateTime);
      }, 1000);
    } else if (endDateTime && now >= startDateTime && now < endDateTime) {
      setShowCountdown(false);
      setCountdown('Test is Live');
    } else {
      setShowCountdown(false);
      setCountdown('Test Ended');
    }
  }, [latestPaper]);

  // Update countdown function
  const updateCountdownToStart = targetStartDate => {
    const now = new Date();
    const timeDiff = targetStartDate - now;

    if (timeDiff <= 0) {
      setShowCountdown(false);
      setCountdown('Test Started');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    let countdownText = '';
    if (days > 0) {
      countdownText = `${days}d ${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      countdownText = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    setCountdown(countdownText);
  };

  // Initialize timer on component mount
  useEffect(() => {
    fetchLatestTestPaper();
    
    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle timer press
  const handleTimerPress = () => {
    if (onTestPress) {
      onTestPress(latestPaper);
    } else if (navigation) {
      navigation.navigate('ChampionSeries');
    }
  };

  // Render countdown timer
  const renderCountdownTimer = () => {
    if (!latestPaper || !showCountdown) {
      return null;
    }

    const countdownParts = countdown.includes('d')
      ? countdown.split('d ')[1]?.split(':') || []
      : countdown.split(':');

    const hasDays = countdown.includes('d');
    const days = hasDays ? countdown.split('d')[0] : null;
    const labels = ['Hours', 'Minutes', 'Seconds'];

    return (
      <TouchableOpacity 
        style={styles.timerContainer}
        onPress={handleTimerPress}
        activeOpacity={0.8}>
        <Text style={styles.timerTitle}>
          {latestPaper.testTitle} - Test Starts In
        </Text>

        <View style={styles.countdownContainer}>
          {hasDays && (
            <View style={styles.timeUnit}>
              <Text style={styles.timeValue}>{days}</Text>
              <Text style={styles.timeLabel}>Days</Text>
            </View>
          )}

          {countdownParts.length === 3 &&
            countdownParts.map((part, index) => (
              <View key={index} style={styles.timeUnit}>
                <Text style={styles.timeValue}>{part}</Text>
                <Text style={styles.timeLabel}>{labels[index]}</Text>
              </View>
            ))}

          {countdownParts.length !== 3 && (
            <View style={styles.timeUnit}>
              <Text style={styles.timeValue}>{countdown}</Text>
              <Text style={styles.timeLabel}>Remaining</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return renderCountdownTimer();
};

export default TestTimer;

const styles = StyleSheet.create({
  timerContainer: {
    backgroundColor: '#672D79',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#8B9DC3',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 0.5,
    borderColor: 'yellow',
  },
  timerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'yellow',
    textAlign: 'center',
    marginBottom: 12,
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    marginBottom: 8,
  },
  timeUnit: {
    backgroundColor: 'yellow',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#672D79',
    padding: 2,
    minWidth: 60,
    maxHeight: 60,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#672D79',
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#672D79',
  },
});
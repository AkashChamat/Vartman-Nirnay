import { useState, useEffect, useRef } from 'react';

const useAccurateTimer = (durationMinutes, isActive, onTimeUp) => {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60); // in seconds
  const [isExpired, setIsExpired] = useState(false);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive && !isExpired) {
      // Set start time only once when timer begins
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
        const remainingSeconds = (durationMinutes * 60) - elapsedSeconds;


        if (remainingSeconds <= 0) {
          setTimeLeft(0);
          setIsExpired(true);
          clearInterval(intervalRef.current);
          onTimeUp();
        } else {
          setTimeLeft(remainingSeconds);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isExpired, durationMinutes, onTimeUp]);

  // Method to get elapsed time for submission
  const getElapsedTime = () => {
    if (!startTimeRef.current) return 0;
    return Math.floor((Date.now() - startTimeRef.current) / 1000);
  };

  // Method to stop timer (for submission)
  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  return {
    timeLeft,
    isExpired,
    getElapsedTime,
    stopTimer,
    startTime: startTimeRef.current
  };
};

export default useAccurateTimer;
